// Screen flow, form handling, idle reset. Vanilla JS, no build step.
(function () {
  const screensEl = document.querySelector(".screens");
  const screens = {};
  document.querySelectorAll(".screen").forEach((s) => {
    screens[s.dataset.screen] = s;
  });

  let history = ["welcome"];
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
    if (id === "chart") {
      renderChart();
    } else if (id === "migration-map") {
      mapControl = renderMigrationMap(document.getElementById("migrationMap"), d, { animated: true });
    } else if (id === "preview") {
      renderPreview();
    }
  }

  function renderChart() {
    renderEditableChart(document.getElementById("chartTree"), State.data, {
      onPersonChange: () => State.save(),
      onStructuralChange: () => {
        State.save();
        renderChart();
      },
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
    // re-render dynamic bits that depend on language
    const activeId = history[history.length - 1];
    if (activeId === "chart") renderChart();
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
    history = ["welcome"];
    goto("chart");
  });

  // ---- back buttons ----
  document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", back));

  // ---- next handlers ----
  document.querySelectorAll("[data-next]").forEach((b) => {
    b.addEventListener("click", () => handleNext(b.dataset.next));
  });

  function handleNext(from) {
    const d = State.data;

    if (from === "chart") {
      if (!d.self.name.trim()) return shakeChartField("self");
      if (!d.father.name.trim()) return shakeChartField("father");
      if (!d.mother.name.trim()) return shakeChartField("mother");
      d.knowGrandparents = !!(d.grandfather.name.trim() || d.grandmother.name.trim());
      d.knowGreatGrandparents = !!(d.greatGrandfather.name.trim() || d.greatGrandmother.name.trim());
      State.save();
      goto("migration-map");
    } else if (from === "migration-map") {
      goto("preview");
    }
  }

  function shakeChartField(role) {
    const input = document.querySelector('#chartTree [data-role="' + role + '"] .chart-name-input');
    if (!input) return;
    input.style.borderColor = "#e0463f";
    input.focus();
    setTimeout(() => (input.style.borderColor = ""), 700);
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
