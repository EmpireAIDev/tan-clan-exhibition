// Take-home family chart editor. Uses Firebase's "compat" (namespaced)
// build loaded via plain <script> tags rather than the modular ES-module
// SDK — module scripts fail with a CORS error if this page is ever opened
// over file:// (e.g. testing locally), while the compat build works the
// same everywhere. See js/sync.js for the same reasoning.
const app = firebase.initializeApp(window.FIREBASE_CONFIG);
const db = firebase.firestore();

const params = new URLSearchParams(location.search);
const docId = params.get("id");

const loadingState = document.getElementById("loadingState");
const notFoundState = document.getElementById("notFoundState");
const editState = document.getElementById("editState");
const formSections = document.getElementById("formSections");
const saveStatus = document.getElementById("saveStatus");
const submittedBanner = document.getElementById("submittedBanner");

let data = null;
let docRef = null;
let saveTimer = null;

async function init() {
  if (!docId) return showNotFound();
  I18n.setLang("en");
  docRef = db.collection("submissions").doc(docId);
  let snap;
  try {
    snap = await docRef.get();
  } catch (e) {
    return showNotFound();
  }
  if (!snap.exists) return showNotFound();

  data = snap.data();
  loadingState.style.display = "none";
  editState.style.display = "block";
  if (data.submitted) submittedBanner.style.display = "block";
  renderForm();
  renderPreview();
}

function showNotFound() {
  loadingState.style.display = "none";
  notFoundState.style.display = "block";
}

function renderPreview() {
  renderFamilyTree(document.getElementById("previewTree"), data);
}

function queueSave() {
  saveStatus.textContent = "Saving...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await docRef.update(Object.assign({}, data, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }));
      saveStatus.textContent = "All changes saved automatically.";
    } catch (e) {
      saveStatus.textContent = "Couldn't save just now — check your connection. We'll keep trying.";
    }
  }, 800);
}

// compressImageFile() comes from js/photo-capture.js (shared with the
// kiosk chart editor and its webcam capture flow).

// Builds one editable card for a person. `person` is the live object inside
// `data` (mutated directly), `onChange` runs after any field updates.
function personCard(container, title, person) {
  const card = document.createElement("div");
  card.className = "person-card";

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.appendChild(heading);

  const nameField = document.createElement("div");
  nameField.className = "field";
  nameField.innerHTML = `<label>Name</label>`;
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = person.name || "";
  nameInput.addEventListener("input", () => {
    person.name = nameInput.value;
    renderPreview();
    queueSave();
  });
  nameField.appendChild(nameInput);
  card.appendChild(nameField);

  const jobField = document.createElement("div");
  jobField.className = "field";
  jobField.innerHTML = `<label>Occupation <span class="opt">(optional)</span></label>`;
  const jobInput = document.createElement("input");
  jobInput.type = "text";
  jobInput.value = person.job || "";
  jobInput.addEventListener("input", () => {
    person.job = jobInput.value;
    renderPreview();
    queueSave();
  });
  jobField.appendChild(jobInput);
  card.appendChild(jobField);

  const photoField = document.createElement("div");
  photoField.className = "field";
  photoField.innerHTML = `<label>Photo</label>`;
  const photoRow = document.createElement("div");
  photoRow.className = "photo-row";
  const photoImg = document.createElement("img");
  photoImg.className = "photo-preview";
  if (person.photo) photoImg.src = person.photo;
  const photoInput = document.createElement("input");
  photoInput.type = "file";
  photoInput.accept = "image/*";
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files[0];
    if (!file) return;
    person.photo = await compressImageFile(file);
    photoImg.src = person.photo;
    renderPreview();
    queueSave();
  });
  photoRow.appendChild(photoImg);
  photoRow.appendChild(photoInput);
  photoField.appendChild(photoRow);
  card.appendChild(photoField);

  container.appendChild(card);
}

function sectionTitle(container, text) {
  const h = document.createElement("h2");
  h.className = "section-title";
  h.textContent = text;
  container.appendChild(h);
}

function renderForm() {
  formSections.innerHTML = "";

  sectionTitle(formSections, "You");
  personCard(formSections, "You", data.self);

  if (data.siblings && data.siblings.length) {
    sectionTitle(formSections, "Brothers & Sisters");
    data.siblings.forEach((sib, i) => {
      personCard(formSections, `Sibling ${i + 1}`, sib);
    });
  }

  sectionTitle(formSections, "Parents");
  personCard(formSections, "Father", data.father);
  personCard(formSections, "Mother", data.mother);

  sectionTitle(formSections, "Grandparents");
  personCard(formSections, "Grandfather", data.grandfather);
  personCard(formSections, "Grandmother", data.grandmother);

  sectionTitle(formSections, "Great-Grandparents");
  personCard(formSections, "Great-Grandfather", data.greatGrandfather);
  personCard(formSections, "Great-Grandmother", data.greatGrandmother);
}

document.getElementById("submitBtn").addEventListener("click", async () => {
  data.knowGrandparents = !!(data.grandfather.name || data.grandmother.name);
  data.knowGreatGrandparents = !!(data.greatGrandfather.name || data.greatGrandmother.name);
  data.submitted = true;
  try {
    await docRef.update(Object.assign({}, data, { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }));
    submittedBanner.style.display = "block";
  } catch (e) {
    saveStatus.textContent = "Couldn't submit just now — check your connection and try again.";
  }
});

init();
