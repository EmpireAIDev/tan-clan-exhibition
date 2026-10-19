// Renders the postcard-sized surname card, auto-scales to fit, prints, then
// returns to the family tree preview (this is a mid-flow print, not the
// terminal step — js/print.js's family-tree print still owns clearing the
// session and returning to the welcome screen). File/element names here
// still say "map" in a few places (print-map.html/js, #surnameMount's
// sibling id history) for a minimal diff against the migration-map version
// this replaced — see js/surname-card.js for what actually renders.
(function () {
  const data = State.loadForPrint();
  if (!data || !data.self || !data.self.name) {
    window.location.href = "index.html";
    return;
  }

  I18n.setLang(data.lang || "en");
  I18n.applyTo(document);

  const L = PRINT_LAYOUT; // A5, see js/state.js
  document.getElementById("pageSizeStyle").textContent =
    `@page { size: ${L.w}mm ${L.h}mm; margin: 0; }`;

  const card = document.getElementById("card");
  card.style.width = L.w + "mm";
  card.style.height = L.h + "mm";
  card.style.padding = `${L.pad + L.textHeaderReserve}mm ${L.pad}mm ${L.pad}mm`;

  const surnameMount = document.getElementById("surnameMount");
  renderSurnameCard(surnameMount, data);
  // The headline the visitor was promised on the name step ("Your keepsake
  // will say: The Tan Family Story").
  if (data.self.surname) {
    const typed = (data.self.surnameText || "").trim();
    const surnameName =
      I18n.lang === "zh"
        ? data.self.surname.zh
        : typed
          ? typed.charAt(0).toUpperCase() + typed.slice(1)
          : surnameDisplayEn(data.self.surname);
    document.getElementById("cardHeader").textContent = I18n.t("familyStoryTitle", { name: surnameName });
  }

  const MAX_SCALE = 4;
  let printTriggered = false;
  let returned = false;

  function fitAndPrint() {
    const PX_PER_MM = 96 / 25.4;
    const availW = (L.w - L.pad * 2) * PX_PER_MM;
    const availH = (L.h - (L.pad * 2 + L.textHeaderReserve)) * PX_PER_MM;
    const fit = () => Math.min(availW / surnameMount.offsetWidth, availH / surnameMount.offsetHeight);

    // Scaling one fixed-width column leaves the other dimension empty (the
    // card was authored narrow). So also let the text reflow: try a range of
    // column widths, and keep whichever lets the scale come out largest —
    // i.e. the one that fills the card best in both directions.
    const cardEl = surnameMount.firstElementChild;
    let best = fit();
    if (cardEl && cardEl.classList.contains("surname-card")) {
      let bestW = null;
      const minW = 90 * PX_PER_MM;
      for (let w = minW; w <= availW; w += availW / 24) {
        cardEl.style.maxWidth = w + "px";
        const sc = fit();
        if (sc > best + 1e-6) {
          best = sc;
          bestW = w;
        }
      }
      cardEl.style.maxWidth = bestW === null ? "" : bestW + "px";
    }
    // The ceiling only stops a very short card ballooning.
    surnameMount.style.transform = `scale(${Math.min(best, MAX_SCALE)})`;

    setTimeout(() => {
      if (printTriggered) return;
      printTriggered = true;
      window.print();
    }, 200);
  }

  // Fonts first: late-swapping Montserrat/Noto reflows the text we measure.
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => requestAnimationFrame(() => requestAnimationFrame(fitAndPrint)));

  function returnToStart() {
    if (returned) return;
    returned = true;
    document.getElementById("stage").style.display = "none";
    document.getElementById("printedScreen").classList.add("open");
    setTimeout(() => {
      window.location.href = "index.html?resume=preview";
    }, 1500);
  }

  window.addEventListener("afterprint", returnToStart);
  setTimeout(returnToStart, 6000);
})();
