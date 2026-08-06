// Wires the "Get a link to finish at home" button on the preview screen.
// Kept separate from flow.js so it's obvious at a glance which part of the
// kiosk touches the network (this file) versus the fully offline core.
(function () {
  const btn = document.getElementById("getLinkBtn");
  const box = document.getElementById("shareBox");
  const qrMount = document.getElementById("shareQr");
  const linkText = document.getElementById("shareLinkText");
  const codeText = document.getElementById("shareCodeText");
  const statusText = document.getElementById("shareStatus");

  // js/sync.js is a module that imports the Firebase SDK from a CDN — if
  // that's blocked (offline, firewall), window.Sync never arrives. Don't
  // hang forever waiting for it; time out with a visible message instead.
  function syncReady(timeoutMs) {
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

  function renderQr(url) {
    qrMount.innerHTML = "";
    try {
      const qr = qrcode(0, "M");
      qr.addData(url);
      qr.make();
      qrMount.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2 });
    } catch (e) {
      qrMount.textContent = "";
    }
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    box.style.display = "block";
    qrMount.innerHTML = "";
    linkText.textContent = I18n.t("shareGenerating");
    codeText.textContent = "";
    statusText.textContent = navigator.onLine ? "" : I18n.t("shareOffline");

    try {
      await syncReady(8000);
      const { docId, url } = await window.Sync.createShareLink(State.data);
      linkText.textContent = url;
      codeText.textContent = docId;
      renderQr(url);
    } catch (e) {
      linkText.textContent = "";
      statusText.textContent = I18n.t("shareOffline");
    } finally {
      btn.disabled = false;
    }
  });
})();
