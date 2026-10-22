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
    if (id === "survey") {
      SurveyScreen.render(document.getElementById("surveyForm"));
    } else if (id === "chart") {
      renderChart();
    } else if (id === "migration-map") {
      mapControl = renderMigrationMap(document.getElementById("migrationMap"), d, { animated: true });
    } else if (id === "preview") {
      renderPreview();
      ensureShareLink();
    }
  }

  // Silently starts creating the take-home share link as soon as the
  // preview screen is reached, so it's already available (and can be
  // printed as a QR on the postcard) even if the visitor never clicks
  // "Get a link to finish at home" themselves. Sync.createShareLink is
  // idempotent, so this is safe to call again later (e.g. the explicit
  // button click, or navigating back to preview) without creating a
  // second submission.
  function syncReadyForPrint(timeoutMs) {
    return new Promise((resolve, reject) => {
      if (window.Sync) return resolve();
      const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
      window.addEventListener(
        "sync-ready",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
    });
  }
  function ensureShareLink() {
    if (State.data.shareUrl) return Promise.resolve();
    return syncReadyForPrint(10000)
      .then(() => window.Sync.createShareLink(State.data))
      .then(() => State.save())
      .catch(() => {
        /* offline or Firebase SDK never loaded — postcard just prints
           without the corner QR this time, not a crash */
      });
  }

  // Left panel: a read-only live preview of the tree (tree.js's renderFamilyTree,
  // same renderer used by the preview screen and printing). Rebuilding it on
  // every keystroke is cheap and has no focus to lose, unlike the right panel.
  function renderChartLeft() {
    const d = State.data;
    d.knowGrandparents = !!(d.grandfather.name.trim() || d.grandmother.name.trim());
    d.knowGreatGrandparents = !!(d.greatGrandfather.name.trim() || d.greatGrandmother.name.trim());
    renderFamilyTree(document.getElementById("chartTree"), d);
  }

  // The family chart is four stages (see js/chart-editor.js): 1 About you,
  // 2 Children & siblings, 3 Parents, 4 Grandparents. chartStage survives
  // navigating away and back (e.g. Back from the migration screen lands on
  // the last stage); it only resets when a visitor starts the chart afresh.
  let chartStage = 1;

  function renderStageBar() {
    const bar = document.getElementById("stageBar");
    if (!bar.children.length) {
      for (let i = 1; i <= CHART_STAGE_COUNT; i++) bar.appendChild(document.createElement("span"));
    }
    Array.from(bar.children).forEach((seg, i) => {
      seg.className = i + 1 < chartStage ? "done" : i + 1 === chartStage ? "active" : "";
    });
    document.getElementById("chartNextBtn").textContent = I18n.t(chartStage === CHART_STAGE_COUNT ? "stageSeeJourney" : "next") + (chartStage === CHART_STAGE_COUNT ? " →" : "");
  }

  function renderChart() {
    renderChartLeft();
    renderStageBar();
    renderQuestionPanel(
      document.getElementById("chartQuestions"),
      State.data,
      {
        onPersonChange: () => {
          State.save();
          renderChartLeft();
        },
        onStructuralChange: () => {
          State.save();
          renderChart();
        },
      },
      chartStage
    );
  }

  function setChartStage(n) {
    chartStage = Math.min(CHART_STAGE_COUNT, Math.max(1, n));
    renderChart();
    document.getElementById("chartQuestions").scrollTop = 0;
  }

  // ---- language ----
  function applyLang(lang) {
    I18n.setLang(lang);
    State.data.lang = lang;
    document.querySelectorAll("#langToggle button").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    I18n.applyTo(document);
    // re-render dynamic bits that depend on language
    const activeId = history[history.length - 1];
    if (activeId === "survey") SurveyScreen.render(document.getElementById("surveyForm"));
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

  // ---- start ----
  document.getElementById("startBtn").addEventListener("click", () => {
    State.reset();
    applyLang(I18n.lang);
    history = ["welcome"];
    goto("survey");
  });

  // ---- back buttons ----
  document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", back));

  // ---- next handlers ----
  document.querySelectorAll("[data-next]").forEach((b) => {
    b.addEventListener("click", () => handleNext(b.dataset.next));
  });

  function handleNext(from) {
    const d = State.data;

    if (from === "survey") {
      if (!SurveyScreen.validate()) return;
      CsvLog.logSubmission(SurveyScreen.buildCsvRow());
      State.save();
      goto("survey-thanks");
    } else if (from === "chart") {
      // The first missing required name sends the visitor to the stage that
      // asks for it (self: stage 1, parents: stage 3) and shakes that field.
      if (!d.self.name.trim()) return shakeChartField("self", 1);
      if (!d.father.name.trim()) return shakeChartField("father", 3);
      if (!d.mother.name.trim()) return shakeChartField("mother", 3);
      d.knowGrandparents = !!(d.grandfather.name.trim() || d.grandmother.name.trim());
      d.knowGreatGrandparents = !!(d.greatGrandfather.name.trim() || d.greatGrandmother.name.trim());
      State.save();
      goto("migration-map");
    } else if (from === "migration-map") {
      goto("preview");
    }
  }

  document.getElementById("chartNextBtn").addEventListener("click", () => {
    const d = State.data;
    // Required names are checked as the visitor leaves the stage that asks
    // for them, not only at the very end.
    if (chartStage === 1 && !d.self.name.trim()) return shakeChartField("self", 1);
    if (chartStage === 3 && !d.father.name.trim()) return shakeChartField("father", 3);
    if (chartStage === 3 && !d.mother.name.trim()) return shakeChartField("mother", 3);
    if (chartStage < CHART_STAGE_COUNT) setChartStage(chartStage + 1);
    else handleNext("chart");
  });
  document.getElementById("chartBackBtn").addEventListener("click", () => {
    if (chartStage > 1) setChartStage(chartStage - 1);
    else back();
  });

  function shakeChartField(role, stage) {
    if (chartStage !== stage) setChartStage(stage);
    let input;
    if (role === "self") {
      // the visitor's name is two fields: surname first, then given name
      const q = (field) => document.querySelector('#chartQuestions .name-card input[data-field="' + field + '"]');
      input = !State.data.self.surnameText || !State.data.self.surnameText.trim() ? q("surname") : q("givenName");
    } else {
      input = document.querySelector('#chartQuestions [data-role="' + role + '"] .question-input[data-field="name"]');
    }
    if (!input) return;
    input.scrollIntoView({ block: "center", behavior: "smooth" });
    input.style.borderColor = "#C62828";
    input.focus();
    setTimeout(() => (input.style.borderColor = ""), 700);
  }

  function renderPreview() {
    renderFamilyTree(document.getElementById("previewTree"), State.data);
  }

  // The survey is a one-time step: once its "Thank you" screen is reached,
  // continuing resets history so the chart's Back button returns straight
  // to welcome (skipping survey/survey-thanks) rather than letting the
  // visitor re-submit the survey a second time.
  document.getElementById("surveyThanksContinueBtn").addEventListener("click", () => {
    history = ["welcome"];
    chartStage = 1;
    goto("chart");
  });

  document.getElementById("replayMapBtn").addEventListener("click", () => {
    mapControl.replay();
  });

  // Foldable A4 (family story + tree | migration path, rotated 180°) opens a
  // preview first; the visitor prints from there.
  // The sheet's first QR code needs the take-home link, which is created in the
  // background when this screen opens: give it a few seconds to finish first.
  document.getElementById("printA4Btn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    Promise.race([ensureShareLink(), new Promise((resolve) => setTimeout(resolve, 4000))]).then(() => {
      State.save();
      window.location.href = "print-a4.html";
    });
  });

  // ---- settings modal ----
  const settingsModal = document.getElementById("settingsModal");
  // Staff-only gate in front of the settings (CSV export of visitors' contact
  // details). This is a casual client-side check to stop visitors poking at
  // the gear — the passcode is visible to anyone who views this file, so it
  // is not real security.
  const STAFF_PASSCODE = "286888EmpireAi";
  const pinModal = document.getElementById("pinModal");
  const pinInput = document.getElementById("pinInput");
  const pinError = document.getElementById("pinError");

  function openPinModal() {
    pinInput.value = "";
    pinError.hidden = true;
    pinModal.classList.add("open");
    pinInput.focus();
  }
  function closePinModal() {
    pinModal.classList.remove("open");
    pinInput.value = "";
  }
  function submitPin() {
    if (pinInput.value.trim() === STAFF_PASSCODE) {
      closePinModal();
      refreshCsvRowCount();
      settingsModal.classList.add("open");
    } else {
      pinError.hidden = false;
      pinInput.value = "";
      pinInput.classList.add("shake-error");
      setTimeout(() => pinInput.classList.remove("shake-error"), 700);
      pinInput.focus();
    }
  }
  document.getElementById("settingsBtn").addEventListener("click", openPinModal);
  document.getElementById("pinSubmitBtn").addEventListener("click", submitPin);
  document.getElementById("pinCancelBtn").addEventListener("click", closePinModal);
  pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitPin();
    else if (e.key === "Escape") closePinModal();
  });
  pinModal.addEventListener("click", (e) => {
    if (e.target === pinModal) closePinModal();
  });
  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    settingsModal.classList.remove("open");
  });
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove("open");
  });

  function refreshCsvRowCount() {
    const n = CsvLog.rowCount();
    document.getElementById("csvRowCountText").textContent = I18n.t("csvRowCountText", { n: n });
  }
  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    CsvLog.downloadCsv(SURVEY_CSV_COLUMNS);
  });

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
      closePinModal();
      settingsModal.classList.remove("open");
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
      // Restore the full chain (not just ["preview"]) so the "Edit answers"
      // button's back() has somewhere to go — printing the migration map
      // navigates away to print-map.html and back here, which would
      // otherwise leave history with a single entry and back() a no-op.
      history = ["welcome", "chart", "migration-map", "preview"];
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
