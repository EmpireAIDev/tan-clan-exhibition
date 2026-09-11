// "Your Migration Path" — a storytelling journey of location cards from the
// family's origin through to Singapore. This replaces the earlier
// coordinate-based SVG map with a heritage-journey card design (see
// PROJECT_STATUS.md for context — this was a planned full revamp).
// Shared by the on-screen reveal (index.html) and the printable postcard
// (print-map.html), same pattern as tree.js.
//
// Entirely data-driven: reads data.origins (set via the "Where did they
// live?" chips in js/chart-editor.js) through getOriginSequence, exactly
// as the previous map did — nothing here is hardcoded to any specific
// place. Singapore is always appended as the final stop if it isn't
// already the last one entered. Visual theming per place lives in
// js/migration-theme.js.

// Which generations feed the path, in oldest-to-youngest order, and the
// i18n key used for their stage label.
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
    if (!place) return;
    stops.push({ place, labelKey: gen.labelKey });
  });
  const last = stops[stops.length - 1];
  if (!last || last.place.key !== "singapore") {
    stops.push({ place: PLACES_BY_KEY.singapore, labelKey: "genLabel_self" });
  }
  return stops;
}

function journeyStageLabel(index, total) {
  if (index === 0) return I18n.t("journeyOrigin");
  if (index === total - 1) return I18n.t("journeyDestination");
  return I18n.t("journeyStop");
}

function buildLocationCard(stop, index, total, delaySeconds) {
  const theme = getPlaceTheme(stop.place);
  const isFinal = index === total - 1;

  const card = document.createElement("div");
  card.className = "journey-card" + (isFinal ? " journey-card-final" : "");
  card.style.setProperty("--card-grad-1", theme.gradient[0]);
  card.style.setProperty("--card-grad-2", theme.gradient[1]);
  card.style.setProperty("--delay", delaySeconds + "s");

  const bg = document.createElement("div");
  bg.className = "journey-card-bg";
  const iconEl = document.createElement("span");
  iconEl.className = "journey-card-icon";
  iconEl.textContent = theme.icon;
  bg.appendChild(iconEl);

  // Real landmark photo when we have one, layered under the icon/gradient.
  // If the file is missing or fails to load, just remove it — the existing
  // icon+gradient design (bg's own background, set below) is already a
  // complete, graceful fallback and needs no extra handling here.
  if (theme.image) {
    const photo = document.createElement("img");
    photo.className = "journey-card-photo";
    photo.alt = "";
    photo.loading = "lazy";
    photo.onload = () => bg.classList.add("has-photo");
    photo.onerror = () => photo.remove();
    photo.src = theme.image;
    bg.insertBefore(photo, iconEl);
  }

  card.appendChild(bg);

  const body = document.createElement("div");
  body.className = "journey-card-body";

  const stageTag = document.createElement("div");
  stageTag.className = "journey-stage-tag";
  stageTag.textContent = journeyStageLabel(index, total);
  body.appendChild(stageTag);

  const nameEn = document.createElement("div");
  nameEn.className = "journey-name-en";
  nameEn.textContent = stop.place.en + (stop.place.key === "singapore" ? " 🇸🇬" : "");
  body.appendChild(nameEn);

  const nameZh = document.createElement("div");
  nameZh.className = "journey-name-zh";
  nameZh.textContent = stop.place.zh;
  body.appendChild(nameZh);

  const desc = document.createElement("p");
  desc.className = "journey-description";
  desc.textContent = getPlaceDescription(stop.place, I18n.lang);
  body.appendChild(desc);

  card.appendChild(body);
  return card;
}

function buildConnector(delaySeconds) {
  const connector = document.createElement("div");
  connector.className = "journey-connector";
  connector.style.setProperty("--delay", delaySeconds + "s");
  const line = document.createElement("div");
  line.className = "journey-connector-line";
  connector.appendChild(line);
  const arrow = document.createElement("span");
  arrow.className = "journey-connector-arrow";
  connector.appendChild(arrow);
  return connector;
}

// Print variant — same card design as the on-screen "Your Migration Path"
// (photo/gradient art, icon fallback, stage tag, name, description), just
// under its own class namespace (journey-print-*, not journey-card/
// journey-connector) and deliberately NOT responsive: the printed page is a
// fixed physical size, and js/print-map.js's fitAndPrint scales this whole
// block down to fit, measuring it on screen first — a row->column
// breakpoint tied to CSS width would fire against the small physical print
// page and no longer match what was measured (see the print-layout bug this
// was built to avoid). Reusing journey-card/journey-connector directly would
// pull in exactly that breakpoint, so this is a parallel, non-responsive set
// of classes instead.
function buildPrintCard(stop, index, total) {
  const theme = getPlaceTheme(stop.place);
  const isFinal = index === total - 1;

  const card = document.createElement("div");
  card.className = "journey-print-card" + (isFinal ? " journey-print-final" : "");

  const bg = document.createElement("div");
  bg.className = "journey-print-bg";
  bg.style.background = "linear-gradient(135deg, " + theme.gradient[0] + ", " + theme.gradient[1] + ")";
  const iconEl = document.createElement("span");
  iconEl.className = "journey-print-icon";
  iconEl.textContent = theme.icon;
  bg.appendChild(iconEl);

  // Same graceful fallback as the on-screen card: if the photo is missing
  // or fails to load, remove it and the icon+gradient background stands on
  // its own — no broken-image glyph, no layout break.
  if (theme.image) {
    const photo = document.createElement("img");
    photo.className = "journey-print-photo";
    photo.alt = "";
    photo.onload = () => bg.classList.add("has-photo");
    photo.onerror = () => photo.remove();
    photo.src = theme.image;
    bg.insertBefore(photo, iconEl);
  }

  card.appendChild(bg);

  const body = document.createElement("div");
  body.className = "journey-print-body";

  const stageTag = document.createElement("div");
  stageTag.className = "journey-print-stage";
  stageTag.textContent = journeyStageLabel(index, total);
  body.appendChild(stageTag);

  const nameEn = document.createElement("div");
  nameEn.className = "journey-print-name-en";
  nameEn.textContent = stop.place.en + (stop.place.key === "singapore" ? " 🇸🇬" : "");
  body.appendChild(nameEn);

  const nameZh = document.createElement("div");
  nameZh.className = "journey-print-name-zh";
  nameZh.textContent = stop.place.zh;
  body.appendChild(nameZh);

  const desc = document.createElement("p");
  desc.className = "journey-print-desc";
  desc.textContent = getPlaceDescription(stop.place, I18n.lang);
  body.appendChild(desc);

  card.appendChild(body);
  return card;
}

function buildPrintConnector() {
  const connector = document.createElement("div");
  connector.className = "journey-print-connector";
  connector.innerHTML = '<span class="journey-print-arrow"></span>';
  return connector;
}

function renderMigrationMap(container, data, opts) {
  opts = opts || {};
  container.innerHTML = "";

  const stops = getOriginSequence(data);
  if (stops.length < 2) {
    const empty = document.createElement("p");
    empty.className = "subtitle";
    empty.textContent = I18n.t("migrationMapEmpty");
    container.appendChild(empty);
    return { replay: function () {} };
  }

  if (opts.compact) {
    const printWrap = document.createElement("div");
    printWrap.className = "journey-print-path";
    stops.forEach((stop, i) => {
      if (i > 0) printWrap.appendChild(buildPrintConnector());
      printWrap.appendChild(buildPrintCard(stop, i, stops.length));
    });
    container.appendChild(printWrap);
    return { replay: function () {} };
  }

  const wrap = document.createElement("div");
  wrap.className = "journey-path";
  if (stops.length === 2) wrap.classList.add("journey-path-2");

  stops.forEach((stop, i) => {
    if (i > 0) wrap.appendChild(buildConnector(i * 0.35 - 0.15));
    wrap.appendChild(buildLocationCard(stop, i, stops.length, i * 0.35));
  });

  container.appendChild(wrap);

  // Kept for API parity with the previous animated map — js/flow.js's
  // "Watch again" button calls mapControl.replay(). The reveal itself is a
  // staggered CSS fade/slide-in (see css/style.css's .journey-revealed)
  // rather than a JS timeline.
  function reveal() {
    wrap.classList.remove("journey-revealed");
    void wrap.offsetWidth; // force reflow so the transition can restart
    requestAnimationFrame(() => wrap.classList.add("journey-revealed"));
  }

  if (opts.animated) {
    reveal();
  } else {
    // Printing (and any other non-animated render) shows everything
    // immediately — no point animating a snapshot, and it keeps print
    // timing simple (no transition to wait out before window.print()).
    wrap.classList.add("journey-revealed");
  }

  return { replay: reveal };
}
