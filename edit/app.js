// Take-home family chart editor. Loaded as a module so it can pull the
// Firebase SDK straight from Firebase's CDN (see js/sync.js for why this
// page is the exception to the "no CDN" rule — it only exists because it
// needs the internet in the first place).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(window.FIREBASE_CONFIG);
const db = getFirestore(app);

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
  docRef = doc(db, "submissions", docId);
  let snap;
  try {
    snap = await getDoc(docRef);
  } catch (e) {
    return showNotFound();
  }
  if (!snap.exists()) return showNotFound();

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
      await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
      saveStatus.textContent = "All changes saved automatically.";
    } catch (e) {
      saveStatus.textContent = "Couldn't save just now — check your connection. We'll keep trying.";
    }
  }, 800);
}

async function compressImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
  const maxDim = 240;
  let { width, height } = img;
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
  canvas.getContext("2d").drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

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
    person.photo = await compressImage(file);
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
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    submittedBanner.style.display = "block";
  } catch (e) {
    saveStatus.textContent = "Couldn't submit just now — check your connection and try again.";
  }
});

init();
