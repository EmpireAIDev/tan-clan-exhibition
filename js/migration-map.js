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

// Compact print variant — the printed postcard is small (as little as
// ~100mm wide) and gets uniformly scaled down by print.js's fitAndPrint,
// so the full story cards' paragraph descriptions and large gradient
// artwork would shrink to illegible. This keeps the same pin/name/arrow
// visual language at a size that still reads once scaled down, and is
// deliberately NOT responsive (no row->column breakpoint) — the printed
// page is a fixed physical size, and a layout that repositions itself
// based on CSS width doesn't match what fitAndPrint measured on screen.
function buildCompactStop(stop, index, total) {
  const theme = getPlaceTheme(stop.place);
  const isFinal = index === total - 1;

  const item = document.createElement("div");
  item.className = "journey-compact-stop" + (isFinal ? " journey-compact-final" : "");

  const badge = document.createElement("div");
  badge.className = "journey-compact-badge";
  badge.style.background = "linear-gradient(135deg, " + theme.gradient[0] + ", " + theme.gradient[1] + ")";
  const iconEl = document.createElement("span");
  iconEl.className = "journey-compact-icon";
  iconEl.textContent = theme.icon;
  badge.appendChild(iconEl);

  // Same landmark photo as the on-screen card, with the same graceful
  // fallback: if it's missing or fails to load, remove it and the
  // icon+gradient badge (already built above) stands on its own.
  if (theme.image) {
    const photo = document.createElement("img");
    photo.className = "journey-compact-photo";
    photo.alt = "";
    photo.onload = () => badge.classList.add("has-photo");
    photo.onerror = () => photo.remove();
    photo.src = theme.image;
    badge.insertBefore(photo, iconEl);
  }

  item.appendChild(badge);

  const nameEn = document.createElement("div");
  nameEn.className = "journey-compact-name-en";
  nameEn.textContent = stop.place.en + (stop.place.key === "singapore" ? " 🇸🇬" : "");
  item.appendChild(nameEn);

  const nameZh = document.createElement("div");
  nameZh.className = "journey-compact-name-zh";
  nameZh.textContent = stop.place.zh;
  item.appendChild(nameZh);

  const desc = document.createElement("p");
  desc.className = "journey-compact-desc";
  desc.textContent = getPlaceDescription(stop.place, I18n.lang);
  item.appendChild(desc);

  return item;
}

function buildCompactConnector() {
  const connector = document.createElement("div");
  connector.className = "journey-compact-connector";
  connector.innerHTML = '<span class="journey-compact-arrow"></span>';
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
    const compactWrap = document.createElement("div");
    compactWrap.className = "journey-compact";
    stops.forEach((stop, i) => {
      if (i > 0) compactWrap.appendChild(buildCompactConnector());
      compactWrap.appendChild(buildCompactStop(stop, i, stops.length));
    });
    container.appendChild(compactWrap);
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
