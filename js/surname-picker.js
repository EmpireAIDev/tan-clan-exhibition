// Resolves the visitor's own Chinese surname from the first word of their
// typed name against js/surname-data.js (generated from OOY's CSV by
// scripts/build-surnames.js). Romanized Chinese surnames are frequently
// ambiguous across dialects — e.g. "Low" could be 劉/劳/卢/罗/鲁/黎 — so this
// always surfaces every match and lets the visitor confirm/choose rather
// than silently guessing. Mounted only on the self name field — see
// js/chart-editor.js's makeQuestionPersonBlock (opts.surname) and
// renderQuestionPanel's "self" call site.
const SurnamePicker = (function () {
  function normalizeSpelling(s) {
    return (s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  function firstToken(fullName) {
    const trimmed = (fullName || "").trim();
    if (!trimmed) return "";
    return trimmed.split(/\s+/)[0];
  }

  // Display-only override: the CSV's primary English spelling is the
  // Mandarin pinyin ("Chen"), but this exhibition is for the Pek Sek Tan
  // Clan Association, who go by the Hokkien romanization "Tan" (already
  // listed among 陈's own spelling variants — see js/surname-data.js). Data
  // untouched; only what's shown to the visitor changes.
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

  function searchRecords(query, limit) {
    const key = normalizeSpelling(query);
    if (!key) return [];
    const out = [];
    for (let i = 0; i < SURNAME_RECORDS.length && out.length < limit; i++) {
      const rec = SURNAME_RECORDS[i];
      if (rec.spellings.some((sp) => normalizeSpelling(sp).startsWith(key))) out.push(rec);
    }
    return out;
  }

  // Mounts a self-contained picker as the last child of `container`.
  // `person` is the live State.data.self object (mutated directly, same
  // pattern as the rest of chart-editor.js). `onChange` fires whenever
  // person.surname is set by a click, so the caller can State.save() /
  // re-render. Returns { sync() } — call sync() after person.name changes.
  function mount(container, person, onChange) {
    const wrap = document.createElement("div");
    wrap.className = "field surname-field";
    wrap.style.display = "none";
    container.appendChild(wrap);

    const label = document.createElement("label");
    label.textContent = I18n.t("surnameLabel");
    wrap.appendChild(label);

    const hint = document.createElement("p");
    hint.className = "survey-hint surname-hint";
    wrap.appendChild(hint);

    const grid = document.createElement("div");
    grid.className = "type-grid";
    wrap.appendChild(grid);

    const searchToggle = document.createElement("button");
    searchToggle.type = "button";
    searchToggle.className = "surname-search-toggle";
    wrap.appendChild(searchToggle);

    const searchWrap = document.createElement("div");
    searchWrap.className = "surname-search-wrap";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = I18n.t("surnameSearchPlaceholder");
    searchWrap.appendChild(searchInput);
    const searchGrid = document.createElement("div");
    searchGrid.className = "type-grid";
    searchWrap.appendChild(searchGrid);
    wrap.appendChild(searchWrap);

    let searchOpen = false;
    function setSearchOpen(open) {
      searchOpen = open;
      searchWrap.style.display = open ? "block" : "none";
      searchToggle.textContent = I18n.t(open ? "surnameSearchClose" : "surnameSearchToggle");
    }
    searchToggle.addEventListener("click", () => setSearchOpen(!searchOpen));

    function choose(rec, token) {
      person.surname = toSurnameValue(rec);
      person.surnameToken = token;
      render();
      if (onChange) onChange();
    }

    function renderGrid(targetGrid, records, token) {
      targetGrid.innerHTML = "";
      records.forEach((rec) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = recordLabel(rec);
        if (person.surname && person.surname.zh === rec.zh && person.surname.en === rec.en) {
          btn.classList.add("selected");
        }
        btn.addEventListener("click", () => choose(rec, token));
        targetGrid.appendChild(btn);
      });
    }

    searchInput.addEventListener("input", () => {
      renderGrid(searchGrid, searchRecords(searchInput.value, 15), normalizeSpelling(firstToken(person.name)));
    });

    function render() {
      const token = firstToken(person.name);
      const key = normalizeSpelling(token);
      if (!key) {
        wrap.style.display = "none";
        return;
      }
      wrap.style.display = "block";

      // Re-resolve from scratch only when the first word itself changed —
      // otherwise keep whatever the visitor already confirmed/chose.
      if (person.surnameToken !== key) {
        const idxs = (typeof SURNAME_LOOKUP !== "undefined" && SURNAME_LOOKUP[key]) || [];
        person.surnameToken = key;
        person.surname = idxs.length === 1 ? toSurnameValue(SURNAME_RECORDS[idxs[0]]) : null;
      }

      const idxs = (typeof SURNAME_LOOKUP !== "undefined" && SURNAME_LOOKUP[key]) || [];
      const candidates = idxs.map((i) => SURNAME_RECORDS[i]);

      if (candidates.length === 0) {
        hint.textContent = I18n.t("surnameHintNone").replace("{word}", token);
        grid.style.display = "none";
        setSearchOpen(true);
      } else {
        hint.textContent = I18n.t(candidates.length === 1 ? "surnameHintSingle" : "surnameHintMulti");
        grid.style.display = "grid";
        renderGrid(grid, candidates, key);
        if (!searchOpen) setSearchOpen(false);
      }
      if (searchOpen) renderGrid(searchGrid, searchRecords(searchInput.value || token, 15), key);
    }

    render();
    return { sync: render };
  }

  return { mount };
})();
