// Renders the family tree as DOM + draws SVG connector lines.
// Shared by the on-screen preview (index.html) and the printable postcard (print.html).

const ROLE_COLORS = {
  self: "#E25A2C",
  father: "#1AA6A6",
  mother: "#7C4D99",
  grandfather: "#D29A1A",
  grandmother: "#39A96B",
  greatgrandfather: "#0D2B45",
  greatgrandmother: "#C62828",
  sibling: "#4E7091",
  child: "#1AA6A6",
  grandchild: "#7C4D99",
  greatgrandchild: "#D29A1A",
  descendant: "#39A96B",
};

// Role (for avatar color + relation label) of a descendant node by
// generation, where self is Generation 1. Generation 5+ (beyond what
// printing includes) all share one generic "descendant" role — the
// Gen-N badge on the card carries the exact depth instead.
function descendantRole(generation) {
  if (generation <= 1) return "self";
  if (generation === 2) return "child";
  if (generation === 3) return "grandchild";
  if (generation === 4) return "greatgrandchild";
  return "descendant";
}

function initial(name) {
  const n = (name || "").trim();
  return n ? n[0].toUpperCase() : "?";
}

function relationKey(role) {
  return "relation_" + role;
}

function makePersonCard(role, person, extraClass) {
  const card = document.createElement("div");
  card.className = "person" + (extraClass ? " " + extraClass : "");
  card.dataset.role = role;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  if (person.photo) {
    avatar.classList.add("avatar-has-photo");
    const img = document.createElement("img");
    img.src = person.photo;
    img.alt = person.name || "";
    avatar.appendChild(img);
  } else {
    avatar.style.background = ROLE_COLORS[role] || "#999";
    avatar.textContent = initial(person.name);
  }
  card.appendChild(avatar);

  const name = document.createElement("div");
  name.className = "person-name";
  name.textContent = person.name || "?";
  card.appendChild(name);

  const relation = document.createElement("div");
  relation.className = "person-relation";
  relation.textContent = I18n.t(relationKey(role));
  card.appendChild(relation);

  if (person.job) {
    const job = document.createElement("div");
    job.className = "person-job";
    job.textContent = person.job;
    card.appendChild(job);
  }

  return card;
}

function makeCouple(pairs) {
  // pairs: [{role, person}, ...] rendered side by side
  const wrap = document.createElement("div");
  wrap.className = "couple";
  pairs.forEach((p) => wrap.appendChild(makePersonCard(p.role, p.person)));
  return wrap;
}

function siblingRole(type) {
  const map = {
    olderBrother: "olderBrother",
    youngerBrother: "youngerBrother",
    olderSister: "olderSister",
    youngerSister: "youngerSister",
  };
  return map[type] || "olderBrother";
}

// Builds the tree DOM. Returns { el, generationRows } where generationRows
// is an ordered array of the row elements actually included (for connectors).
function buildFamilyTree(data) {
  const el = document.createElement("div");
  el.className = "family-tree";
  const rows = [];

  if (data.knowGreatGrandparents) {
    const row = document.createElement("div");
    row.className = "gen gen-couple";
    row.appendChild(
      makeCouple([
        { role: "greatgrandfather", person: data.greatGrandfather },
        { role: "greatgrandmother", person: data.greatGrandmother },
      ])
    );
    el.appendChild(row);
    rows.push(row);
  }

  if (data.knowGrandparents) {
    const row = document.createElement("div");
    row.className = "gen gen-couple";
    row.appendChild(
      makeCouple([
        { role: "grandfather", person: data.grandfather },
        { role: "grandmother", person: data.grandmother },
      ])
    );
    el.appendChild(row);
    rows.push(row);
  }

  const parentsRow = document.createElement("div");
  parentsRow.className = "gen gen-couple";
  parentsRow.appendChild(
    makeCouple([
      { role: "father", person: data.father },
      { role: "mother", person: data.mother },
    ])
  );
  el.appendChild(parentsRow);
  rows.push(parentsRow);

  const childrenRow = document.createElement("div");
  childrenRow.className = "gen gen-children";
  const ordered = [];
  (data.siblings || []).forEach((s) => {
    if (s.type === "olderBrother" || s.type === "olderSister") ordered.push(s);
  });
  ordered.push({ __self: true });
  (data.siblings || []).forEach((s) => {
    if (s.type === "youngerBrother" || s.type === "youngerSister") ordered.push(s);
  });

  ordered.forEach((s) => {
    if (s.__self) {
      childrenRow.appendChild(makePersonCard("self", data.self, "person-self"));
    } else {
      childrenRow.appendChild(makePersonCard(siblingRole(s.type), s, "person-sibling"));
    }
  });
  el.appendChild(childrenRow);
  rows.push(childrenRow);

  return { el, rows };
}

// Draws simple vertical connector lines between consecutive generation rows,
// using an absolutely positioned SVG overlay sized to the tree container.
function drawConnectors(container, rows) {
  const old = container.querySelector("svg.connectors");
  if (old) old.remove();

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "connectors");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.overflow = "visible";
  svg.style.pointerEvents = "none";

  const containerRect = container.getBoundingClientRect();

  for (let i = 0; i < rows.length - 1; i++) {
    const fromRow = rows[i];
    const toRow = rows[i + 1];
    const fromRect = fromRow.getBoundingClientRect();
    const toChildren = Array.from(toRow.querySelectorAll(".person"));
    if (!toChildren.length) continue;

    const fromCenterX = fromRect.left + fromRect.width / 2 - containerRect.left;
    const fromY = fromRect.bottom - containerRect.top;
    const toRect = toRow.getBoundingClientRect();
    const toY = toRect.top - containerRect.top;
    const midY = (fromY + toY) / 2;

    // trunk line down from the parent row
    const trunk = document.createElementNS(svgNS, "line");
    trunk.setAttribute("x1", fromCenterX);
    trunk.setAttribute("y1", fromY);
    trunk.setAttribute("x2", fromCenterX);
    trunk.setAttribute("y2", midY);
    trunk.setAttribute("class", "connector-line");
    svg.appendChild(trunk);

    if (toChildren.length === 1) {
      const cardRect = toChildren[0].getBoundingClientRect();
      const cx = cardRect.left + cardRect.width / 2 - containerRect.left;
      const drop = document.createElementNS(svgNS, "line");
      drop.setAttribute("x1", fromCenterX);
      drop.setAttribute("y1", midY);
      drop.setAttribute("x2", cx);
      drop.setAttribute("y2", toY);
      drop.setAttribute("class", "connector-line");
      svg.appendChild(drop);
    } else {
      const centers = toChildren.map((c) => {
        const r = c.getBoundingClientRect();
        return r.left + r.width / 2 - containerRect.left;
      });
      const leftMost = Math.min(...centers);
      const rightMost = Math.max(...centers);
      const bar = document.createElementNS(svgNS, "line");
      bar.setAttribute("x1", leftMost);
      bar.setAttribute("y1", midY);
      bar.setAttribute("x2", rightMost);
      bar.setAttribute("y2", midY);
      bar.setAttribute("class", "connector-line");
      svg.appendChild(bar);

      // connect trunk to bar
      const toBar = document.createElementNS(svgNS, "line");
      toBar.setAttribute("x1", fromCenterX);
      toBar.setAttribute("y1", midY);
      toBar.setAttribute("x2", fromCenterX);
      toBar.setAttribute("y2", midY);
      svg.appendChild(toBar);

      centers.forEach((cx) => {
        const drop = document.createElementNS(svgNS, "line");
        drop.setAttribute("x1", cx);
        drop.setAttribute("y1", midY);
        drop.setAttribute("x2", cx);
        drop.setAttribute("y2", toY);
        drop.setAttribute("class", "connector-line");
        svg.appendChild(drop);
      });
    }
  }

  container.style.position = "relative";
  container.insertBefore(svg, container.firstChild);
}

// ---- descendants of self (self = Family Root in Singapore, Generation 1) ----
// A separate, self-contained recursive layout from the ancestor rows above:
// unlike the fixed-shape ancestor side (always exactly one couple per row,
// so a single "connect this row to the next row" pass works), a descendant
// tree branches — different children can have different numbers of their
// own children — so each node draws its own connector to just its direct
// children, recursively, rather than one global row-to-row pass.
// maxGeneration (optional) caps how deep to render — used by printing to
// show only the first 4 generations without touching the underlying data;
// omit it (or pass Infinity) to render the whole tree, e.g. on-screen.
function buildDescendantNode(person, generation, maxGeneration) {
  const node = document.createElement("div");
  node.className = "descendant-node";
  node.dataset.generation = generation;

  const role = descendantRole(generation);
  const card = makePersonCard(role, person, generation === 1 ? "person-self" : "person-descendant");
  const badge = document.createElement("div");
  badge.className = "gen-badge";
  badge.textContent = I18n.t("genBadge", { n: generation });
  card.appendChild(badge);
  node.appendChild(card);

  const children = person.children || [];
  if (children.length && generation < maxGeneration) {
    const childrenWrap = document.createElement("div");
    childrenWrap.className = "descendant-children";
    children.forEach((child) => {
      childrenWrap.appendChild(buildDescendantNode(child, generation + 1, maxGeneration));
    });
    node.appendChild(childrenWrap);
  }

  return node;
}

// Draws local SVG connectors from each node with children to those direct
// children only (scoped to that node's own wrapper), then recurses —
// see buildDescendantNode's comment for why this can't reuse drawConnectors.
function drawDescendantConnectors(node) {
  const card = node.querySelector(":scope > .person");
  const childrenWrap = node.querySelector(":scope > .descendant-children");
  if (!card || !childrenWrap) return;

  const childNodes = Array.from(childrenWrap.children);
  const childCards = childNodes.map((n) => n.querySelector(":scope > .person")).filter(Boolean);
  if (childCards.length) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "connectors");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.overflow = "visible";
    svg.style.pointerEvents = "none";

    node.style.position = "relative";
    const nodeRect = node.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const fromX = cardRect.left + cardRect.width / 2 - nodeRect.left;
    const fromY = cardRect.bottom - nodeRect.top;
    const wrapRect = childrenWrap.getBoundingClientRect();
    const toY = wrapRect.top - nodeRect.top;
    const midY = (fromY + toY) / 2;

    const trunk = document.createElementNS(svgNS, "line");
    trunk.setAttribute("x1", fromX);
    trunk.setAttribute("y1", fromY);
    trunk.setAttribute("x2", fromX);
    trunk.setAttribute("y2", midY);
    trunk.setAttribute("class", "connector-line");
    svg.appendChild(trunk);

    const centers = childCards.map((c) => {
      const r = c.getBoundingClientRect();
      return r.left + r.width / 2 - nodeRect.left;
    });
    if (centers.length === 1) {
      const drop = document.createElementNS(svgNS, "line");
      drop.setAttribute("x1", fromX);
      drop.setAttribute("y1", midY);
      drop.setAttribute("x2", centers[0]);
      drop.setAttribute("y2", toY);
      drop.setAttribute("class", "connector-line");
      svg.appendChild(drop);
    } else {
      const bar = document.createElementNS(svgNS, "line");
      bar.setAttribute("x1", Math.min(...centers));
      bar.setAttribute("y1", midY);
      bar.setAttribute("x2", Math.max(...centers));
      bar.setAttribute("y2", midY);
      bar.setAttribute("class", "connector-line");
      svg.appendChild(bar);
      centers.forEach((cx) => {
        const drop = document.createElementNS(svgNS, "line");
        drop.setAttribute("x1", cx);
        drop.setAttribute("y1", midY);
        drop.setAttribute("x2", cx);
        drop.setAttribute("y2", toY);
        drop.setAttribute("class", "connector-line");
        svg.appendChild(drop);
      });
    }
    node.insertBefore(svg, node.firstChild);
  }

  childNodes.forEach(drawDescendantConnectors);
}

function renderFamilyTree(container, data, opts) {
  opts = opts || {};
  const maxGeneration = opts.maxGeneration || Infinity;
  container.innerHTML = "";
  const { el, rows } = buildFamilyTree(data);

  // Self is Generation 1 (Family Root in Singapore); descendants render as
  // their own recursive subtree directly below the self+siblings row,
  // replacing self's plain person card with one that also carries its
  // children (siblings themselves are a separate generation-1 concept and
  // keep rendering as plain cards, unaffected).
  const descendantRoot = buildDescendantNode(data.self, 1, maxGeneration);
  const selfCard = el.querySelector('.gen-children [data-role="self"]');
  if (selfCard) selfCard.replaceWith(descendantRoot);

  container.appendChild(el);
  // connectors need layout to exist first
  requestAnimationFrame(() => {
    drawConnectors(el, rows);
    drawDescendantConnectors(descendantRoot);
  });
  return el;
}
