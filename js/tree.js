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
};

// Avatar placeholder emoji, used instead of a bare "?" whenever a person
// has no name/photo yet. Grandparent tiers (including great-grandparents)
// share the grandparent emoji; a child's own son/daughter emoji depends on
// the gender picked in the chart (see js/chart-editor.js).
const ROLE_EMOJI = {
  father: "👨",
  mother: "👩",
  grandfather: "👴",
  grandmother: "👵",
  greatgrandfather: "👴",
  greatgrandmother: "👵",
  self: "🧑",
  olderBrother: "👦",
  youngerBrother: "👦",
  olderSister: "👧",
  youngerSister: "👧",
};

// Always the role emoji, regardless of whether a name has been typed —
// only an actual photo replaces it (see makePersonCard).
function avatarFallback(role, person) {
  if (role === "child") return person.gender === "daughter" ? "👧" : "👦";
  return ROLE_EMOJI[role] || "🧑";
}

// ---- Family Root in Singapore / dynamic generation numbering ----
// Generation 1 is whichever tier the visitor marked as originating from
// Singapore (oldest tier wins if more than one somehow is) — e.g. if
// grandparents lived in Singapore, THEY are Generation 1, parents are
// Generation 2, self is Generation 3. Ancestor tiers older than the root
// (e.g. great-grandparents who lived elsewhere before the family arrived)
// don't get a generation number at all. If no tier is marked Singapore,
// self is the fallback root, matching the kiosk's baseline assumption
// that the visitor themself is Singapore-based.
const GENERATION_TIERS = ["greatGrandparents", "grandparents", "parents", "self", "children"];

function generationRootTier(data) {
  if (data.knowGreatGrandparents && data.origins && data.origins.greatGrandparents === "singapore") {
    return "greatGrandparents";
  }
  if (data.knowGrandparents && data.origins && data.origins.grandparents === "singapore") {
    return "grandparents";
  }
  if (data.origins && data.origins.parents === "singapore") return "parents";
  return "self";
}

function generationNumber(tier, rootTier) {
  return GENERATION_TIERS.indexOf(tier) - GENERATION_TIERS.indexOf(rootTier) + 1;
}

function addGenBadge(card, tier, rootTier) {
  const n = generationNumber(tier, rootTier);
  if (n < 1) return;
  const badge = document.createElement("div");
  badge.className = "gen-badge";
  badge.textContent = I18n.t("genBadge", { n });
  card.appendChild(badge);
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
    avatar.textContent = avatarFallback(role, person);
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
  const rootTier = generationRootTier(data);

  if (data.knowGreatGrandparents) {
    const row = document.createElement("div");
    row.className = "gen gen-couple";
    row.appendChild(
      makeCouple([
        { role: "greatgrandfather", person: data.greatGrandfather },
        { role: "greatgrandmother", person: data.greatGrandmother },
      ])
    );
    row.querySelectorAll(".person").forEach((card) => addGenBadge(card, "greatGrandparents", rootTier));
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
    row.querySelectorAll(".person").forEach((card) => addGenBadge(card, "grandparents", rootTier));
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
  parentsRow.querySelectorAll(".person").forEach((card) => addGenBadge(card, "parents", rootTier));
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
  childrenRow.querySelectorAll(".person").forEach((card) => addGenBadge(card, "self", rootTier));
  el.appendChild(childrenRow);
  rows.push(childrenRow);

  return { el, rows, rootTier };
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

// ---- self's children (one level only — no grandchildren) ----
// A self-contained addition below the self+siblings row: self's own
// children render as a flat row directly under self, connected with a
// small local SVG (scoped to this wrapper) since the existing row-to-row
// drawConnectors would incorrectly also draw a line from every sibling.
// maxGeneration (optional) hides this row entirely once it would exceed
// the cap — used by printing; on-screen callers omit it (Infinity).
function buildChildrenNode(selfPerson, selfGeneration, maxGeneration) {
  const node = document.createElement("div");
  node.className = "descendant-node";
  node.dataset.generation = selfGeneration;

  const card = makePersonCard("self", selfPerson, "person-self");
  const selfBadge = document.createElement("div");
  selfBadge.className = "gen-badge";
  selfBadge.textContent = I18n.t("genBadge", { n: selfGeneration });
  card.appendChild(selfBadge);
  node.appendChild(card);

  const children = selfPerson.children || [];
  const childGeneration = selfGeneration + 1;
  if (children.length && childGeneration <= maxGeneration) {
    const childrenWrap = document.createElement("div");
    childrenWrap.className = "descendant-children";
    children.forEach((child) => {
      const childCard = makePersonCard("child", child, "person-descendant");
      const badge = document.createElement("div");
      badge.className = "gen-badge";
      badge.textContent = I18n.t("genBadge", { n: childGeneration });
      childCard.appendChild(badge);
      childrenWrap.appendChild(childCard);
    });
    node.appendChild(childrenWrap);
  }

  return node;
}

// Draws the local connector from self's card to its direct children row
// (see buildChildrenNode's comment for why this can't reuse drawConnectors).
function drawChildrenConnector(node) {
  const card = node.querySelector(":scope > .person");
  const childrenWrap = node.querySelector(":scope > .descendant-children");
  if (!card || !childrenWrap) return;

  const childCards = Array.from(childrenWrap.querySelectorAll(":scope > .person"));
  if (!childCards.length) return;

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

function renderFamilyTree(container, data, opts) {
  opts = opts || {};
  const maxGeneration = opts.maxGeneration || Infinity;
  container.innerHTML = "";
  const { el, rows, rootTier } = buildFamilyTree(data);

  // Self's generation number depends on the dynamic root (see
  // generationRootTier) — self's own children render as one flat row
  // directly below, replacing self's plain card in the self+siblings row.
  const selfGeneration = generationNumber("self", rootTier);
  const childrenNode = buildChildrenNode(data.self, selfGeneration, maxGeneration);
  const selfCard = el.querySelector('.gen-children [data-role="self"]');
  if (selfCard) selfCard.replaceWith(childrenNode);

  container.appendChild(el);
  // connectors need layout to exist first
  requestAnimationFrame(() => {
    drawConnectors(el, rows);
    drawChildrenConnector(childrenNode);
  });
  return el;
}
