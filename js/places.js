// Preset places for the migration map. x/y are coordinates on the
// assets/map.svg viewBox (0 0 500 620) — a stylized, not survey-accurate,
// illustration of China down through Hong Kong/Taiwan/Southeast Asia.
const PLACES = [
  { key: "ningbo", en: "Ningbo", zh: "寧波", x: 372, y: 168 },
  { key: "shanghai", en: "Shanghai", zh: "上海", x: 383, y: 152 },
  { key: "guangzhou", en: "Guangzhou (Canton)", zh: "廣州", x: 330, y: 268 },
  { key: "xiamen", en: "Xiamen", zh: "廈門", x: 360, y: 240 },
  { key: "hongkong", en: "Hong Kong", zh: "香港", x: 345, y: 288 },
  { key: "taipei", en: "Taipei", zh: "臺北", x: 400, y: 260 },
  { key: "bangkok", en: "Bangkok", zh: "曼谷", x: 245, y: 420 },
  { key: "kualalumpur", en: "Kuala Lumpur / Penang", zh: "吉隆坡／檳城", x: 270, y: 500 },
  { key: "jakarta", en: "Jakarta", zh: "雅加達", x: 300, y: 570 },
  { key: "singapore", en: "Singapore", zh: "新加坡", x: 290, y: 540 },
  { key: "other", en: "Somewhere else", zh: "其他地方", x: null, y: null },
];

const PLACES_BY_KEY = PLACES.reduce((acc, p) => {
  acc[p.key] = p;
  return acc;
}, {});

function placeLabel(key) {
  const p = PLACES_BY_KEY[key];
  if (!p) return "";
  return I18n.lang === "zh" ? p.zh : p.en;
}
