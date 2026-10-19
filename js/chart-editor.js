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
  const viewportW = document.documentElement.clientWidth;
  const viewportH = window.innerHeight;

  // Cap the popover's height to the viewport (minus margins) so long lists
  // (e.g. the "where did they live?" place picker) scroll inside the
  // popover itself instead of silently overflowing past the bottom of the
  // screen — the kiosk's `overflow: hidden` body means anything past the
  // viewport edge is otherwise completely unreachable, not just hidden
  // behind a scrollbar.
  pop.style.maxHeight = Math.max(160, viewportH - 24) + "px";

  const popRect = pop.getBoundingClientRect();
  let left = rect.left + window.scrollX + rect.width / 2 - popRect.width / 2;
  left = Math.max(8, Math.min(left, window.scrollX + viewportW - popRect.width - 8));
  pop.style.left = left + "px";

  const spaceBelow = viewportH - rect.bottom;
  const spaceAbove = rect.top;
  let top;
  if (popRect.height + 14 > spaceBelow && spaceAbove > spaceBelow) {
    // Not enough room below, but more room above the anchor: open upward.
    top = rect.top + window.scrollY - 6 - Math.min(popRect.height, spaceAbove - 12);
  } else {
    top = rect.bottom + window.scrollY + 6;
  }
  top = Math.max(8, Math.min(top, window.scrollY + viewportH - 8 - Math.min(popRect.height, viewportH - 24)));
  pop.style.top = top + "px";

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

// ---- grouped, searchable picker (ancestral hometowns, current cities) ----
// cfg: { groups: [{key,en,zh}], items: [{key,en,zh,group}], placeholder,
//        onPick(key), onClear() } — one heading + button list per group so a
// long list stays scannable; the search box filters both, hiding a group
// once none of its items match.
function openGroupedPicker(anchorEl, cfg) {
  openPopover(anchorEl, (pop) => {
    pop.classList.add("origin-popover");

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "origin-search";
    searchInput.placeholder = cfg.placeholder;
    pop.appendChild(searchInput);

    const groupEntries = [];
    cfg.groups.forEach((group) => {
      const inGroup = cfg.items.filter((it) => it.group === group.key);
      if (!inGroup.length) return;

      const heading = document.createElement("div");
      heading.className = "origin-group-heading";
      heading.textContent = I18n.lang === "zh" ? group.zh : group.en;
      pop.appendChild(heading);

      const buttons = inGroup.map((item) => {
        const btn = document.createElement("button");
        btn.textContent = I18n.lang === "zh" ? item.zh : item.en;
        btn.addEventListener("click", () => {
          cfg.onPick(item.key);
          closePopover();
        });
        pop.appendChild(btn);
        return { btn, en: item.en, zh: item.zh };
      });
      groupEntries.push({ heading, buttons });
    });

    function applyFilter() {
      const q = searchInput.value.trim().toLowerCase();
      groupEntries.forEach(({ heading, buttons }) => {
        let anyVisible = false;
        buttons.forEach(({ btn, en, zh }) => {
          const match = !q || en.toLowerCase().includes(q) || zh.includes(searchInput.value.trim());
          btn.style.display = match ? "" : "none";
          if (match) anyVisible = true;
        });
        heading.style.display = anyVisible ? "" : "none";
      });
    }
    searchInput.addEventListener("input", applyFilter);

    const clearBtn = document.createElement("button");
    clearBtn.className = "danger";
    clearBtn.textContent = I18n.t("removePhoto"); // reuse "Remove" label
    clearBtn.addEventListener("click", () => {
      cfg.onClear();
      closePopover();
    });
    pop.appendChild(clearBtn);

    setTimeout(() => searchInput.focus(), 0);
  });
}

// "Meizhou, Guangdong" — a county/city plus its province where there is one.
function placeFullLabel(key) {
  const p = PLACES_BY_KEY[key];
  if (!p) return "";
  const g = PLACE_GROUPS.find((x) => x.key === p.group);
  const provinceGroups = ["guangdong", "fujian", "guangxi", "zhejiang"];
  if (g && provinceGroups.includes(p.group) && p.en !== g.en && p.zh !== g.zh) {
    if (I18n.lang === "zh") return g.zh.replace(/省$/, "") + p.zh;
    return p.en + ", " + g.en.replace(/ Province$/, "");
  }
  return placeLabel(key);
}

// ---- ancestral hometown (per generation): a big call-to-action card ----
function makeHometownCard(data, generationKey, onChange) {
  const card = document.createElement("div");
  card.className = "hometown-card";

  const kicker = document.createElement("div");
  kicker.className = "hometown-kicker";
  kicker.textContent = I18n.t("hometownKicker");
  card.appendChild(kicker);

  const q = document.createElement("div");
  q.className = "hometown-q";
  q.textContent = I18n.t("hometownQ_" + generationKey);
  card.appendChild(q);

  const hint = document.createElement("p");
  hint.className = "hometown-hint";
  hint.textContent = I18n.t("hometownHint");
  card.appendChild(hint);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "hometown-btn";
  card.appendChild(btn);

  const selected = document.createElement("div");
  selected.className = "hometown-selected";
  card.appendChild(selected);

  function refresh() {
    const val = data.origins[generationKey];
    btn.innerHTML = "";
    const icon = document.createElement("span");
    icon.className = "hometown-btn-icon";
    icon.textContent = "◉";
    btn.appendChild(icon);
    const label = document.createElement("span");
    label.textContent = I18n.t("hometownBtn_" + generationKey);
    btn.appendChild(label);
    const arrow = document.createElement("span");
    arrow.className = "hometown-btn-arrow";
    arrow.textContent = "→";
    btn.appendChild(arrow);
    selected.hidden = !val;
    selected.textContent = val ? I18n.t("hometownSelected") + " " + placeFullLabel(val) + " ✓" : "";
  }
  refresh();

  btn.addEventListener("click", () =>
    openGroupedPicker(btn, {
      groups: PLACE_GROUPS,
      items: PLACES,
      placeholder: I18n.t("searchPlacePlaceholder"),
      onPick: (key) => {
        data.origins[generationKey] = key;
        refresh();
        if (onChange) onChange();
      },
      onClear: () => {
        data.origins[generationKey] = null;
        refresh();
        if (onChange) onChange();
      },
    })
  );
  return card;
}

// ---- where a sibling / child lives now (feeds the "Our Routes" branches) ----
// kind "country": a sibling who moved abroad — one of the 199 countries that
// have a picture in assets/siblingMigration (js/countries.js), stored in
// person.country. kind "city" (default): a child's city, in person.location.
function makeLiveNowCard(person, onChange, kind) {
  const isCountry = kind === "country";
  const field = isCountry ? "country" : "location";
  const labelOf = isCountry ? countryLabel : cityLabel;
  const wrap = document.createElement("div");
  wrap.className = "livenow";

  const label = document.createElement("div");
  label.className = "livenow-q";
  label.textContent = I18n.t("liveNowQ");
  wrap.appendChild(label);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "livenow-btn";
  wrap.appendChild(btn);

  function refresh() {
    btn.classList.toggle("set", !!person[field]);
    btn.textContent = person[field]
      ? "📍 " + labelOf(person[field]) + " ✓"
      : I18n.t(isCountry ? "liveNowBtnCountry" : "liveNowBtn") + " →";
  }
  refresh();

  btn.addEventListener("click", () =>
    openGroupedPicker(btn, {
      groups: isCountry ? COUNTRY_GROUPS : CITY_GROUPS,
      items: isCountry ? COUNTRY_PICKER_ITEMS : CITIES,
      placeholder: I18n.t(isCountry ? "searchCountryPlaceholder" : "searchCityPlaceholder"),
      onPick: (key) => {
        person[field] = key;
        refresh();
        if (onChange) onChange();
      },
      onClear: () => {
        person[field] = null;
        refresh();
        if (onChange) onChange();
      },
    })
  );
  return wrap;
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
      avatarBtn.textContent = avatarFallback(role, person);
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
    if (!avatarBtn.classList.contains("avatar-has-photo")) avatarBtn.textContent = avatarFallback(role, person);
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

  if (opts.showGenderSelect) {
    const genderRow = document.createElement("div");
    genderRow.className = "question-row";
    const genderLabel = document.createElement("label");
    genderLabel.textContent = I18n.t("childGenderLabel");
    genderRow.appendChild(genderLabel);
    const genderSelect = document.createElement("select");
    genderSelect.className = "question-input";
    ["son", "daughter"].forEach((g) => {
      const o = document.createElement("option");
      o.value = g;
      o.textContent = I18n.t(g);
      if (person.gender === g) o.selected = true;
      genderSelect.appendChild(o);
    });
    genderSelect.addEventListener("change", () => {
      person.gender = genderSelect.value;
      renderAvatarContent();
      if (opts.onPersonChange) opts.onPersonChange();
    });
    genderRow.appendChild(genderSelect);
    block.appendChild(genderRow);
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

  if (opts.showLocation) block.appendChild(makeLiveNowCard(person, opts.onPersonChange, opts.showLocation));

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

// Photo + job for the visitor themself (their name lives in the surname /
// given name card, see js/surname-picker.js).
function makeSelfExtrasBlock(person, callbacks) {
  const block = document.createElement("div");
  block.className = "question-person";
  block.dataset.role = "self";

  const photoRow = document.createElement("div");
  photoRow.className = "question-row";
  const photoLabel = document.createElement("label");
  photoLabel.textContent = I18n.t("selfPhotoLabel");
  photoRow.appendChild(photoLabel);
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
      avatarBtn.style.background = ROLE_COLORS.self;
      avatarBtn.textContent = avatarFallback("self", person);
    }
  }
  renderAvatarContent();
  avatarBtn.addEventListener("click", () =>
    openPhotoMenu(avatarBtn, person, () => {
      renderAvatarContent();
      if (callbacks.onPersonChange) callbacks.onPersonChange();
    })
  );
  photoRow.appendChild(avatarBtn);
  block.appendChild(photoRow);

  const jobRow = document.createElement("div");
  jobRow.className = "question-row";
  const jobLabel = document.createElement("label");
  jobLabel.textContent = I18n.t("selfJobLabel");
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
    if (callbacks.onPersonChange) callbacks.onPersonChange();
  });
  jobRow.appendChild(jobInput);
  block.appendChild(jobRow);
  return block;
}

// ---- self's own children only — one level, no grandchildren (self is the
// Family Root in Singapore's own generation; the tree doesn't go further
// down than that). Renders a flat list directly into `container`.
function makeDescendantEditor(container, selfPerson, callbacks) {
  const children = selfPerson.children || (selfPerson.children = []);
  children.forEach((child, i) => {
    container.appendChild(
      makeQuestionPersonBlock("child", child, {
        nameLabelKey: "siblingName",
        jobLabelKey: "siblingJobLabel",
        showGenderSelect: true,
        showLocation: "city",
        onPersonChange: callbacks.onPersonChange,
        onRemove: () => {
          children.splice(i, 1);
          callbacks.onStructuralChange();
        },
      })
    );
  });

  const addBtn = document.createElement("button");
  addBtn.className = "add-sibling-card";
  addBtn.textContent = I18n.t("addChild");
  addBtn.addEventListener("click", () => {
    children.push({ name: "", job: "", photo: null, gender: "son" });
    callbacks.onStructuralChange();
  });
  container.appendChild(addBtn);
}

function questionSectionHeading(text) {
  const h = document.createElement("h3");
  h.className = "question-section-title";
  h.textContent = text;
  return h;
}

// "03  LET'S MEET YOUR PARENTS"
function stageHeading(stage) {
  const h = document.createElement("h2");
  h.className = "stage-heading";
  const num = document.createElement("span");
  num.className = "stage-num";
  num.textContent = String(stage).padStart(2, "0");
  h.appendChild(num);
  h.appendChild(document.createTextNode(I18n.t("stageTitle" + stage)));
  return h;
}

const CHART_STAGE_COUNT = 4;

function coupleSection(titleKey, a, b, hometownKey, data, callbacks) {
  const section = document.createElement("div");
  section.className = "question-section";
  if (titleKey) section.appendChild(questionSectionHeading(I18n.t(titleKey)));
  [a, b].forEach((p) =>
    section.appendChild(
      makeQuestionPersonBlock(p.role, p.person, {
        nameLabelKey: p.nameKey,
        jobLabelKey: p.jobKey,
        onPersonChange: callbacks.onPersonChange,
      })
    )
  );
  section.appendChild(makeHometownCard(data, hometownKey, callbacks.onPersonChange));
  return section;
}

// ---- the question panel for ONE stage of the four-stage chart ----
//   1 About you · 2 Children & siblings · 3 Parents · 4 Grandparents
// (great-grandparents ride along in stage 4, below the grandparents)
function renderQuestionPanel(container, data, callbacks, stage) {
  stage = Math.min(CHART_STAGE_COUNT, Math.max(1, stage || 1));
  container.innerHTML = "";
  container.appendChild(stageHeading(stage));

  if (stage === 1) {
    const section = document.createElement("div");
    section.className = "question-section";
    SurnamePicker.mountNameCard(section, data.self, callbacks.onPersonChange);
    section.appendChild(makeSelfExtrasBlock(data.self, callbacks));
    container.appendChild(section);
  }

  if (stage === 2) {
    const childrenSection = document.createElement("div");
    childrenSection.className = "question-section";
    childrenSection.appendChild(questionSectionHeading(I18n.t("childrenSectionTitle")));
    makeDescendantEditor(childrenSection, data.self, callbacks);
    container.appendChild(childrenSection);

    const siblingsSection = document.createElement("div");
    siblingsSection.className = "question-section";
    siblingsSection.appendChild(questionSectionHeading(I18n.t("siblingsYN")));
    (data.siblings || []).forEach((sib, i) => {
      siblingsSection.appendChild(
        makeQuestionPersonBlock(siblingRole(sib.type), sib, {
          nameLabelKey: "siblingName",
          jobLabelKey: "siblingJobLabel",
          showTypeSelect: true,
          showLocation: "country",
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
  }

  if (stage === 3) {
    container.appendChild(
      coupleSection(
        null,
        { role: "father", person: data.father, nameKey: "fatherName", jobKey: "fatherJob" },
        { role: "mother", person: data.mother, nameKey: "motherName", jobKey: "motherJob" },
        "parents",
        data,
        callbacks
      )
    );
  }

  if (stage === 4) {
    container.appendChild(
      coupleSection(
        null,
        { role: "grandfather", person: data.grandfather, nameKey: "grandfatherName", jobKey: "grandfatherJob" },
        { role: "grandmother", person: data.grandmother, nameKey: "grandmotherName", jobKey: "grandmotherJob" },
        "grandparents",
        data,
        callbacks
      )
    );
    container.appendChild(
      coupleSection(
        "greatGrandparentsTitle",
        { role: "greatgrandfather", person: data.greatGrandfather, nameKey: "greatGrandfatherName", jobKey: "greatGrandfatherJob" },
        { role: "greatgrandmother", person: data.greatGrandmother, nameKey: "greatGrandmotherName", jobKey: "greatGrandmotherJob" },
        "greatGrandparents",
        data,
        callbacks
      )
    );
  }
}
