// DREAMS 2026 visitor survey screen — shown once, before the family chart.
// Builds the form into a container (see index.html's #surveyForm) and
// exposes render/validate/buildCsvRow so js/flow.js can own navigation the
// same way it does for every other screen. Fixed UI text lives in
// js/i18n.js (bilingual, like the rest of the kiosk); option lists + PDPA
// text live in js/survey-questions.js (also bilingual, {en,zh} per item —
// see surveyOptionLabel there). CSV output always uses the English label
// regardless of display language — see buildCsvRow below.
const SurveyScreen = (function () {
  function fieldWrap(labelText, hintText) {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const label = document.createElement("label");
    label.textContent = labelText;
    if (hintText) {
      const opt = document.createElement("span");
      opt.className = "opt";
      opt.textContent = " " + hintText;
      label.appendChild(opt);
    }
    wrap.appendChild(label);
    return wrap;
  }

  function sectionHeading(container, text) {
    const h = document.createElement("h2");
    h.className = "survey-section-title";
    h.textContent = text;
    container.appendChild(h);
  }

  function singleSelectGrid(wrap, options, getCurrent, onSelect) {
    const grid = document.createElement("div");
    grid.className = "type-grid";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = surveyOptionLabel(opt);
      if (getCurrent() === opt.key) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        onSelect(opt.key);
        grid.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
  }

  function multiSelectList(wrap, options, selectedArray, getOther, onToggle, onOtherInput) {
    const list = document.createElement("div");
    list.className = "checkbox-list";

    function makeRow(key, labelText) {
      const row = document.createElement("label");
      row.className = "checkbox-row";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = selectedArray.includes(key);
      row.appendChild(cb);
      const span = document.createElement("span");
      span.textContent = labelText;
      row.appendChild(span);
      list.appendChild(row);
      return cb;
    }

    options.forEach((opt) => {
      const cb = makeRow(opt.key, surveyOptionLabel(opt));
      cb.addEventListener("change", () => onToggle(opt.key, cb.checked));
    });

    const otherInput = document.createElement("input");
    otherInput.type = "text";
    otherInput.className = "other-input";
    otherInput.placeholder = I18n.t("surveyOtherPlaceholder");
    otherInput.value = getOther() || "";
    otherInput.style.display = selectedArray.includes("other") ? "block" : "none";
    otherInput.addEventListener("input", () => onOtherInput(otherInput.value));

    const otherCb = makeRow("other", I18n.t("surveyOtherPrompt"));
    otherCb.addEventListener("change", () => {
      onToggle("other", otherCb.checked);
      otherInput.style.display = otherCb.checked ? "block" : "none";
      if (otherCb.checked) otherInput.focus();
    });

    wrap.appendChild(list);
    wrap.appendChild(otherInput);
  }

  function toggleCard(container, id, title, desc, checked, onChange) {
    const card = document.createElement("label");
    card.className = "toggle-card";
    card.id = id;
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = checked;
    card.appendChild(cb);
    const text = document.createElement("div");
    const h = document.createElement("div");
    h.className = "toggle-card-title";
    h.textContent = title;
    text.appendChild(h);
    const p = document.createElement("div");
    p.className = "toggle-card-desc";
    p.textContent = desc;
    text.appendChild(p);
    card.appendChild(text);
    cb.addEventListener("change", () => onChange(cb.checked));
    container.appendChild(card);
    return cb;
  }

  function render(container) {
    const s = State.data.survey;
    container.innerHTML = "";

    // ---- Section 1 — About You ----
    sectionHeading(container, I18n.t("surveySection1"));

    const nameWrap = fieldWrap(I18n.t("surveyNameLabel"));
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = s.name || "";
    nameInput.addEventListener("input", () => { s.name = nameInput.value; State.save(); });
    nameWrap.appendChild(nameInput);
    container.appendChild(nameWrap);

    const ageWrap = fieldWrap(I18n.t("surveyAgeGroupLabel"));
    singleSelectGrid(ageWrap, AGE_GROUPS, () => s.ageGroup, (key) => { s.ageGroup = key; State.save(); });
    container.appendChild(ageWrap);

    const genderWrap = fieldWrap(I18n.t("surveyGenderLabel"), I18n.t("optional"));
    singleSelectGrid(genderWrap, GENDERS, () => s.gender, (key) => { s.gender = key; State.save(); });
    container.appendChild(genderWrap);

    const clanWrap = fieldWrap(I18n.t("surveyClanCommunityLabel"), I18n.t("optional"));
    const clanInput = document.createElement("input");
    clanInput.type = "text";
    clanInput.value = s.clanCommunity || "";
    clanInput.addEventListener("input", () => { s.clanCommunity = clanInput.value; State.save(); });
    clanWrap.appendChild(clanInput);
    container.appendChild(clanWrap);

    // ---- Section 2 — DREAMS Areas ----
    sectionHeading(container, I18n.t("surveySection2"));

    const dreamsWrap = fieldWrap(I18n.t("surveyDreamsQuestion"), I18n.t("surveySelectAll"));
    multiSelectList(
      dreamsWrap,
      DREAMS_AREAS,
      s.dreamsAreas,
      () => s.dreamsAreasOther,
      (key, checked) => {
        if (checked) s.dreamsAreas.push(key);
        else s.dreamsAreas = s.dreamsAreas.filter((k) => k !== key);
        State.save();
      },
      (val) => { s.dreamsAreasOther = val; State.save(); }
    );
    container.appendChild(dreamsWrap);

    // ---- Section 3 — What's Next ----
    sectionHeading(container, I18n.t("surveySection3"));

    const futureWrap = fieldWrap(I18n.t("surveyFutureQuestion"), I18n.t("surveySelectAll"));
    multiSelectList(
      futureWrap,
      FUTURE_ACTIVITIES,
      s.futurePrograms,
      () => s.futureProgramsOther,
      (key, checked) => {
        if (checked) s.futurePrograms.push(key);
        else s.futurePrograms = s.futurePrograms.filter((k) => k !== key);
        State.save();
      },
      (val) => { s.futureProgramsOther = val; State.save(); }
    );
    container.appendChild(futureWrap);

    // ---- Section 4 — Contact & Lucky Draw ----
    sectionHeading(container, I18n.t("surveySection4"));

    const contactWrap = document.createElement("div");
    contactWrap.id = "surveyContactFields";

    const mobileWrap = fieldWrap(I18n.t("surveyMobileLabel"));
    mobileWrap.id = "surveyMobileField";
    const mobileInput = document.createElement("input");
    mobileInput.type = "tel";
    mobileInput.inputMode = "numeric";
    mobileInput.maxLength = 8;
    mobileInput.placeholder = "8123 4567";
    mobileInput.required = true;
    mobileInput.value = s.mobile || "";
    mobileInput.addEventListener("input", () => {
      // Singapore mobile numbers are 8 digits — strip anything else as the
      // visitor types rather than rejecting the whole value on submit.
      mobileInput.value = mobileInput.value.replace(/\D/g, "").slice(0, 8);
      s.mobile = mobileInput.value;
      State.save();
    });
    mobileWrap.appendChild(mobileInput);
    contactWrap.appendChild(mobileWrap);

    const emailWrap = fieldWrap(I18n.t("surveyEmailLabel"), I18n.t("optional"));
    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.value = s.email || "";
    emailInput.addEventListener("input", () => { s.email = emailInput.value; State.save(); });
    emailWrap.appendChild(emailInput);
    contactWrap.appendChild(emailWrap);

    const contactHint = document.createElement("p");
    contactHint.className = "survey-hint";
    contactHint.textContent = I18n.t("surveyContactHint");
    contactWrap.appendChild(contactHint);

    container.appendChild(contactWrap);

    toggleCard(
      container,
      "keepInformedCard",
      I18n.t("surveyKeepInformedTitle"),
      I18n.t("surveyKeepInformedDesc"),
      s.keepInformed,
      (checked) => { s.keepInformed = checked; State.save(); }
    );

    // ---- Section 5 — Personal Data / PDPA ----
    sectionHeading(container, I18n.t("surveySection5"));
    const notice = document.createElement("div");
    notice.className = "pdpa-notice";
    const noticeTitle = document.createElement("h3");
    noticeTitle.textContent = I18n.t("surveyPdpaTitle");
    notice.appendChild(noticeTitle);
    PDPA_NOTICE_PARAGRAPHS.forEach((p) => {
      const para = document.createElement("p");
      para.textContent = I18n.lang === "zh" ? p.zh : p.en;
      notice.appendChild(para);
    });
    container.appendChild(notice);

    toggleCard(
      container,
      "pdpaConsentCard",
      "",
      I18n.t("surveyPdpaConsentLabel"),
      s.pdpaConsent,
      (checked) => { s.pdpaConsent = checked; State.save(); }
    );
    document.getElementById("pdpaConsentCard").classList.add("toggle-card-consent");
  }

  function shakeField(el) {
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("shake-error");
    setTimeout(() => el.classList.remove("shake-error"), 700);
  }

  function validate() {
    const s = State.data.survey;
    if (!/^\d{8}$/.test(s.mobile.trim())) {
      shakeField(document.getElementById("surveyMobileField"));
      return false;
    }
    if (!s.pdpaConsent) {
      shakeField(document.getElementById("pdpaConsentCard"));
      return false;
    }
    return true;
  }

  // CSV output stays English regardless of display language, so exported
  // data isn't split across two languages depending on which visitor
  // answered it — see js/survey-questions.js.
  function labelForEn(options, key) {
    const opt = options.find((o) => o.key === key);
    return opt ? opt.en : "";
  }

  function formatMultiEn(selectedKeys, options, otherText) {
    const labels = selectedKeys
      .filter((k) => k !== "other")
      .map((k) => labelForEn(options, k))
      .filter(Boolean);
    if (selectedKeys.includes("other")) {
      labels.push(otherText && otherText.trim() ? "Other: " + otherText.trim() : "Other");
    }
    return labels.join("; ");
  }

  function buildCsvRow() {
    const s = State.data.survey;
    const now = new Date().toISOString();
    const hasContact = Boolean(s.mobile.trim() || s.email.trim());
    return [
      now,
      SURVEY_EVENT_SOURCE,
      s.name || "",
      labelForEn(AGE_GROUPS, s.ageGroup),
      labelForEn(GENDERS, s.gender),
      formatMultiEn(s.dreamsAreas, DREAMS_AREAS, s.dreamsAreasOther),
      formatMultiEn(s.futurePrograms, FUTURE_ACTIVITIES, s.futureProgramsOther),
      s.clanCommunity || "",
      s.mobile || "",
      s.email || "",
      hasContact ? "Yes" : "No",
      s.keepInformed ? "Yes" : "No",
      "Yes",
      now,
      SURVEY_CONSENT_VERSION,
    ];
  }

  return { render, validate, buildCsvRow };
})();
