// Stylized (not survey-accurate) migration map: China down through Hong Kong/
// Taiwan/Southeast Asia to Singapore. Shared by the on-screen animated reveal
// and the printable postcard, same pattern as tree.js.

const MAP_VIEWBOX = "0 0 500 620";

function baseMapSVG() {
  // Stylized coastlines (not survey-accurate) instead of plain ovals: China's
  // mainland has its characteristic bays/peninsulas, Taiwan is an elongated
  // island, Indochina tapers into the Malay peninsula, and Sumatra/Java sit
  // apart as their own islands.
  const land = "#DCEEE2";
  const landAlt = "#E5F3E9";
  const stroke = "#BFE0CB";
  return `
  <rect x="0" y="0" width="500" height="620" fill="#D6EFEF"></rect>

  <path d="M140,90
    Q200,20 280,25
    Q340,20 375,45
    Q400,55 430,75
    Q405,90 385,105
    Q420,110 432,130
    Q415,145 400,150
    Q415,165 405,180
    Q380,205 385,225
    Q405,235 385,250
    Q400,270 375,285
    Q390,300 355,310
    Q320,325 280,315
    Q240,305 205,285
    Q170,265 150,230
    Q210,245 195,215
    Q140,190 95,175
    Q110,140 140,110
    Q135,95 140,90 Z"
    fill="${land}" stroke="${stroke}" stroke-width="2.5"></path>

  <ellipse cx="345" cy="325" rx="16" ry="10" fill="${land}" stroke="${stroke}" stroke-width="2"></ellipse>

  <path d="M405,215
    Q426,228 420,258
    Q414,290 397,301
    Q384,272 389,240
    Q391,222 405,215 Z"
    fill="${land}" stroke="${stroke}" stroke-width="2.5"></path>

  <path d="M250,300
    Q300,308 320,340
    Q312,375 292,398
    Q302,428 280,458
    Q262,472 240,460
    Q222,432 231,400
    Q202,372 190,340
    Q182,310 202,290
    Q222,282 250,300 Z"
    fill="${landAlt}" stroke="${stroke}" stroke-width="2.5"></path>

  <path d="M260,460
    Q287,480 277,510
    Q272,530 287,547
    Q262,536 250,510
    Q239,485 260,460 Z"
    fill="${landAlt}" stroke="${stroke}" stroke-width="2.5"></path>

  <path d="M290,532
    Q305,536 306,548
    Q304,560 290,558
    Q278,554 279,542
    Q281,533 290,532 Z"
    fill="#E25A2C" stroke="#B8431A" stroke-width="2"></path>

  <path d="M165,510
    Q200,495 225,510
    Q260,528 275,555
    Q285,575 270,590
    Q245,600 225,585
    Q195,565 180,545
    Q160,525 165,510 Z"
    fill="${landAlt}" stroke="${stroke}" stroke-width="2.5"></path>

  <path d="M288,578
    Q328,563 375,570
    Q410,577 424,588
    Q398,597 358,593
    Q318,589 293,585
    Q283,582 288,578 Z"
    fill="${landAlt}" stroke="${stroke}" stroke-width="2.5"></path>
  `;
}

// Which generations feed the path, in oldest-to-youngest order, and the
// i18n key used for their pin label.
const MAP_GENERATIONS = [
  { key: "greatGrandparents", knownFlag: "knowGreatGrandparents", labelKey: "genLabel_greatGrandparents" },
  { key: "grandparents", knownFlag: "knowGrandparents", labelKey: "genLabel_grandparents" },
  { key: "parents", knownFlag: null, labelKey: "genLabel_parents" },
];

function getOriginSequence(data) {
  const stops = [];
  MAP_GENERATIONS.forEach((gen) => {
    if (gen.knownFlag && !data[gen.knownFlag]) return;
    const placeKey = data.origins && data.origins[gen.key];
    if (!placeKey) return;
    const place = PLACES_BY_KEY[placeKey];
    if (!place || place.x === null) return;
    stops.push({ place, labelKey: gen.labelKey });
  });
  const last = stops[stops.length - 1];
  if (!last || last.place.key !== "singapore") {
    stops.push({ place: PLACES_BY_KEY.singapore, labelKey: "genLabel_self" });
  }
  return stops;
}

function renderMigrationMap(container, data, opts) {
  opts = opts || {};
  const animated = !!opts.animated;
  container.innerHTML = "";

  const stops = getOriginSequence(data);
  if (stops.length < 2) {
    const empty = document.createElement("p");
    empty.className = "subtitle";
    empty.textContent = I18n.t("migrationMapEmpty");
    container.appendChild(empty);
    return { replay: function () {} };
  }

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", MAP_VIEWBOX);
  svg.setAttribute("class", "migration-map-svg");
  svg.innerHTML = baseMapSVG();

  const linesGroup = document.createElementNS(svgNS, "g");
  const pinsGroup = document.createElementNS(svgNS, "g");
  svg.appendChild(linesGroup);
  svg.appendChild(pinsGroup);
  container.appendChild(svg);

  const lineEls = [];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1].place;
    const b = stops[i].place;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", a.x);
    line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x);
    line.setAttribute("y2", b.y);
    line.setAttribute("class", "migration-line");
    linesGroup.appendChild(line);
    lineEls.push(line);
  }

  const pinEls = stops.map((stop, i) => {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "migration-pin");
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("cx", stop.place.x);
    dot.setAttribute("cy", stop.place.y);
    dot.setAttribute("r", i === stops.length - 1 ? 9 : 7);
    dot.setAttribute("class", i === stops.length - 1 ? "migration-dot migration-dot-final" : "migration-dot");
    g.appendChild(dot);

    const labelY = stop.place.y - 14;
    const name = document.createElementNS(svgNS, "text");
    name.setAttribute("x", stop.place.x);
    name.setAttribute("y", labelY);
    name.setAttribute("class", "migration-label");
    name.textContent = placeLabel(stop.place.key);
    g.appendChild(name);

    const tag = document.createElementNS(svgNS, "text");
    tag.setAttribute("x", stop.place.x);
    tag.setAttribute("y", labelY + 12);
    tag.setAttribute("class", "migration-tag");
    tag.textContent = I18n.t(stop.labelKey);
    g.appendChild(tag);

    pinsGroup.appendChild(g);
    return g;
  });

  function showAllInstantly() {
    lineEls.forEach((l) => l.classList.add("visible"));
    pinEls.forEach((p) => p.classList.add("visible"));
  }

  function playAnimation() {
    lineEls.forEach((l) => l.classList.remove("visible"));
    pinEls.forEach((p) => p.classList.remove("visible"));
    let i = 0;
    function step() {
      if (i >= pinEls.length) return;
      pinEls[i].classList.add("visible");
      if (i > 0) lineEls[i - 1].classList.add("visible");
      i++;
      if (i < pinEls.length) setTimeout(step, 900);
    }
    requestAnimationFrame(step);
  }

  if (animated) {
    playAnimation();
  } else {
    showAllInstantly();
  }

  return { replay: playAnimation };
}
