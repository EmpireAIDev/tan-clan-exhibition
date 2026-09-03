// Shared photo handling: resize/compress (used by the kiosk chart, the
// take-home editor, and the webcam capture flow below) plus a small webcam
// capture modal. Plain classic script (not a module) — see js/sync.js for
// why this app avoids <script type="module">.

// Resize an image (from a <input type=file> File, or an already-loaded
// <img>/<canvas>-drawable source) down to a small JPEG data URL. Keeps
// Firestore documents small since photos are stored inline as base64.
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(compressImageElement(img));
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImageElement(source, sourceWidth, sourceHeight) {
  const maxDim = 240;
  let width = sourceWidth || source.naturalWidth || source.videoWidth || source.width;
  let height = sourceHeight || source.naturalHeight || source.videoHeight || source.height;
  if (width > height && width > maxDim) {
    height = Math.round(height * (maxDim / width));
    width = maxDim;
  } else if (height > maxDim) {
    width = Math.round(width * (maxDim / height));
    height = maxDim;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(source, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

// Webcam capture modal. Injects its own markup on first use. Resolves with
// a compressed data URL, or null if the visitor cancels/camera fails.
const PhotoCapture = {
  _modal: null,
  _video: null,
  _stream: null,

  _ensureModal() {
    if (this._modal) return;
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "webcamModal";
    modal.innerHTML = `
      <div class="modal webcam-modal">
        <h2 data-i18n="takePhotoTitle">Take a photo</h2>
        <div class="webcam-video-wrap">
          <video id="webcamVideo" autoplay playsinline muted></video>
        </div>
        <p class="subtitle" id="webcamError" style="display:none; color:#C62828;"></p>
        <div class="nav-buttons">
          <button class="btn btn-ghost" id="webcamCancelBtn" data-i18n="close">Close</button>
          <button class="btn btn-primary" id="webcamCaptureBtn" data-i18n="capturePhoto">Capture</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this._modal = modal;
    this._video = modal.querySelector("#webcamVideo");
    if (window.I18n) I18n.applyTo(modal);
  },

  async open() {
    this._ensureModal();
    const errorEl = this._modal.querySelector("#webcamError");
    errorEl.style.display = "none";
    this._modal.classList.add("open");

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      this._video.srcObject = this._stream;
    } catch (e) {
      errorEl.textContent = I18n.t("webcamUnavailable");
      errorEl.style.display = "block";
    }

    return new Promise((resolve) => {
      const cancelBtn = this._modal.querySelector("#webcamCancelBtn");
      const captureBtn = this._modal.querySelector("#webcamCaptureBtn");

      const cleanup = (result) => {
        if (this._stream) {
          this._stream.getTracks().forEach((t) => t.stop());
          this._stream = null;
        }
        this._modal.classList.remove("open");
        cancelBtn.removeEventListener("click", onCancel);
        captureBtn.removeEventListener("click", onCapture);
        resolve(result);
      };
      const onCancel = () => cleanup(null);
      const onCapture = () => {
        if (!this._stream) return cleanup(null);
        const dataUrl = compressImageElement(this._video);
        cleanup(dataUrl);
      };
      cancelBtn.addEventListener("click", onCancel);
      captureBtn.addEventListener("click", onCapture);
    });
  },
};
