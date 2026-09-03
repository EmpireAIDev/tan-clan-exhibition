// DREAMS 2026 visitor survey screen — shown once, before the family chart.
// Builds the form into a container (see index.html's #surveyForm) and
// exposes render/validate/buildCsvRow so js/flow.js can own navigation the
// same way it does for every other screen. Options/labels/PDPA text live in
// js/survey-questions.js; local storage + CSV export live in js/csv-log.js.
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
      btn.textContent = opt.label;
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

  function ratingRow(wrap, getCurrent, onSelect) {
    const grid = document.createElement("div");
    grid.className = "count-grid";
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(i);
      if (getCurrent() === i) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        onSelect(i);
        grid.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
      grid.appendChild(btn);
    }
    wrap.appendChild(grid);
    const captions = document.createElement("div");
    captions.className = "rating-captions";
    const lo = document.createElement("span");
    lo.textContent = "1 = Not meaningful to me";
    const hi = document.createElement("span");
    hi.textContent = "5 = Very meaningful to me";
    captions.appendChild(lo);
    captions.appendChild(hi);
    wrap.appendChild(captions);
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
      const cb = makeRow(opt.key, opt.label);
      cb.addEventListener("change", () => onToggle(opt.key, cb.checked));
    });

    const otherInput = document.createElement("input");
    otherInput.type = "text";
    otherInput.className = "other-input";
    otherInput.placeholder = "Please specify";
    otherInput.value = getOther() || "";
    otherInput.style.display = selectedArray.includes("other") ? "block" : "none";
    otherInput.addEventListener("input", () => onOtherInput(otherInput.value));

    const otherCb = makeRow("other", "Other:");
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

    // ---- Section 1 ----
    sectionHeading(container, "Section 1 — Your Experience Today");

    const ratingWrap = fieldWrap("How did you find the DREAMS exhibition?");
    ratingRow(ratingWrap, () => s.rating, (v) => { s.rating = v; State.save(); });
    container.appendChild(ratingWrap);

    const interestsWrap = fieldWrap("Which parts interested you most?", "(select all that apply)");
    multiSelectList(
      interestsWrap,
      EXHIBITION_INTERESTS,
      s.interests,
      () => s.interestsOther,
      (key, checked) => {
        if (checked) s.interests.push(key);
        else s.interests = s.interests.filter((k) => k !== key);
        State.save();
      },
      (val) => { s.interestsOther = val; State.save(); }
    );
    container.appendChild(interestsWrap);

    const rootsWrap = fieldWrap(
      "After today's experience, would you like to discover more about your own roots, family story or heritage?"
    );
    singleSelectGrid(rootsWrap, ROOTS_INTEREST_OPTIONS, () => s.rootsInterest, (key) => {
      s.rootsInterest = key;
      State.save();
    });
    container.appendChild(rootsWrap);

    // ---- Section 2 ----
    sectionHeading(container, "Section 2 — What Would You Like OOY CIRCLE To Do Next?");

    const futureWrap = fieldWrap("Which future activities would interest you?", "(select all that apply)");
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

    const nextChapterWrap = fieldWrap(
      "Is there something you would like to see in the next chapter of OOY CIRCLE?",
      "(optional)"
    );
    const nextChapterInput = document.createElement("textarea");
    nextChapterInput.rows = 3;
    nextChapterInput.value = s.nextChapterSuggestion || "";
    nextChapterInput.addEventListener("input", () => {
      s.nextChapterSuggestion = nextChapterInput.value;
      State.save();
    });
    nextChapterWrap.appendChild(nextChapterInput);
    container.appendChild(nextChapterWrap);

    // ---- Section 3 ----
    sectionHeading(container, "Section 3 — About You");

    const nameWrap = fieldWrap("Name");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = s.name || "";
    nameInput.addEventListener("input", () => { s.name = nameInput.value; State.save(); });
    nameWrap.appendChild(nameInput);
    container.appendChild(nameWrap);

    const ageWrap = fieldWrap("Age group");
    singleSelectGrid(ageWrap, AGE_GROUPS, () => s.ageGroup, (key) => { s.ageGroup = key; State.save(); });
    container.appendChild(ageWrap);

    const genderWrap = fieldWrap("Gender");
    singleSelectGrid(genderWrap, GENDERS, () => s.gender, (key) => { s.gender = key; State.save(); });
    container.appendChild(genderWrap);

    const hobbiesWrap = fieldWrap("Your hobbies/interests");
    const hobbiesInput = document.createElement("input");
    hobbiesInput.type = "text";
    hobbiesInput.value = s.hobbies || "";
    hobbiesInput.addEventListener("input", () => { s.hobbies = hobbiesInput.value; State.save(); });
    hobbiesWrap.appendChild(hobbiesInput);
    container.appendChild(hobbiesWrap);

    const contactWrap = document.createElement("div");
    contactWrap.id = "surveyContactFields";

    const mobileWrap = fieldWrap("Mobile / WhatsApp");
    const mobileInput = document.createElement("input");
    mobileInput.type = "tel";
    mobileInput.value = s.mobile || "";
    mobileInput.addEventListener("input", () => { s.mobile = mobileInput.value; State.save(); });
    mobileWrap.appendChild(mobileInput);
    contactWrap.appendChild(mobileWrap);

    const emailWrap = fieldWrap("Email");
    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.value = s.email || "";
    emailInput.addEventListener("input", () => { s.email = emailInput.value; State.save(); });
    emailWrap.appendChild(emailInput);
    contactWrap.appendChild(emailWrap);

    const contactHint = document.createElement("p");
    contactHint.className = "survey-hint";
    contactHint.textContent =
      "At least one of these is only required if you join OOY CIRCLE or ask to be kept informed below.";
    contactWrap.appendChild(contactHint);

    container.appendChild(contactWrap);

    // ---- Section 4 ----
    sectionHeading(container, "Section 4 — Continue the Journey");
    const section4Sub = document.createElement("p");
    section4Sub.className = "survey-hint";
    section4Sub.textContent = "Would you like to be part of what comes next?";
    container.appendChild(section4Sub);

    toggleCard(
      container,
      "joinCircleCard",
      "Join OOY CIRCLE",
      "I would like to become an OOY CIRCLE member. Membership is currently complimentary.",
      s.joinCircle,
      (checked) => { s.joinCircle = checked; State.save(); }
    );

    toggleCard(
      container,
      "keepInformedCard",
      "Keep me informed",
      "I would like to receive information about future OOY CIRCLE programmes, events and opportunities.",
      s.keepInformed,
      (checked) => { s.keepInformed = checked; State.save(); }
    );

    const contributeWrap = document.createElement("div");
    const contributeDetailsWrap = fieldWrap("How might you like to contribute?", "(optional)");
    const contributeDetailsInput = document.createElement("textarea");
    contributeDetailsInput.rows = 2;
    contributeDetailsInput.value = s.contributeDetails || "";
    contributeDetailsInput.addEventListener("input", () => {
      s.contributeDetails = contributeDetailsInput.value;
      State.save();
    });
    contributeDetailsWrap.appendChild(contributeDetailsInput);
    contributeDetailsWrap.style.display = s.contribute ? "block" : "none";

    toggleCard(
      container,
      "contributeCard",
      "I would like to contribute",
      "I am interested in volunteering, sharing my skills or helping with future OOY CIRCLE activities.",
      s.contribute,
      (checked) => {
        s.contribute = checked;
        State.save();
        contributeDetailsWrap.style.display = checked ? "block" : "none";
      }
    );
    contributeWrap.appendChild(contributeDetailsWrap);
    container.appendChild(contributeWrap);

    // ---- Section 5 ----
    sectionHeading(container, "Section 5 — Personal Data / PDPA");
    const notice = document.createElement("div");
    notice.className = "pdpa-notice";
    const noticeTitle = document.createElement("h3");
    noticeTitle.textContent = "Personal Data Notice";
    notice.appendChild(noticeTitle);
    PDPA_NOTICE_PARAGRAPHS.forEach((p) => {
      const para = document.createElement("p");
      para.textContent = p;
      notice.appendChild(para);
    });
    container.appendChild(notice);

    toggleCard(
      container,
      "pdpaConsentCard",
      "",
      "I acknowledge that I have read the Personal Data Notice and consent to the collection, use and disclosure of the information I provide for the purposes indicated in this form.",
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
    if (!s.pdpaConsent) {
      shakeField(document.getElementById("pdpaConsentCard"));
      return false;
    }
    if ((s.joinCircle || s.keepInformed) && !s.mobile.trim() && !s.email.trim()) {
      shakeField(document.getElementById("surveyContactFields"));
      return false;
    }
    return true;
  }

  function labelFor(options, key) {
    const opt = options.find((o) => o.key === key);
    return opt ? opt.label : "";
  }

  function formatMulti(selectedKeys, options, otherText) {
    const labels = selectedKeys
      .filter((k) => k !== "other")
      .map((k) => labelFor(options, k))
      .filter(Boolean);
    if (selectedKeys.includes("other")) {
      labels.push(otherText && otherText.trim() ? "Other: " + otherText.trim() : "Other");
    }
    return labels.join("; ");
  }

  function buildCsvRow() {
    const s = State.data.survey;
    const now = new Date().toISOString();
    return [
      now,
      SURVEY_EVENT_SOURCE,
      s.rating || "",
      formatMulti(s.interests, EXHIBITION_INTERESTS, s.interestsOther),
      labelFor(ROOTS_INTEREST_OPTIONS, s.rootsInterest),
      formatMulti(s.futurePrograms, FUTURE_ACTIVITIES, s.futureProgramsOther),
      labelFor(AGE_GROUPS, s.ageGroup),
      labelFor(GENDERS, s.gender),
      s.hobbies || "",
      s.name || "",
      s.mobile || "",
      s.email || "",
      s.joinCircle ? "Yes" : "No",
      s.keepInformed ? "Yes" : "No",
      s.contribute ? "Yes" : "No",
      s.contributeDetails || "",
      s.nextChapterSuggestion || "",
      "Yes",
      now,
      SURVEY_CONSENT_VERSION,
    ];
  }

  return { render, validate, buildCsvRow };
})();
