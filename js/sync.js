// Cloud sync for the "take it home and finish it" flow. This is the one part
// of the app that legitimately needs the internet (there's no server without
// it) and legitimately needs the Firebase SDK — everything else in the kiosk
// (QnA, tree, migration map, printing) stays fully offline and never loads
// this file's dependencies. Loaded as a module so it can import the SDK
// straight from Firebase's CDN — vendoring the modular SDK's internal import
// graph without a bundler is impractical, and this code path already
// requires connectivity to reach Firestore.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  doc,
  collection,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const EDIT_BASE_URL = "https://zhengxuanlow.github.io/tan-clan-exhibition/edit/index.html?id=";

const app = initializeApp(window.FIREBASE_CONFIG);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
});

// Client-generates the doc ID (no network round-trip needed for this part),
// so the share link/QR can be shown immediately even with zero connectivity.
// The actual write uses Firestore's offline queue: if there's no connection
// right now, it queues locally and syncs automatically the next time this
// laptop has any connectivity at all.
async function createShareLink(visitorData) {
  const ref = doc(collection(db, "submissions"));
  const payload = {
    ...visitorData,
    submitted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  setDoc(ref, payload).catch(() => {
    /* offline — already queued locally by Firestore's persistence layer */
  });
  return { docId: ref.id, url: EDIT_BASE_URL + ref.id };
}

window.Sync = { createShareLink };
window.dispatchEvent(new Event("sync-ready"));
