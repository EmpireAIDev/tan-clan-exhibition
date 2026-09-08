// Intergenerational dialogue questions — prompts meant to start a
// conversation between generations at home. Deliberately kept out of the
// kiosk family-chart step (see js/chart-editor.js); only collected/edited
// in the take-home editor (edit/app.js), and stored on the submission doc
// as data.dialogueAnswers[id].
const DIALOGUE_QUESTIONS = [
  {
    id: "grandpaFirstJob",
    en: "What was Grandpa's first job?",
    zh: "爷爷的第一份工作是什么？",
    askEn: "Ask Grandma",
    askZh: "问问奶奶",
  },
  {
    id: "firstHome",
    en: "What was our family's first home in Singapore?",
    zh: "我们家在新加坡的第一个家是什么样的？",
    askEn: "Ask Parents",
    askZh: "问问父母",
  },
  {
    id: "inherited",
    en: "What do you think you inherited from them?",
    zh: "你觉得你从他们身上继承了什么？",
    askEn: "Ask Children",
    askZh: "问问孩子们",
  },
];
