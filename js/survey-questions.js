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
const SURVEY_CONSENT_VERSION = "v2-2026-09-25";

function surveyOptionLabel(opt) {
  return I18n.lang === "zh" ? opt.zh : opt.en;
}

// The six DREAMS pillars, per the final field list from OOY. Order matches
// the acronym: Discovery, Remember, Express, Art, Mindfulness, Smart.
const DREAMS_AREAS = [
  { key: "discovery", en: "Discovery — Genealogy", zh: "探索 (Discovery) — 家谱" },
  { key: "remember", en: "Remember — Heritage", zh: "缅怀 (Remember) — 文化传承" },
  { key: "express", en: "Express — Culture", zh: "表达 (Express) — 文化" },
  { key: "art", en: "Art — Creativity", zh: "艺术 (Art) — 创意" },
  { key: "mindfulness", en: "Mindfulness — Wellbeing", zh: "静心 (Mindfulness) — 身心健康" },
  { key: "smart", en: "Smart — Technology", zh: "智慧 (Smart) — 科技" },
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
  { key: "18_25", en: "18–25", zh: "18–25岁" },
  { key: "26_35", en: "26–35", zh: "26–35岁" },
  { key: "36_45", en: "36–45", zh: "36–45岁" },
  { key: "46_60", en: "46–60", zh: "46–60岁" },
  { key: "above60", en: "Above 60", zh: "60岁以上" },
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
    en: "We collect the information above to run today's DREAMS Digital Journey, plan future OOY CIRCLE programmes, and — only if you provide a WhatsApp number or email — to contact Lucky Draw winners.",
    zh: "我们收集以上资料，用于开展今天的 DREAMS 数码之旅、规划 OOY CIRCLE 未来的项目，并且仅在您提供 WhatsApp 号码或电子邮件时，用于联系幸运抽奖得主。",
  },
  {
    en: "Entering the Lucky Draw does not require you to agree to receive future OOY CIRCLE communications — these are separate choices, and you may opt in to one, both or neither.",
    zh: "参加幸运抽奖并不代表您同意接收 OOY CIRCLE 未来的资讯 — 这是两项各自独立的选择，您可以选择其中一项、两项，或都不选。",
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

// Ordered to match the final OOY field list exactly, so the CSV header row
// and js/survey.js's buildCsvRow() stay in lockstep. Kept English-only
// regardless of display language, so exported data isn't split across two
// languages depending on which visitor answered it.
const SURVEY_CSV_COLUMNS = [
  "Timestamp",
  "Event Source",
  "Name",
  "Age Group",
  "Gender",
  "DREAMS Areas Interested",
  "Future OOY Activities",
  "Clan/Community/Association",
  "Mobile/WhatsApp",
  "Email",
  "Lucky Draw Eligible",
  "Keep Informed (Future Communications)",
  "PDPA Consent",
  "Consent Timestamp",
  "Consent Version",
];
