
const COUNTRIES_BY_KEY = COUNTRIES.reduce((acc, c) => {
  acc[c.key] = c;
  return acc;
}, {});

function countryLabel(key) {
  const c = COUNTRIES_BY_KEY[key];
  if (!c) return "";
  return I18n.lang === "zh" ? c.zh : c.en;
}

function countryImage(country) {
  return "assets/siblingMigration/" + encodeURIComponent(country.file);
}

// Picker layout: a short "Popular" group first (where Singapore families'
// relatives most often settle), then A-Z so 199 names stay scannable. The
// same country can appear in both, which is fine: the picker only cares
// about the key it hands back.
const POPULAR_COUNTRY_KEYS = [
  "Australia", "United_Kingdom", "United_States", "Canada", "New_Zealand", "Malaysia", "China", "Hong_Kong",
  "Taiwan", "Japan", "Thailand", "Indonesia", "Singapore", "United_Arab_Emirates", "Germany", "France",
];

const COUNTRY_GROUPS = [{ key: "popular", en: "Popular", zh: "常见" }].concat(
  Array.from(new Set(COUNTRIES.map((c) => c.en.charAt(0).toUpperCase())))
    .sort()
    .map((letter) => ({ key: "letter-" + letter, en: letter, zh: letter }))
);

const COUNTRY_PICKER_ITEMS = POPULAR_COUNTRY_KEYS.filter((k) => COUNTRIES_BY_KEY[k])
  .map((k) => Object.assign({}, COUNTRIES_BY_KEY[k], { group: "popular" }))
  .concat(COUNTRIES.map((c) => Object.assign({}, c, { group: "letter-" + c.en.charAt(0).toUpperCase() })));
