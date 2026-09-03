// DREAMS 2026 visitor survey — static content (options, PDPA notice text,
// CSV schema). English-only for now, matching edit/app.js's existing
// precedent of not being fully bilingual yet (unlike the rest of the kiosk).
// See js/survey.js for the screen itself and js/csv-log.js for local
// storage/export.

const SURVEY_EVENT_SOURCE = "DREAMS 2026";

// Bump this whenever the PDPA notice wording below changes, so every CSV
// row records exactly which version of the notice the visitor consented to.
const SURVEY_CONSENT_VERSION = "v1-2026-09-03";

const EXHIBITION_INTERESTS = [
  { key: "roots", label: "Roots / genealogy / family history" },
  { key: "heritage", label: "Heritage & culture" },
  { key: "arts", label: "Arts & creativity" },
  { key: "wellness", label: "Wellness" },
  { key: "music", label: "Music & performance" },
  { key: "ai", label: "AI & digital learning" },
  { key: "intergenerational", label: "Intergenerational activities" },
  { key: "community", label: "Community networking" },
  { key: "entrepreneurship", label: "Entrepreneurship / business opportunities" },
];

const ROOTS_INTEREST_OPTIONS = [
  { key: "yes", label: "Yes" },
  { key: "maybe", label: "Maybe" },
  { key: "not_now", label: "Not at the moment" },
];

const FUTURE_ACTIVITIES = [
  { key: "workshops", label: "Family tree / genealogy workshops" },
  { key: "heritage", label: "Heritage and cultural programmes" },
  { key: "arts", label: "Arts & creative activities" },
  { key: "music", label: "Music programmes" },
  { key: "wellness", label: "Wellness activities" },
  { key: "ai", label: "AI & digital skills" },
  { key: "intergenerational", label: "Intergenerational programmes" },
  { key: "talks", label: "Talks / learning sessions" },
  { key: "social", label: "Social gatherings / networking" },
  { key: "entrepreneurship", label: "Entrepreneurship / business networking" },
  { key: "volunteering", label: "Volunteering" },
  { key: "community", label: "Community projects" },
];

const AGE_GROUPS = [
  { key: "under18", label: "Under 18" },
  { key: "18_29", label: "18–29" },
  { key: "30_39", label: "30–39" },
  { key: "40_49", label: "40–49" },
  { key: "50_59", label: "50–59" },
  { key: "60_69", label: "60–69" },
  { key: "70plus", label: "70+" },
  { key: "prefer_not", label: "Prefer not to say" },
];

const GENDERS = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
  { key: "prefer_not", label: "Prefer not to say" },
];

// [INSERT PEK SEK TAN CLAN ASSOCIATION DPO / PRIVACY CONTACT EMAIL] below is
// a deliberate placeholder — per the brief, this wording must be reviewed
// and finalised by the Association's DPO/privacy officer before this form
// goes live at a real event.
const PDPA_NOTICE_PARAGRAPHS = [
  "OOY CIRCLE is an initiative/division governed by Pek Sek Tan Clan Association.",
  "The personal information provided through this form will be collected, used and stored by Pek Sek Tan Clan Association for purposes relevant to the selections made above, including visitor feedback and programme planning, administration of OOY CIRCLE membership, responding to requests to participate or volunteer, and communicating information about OOY CIRCLE programmes and activities where consent has been given.",
  "Personal data will be handled in accordance with Singapore's Personal Data Protection Act 2012 and the Association's applicable privacy practices.",
  "Requests concerning access, correction or withdrawal of consent may be directed to: [INSERT PEK SEK TAN CLAN ASSOCIATION DPO / PRIVACY CONTACT EMAIL]",
];

// Ordered to match the "Database Requirements" list exactly, so the CSV
// header row and js/survey.js's buildCsvRow() stay in lockstep.
const SURVEY_CSV_COLUMNS = [
  "Timestamp",
  "Event Source",
  "Rating (1-5)",
  "Exhibition Interests",
  "Roots Interest",
  "Future Programmes",
  "Age Group",
  "Gender",
  "Hobbies/Interests",
  "Name",
  "Mobile/WhatsApp",
  "Email",
  "Join OOY Circle",
  "Keep Informed",
  "Volunteer/Contribute",
  "Contribution Details",
  "Next Chapter Suggestion",
  "PDPA Consent",
  "Consent Timestamp",
  "Consent Version",
];
