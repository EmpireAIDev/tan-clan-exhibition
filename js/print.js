// Renders the postcard-sized keepsake, auto-scales the tree to fit, prints,
// then auto-returns to the start of the kiosk flow.
(function () {
  const data = State.loadForPrint();
  if (!data || !data.self || !data.self.name) {
    window.location.href = "index.html";
    return;
  }

  I18n.setLang(data.lang || "en");
  I18n.applyTo(document);

  const settings = State.getSettings();
  const paper = PAPER_SIZES[settings.paperSize] || PAPER_SIZES.a6;

  document.getElementById("pageSizeStyle").textContent =
    `@page { size: ${paper.w}mm ${paper.h}mm; margin: 0; }`;

  const card = document.getElementById("card");
  const PADDING_MM = 6;
  const HEADER_RESERVE_MM = 8;
  card.style.width = paper.w + "mm";
  card.style.height = paper.h + "mm";
  card.style.padding = `${PADDING_MM + HEADER_RESERVE_MM}mm ${PADDING_MM}mm ${PADDING_MM}mm`;

  const treeMount = document.getElementById("treeMount");
  // Printing caps the descendant side at 4 generations (self = Gen 1, so
  // through great-grandchildren) — the underlying data (and the on-screen
  // tree) keep every generation the visitor added; only this render call
  // is limited, via renderFamilyTree's maxGeneration option (js/tree.js).
  renderFamilyTree(treeMount, data, { maxGeneration: 4 });

  // Small scannable QR in the corner, linking to the same take-home page as
  // the on-screen share step — only shown if a link was actually created
  // (js/flow.js tries to have one ready by the time you reach print, but a
  // fully-offline visit that never got connectivity simply won't have one).
  if (data.shareUrl) {
    try {
      const qr = qrcode(0, "M");
      qr.addData(data.shareUrl);
      qr.make();
      const cardQr = document.getElementById("cardQr");
      cardQr.innerHTML = qr.createSvgTag({ cellSize: 2, margin: 1 });
      cardQr.classList.add("visible");
    } catch (e) {
      /* corner QR is a nice-to-have, never block printing over it */
    }
  }

  let printTriggered = false;
  let returned = false;

  function fitAndPrint() {
    const cardRect = card.getBoundingClientRect();
    const treeRect = treeMount.getBoundingClientRect();
    const availW = cardRect.width - PADDING_MM * 2 * (96 / 25.4);
    const availH = cardRect.height - (PADDING_MM * 2 + HEADER_RESERVE_MM) * (96 / 25.4);
    const scale = Math.min(availW / treeRect.width, availH / treeRect.height, 1);
    treeMount.style.transform = `scale(${scale})`;

    setTimeout(() => {
      if (printTriggered) return;
      printTriggered = true;
      window.print();
    }, 200);
  }

  // Give the browser two frames: one for tree.js's own connector draw
  // (which itself waits a frame), one for final layout settling.
  requestAnimationFrame(() => requestAnimationFrame(fitAndPrint));

  function returnToStart() {
    if (returned) return;
    returned = true;
    document.getElementById("stage").classList.add("no-print");
    document.getElementById("stage").style.display = "none";
    document.getElementById("printedScreen").classList.add("open");
    setTimeout(() => {
      localStorage.removeItem("tanclan_visitor");
      window.location.href = "index.html";
    }, 2500);
  }

  window.addEventListener("afterprint", returnToStart);
  // Fallback in case the kiosk's silent-print path never fires afterprint.
  setTimeout(returnToStart, 6000);
})();
