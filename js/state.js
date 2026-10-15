// Central visitor data model + persistence helpers.
const STORAGE_KEY = "tanclan_visitor";

// The kiosk prints on A5 only. Every print dimension (millimetres) lives here
// so js/print.js, js/print-map.js and the tests share one source of truth;
// css/print.css repeats the logo/QR/caption numbers and must be kept in step
// (each is marked there).
const PRINT_LAYOUT = {
  w: 210,
  h: 148,
  pad: 8.5, // blank margin round the card
  gap: 2, // clear space kept between the tree and the logo / QR / caption
  textHeaderReserve: 11.5, // top band for the plain text header (surname card)
};

function blankPerson() {
  return { name: "", job: "", photo: null };
}

// DREAMS 2026 visitor survey — completed before the family chart. Kept
// entirely local (see js/csv-log.js): never sent to Firestore (js/sync.js
// strips this key out before writing), only exported to CSV by staff.
function blankSurvey() {
  return {
    name: "",
    ageGroup: null,
    gender: null,
    dreamsAreas: [],
    dreamsAreasOther: "",
    futurePrograms: [],
    futureProgramsOther: "",
    clanCommunity: "",
    mobile: "",
    email: "",
    keepInformed: false,
    pdpaConsent: false,
  };
}

function blankState() {
  return {
    lang: "en",
    // children: self's own children only ({name,job,photo,gender}) — no
    // grandchildren; see js/tree.js's generationRootTier for how "Family
    // Root in Singapore" (Generation 1) is determined.
    // surname/surnameToken: resolved by js/surname-picker.js from the first
    // word of `name` against js/surname-data.js — surname is the chosen
    // {en,zh,history,famous} record (or null until resolved/chosen), and
    // surnameToken is the normalized spelling it was resolved from, used to
    // detect when `name`'s first word changes and needs re-resolving. Printed
    // on the "Print this map" card — see js/surname-card.js.
    self: { name: "", job: "", photo: null, children: [], surname: null, surnameToken: null },
    hasSiblings: null, // true/false
    siblingCount: 0,
    siblings: [], // { name, type, job, photo }
    father: blankPerson(),
    mother: blankPerson(),
    knowGrandparents: null, // true/false
    grandfather: blankPerson(),
    grandmother: blankPerson(),
    knowGreatGrandparents: null,
    greatGrandfather: blankPerson(),
    greatGrandmother: blankPerson(),
    origins: {
      greatGrandparents: null, // preset place key from js/places.js
      grandparents: null,
      parents: null,
    },
    // Intergenerational dialogue question answers — never asked at the
    // kiosk; only collected/edited later in edit/ (see js/dialogue-questions.js).
    // Keyed by question id, e.g. { grandpaFirstJob: "..." }.
    dialogueAnswers: {},
    survey: blankSurvey(),
  };
}

const State = {
  data: blankState(),

  reset() {
    const lang = this.data.lang;
    this.data = blankState();
    this.data.lang = lang;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      /* storage unavailable, continue silently for kiosk resilience */
    }
  },

  loadForPrint() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
};
