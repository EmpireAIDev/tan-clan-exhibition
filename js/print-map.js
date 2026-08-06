// Renders the postcard-sized migration map, auto-scales to fit, prints, then
// returns to the family tree preview (this is a mid-flow print, not the
// terminal step — js/print.js's family-tree print still owns clearing the
// session and returning to the welcome screen).
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
  renderMigrationMap(treeMount, data, { animated: false });

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

  requestAnimationFrame(() => requestAnimationFrame(fitAndPrint));

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
