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

  function syncReady() {
    return new Promise((resolve) => {
      if (window.Sync) return resolve();
      window.addEventListener("sync-ready", () => resolve(), { once: true });
    });
  }

  function renderQr(url) {
    qrMount.innerHTML = "";
    if (typeof qrcode !== "function") return;
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    qrMount.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2 });
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    box.style.display = "block";
    linkText.textContent = I18n.t("shareGenerating");
    codeText.textContent = "";
    statusText.textContent = navigator.onLine ? "" : I18n.t("shareOffline");

    await syncReady();
    const { docId, url } = await window.Sync.createShareLink(State.data);
    linkText.textContent = url;
    codeText.textContent = docId;
    renderQr(url);
    btn.disabled = false;
  });
})();
