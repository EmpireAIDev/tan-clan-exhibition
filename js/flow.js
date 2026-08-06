// Screen flow, form handling, idle reset. Vanilla JS, no build step.
(function () {
  const screensEl = document.querySelector(".screens");
  const screens = {};
  document.querySelectorAll(".screen").forEach((s) => {
    screens[s.dataset.screen] = s;
  });

  let history = ["welcome"];
  let siblingIndex = 0; // which sibling we're currently collecting details for
  let currentSiblingType = null;
  let mapControl = { replay: function () {} };

  function showScreen(id) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[id].classList.add("active");
    screensEl.scrollTop = 0;
  }

  function goto(id) {
    history.push(id);
    showScreen(id);
    syncScreenUI(id);
  }

  function back() {
    if (history.length <= 1) return;
    history.pop();
    const prev = history[history.length - 1];
    showScreen(prev);
    syncScreenUI(prev);
  }

  function syncScreenUI(id) {
    const d = State.data;
    if (id === "self") {
      document.getElementById("selfName").value = d.self.name || "";
    } else if (id === "siblings-yn") {
      setChoice("siblingsYNChoice", d.hasSiblings === true ? "yes" : d.hasSiblings === false ? "no" : null);
    } else if (id === "siblings-count") {
      setChoice("siblingCountGrid", d.siblingCount ? String(d.siblingCount) : null);
    } else if (id === "siblings-details") {
      loadSiblingDetailsScreen();
    } else if (id === "parents") {
      document.getElementById("fatherName").value = d.father.name || "";
      document.getElementById("fatherJob").value = d.father.job || "";
      document.getElementById("motherName").value = d.mother.name || "";
      document.getElementById("motherJob").value = d.mother.job || "";
      setChoice("parentsPlaceGrid", d.origins.parents);
    } else if (id === "grandparents-yn") {
      setChoice("grandparentsYNChoice", d.knowGrandparents === true ? "yes" : d.knowGrandparents === false ? "no" : null);
    } else if (id === "grandparents") {
      document.getElementById("grandfatherName").value = d.grandfather.name || "";
      document.getElementById("grandfatherJob").value = d.grandfather.job || "";
      document.getElementById("grandmotherName").value = d.grandmother.name || "";
      document.getElementById("grandmotherJob").value = d.grandmother.job || "";
      setChoice("grandparentsPlaceGrid", d.origins.grandparents);
    } else if (id === "greatgrandparents-yn") {
      setChoice("greatGrandparentsYNChoice", d.knowGreatGrandparents === true ? "yes" : d.knowGreatGrandparents === false ? "no" : null);
    } else if (id === "greatgrandparents") {
      document.getElementById("greatGrandfatherName").value = d.greatGrandfather.name || "";
      document.getElementById("greatGrandfatherJob").value = d.greatGrandfather.job || "";
      document.getElementById("greatGrandmotherName").value = d.greatGrandmother.name || "";
      document.getElementById("greatGrandmotherJob").value = d.greatGrandmother.job || "";
      setChoice("greatgrandparentsPlaceGrid", d.origins.greatGrandparents);
    } else if (id === "migration-map") {
      mapControl = renderMigrationMap(document.getElementById("migrationMap"), d, { animated: true });
    } else if (id === "preview") {
      renderPreview();
    }
  }

  function populatePlaceGrid(groupId) {
    const container = document.getElementById(groupId);
    PLACES.forEach((place) => {
      const btn = document.createElement("button");
      btn.dataset.val = place.key;
      btn.dataset.i18nPlace = place.key;
      btn.textContent = I18n.lang === "zh" ? place.zh : place.en;
      container.appendChild(btn);
    });
  }
  populatePlaceGrid("greatgrandparentsPlaceGrid");
  populatePlaceGrid("grandparentsPlaceGrid");
  populatePlaceGrid("parentsPlaceGrid");

  function refreshPlaceGridLabels() {
    document.querySelectorAll("[data-i18n-place]").forEach((btn) => {
      btn.textContent = placeLabel(btn.dataset.i18nPlace);
    });
  }

  function setChoice(groupId, val) {
    const group = document.getElementById(groupId);
    group.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("selected", val !== null && b.dataset.val === val);
    });
  }

  function bindChoiceGroup(groupId) {
    document.getElementById(groupId).addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      setChoice(groupId, btn.dataset.val);
    });
  }
  bindChoiceGroup("siblingsYNChoice");
  bindChoiceGroup("siblingCountGrid");
  bindChoiceGroup("grandparentsYNChoice");
  bindChoiceGroup("greatGrandparentsYNChoice");
  bindChoiceGroup("parentsPlaceGrid");
  bindChoiceGroup("grandparentsPlaceGrid");
  bindChoiceGroup("greatgrandparentsPlaceGrid");

  document.getElementById("siblingTypeGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    currentSiblingType = btn.dataset.val;
    document.getElementById("siblingTypeGrid").querySelectorAll("button").forEach((b) => {
      b.classList.toggle("selected", b === btn);
    });
  });

  function getSelected(groupId) {
    const sel = document.getElementById(groupId).querySelector("button.selected");
    return sel ? sel.dataset.val : null;
  }

  function loadSiblingDetailsScreen() {
    const total = State.data.siblingCount;
    document.getElementById("siblingDetailsTitle").textContent = I18n.t("siblingDetailsTitle", {
      n: siblingIndex + 1,
      total,
    });
    const existing = State.data.siblings[siblingIndex] || { name: "", type: null, job: "" };
    document.getElementById("siblingName").value = existing.name || "";
    document.getElementById("siblingJob").value = existing.job || "";
    currentSiblingType = existing.type || null;
    document.getElementById("siblingTypeGrid").querySelectorAll("button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.val === currentSiblingType);
    });
  }

  // ---- language ----
  function applyLang(lang) {
    I18n.setLang(lang);
    State.data.lang = lang;
    document.querySelectorAll("#langToggle button").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    document.querySelectorAll("#langPick button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.lang === lang);
    });
    I18n.applyTo(document);
    refreshPlaceGridLabels();
    // re-render dynamic bits that depend on language
    const activeId = history[history.length - 1];
    if (activeId === "siblings-details") loadSiblingDetailsScreen();
    if (activeId === "preview") renderPreview();
    if (activeId === "migration-map") {
      mapControl = renderMigrationMap(document.getElementById("migrationMap"), State.data, { animated: false });
    }
  }

  document.getElementById("langToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    applyLang(btn.dataset.lang);
  });
  document.getElementById("langPick").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    applyLang(btn.dataset.lang);
  });

  // ---- start ----
  document.getElementById("startBtn").addEventListener("click", () => {
    State.reset();
    applyLang(I18n.lang);
    siblingIndex = 0;
    history = ["welcome"];
    document.getElementById("selfName").value = "";
    goto("self");
  });

  // ---- back buttons ----
  document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", back));

  // ---- next handlers ----
  document.querySelectorAll("[data-next]").forEach((b) => {
    b.addEventListener("click", () => handleNext(b.dataset.next));
  });

  function handleNext(from) {
    const d = State.data;

    if (from === "self") {
      const name = document.getElementById("selfName").value.trim();
      if (!name) return shake("selfName");
      d.self.name = name;
      State.save();
      goto("siblings-yn");
    } else if (from === "siblings-yn") {
      const val = getSelected("siblingsYNChoice");
      if (!val) return;
      d.hasSiblings = val === "yes";
      State.save();
      if (d.hasSiblings) {
        goto("siblings-count");
      } else {
        d.siblingCount = 0;
        d.siblings = [];
        goto("parents");
      }
    } else if (from === "siblings-count") {
      const val = getSelected("siblingCountGrid");
      if (!val) return;
      d.siblingCount = parseInt(val, 10);
      d.siblings = new Array(d.siblingCount).fill(null).map(() => ({ name: "", type: null, job: "", photo: null }));
      State.save();
      siblingIndex = 0;
      goto("siblings-details");
    } else if (from === "siblings-details") {
      const name = document.getElementById("siblingName").value.trim();
      const job = document.getElementById("siblingJob").value.trim();
      if (!name) return shake("siblingName");
      if (!currentSiblingType) return;
      const existingPhoto = (d.siblings[siblingIndex] && d.siblings[siblingIndex].photo) || null;
      d.siblings[siblingIndex] = { name, type: currentSiblingType, job, photo: existingPhoto };
      State.save();
      if (siblingIndex + 1 < d.siblingCount) {
        siblingIndex++;
        currentSiblingType = null;
        // re-push the same screen id so back() steps through siblings one by one
        history.push("siblings-details");
        loadSiblingDetailsScreen();
      } else {
        goto("parents");
      }
    } else if (from === "parents") {
      const fatherName = document.getElementById("fatherName").value.trim();
      const motherName = document.getElementById("motherName").value.trim();
      if (!fatherName) return shake("fatherName");
      if (!motherName) return shake("motherName");
      d.father.name = fatherName;
      d.father.job = document.getElementById("fatherJob").value.trim();
      d.mother.name = motherName;
      d.mother.job = document.getElementById("motherJob").value.trim();
      d.origins.parents = getSelected("parentsPlaceGrid");
      State.save();
      goto("grandparents-yn");
    } else if (from === "grandparents-yn") {
      const val = getSelected("grandparentsYNChoice");
      if (!val) return;
      d.knowGrandparents = val === "yes";
      State.save();
      if (d.knowGrandparents) {
        goto("grandparents");
      } else {
        goto("greatgrandparents-yn");
      }
    } else if (from === "grandparents") {
      const gfName = document.getElementById("grandfatherName").value.trim();
      const gmName = document.getElementById("grandmotherName").value.trim();
      if (!gfName) return shake("grandfatherName");
      if (!gmName) return shake("grandmotherName");
      d.grandfather.name = gfName;
      d.grandfather.job = document.getElementById("grandfatherJob").value.trim();
      d.grandmother.name = gmName;
      d.grandmother.job = document.getElementById("grandmotherJob").value.trim();
      d.origins.grandparents = getSelected("grandparentsPlaceGrid");
      State.save();
      goto("greatgrandparents-yn");
    } else if (from === "greatgrandparents-yn") {
      const val = getSelected("greatGrandparentsYNChoice");
      if (!val) return;
      d.knowGreatGrandparents = val === "yes";
      State.save();
      if (d.knowGreatGrandparents) {
        goto("greatgrandparents");
      } else {
        goto("migration-map");
      }
    } else if (from === "greatgrandparents") {
      const ggfName = document.getElementById("greatGrandfatherName").value.trim();
      const ggmName = document.getElementById("greatGrandmotherName").value.trim();
      if (!ggfName) return shake("greatGrandfatherName");
      if (!ggmName) return shake("greatGrandmotherName");
      d.greatGrandfather.name = ggfName;
      d.greatGrandfather.job = document.getElementById("greatGrandfatherJob").value.trim();
      d.greatGrandmother.name = ggmName;
      d.greatGrandmother.job = document.getElementById("greatGrandmotherJob").value.trim();
      d.origins.greatGrandparents = getSelected("greatgrandparentsPlaceGrid");
      State.save();
      goto("migration-map");
    } else if (from === "migration-map") {
      goto("preview");
    }
  }

  function shake(inputId) {
    const el = document.getElementById(inputId);
    el.style.borderColor = "#e0463f";
    el.focus();
    setTimeout(() => (el.style.borderColor = ""), 700);
  }

  function renderPreview() {
    renderFamilyTree(document.getElementById("previewTree"), State.data);
  }

  document.getElementById("replayMapBtn").addEventListener("click", () => {
    mapControl.replay();
  });

  document.getElementById("printMapBtn").addEventListener("click", () => {
    State.save();
    window.location.href = "print-map.html";
  });

  // ---- print ----
  document.getElementById("printBtn").addEventListener("click", () => {
    State.save();
    window.location.href = "print.html";
  });

  // ---- settings modal ----
  const settingsModal = document.getElementById("settingsModal");
  document.getElementById("settingsBtn").addEventListener("click", () => {
    renderPaperOptions();
    settingsModal.classList.add("open");
  });
  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    settingsModal.classList.remove("open");
  });
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove("open");
  });

  function renderPaperOptions() {
    const settings = State.getSettings();
    const container = document.getElementById("paperSizeOptions");
    container.innerHTML = "";
    Object.keys(PAPER_SIZES).forEach((key) => {
      const opt = PAPER_SIZES[key];
      const btn = document.createElement("button");
      btn.className = "paper-option" + (settings.paperSize === key ? " selected" : "");
      btn.textContent = opt.labelKey;
      btn.addEventListener("click", () => {
        State.saveSettings({ paperSize: key });
        renderPaperOptions();
      });
      container.appendChild(btn);
    });
  }

  // ---- idle auto-reset (3 minutes) ----
  const IDLE_WARNING_MS = 2.5 * 60 * 1000;
  const IDLE_RESET_MS = 3 * 60 * 1000;
  let warnTimer, resetTimer;
  const idleOverlay = document.getElementById("idleOverlay");

  function resetIdleTimers() {
    clearTimeout(warnTimer);
    clearTimeout(resetTimer);
    idleOverlay.classList.remove("open");
    warnTimer = setTimeout(() => idleOverlay.classList.add("open"), IDLE_WARNING_MS);
    resetTimer = setTimeout(() => {
      idleOverlay.classList.remove("open");
      if (history[history.length - 1] !== "welcome") {
        State.reset();
        siblingIndex = 0;
        history = ["welcome"];
        showScreen("welcome");
      }
    }, IDLE_RESET_MS);
  }
  ["click", "keydown", "touchstart", "input"].forEach((evt) =>
    document.addEventListener(evt, resetIdleTimers, { passive: true })
  );
  resetIdleTimers();

  // ---- init ----
  // Printing the migration map mid-flow navigates away to print-map.html and
  // back; resume exactly where the visitor left off instead of restarting.
  const resumeAt = new URLSearchParams(window.location.search).get("resume");
  if (resumeAt === "preview") {
    const restored = State.loadForPrint();
    if (restored) {
      State.data = restored;
      I18n.setLang(restored.lang || "en");
      applyLang(I18n.lang);
      history = ["preview"];
      showScreen("preview");
      syncScreenUI("preview");
    } else {
      I18n.setLang("en");
      applyLang("en");
      showScreen("welcome");
    }
  } else {
    I18n.setLang("en");
    applyLang("en");
    showScreen("welcome");
  }
})();
