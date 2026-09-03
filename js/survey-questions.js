// DREAMS 2026 visitor survey — static content (options, PDPA notice text,
// CSV schema). Bilingual (en/zh) like the rest of the kiosk: option lists
// follow js/places.js's {key, en, zh} + lookup-helper pattern; fixed
// UI labels/questions/headings live in js/i18n.js's dictionary instead (see
// js/survey.js for how both get pulled together). CSV output always uses
// the English label regardless of display language, so staff analysis
// isn't split across two languages — see survey.js's buildCsvRow.

const SURVEY_EVENT_SOURCE = "DREAMS 2026";

// Bump this whenever the PDPA notice wording below changes, so every CSV
// row records exactly which version of the notice the visitor consented to.
const SURVEY_CONSENT_VERSION = "v1-2026-09-03";

function surveyOptionLabel(opt) {
  return I18n.lang === "zh" ? opt.zh : opt.en;
}

const EXHIBITION_INTERESTS = [
  { key: "roots", en: "Roots / genealogy / family history", zh: "根源／家谱／家族历史" },
  { key: "heritage", en: "Heritage & culture", zh: "文化传承" },
  { key: "arts", en: "Arts & creativity", zh: "艺术与创意" },
  { key: "wellness", en: "Wellness", zh: "身心健康" },
  { key: "music", en: "Music & performance", zh: "音乐与表演" },
  { key: "ai", en: "AI & digital learning", zh: "人工智能与数码学习" },
  { key: "intergenerational", en: "Intergenerational activities", zh: "跨代活动" },
  { key: "community", en: "Community networking", zh: "社区联谊" },
  { key: "entrepreneurship", en: "Entrepreneurship / business opportunities", zh: "创业／商机" },
];

const ROOTS_INTEREST_OPTIONS = [
  { key: "yes", en: "Yes", zh: "是" },
  { key: "maybe", en: "Maybe", zh: "或许" },
  { key: "not_now", en: "Not at the moment", zh: "暂时不需要" },
];

const FUTURE_ACTIVITIES = [
  { key: "workshops", en: "Family tree / genealogy workshops", zh: "家族树／家谱工作坊" },
  { key: "heritage", en: "Heritage and cultural programmes", zh: "文化传承项目" },
  { key: "arts", en: "Arts & creative activities", zh: "艺术与创意活动" },
  { key: "music", en: "Music programmes", zh: "音乐项目" },
  { key: "wellness", en: "Wellness activities", zh: "身心健康活动" },
  { key: "ai", en: "AI & digital skills", zh: "人工智能与数码技能" },
  { key: "intergenerational", en: "Intergenerational programmes", zh: "跨代项目" },
  { key: "talks", en: "Talks / learning sessions", zh: "讲座／学习课程" },
  { key: "social", en: "Social gatherings / networking", zh: "社交聚会／联谊" },
  { key: "entrepreneurship", en: "Entrepreneurship / business networking", zh: "创业／商务联谊" },
  { key: "volunteering", en: "Volunteering", zh: "志愿服务" },
  { key: "community", en: "Community projects", zh: "社区项目" },
];

const AGE_GROUPS = [
  { key: "under18", en: "Under 18", zh: "18岁以下" },
  { key: "18_29", en: "18–29", zh: "18–29岁" },
  { key: "30_39", en: "30–39", zh: "30–39岁" },
  { key: "40_49", en: "40–49", zh: "40–49岁" },
  { key: "50_59", en: "50–59", zh: "50–59岁" },
  { key: "60_69", en: "60–69", zh: "60–69岁" },
  { key: "70plus", en: "70+", zh: "70岁以上" },
  { key: "prefer_not", en: "Prefer not to say", zh: "不愿透露" },
];

const GENDERS = [
  { key: "male", en: "Male", zh: "男" },
  { key: "female", en: "Female", zh: "女" },
  { key: "prefer_not", en: "Prefer not to say", zh: "不愿透露" },
];

// [INSERT PEK SEK TAN CLAN ASSOCIATION DPO / PRIVACY CONTACT EMAIL] below is
// a deliberate placeholder — per the brief, this wording (English AND the
// Chinese translation added here) must be reviewed and finalised by the
// Association's DPO/privacy officer before this form goes live at a real
// event. The Chinese text is a good-faith translation, not a certified
// legal one — have it checked alongside the English original.
const PDPA_NOTICE_PARAGRAPHS = [
  {
    en: "OOY CIRCLE is an initiative/division governed by Pek Sek Tan Clan Association.",
    zh: "OOY CIRCLE 是 Pek Sek Tan Clan Association（碧山陈氏公会）旗下的一个项目／部门。",
  },
  {
    en: "The personal information provided through this form will be collected, used and stored by Pek Sek Tan Clan Association for purposes relevant to the selections made above, including visitor feedback and programme planning, administration of OOY CIRCLE membership, responding to requests to participate or volunteer, and communicating information about OOY CIRCLE programmes and activities where consent has been given.",
    zh: "通过本表格提供的个人资料将由 Pek Sek Tan Clan Association 收集、使用及储存，用于与上述所选项目相关的用途，包括访客反馈与项目规划、OOY CIRCLE 会员资格的管理、回应参与或志愿服务的请求，以及在您已同意的情况下，传达有关 OOY CIRCLE 项目和活动的信息。",
  },
  {
    en: "Personal data will be handled in accordance with Singapore's Personal Data Protection Act 2012 and the Association's applicable privacy practices.",
    zh: "个人资料将根据新加坡《2012年个人资料保护法》（Personal Data Protection Act 2012）以及本会适用的隐私惯例处理。",
  },
  {
    en: "Requests concerning access, correction or withdrawal of consent may be directed to: [INSERT PEK SEK TAN CLAN ASSOCIATION DPO / PRIVACY CONTACT EMAIL]",
    zh: "如需查阅、更正个人资料或撤回同意，请联系：[请填写 PEK SEK TAN CLAN ASSOCIATION DPO／隐私联系邮箱]",
  },
];

// Ordered to match the "Database Requirements" list exactly, so the CSV
// header row and js/survey.js's buildCsvRow() stay in lockstep. Kept
// English-only regardless of display language, so exported data isn't
// split across two languages depending on which visitor answered it.
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
