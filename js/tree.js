// Renders the family tree as DOM + draws SVG connector lines.
// Shared by the on-screen preview (index.html) and the printable postcard (print.html).

const ROLE_COLORS = {
  self: "#f5820d",
  father: "#3b7dd8",
  mother: "#e0568c",
  grandfather: "#2f9e8f",
  grandmother: "#8e6fce",
  greatgrandfather: "#a9762f",
  greatgrandmother: "#c9506b",
  sibling: "#6b7a8f",
};

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

function renderFamilyTree(container, data) {
  container.innerHTML = "";
  const { el, rows } = buildFamilyTree(data);
  container.appendChild(el);
  // connectors need layout to exist first
  requestAnimationFrame(() => drawConnectors(el, rows));
  return el;
}
