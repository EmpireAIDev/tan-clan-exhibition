// Editable organization-chart QnA replacement. Reuses tree.js's layout
// primitives (ROLE_COLORS, relationKey, siblingRole, drawConnectors) so the
// editable chart looks and connects exactly like the read-only preview —
// only the person cards themselves are swapped for editable ones.

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

// ---- editable person card ----
// `person` is the live object inside State.data (mutated directly).
// `onPersonChange` runs after any field/photo change (triggers save/etc.,
// caller decides). `onRemove` (optional) shows a remove (×) control, used
// for siblings.
function makeEditablePersonCard(role, person, opts) {
  opts = opts || {};
  const wrap = document.createElement("div");
  wrap.className = "chart-card-wrap";

  const card = document.createElement("div");
  card.className = "person chart-card" + (role === "self" ? " person-self" : "");
  card.dataset.role = role;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  function renderAvatarContent() {
    avatar.innerHTML = "";
    if (person.photo) {
      avatar.classList.add("avatar-has-photo");
      const img = document.createElement("img");
      img.src = person.photo;
      img.alt = person.name || "";
      avatar.appendChild(img);
    } else {
      avatar.classList.remove("avatar-has-photo");
      avatar.style.background = ROLE_COLORS[role] || "#999";
      avatar.textContent = initial(person.name);
    }
  }
  renderAvatarContent();
  avatar.addEventListener("click", () => openPhotoMenu(avatar, person, () => {
    renderAvatarContent();
    if (opts.onPersonChange) opts.onPersonChange();
  }));
  card.appendChild(avatar);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "chart-name-input";
  nameInput.maxLength = 30;
  nameInput.placeholder = I18n.t("namePlaceholder");
  nameInput.value = person.name || "";
  nameInput.addEventListener("input", () => {
    person.name = nameInput.value;
    avatar.querySelector("img") || (avatar.textContent = initial(person.name));
    if (opts.onPersonChange) opts.onPersonChange();
  });
  card.appendChild(nameInput);

  if (opts.showTypeSelect) {
    const typeSelect = document.createElement("select");
    typeSelect.className = "chart-name-input";
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
    card.appendChild(typeSelect);
  } else {
    const relation = document.createElement("div");
    relation.className = "chart-relation-label";
    relation.textContent = I18n.t(relationKey(role));
    card.appendChild(relation);
  }

  const jobInput = document.createElement("input");
  jobInput.type = "text";
  jobInput.className = "chart-job-input";
  jobInput.maxLength = 40;
  jobInput.placeholder = I18n.t("jobPlaceholder");
  jobInput.value = person.job || "";
  jobInput.addEventListener("input", () => {
    person.job = jobInput.value;
    if (opts.onPersonChange) opts.onPersonChange();
  });
  card.appendChild(jobInput);

  wrap.appendChild(card);

  if (opts.onRemove) {
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-sibling-btn";
    removeBtn.textContent = "×";
    removeBtn.title = I18n.t("removePhoto");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      opts.onRemove();
    });
    wrap.appendChild(removeBtn);
  }

  return wrap;
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

// ---- origin chip (per generation-couple row) ----
function makeOriginChip(data, generationKey) {
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
  return chip;
}

// ---- full chart ----
// Unlike tree.js's read-only buildFamilyTree, this always shows all 4
// generations (so there's somewhere to type them in) — "known" for the
// final tree/map is derived later from whether names got filled in.
function buildEditableChart(data, callbacks) {
  const el = document.createElement("div");
  el.className = "family-tree";
  const rows = [];

  function coupleRow(genKey, roleA, personA, roleB, personB) {
    const row = document.createElement("div");
    row.className = "gen gen-couple";
    const stack = document.createElement("div");
    stack.style.display = "flex";
    stack.style.flexDirection = "column";
    stack.style.alignItems = "center";
    const couple = document.createElement("div");
    couple.className = "couple";
    couple.appendChild(makeEditablePersonCard(roleA, personA, { onPersonChange: callbacks.onPersonChange }));
    couple.appendChild(makeEditablePersonCard(roleB, personB, { onPersonChange: callbacks.onPersonChange }));
    stack.appendChild(couple);
    stack.appendChild(makeOriginChip(data, genKey));
    row.appendChild(stack);
    el.appendChild(row);
    rows.push(row);
  }

  coupleRow("greatGrandparents", "greatgrandfather", data.greatGrandfather, "greatgrandmother", data.greatGrandmother);
  coupleRow("grandparents", "grandfather", data.grandfather, "grandmother", data.grandmother);

  // Parents have no origin chip of their own in the old flow *and* no
  // knowParents flag (always required) — but the map still wants a
  // "parents" hop, so give them a chip too.
  const parentsRow = document.createElement("div");
  parentsRow.className = "gen gen-couple";
  const parentsStack = document.createElement("div");
  parentsStack.style.display = "flex";
  parentsStack.style.flexDirection = "column";
  parentsStack.style.alignItems = "center";
  const parentsCouple = document.createElement("div");
  parentsCouple.className = "couple";
  parentsCouple.appendChild(makeEditablePersonCard("father", data.father, { onPersonChange: callbacks.onPersonChange }));
  parentsCouple.appendChild(makeEditablePersonCard("mother", data.mother, { onPersonChange: callbacks.onPersonChange }));
  parentsStack.appendChild(parentsCouple);
  parentsStack.appendChild(makeOriginChip(data, "parents"));
  parentsRow.appendChild(parentsStack);
  el.appendChild(parentsRow);
  rows.push(parentsRow);

  const childrenRow = document.createElement("div");
  childrenRow.className = "gen gen-children";

  const ordered = [];
  (data.siblings || []).forEach((s, i) => {
    if (s.type === "olderBrother" || s.type === "olderSister") ordered.push({ sib: s, i });
  });
  ordered.push({ self: true });
  (data.siblings || []).forEach((s, i) => {
    if (s.type === "youngerBrother" || s.type === "youngerSister" || !s.type) ordered.push({ sib: s, i });
  });

  ordered.forEach((entry) => {
    if (entry.self) {
      childrenRow.appendChild(makeEditablePersonCard("self", data.self, { onPersonChange: callbacks.onPersonChange }));
    } else {
      childrenRow.appendChild(
        makeEditablePersonCard(siblingRole(entry.sib.type), entry.sib, {
          onPersonChange: callbacks.onPersonChange,
          showTypeSelect: true,
          onStructuralChange: callbacks.onStructuralChange,
          onRemove:
            data.siblings.length <= 6
              ? () => {
                  data.siblings.splice(entry.i, 1);
                  callbacks.onStructuralChange();
                }
              : null,
        })
      );
    }
  });

  if ((data.siblings || []).length < 6) {
    const addBtn = document.createElement("button");
    addBtn.className = "add-sibling-card";
    addBtn.textContent = I18n.t("addSibling");
    addBtn.addEventListener("click", () => {
      data.siblings.push({ name: "", type: "youngerBrother", job: "", photo: null });
      callbacks.onStructuralChange();
    });
    childrenRow.appendChild(addBtn);
  }

  el.appendChild(childrenRow);
  rows.push(childrenRow);

  return { el, rows };
}

function renderEditableChart(container, data, callbacks) {
  container.innerHTML = "";
  const { el, rows } = buildEditableChart(data, callbacks);
  container.appendChild(el);
  requestAnimationFrame(() => drawConnectors(el, rows));
  return el;
}
