// Right-panel question editor for the family-chart step. The left panel
// (see js/flow.js's renderChartLeft) shows the live, read-only tree via
// tree.js's renderFamilyTree — this file only builds the scrollable list of
// question cards that actually collect the data, so typing in a field never
// has to rebuild the field itself (no focus/cursor loss), while structural
// changes (add/remove sibling) do a full re-render since those are
// infrequent button clicks, not keystrokes.

const SIBLING_TYPE_OPTIONS = ["olderBrother", "youngerBrother", "olderSister", "youngerSister"];

// ---- generic popover helper (shared by photo menu + origin picker) ----
let activePopover = null;

function closePopover() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }
  document.removeEventListener("click", onDocClickCloseSoon, true);
}

function onDocClickCloseSoon(e) {
  if (activePopover && !activePopover.contains(e.target)) closePopover();
}

function openPopover(anchorEl, buildContent) {
  closePopover();
  const pop = document.createElement("div");
  pop.className = "photo-popover";
  buildContent(pop);
  document.body.appendChild(pop);

  const rect = anchorEl.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  let left = rect.left + window.scrollX + rect.width / 2 - popRect.width / 2;
  left = Math.max(8, Math.min(left, window.scrollX + document.documentElement.clientWidth - popRect.width - 8));
  pop.style.left = left + "px";
  pop.style.top = rect.bottom + window.scrollY + 6 + "px";

  activePopover = pop;
  setTimeout(() => document.addEventListener("click", onDocClickCloseSoon, true), 0);
  return pop;
}

function openPhotoMenu(avatarEl, person, onChanged) {
  openPopover(avatarEl, (pop) => {
    const takeBtn = document.createElement("button");
    takeBtn.textContent = I18n.t("takePhoto");
    takeBtn.addEventListener("click", async () => {
      closePopover();
      const dataUrl = await PhotoCapture.open();
      if (dataUrl) {
        person.photo = dataUrl;
        onChanged();
      }
    });
    pop.appendChild(takeBtn);

    const uploadBtn = document.createElement("button");
    uploadBtn.textContent = I18n.t("uploadPhoto");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      closePopover();
      if (!file) return;
      person.photo = await compressImageFile(file);
      onChanged();
    });
    uploadBtn.addEventListener("click", () => fileInput.click());
    pop.appendChild(uploadBtn);
    pop.appendChild(fileInput);

    if (person.photo) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "danger";
      removeBtn.textContent = I18n.t("removePhoto");
      removeBtn.addEventListener("click", () => {
        person.photo = null;
        closePopover();
        onChanged();
      });
      pop.appendChild(removeBtn);
    }
  });
}

// ---- origin question (per generation) ----
function makeOriginQuestion(data, generationKey, questionKey) {
  const row = document.createElement("div");
  row.className = "question-row origin-question";

  const label = document.createElement("label");
  label.textContent = I18n.t(questionKey);
  row.appendChild(label);

  const chip = document.createElement("button");
  chip.className = "origin-chip";
  function refresh() {
    const val = data.origins[generationKey];
    if (val) {
      chip.textContent = placeLabel(val);
      chip.classList.add("set");
    } else {
      chip.textContent = I18n.t("whereDidTheyLive");
      chip.classList.remove("set");
    }
  }
  refresh();
  chip.addEventListener("click", () => {
    openPopover(chip, (pop) => {
      PLACES.forEach((place) => {
        const btn = document.createElement("button");
        btn.textContent = I18n.lang === "zh" ? place.zh : place.en;
        btn.addEventListener("click", () => {
          data.origins[generationKey] = place.key;
          refresh();
          closePopover();
        });
        pop.appendChild(btn);
      });
      const clearBtn = document.createElement("button");
      clearBtn.className = "danger";
      clearBtn.textContent = I18n.t("removePhoto"); // reuse "Remove" label
      clearBtn.addEventListener("click", () => {
        data.origins[generationKey] = null;
        refresh();
        closePopover();
      });
      pop.appendChild(clearBtn);
    });
  });
  row.appendChild(chip);

  const hint = document.createElement("p");
  hint.className = "question-hint";
  hint.textContent = I18n.t("originHint");
  row.appendChild(hint);

  return row;
}

// ---- one person's question block (name + optional job/type + photo) ----
// `person` is the live object inside State.data (mutated directly).
function makeQuestionPersonBlock(role, person, opts) {
  opts = opts || {};
  const block = document.createElement("div");
  block.className = "question-person";
  block.dataset.role = role;

  const nameRow = document.createElement("div");
  nameRow.className = "question-row";
  const nameLabel = document.createElement("label");
  nameLabel.textContent = I18n.t(opts.nameLabelKey);
  nameRow.appendChild(nameLabel);

  const nameInputRow = document.createElement("div");
  nameInputRow.className = "question-input-row";

  const avatarBtn = document.createElement("button");
  avatarBtn.type = "button";
  avatarBtn.className = "q-avatar-btn";
  function renderAvatarContent() {
    avatarBtn.innerHTML = "";
    if (person.photo) {
      avatarBtn.classList.add("avatar-has-photo");
      const img = document.createElement("img");
      img.src = person.photo;
      img.alt = person.name || "";
      avatarBtn.appendChild(img);
    } else {
      avatarBtn.classList.remove("avatar-has-photo");
      avatarBtn.style.background = ROLE_COLORS[role] || "#999";
      avatarBtn.textContent = initial(person.name);
    }
  }
  renderAvatarContent();
  avatarBtn.addEventListener("click", () =>
    openPhotoMenu(avatarBtn, person, () => {
      renderAvatarContent();
      if (opts.onPersonChange) opts.onPersonChange();
    })
  );
  nameInputRow.appendChild(avatarBtn);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "question-input";
  nameInput.dataset.field = "name";
  nameInput.maxLength = 30;
  nameInput.placeholder = I18n.t("namePlaceholder");
  nameInput.value = person.name || "";
  nameInput.addEventListener("input", () => {
    person.name = nameInput.value;
    if (!avatarBtn.classList.contains("avatar-has-photo")) avatarBtn.textContent = initial(person.name);
    if (opts.onPersonChange) opts.onPersonChange();
  });
  nameInputRow.appendChild(nameInput);
  nameRow.appendChild(nameInputRow);
  block.appendChild(nameRow);

  if (opts.showTypeSelect) {
    const typeRow = document.createElement("div");
    typeRow.className = "question-row";
    const typeLabel = document.createElement("label");
    typeLabel.textContent = I18n.t("siblingType");
    typeRow.appendChild(typeLabel);
    const typeSelect = document.createElement("select");
    typeSelect.className = "question-input";
    SIBLING_TYPE_OPTIONS.forEach((t) => {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = I18n.t(t);
      if (person.type === t) o.selected = true;
      typeSelect.appendChild(o);
    });
    typeSelect.addEventListener("change", () => {
      person.type = typeSelect.value;
      if (opts.onStructuralChange) opts.onStructuralChange();
    });
    typeRow.appendChild(typeSelect);
    block.appendChild(typeRow);
  }

  const jobRow = document.createElement("div");
  jobRow.className = "question-row";
  const jobLabel = document.createElement("label");
  jobLabel.textContent = I18n.t(opts.jobLabelKey);
  jobRow.appendChild(jobLabel);
  const jobInput = document.createElement("input");
  jobInput.type = "text";
  jobInput.className = "question-input";
  jobInput.dataset.field = "job";
  jobInput.maxLength = 40;
  jobInput.placeholder = I18n.t("jobPlaceholder");
  jobInput.value = person.job || "";
  jobInput.addEventListener("input", () => {
    person.job = jobInput.value;
    if (opts.onPersonChange) opts.onPersonChange();
  });
  jobRow.appendChild(jobInput);
  block.appendChild(jobRow);

  if (opts.onRemove) {
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-sibling-btn";
    removeBtn.textContent = "×";
    removeBtn.title = I18n.t("removePhoto");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      opts.onRemove();
    });
    block.appendChild(removeBtn);
  }

  return block;
}

function questionSectionHeading(text) {
  const h = document.createElement("h3");
  h.className = "question-section-title";
  h.textContent = text;
  return h;
}

// ---- full right-panel question list ----
function renderQuestionPanel(container, data, callbacks) {
  container.innerHTML = "";

  // -- about you --
  const selfSection = document.createElement("div");
  selfSection.className = "question-section";
  selfSection.appendChild(questionSectionHeading(I18n.t("aboutYouTitle")));
  selfSection.appendChild(
    makeQuestionPersonBlock("self", data.self, {
      nameLabelKey: "nameLabel",
      jobLabelKey: "selfJobLabel",
      onPersonChange: callbacks.onPersonChange,
    })
  );
  container.appendChild(selfSection);

  // -- siblings --
  const siblingsSection = document.createElement("div");
  siblingsSection.className = "question-section";
  siblingsSection.appendChild(questionSectionHeading(I18n.t("siblingsYN")));
  (data.siblings || []).forEach((sib, i) => {
    siblingsSection.appendChild(
      makeQuestionPersonBlock(siblingRole(sib.type), sib, {
        nameLabelKey: "siblingName",
        jobLabelKey: "siblingJobLabel",
        showTypeSelect: true,
        onPersonChange: callbacks.onPersonChange,
        onStructuralChange: callbacks.onStructuralChange,
        onRemove: () => {
          data.siblings.splice(i, 1);
          callbacks.onStructuralChange();
        },
      })
    );
  });
  if ((data.siblings || []).length < 6) {
    const addBtn = document.createElement("button");
    addBtn.className = "add-sibling-card";
    addBtn.textContent = I18n.t("addSibling");
    addBtn.addEventListener("click", () => {
      data.siblings.push({ name: "", type: "youngerBrother", job: "", photo: null });
      callbacks.onStructuralChange();
    });
    siblingsSection.appendChild(addBtn);
  }
  container.appendChild(siblingsSection);

  // -- parents --
  const parentsSection = document.createElement("div");
  parentsSection.className = "question-section";
  parentsSection.appendChild(questionSectionHeading(I18n.t("parentsTitle")));
  parentsSection.appendChild(
    makeQuestionPersonBlock("father", data.father, {
      nameLabelKey: "fatherName",
      jobLabelKey: "fatherJob",
      onPersonChange: callbacks.onPersonChange,
    })
  );
  parentsSection.appendChild(
    makeQuestionPersonBlock("mother", data.mother, {
      nameLabelKey: "motherName",
      jobLabelKey: "motherJob",
      onPersonChange: callbacks.onPersonChange,
    })
  );
  parentsSection.appendChild(makeOriginQuestion(data, "parents", "originParentsQuestion"));
  container.appendChild(parentsSection);

  // -- grandparents --
  const grandparentsSection = document.createElement("div");
  grandparentsSection.className = "question-section";
  grandparentsSection.appendChild(questionSectionHeading(I18n.t("grandparentsTitle")));
  grandparentsSection.appendChild(
    makeQuestionPersonBlock("grandfather", data.grandfather, {
      nameLabelKey: "grandfatherName",
      jobLabelKey: "grandfatherJob",
      onPersonChange: callbacks.onPersonChange,
    })
  );
  grandparentsSection.appendChild(
    makeQuestionPersonBlock("grandmother", data.grandmother, {
      nameLabelKey: "grandmotherName",
      jobLabelKey: "grandmotherJob",
      onPersonChange: callbacks.onPersonChange,
    })
  );
  grandparentsSection.appendChild(makeOriginQuestion(data, "grandparents", "originGrandQuestion"));
  container.appendChild(grandparentsSection);

  // -- great-grandparents --
  const greatGrandparentsSection = document.createElement("div");
  greatGrandparentsSection.className = "question-section";
  greatGrandparentsSection.appendChild(questionSectionHeading(I18n.t("greatGrandparentsTitle")));
  greatGrandparentsSection.appendChild(
    makeQuestionPersonBlock("greatgrandfather", data.greatGrandfather, {
      nameLabelKey: "greatGrandfatherName",
      jobLabelKey: "greatGrandfatherJob",
      onPersonChange: callbacks.onPersonChange,
    })
  );
  greatGrandparentsSection.appendChild(
    makeQuestionPersonBlock("greatgrandmother", data.greatGrandmother, {
      nameLabelKey: "greatGrandmotherName",
      jobLabelKey: "greatGrandmotherJob",
      onPersonChange: callbacks.onPersonChange,
    })
  );
  greatGrandparentsSection.appendChild(makeOriginQuestion(data, "greatGrandparents", "originGGQuestion"));
  container.appendChild(greatGrandparentsSection);
}
