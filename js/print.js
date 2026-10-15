// Renders the A5 keepsake, auto-scales the tree to fill it, prints,
// then auto-returns to the start of the kiosk flow.
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
  // Logo (top-left) and QR + Lucky Draw caption (bottom-right) sit in the
  // blank side areas beside the narrow tree instead of full-width bands
  // above/below it, so the tree can use the full card height; fitAndPrint
  // grows it until it would touch any of them. Uniform padding keeps the
  // tree centred on the card.
  card.style.width = L.w + "mm";
  card.style.height = L.h + "mm";
  card.style.padding = L.pad + "mm";

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
      document.getElementById("cardQrCaption").classList.add("visible");
    } catch (e) {
      /* corner QR is a nice-to-have, never block printing over it */
    }
  }

  const MAX_SCALE = 4;
  let printTriggered = false;
  let returned = false;

  function fitAndPrint() {
    const PX_PER_MM = 96 / 25.4;
    const cardRect = card.getBoundingClientRect();
    const local = (el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left - cardRect.left, r: r.right - cardRect.left, t: r.top - cardRect.top, b: r.bottom - cardRect.top };
    };
    const gap = L.gap * PX_PER_MM;
    const pad = L.pad * PX_PER_MM;
    // Corner furniture the tree must keep clear of (only what is showing).
    const obstacles = ["cardHeader", "cardQr", "cardQrCaption"]
      .map((id) => document.getElementById(id))
      .filter((el) => el && getComputedStyle(el).display !== "none")
      .map(local);
    // offsetWidth/Height are the untransformed layout size; the mount is
    // centred on the card, so at scale s its box is that size * s about the
    // card centre. Find the largest s that stays inside the padding and off
    // every obstacle (growing the box can only add collisions, so bisect).
    const w0 = treeMount.offsetWidth;
    const h0 = treeMount.offsetHeight;
    const cx = cardRect.width / 2;
    const cy = cardRect.height / 2;
    // Collide per generation row, not against the tree's overall bounding
    // box: the tree is a narrow stack with one or two wide rows, and the
    // corner items can sit beside the narrow ones. Row positions are layout
    // offsets inside the tree, which scale about the card centre.
    const rows = Array.from(treeMount.querySelectorAll(".family-tree > .gen")).map((r) => ({
      l: r.offsetLeft,
      r: r.offsetLeft + r.offsetWidth,
      t: r.offsetTop,
      b: r.offsetTop + r.offsetHeight,
    }));
    const at = (v, c0, s, c) => c + (v - c0) * s;
    const fits = (s) => {
      const b = { l: cx - (w0 * s) / 2, r: cx + (w0 * s) / 2, t: cy - (h0 * s) / 2, b: cy + (h0 * s) / 2 };
      if (b.l < pad || b.r > cardRect.width - pad || b.t < pad || b.b > cardRect.height - pad) return false;
      return !rows.some((row) => {
        const rl = at(row.l, w0 / 2, s, cx);
        const rr = at(row.r, w0 / 2, s, cx);
        const rt = at(row.t, h0 / 2, s, cy);
        const rb = at(row.b, h0 / 2, s, cy);
        return obstacles.some((o) => rl < o.r + gap && rr > o.l - gap && rt < o.b + gap && rb > o.t - gap);
      });
    };
    // The ceiling only stops a tiny tree (just parents) ballooning.
    let lo = 0.05;
    let hi = MAX_SCALE;
    if (fits(hi)) lo = hi;
    else {
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
    }
    const scale = lo;
    treeMount.style.transform = `scale(${scale})`;
    redrawTreeConnectors();

    setTimeout(() => {
      if (printTriggered) return;
      printTriggered = true;
      redrawTreeConnectors(); // last word on layout before the page is captured
      window.print();
    }, 200);
  }

  function redrawTreeConnectors() {
    const tree = treeMount.querySelector(".family-tree");
    if (tree && tree.redrawConnectors) tree.redrawConnectors();
  }

  // Wait for web fonts first: late-swapping Montserrat changes name widths
  // and wrapping, i.e. the tree's real size, so measuring before then would
  // mis-fit it (tree.js redraws its connectors on any such resize itself).
  // Then two frames for final layout settling.
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => requestAnimationFrame(() => requestAnimationFrame(fitAndPrint)));

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
