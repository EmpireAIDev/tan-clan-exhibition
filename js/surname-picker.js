// The "Let's start with your name" card for the visitor's own name: a Surname
// field with live suggestions, a "Can't find your surname? Browse all
// surnames" directory, and a Given name field. The chosen Chinese surname
// (js/surname-data.js, generated from OOY's CSV by scripts/build-surnames.js)
// is what the printed surname card shows.
//
// Romanized Chinese surnames are often ambiguous across dialects — "Low"
// could be 刘/劳/卢/罗/鲁/黎 — so typing never silently picks one (unless the
// spelling matches exactly one surname): every match is offered as a button
// and the visitor chooses.
//
// State (all on the live State.data.self object): surnameText / givenName are
// what was typed, name is "surnameText givenName" (what the rest of the app
// — tree, CSV, take-home page — already reads), surname is the chosen
// {en,zh,history,...} record, surnameToken the normalised spelling the
// suggestions were last resolved for.
const SurnamePicker = (function () {
  function normalizeSpelling(s) {
    return (s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  // Display-only override: the CSV's primary English spelling is the
  // Mandarin pinyin ("Chen"), but this exhibition is for the Pek Sek Tan
  // Clan Association, who go by the Hokkien romanization "Tan" (already
  // listed among 陈's own spelling variants — see js/surname-data.js). Data
  // untouched; only what's shown to the visitor changes. Kept in sync with
  // surnameDisplayEn in js/surname-card.js.
  function surnameDisplayEn(rec) {
    if (rec.en === "Chen" && rec.zh === "陈") return "Tan";
    return rec.en;
  }

  function recordLabel(rec) {
    return rec.zh + "  " + surnameDisplayEn(rec);
  }

  function toSurnameValue(rec) {
    return {
      en: rec.en,
      zh: rec.zh,
      history: rec.history,
      historyZh: rec.historyZh,
      famous: rec.famous,
      famousZh: rec.famousZh,
    };
  }

  function sameRecord(a, rec) {
    return !!a && a.zh === rec.zh && a.en === rec.en;
  }

  // Records with real content first, so e.g. 陈 leads the "Tan" matches.
  function byRichness(a, b) {
    const score = (r) => (r.history ? 2 : 0) + (r.famous ? 1 : 0);
    return score(b) - score(a);
  }

  function lookupCandidates(key) {
    if (!key || typeof SURNAME_LOOKUP === "undefined") return [];
    return (SURNAME_LOOKUP[key] || []).map((i) => SURNAME_RECORDS[i]).sort(byRichness);
  }

  const HAS_CJK = /[㐀-鿿]/;
  function searchRecords(query, limit) {
    const q = (query || "").trim();
    if (!q) return [];
    const out = [];
    if (HAS_CJK.test(q)) {
      for (let i = 0; i < SURNAME_RECORDS.length && out.length < limit; i++) {
        if (SURNAME_RECORDS[i].zh.includes(q)) out.push(SURNAME_RECORDS[i]);
      }
      return out;
    }
    const key = normalizeSpelling(q);
    if (!key) return [];
    for (let i = 0; i < SURNAME_RECORDS.length && out.length < limit; i++) {
      const rec = SURNAME_RECORDS[i];
      if (rec.spellings.some((sp) => normalizeSpelling(sp).startsWith(key))) out.push(rec);
    }
    return out.sort(byRichness);
  }

  // Common surnames to show in the directory before anything is typed.
  const POPULAR_ZH = ["陈", "林", "李", "黄", "吴", "王", "张", "刘", "郑", "杨", "许", "谢"];
  function popularRecords() {
    return POPULAR_ZH.map((zh) => SURNAME_RECORDS.filter((r) => r.zh === zh).sort(byRichness)[0]).filter(Boolean);
  }

  function capitalise(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // The headline the printed surname card carries, e.g. "The Tan Family Story".
  function familyStoryTitle(surnameRec, typedText) {
    const name =
      I18n.lang === "zh"
        ? (surnameRec && surnameRec.zh) || typedText
        : capitalise((typedText || "").trim()) || (surnameRec && surnameDisplayEn(surnameRec));
    return name ? I18n.t("familyStoryTitle", { name: name }) : "";
  }

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  // Mounts the whole name card into `container`. `person` is the live
  // State.data.self; `onChange` fires after every edit (the caller saves +
  // redraws the tree preview).
  function mountNameCard(container, person, onChange) {
    // Older saves (and the take-home editor) only have a single `name`.
    if (person.surnameText == null && person.givenName == null && person.name) {
      const words = person.name.trim().split(/\s+/);
      person.surnameText = words[0] || "";
      person.givenName = words.slice(1).join(" ");
    }
    person.surnameText = person.surnameText || "";
    person.givenName = person.givenName || "";

    const card = el("div", "name-card");
    container.appendChild(card);

    const head = el("div", "name-card-head");
    head.appendChild(el("span", "name-card-badge", "1"));
    const headText = el("div");
    headText.appendChild(el("div", "name-card-title", I18n.t("nameCardTitle")));
    headText.appendChild(el("div", "name-card-sub", I18n.t("nameCardHint")));
    head.appendChild(headText);
    card.appendChild(head);

    // ---- surname field + suggestions ----
    card.appendChild(el("label", "name-card-label", I18n.t("surnameFieldLabel")));
    const surnameWrap = el("div", "search-field");
    surnameWrap.appendChild(el("span", "search-ico", "⌕"));
    const surnameInput = document.createElement("input");
    surnameInput.type = "text";
    surnameInput.className = "search-input";
    surnameInput.dataset.field = "surname";
    surnameInput.maxLength = 30;
    surnameInput.autocomplete = "off";
    surnameInput.placeholder = I18n.t("surnameFieldPlaceholder");
    surnameInput.value = person.surnameText;
    surnameWrap.appendChild(surnameInput);
    card.appendChild(surnameWrap);

    const matches = el("div", "surname-matches");
    const hint = el("p", "survey-hint surname-hint");
    const grid = el("div", "type-grid");
    matches.appendChild(hint);
    matches.appendChild(grid);
    card.appendChild(matches);

    // ---- directory ----
    const browseLink = el("button", "link-btn", I18n.t("browseSurnamesLink"));
    browseLink.type = "button";
    card.appendChild(browseLink);

    const dir = el("div", "surname-directory");
    dir.hidden = true;
    dir.appendChild(el("div", "surname-directory-title", I18n.t("directoryTitle")));
    dir.appendChild(el("label", "name-card-label", I18n.t("directorySearchLabel")));
    const dirWrap = el("div", "search-field");
    dirWrap.appendChild(el("span", "search-ico", "⌕"));
    const dirInput = document.createElement("input");
    dirInput.type = "text";
    dirInput.className = "search-input";
    dirInput.autocomplete = "off";
    dirInput.placeholder = I18n.t("directorySearchPlaceholder");
    dirWrap.appendChild(dirInput);
    dir.appendChild(dirWrap);
    const dirGrid = el("div", "type-grid dir-grid");
    dir.appendChild(dirGrid);
    const dirEmpty = el("p", "survey-hint");
    dirEmpty.hidden = true;
    dirEmpty.textContent = I18n.t("directoryNoResults");
    dir.appendChild(dirEmpty);
    const closeLink = el("button", "link-btn dir-close", I18n.t("closeDirectory"));
    closeLink.type = "button";
    dir.appendChild(closeLink);
    card.appendChild(dir);

    // ---- given name + keepsake line ----
    card.appendChild(el("label", "name-card-label", I18n.t("givenNameLabel")));
    const givenInput = document.createElement("input");
    givenInput.type = "text";
    givenInput.className = "question-input";
    givenInput.dataset.field = "givenName";
    givenInput.maxLength = 30;
    givenInput.autocomplete = "off";
    givenInput.placeholder = I18n.t("givenNamePlaceholder");
    givenInput.value = person.givenName;
    card.appendChild(givenInput);

    const keepsake = el("p", "keepsake-line");
    card.appendChild(keepsake);

    // ---- behaviour ----
    let dirOpen = false;
    let dirAutoOpened = false; // opened by us (no matches), not by the visitor

    function setDirOpen(open) {
      dirOpen = open;
      dir.hidden = !open;
      browseLink.style.display = open ? "none" : "";
      if (open) renderDirectory();
    }

    function composeName() {
      person.name = (person.surnameText + " " + person.givenName).trim();
    }

    function changed() {
      composeName();
      if (onChange) onChange();
    }

    function choose(rec) {
      // Choosing only confirms which Chinese surname is meant; the spelling the
      // visitor typed ("Liew") stays as their name. The record's own spelling is
      // used only when nothing was typed (picked from the directory).
      person.surname = toSurnameValue(rec);
      if (!person.surnameText.trim()) person.surnameText = surnameDisplayEn(rec);
      person.surnameToken = normalizeSpelling(person.surnameText);
      surnameInput.value = person.surnameText;
      refresh();
      changed();
    }

    function renderButtons(target, records) {
      target.innerHTML = "";
      records.forEach((rec) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = recordLabel(rec);
        if (sameRecord(person.surname, rec)) btn.classList.add("selected");
        btn.addEventListener("click", () => choose(rec));
        target.appendChild(btn);
      });
    }

    function renderDirectory() {
      const q = dirInput.value.trim();
      const records = q ? searchRecords(q, 18) : popularRecords();
      renderButtons(dirGrid, records);
      dirEmpty.hidden = !q || records.length > 0;
    }

    function refresh() {
      const text = person.surnameText.trim();
      const key = normalizeSpelling(text);

      // Re-resolve only when the typed spelling changed — otherwise keep
      // whatever the visitor already confirmed.
      if (person.surnameToken !== key) {
        person.surnameToken = key;
        const found = lookupCandidates(key);
        person.surname = found.length === 1 ? toSurnameValue(found[0]) : null;
      }
      const candidates = lookupCandidates(key);

      if (!text) {
        matches.hidden = true;
        if (dirAutoOpened) {
          setDirOpen(false);
          dirAutoOpened = false;
        }
      } else if (candidates.length === 0) {
        matches.hidden = false;
        hint.textContent = I18n.t("surnameHintNone").replace("{word}", text);
        grid.innerHTML = "";
        if (!dirOpen) {
          setDirOpen(true);
          dirAutoOpened = true;
        }
      } else {
        matches.hidden = false;
        hint.textContent = I18n.t(candidates.length === 1 ? "surnameHintSingle" : "surnameHintMulti").replace("{word}", text);
        renderButtons(grid, candidates);
        if (dirAutoOpened) {
          setDirOpen(false);
          dirAutoOpened = false;
        }
      }
      if (dirOpen) renderDirectory();

      const title = familyStoryTitle(person.surname, text);
      keepsake.hidden = !title;
      keepsake.textContent = "";
      if (title) {
        keepsake.appendChild(document.createTextNode(I18n.t("keepsakeSays") + " "));
        keepsake.appendChild(el("strong", null, title));
      }
    }

    surnameInput.addEventListener("input", () => {
      person.surnameText = surnameInput.value;
      refresh();
      changed();
    });
    givenInput.addEventListener("input", () => {
      person.givenName = givenInput.value;
      changed();
    });
    browseLink.addEventListener("click", () => {
      dirAutoOpened = false;
      setDirOpen(true);
      dirInput.focus();
    });
    closeLink.addEventListener("click", () => {
      dirAutoOpened = false;
      setDirOpen(false);
    });
    dirInput.addEventListener("input", renderDirectory);

    refresh();
    return { card: card };
  }

  return { mountNameCard, familyStoryTitle };
})();
