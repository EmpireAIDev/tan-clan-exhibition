// Cloud sync for the "take it home and finish it" flow. This is the one part
// of the app that legitimately needs the internet (there's no server without
// it) and legitimately needs the Firebase SDK — everything else in the kiosk
// (QnA, tree, migration map, printing) stays fully offline and never loads
// this file's dependencies.
//
// Uses the Firebase "compat" (namespaced) build loaded via plain <script>
// tags rather than the modular SDK's ES modules — module scripts require a
// same-origin fetch() under the hood, which Chrome blocks entirely over
// file:// with a CORS error. Since this app is meant to be opened by just
// double-clicking index.html (no local server), the compat build is the one
// that actually works here.
(function () {
  const app = firebase.initializeApp(window.FIREBASE_CONFIG);
  const db = firebase.firestore();
  try {
    db.enablePersistence({ synchronizeTabs: false }).catch(() => {
      /* persistence unavailable (private browsing, multiple tabs, etc.) —
         writes still work, they just won't survive a full offline restart */
    });
  } catch (e) {
    /* ignore */
  }

  const EDIT_BASE_URL = "https://empireaidev.github.io/tan-clan-exhibition/edit/index.html?id=";

  // Client-generates the doc ID (no network round-trip needed for this part),
  // so the share link/QR can be shown immediately even with zero connectivity.
  // The actual write uses Firestore's offline queue: if there's no connection
  // right now, it queues locally and syncs automatically the next time this
  // laptop has any connectivity at all.
  //
  // Idempotent: once a doc has been created for this visitor (shareDocId
  // stamped onto their data), later calls just return the cached link
  // instead of creating a second submission. This lets both the silent
  // background call (as soon as the preview screen loads, so the printed
  // postcard's QR is ready in time) and the explicit "Get a link" button
  // share one submission.
  function createShareLink(visitorData) {
    if (visitorData.shareDocId) {
      return Promise.resolve({ docId: visitorData.shareDocId, url: visitorData.shareUrl });
    }
    const ref = db.collection("submissions").doc();
    const payload = Object.assign({}, visitorData, {
      submitted: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    ref.set(payload).catch(() => {
      /* offline — already queued locally by Firestore's persistence layer */
    });
    const url = EDIT_BASE_URL + ref.id;
    visitorData.shareDocId = ref.id;
    visitorData.shareUrl = url;
    return Promise.resolve({ docId: ref.id, url });
  }

  window.Sync = { createShareLink };
  window.dispatchEvent(new Event("sync-ready"));
})();
