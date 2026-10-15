// Display-only override: the CSV's primary English spelling is the
// Mandarin pinyin ("Chen"), but this exhibition is for the Pek Sek Tan Clan
// Association, who go by the Hokkien romanization "Tan" (already listed
// among 陈's own spelling variants — see js/surname-data.js). Data
// untouched; only what's shown to the visitor changes. Kept in sync with
// the identical override in js/surname-picker.js's recordLabel.
function surnameDisplayEn(surname) {
  if (surname.en === "Chen" && surname.zh === "陈") return "Tan";
  return surname.en;
}

// Renders the printed surname card: English + Chinese surname on top,
// history/origin + a notable clan figure on the bottom. Replaces the
// migration map on the "Print this map" mid-flow printout (print-map.html)
// — see js/surname-picker.js for how data.self.surname gets resolved while
// the visitor types their name on the family-tree step.

// Most surnames in the CSV (667 of 770) have no recorded history — rather
// than a dead-end "coming soon" message, point the visitor at MyChinaRoots'
// own research resources so the card is still useful.
const SURNAME_RESOURCE_LINKS = [
  { labelKey: "surnameResourceAdviceLabel", url: "https://www.mychinaroots.com/get-in-touch" },
  { labelKey: "surnameResourceRomanizedLabel", url: "https://www.mychinaroots.com/search/records?tab=ai" },
  { labelKey: "surnameResourceZupuLabel", url: "https://www.mychinaroots.com/search/records?tab=full-text" },
];

function buildResourcesFallback() {
  const wrap = document.createElement("div");
  wrap.className = "surname-resources";

  const intro = document.createElement("p");
  intro.className = "surname-resources-intro";
  intro.textContent = I18n.t("surnameResourcesIntro");
  wrap.appendChild(intro);

  const list = document.createElement("ul");
  SURNAME_RESOURCE_LINKS.forEach((item) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.className = "surname-resource-label";
    label.textContent = I18n.t(item.labelKey) + ": ";
    li.appendChild(label);
    const link = document.createElement("a");
    link.className = "surname-resource-url";
    link.href = item.url;
    link.textContent = item.url.replace(/^https:\/\/(www\.)?/, "");
    li.appendChild(link);
    list.appendChild(li);
  });
  wrap.appendChild(list);

  return wrap;
}

function renderSurnameCard(container, data) {
  container.innerHTML = "";
  const surname = data && data.self && data.self.surname;

  if (!surname) {
    const empty = document.createElement("p");
    empty.className = "surname-missing";
    empty.textContent = I18n.t("surnameMissingFallback");
    container.appendChild(empty);
    return;
  }

  const card = document.createElement("div");
  card.className = "surname-card";

  const top = document.createElement("div");
  top.className = "surname-top";
  const zh = document.createElement("div");
  zh.className = "surname-zh";
  zh.textContent = surname.zh;
  const en = document.createElement("div");
  en.className = "surname-en";
  en.textContent = surnameDisplayEn(surname);
  top.appendChild(zh);
  top.appendChild(en);
  card.appendChild(top);

  const divider = document.createElement("div");
  divider.className = "surname-divider";
  card.appendChild(divider);

  const bottom = document.createElement("div");
  bottom.className = "surname-bottom";
  // Chinese-language visitors get historyZh when it exists; otherwise fall
  // back to the English text rather than the resources block, since having
  // *some* history beats none. Only surnames with no history in either
  // language get the MyChinaRoots fallback.
  const historyText = (I18n.lang === "zh" && surname.historyZh) || surname.history;
  if (historyText) {
    const history = document.createElement("p");
    history.className = "surname-history";
    history.textContent = historyText;
    bottom.appendChild(history);
  } else {
    bottom.appendChild(buildResourcesFallback());
  }
  const famousText = (I18n.lang === "zh" && surname.famousZh) || surname.famous;
  if (famousText) {
    const famous = document.createElement("p");
    famous.className = "surname-famous";
    const label = document.createElement("strong");
    label.textContent = I18n.t("surnameFamousLabel") + " ";
    famous.appendChild(label);
    famous.appendChild(document.createTextNode(famousText));
    bottom.appendChild(famous);
  }
  card.appendChild(bottom);

  container.appendChild(card);
}
