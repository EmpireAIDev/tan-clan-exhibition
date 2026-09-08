// Central visitor data model + persistence helpers.
const STORAGE_KEY = "tanclan_visitor";
const SETTINGS_KEY = "tanclan_settings";

const PAPER_SIZES = {
  a6: { labelKey: "A6 Postcard (148 x 100mm)", w: 148, h: 100 },
  photo4x6: { labelKey: "4x6\" Photo (152.4 x 101.6mm)", w: 152.4, h: 101.6 },
  a5: { labelKey: "A5 (210 x 148mm)", w: 210, h: 148 },
};

function blankPerson() {
  return { name: "", job: "", photo: null };
}

// DREAMS 2026 visitor survey — completed before the family chart. Kept
// entirely local (see js/csv-log.js): never sent to Firestore (js/sync.js
// strips this key out before writing), only exported to CSV by staff.
function blankSurvey() {
  return {
    rating: null,
    interests: [],
    interestsOther: "",
    rootsInterest: null,
    futurePrograms: [],
    futureProgramsOther: "",
    nextChapterSuggestion: "",
    name: "",
    ageGroup: null,
    gender: null,
    hobbies: "",
    mobile: "",
    email: "",
    joinCircle: false,
    keepInformed: false,
    contribute: false,
    contributeDetails: "",
    pdpaConsent: false,
  };
}

function blankState() {
  return {
    lang: "en",
    self: { name: "", job: "", photo: null, children: [] }, // children: self's own children only ({name,job,photo,gender}) — no grandchildren; see js/tree.js's generationRootTier for how "Family Root in Singapore" (Generation 1) is determined
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

  getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { paperSize: "a6" };
    } catch (e) {
      return { paperSize: "a6" };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      /* ignore */
    }
  },
};
