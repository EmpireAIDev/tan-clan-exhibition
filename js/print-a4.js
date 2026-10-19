// Foldable A4 keepsake: previews, then prints, one A4 portrait sheet folded
// along its horizontal centre line. Top half = migration path, rotated 180°;
// bottom half = family story + family tree, upright (CSS, css/print-a4.css) so it reads
// correctly once the sheet is folded over. Everything is rendered from the same
// State data and the same render functions as the on-screen screens
// (renderFamilyTree, renderSurnameCard, getOriginSequence/collectBranches) —
// nothing is duplicated or hardcoded here, only laid out for this sheet.
(function () {
  const data = State.loadForPrint();
  if (!data || !data.self || !data.self.name) {
    window.location.href = "index.html";
    return;
  }

  I18n.setLang(data.lang || "en");
  I18n.applyTo(document);

  const MM = 96 / 25.4;
  const SHEET_W = 210 * MM;
  const SHEET_H = 297 * MM;
  const $ = (id) => document.getElementById(id);

  // ---- content ----
  const surname = data.self.surname;
  const typedSurname = (data.self.surnameText || "").trim();
  const familyName = surname
    ? I18n.lang === "zh"
      ? surname.zh
      : typedSurname
        ? typedSurname.charAt(0).toUpperCase() + typedSurname.slice(1)
        : surnameDisplayEn(surname)
    : "";
  $("a4Title").textContent = surname
    ? I18n.t("familyStoryTitle", { name: familyName })
    : I18n.t("previewTitle");
  renderSurnameCard($("surnameMount"), data);
  // Bottom box of the surname panel: "Interested to know more?" when the card
  // shows a real history, or "Need help exploring your roots?" when it has none.
  // In the no-history case the card itself lists the two record searches, so the
  // get-in-touch entry (it lives in this box instead) is dropped from that list.
  const hasHistory = !!document.querySelector("#surnameMount .surname-history");
  $("a4More").classList.toggle("is-nohistory", !hasHistory);
  $("a4More").hidden = false;
  if (!hasHistory) {
    document.querySelectorAll("#surnameMount .surname-resources li").forEach((li) => {
      if (li.querySelector('a[href*="get-in-touch"]')) li.remove();
    });
  }

  renderFamilyTree($("treeMount"), data, { maxGeneration: 4 }); // same 4-generation cap as the A5 print

  buildRoutes($("routesMount"));
  buildQrCards($("qrRow"));

  // "Where our roots began" (origin cards, same data/theme as the on-screen
  // journey) next to "Where the story continues" (siblings' and children's places).
  function buildRoutes(mount) {
    mount.innerHTML = "";
    const stops = getOriginSequence(data);
    const branches = collectBranches(data);
    if (stops.length < 2 && !branches.length) {
      const empty = document.createElement("p");
      empty.className = "surname-missing";
      empty.textContent = I18n.t("migrationMapEmpty");
      mount.appendChild(empty);
      return;
    }
    mount.classList.add("a4-flow2");
    const title = (en, zh) => {
      const t = document.createElement("h3");
      t.className = "a4-sec-title";
      t.appendChild(document.createTextNode(en + " "));
      const s = document.createElement("span");
      s.textContent = "· " + zh;
      t.appendChild(s);
      return t;
    };

    const roots = document.createElement("div");
    roots.className = "a4-sec a4-sec-roots";
    roots.appendChild(title("WHERE OUR ROOTS BEGAN", "我们的根"));
    const row = document.createElement("div");
    row.className = "a4-roots-row";
    stops.forEach((stop, i) => {
      if (i > 0) {
        const arrow = document.createElement("span");
        arrow.className = "a4-rarrow";
        row.appendChild(arrow);
      }
      const card = buildPrintCard(stop, i, stops.length);
      // The sheet uses the short postcard line per place (js/place-postcard.js),
      // not the longer on-screen description.
      const desc = card.querySelector(".journey-print-desc");
      if (desc) desc.textContent = getPlacePostcard(stop.place, I18n.lang);
      row.appendChild(card);
    });
    roots.appendChild(row);
    mount.appendChild(roots);

    if (branches.length) {
      const vr = document.createElement("div");
      vr.className = "a4-vr";
      mount.appendChild(vr);
      const routes = document.createElement("div");
      routes.className = "a4-sec a4-sec-routes";
      routes.appendChild(title("WHERE THE STORY CONTINUES", "故事延续"));
      const list = document.createElement("div");
      list.className = "a4-routes-list";
      branches.forEach((br) => list.appendChild(buildBranchCard(br, 0)));
      routes.appendChild(list);
      mount.appendChild(routes);
    }
  }

  // Three QR cards. #1 is the take-home page link (when a share link exists);
  // #2 and #3 are placeholders until their links are supplied: set `url` below
  // and they render as real QR codes.
  function buildQrCards(row) {
    const cards = [
      {
        no: "01",
        url: data.shareUrl || null,
        title: "Refine your family tree",
        en: "Continue your tree at home and share a fuller version with your family.",
        zh: "在家继续完善家谱，与家人分享更完整的版本。",
      },
      {
        no: "02",
        url: null, // TODO: link to the second survey
        title: "Unlock 2× chances",
        en: "Complete a second survey to qualify for an extra chance to win.",
        zh: "完成第二份问卷，即可多一次中奖机会。",
      },
      {
        no: "03",
        url: null, // TODO: link to the family legacy quiz / guide
        title: "Your family legacy",
        en: "Explore a legacy-planning quiz or guide. Resource coming soon.",
        zh: "探索传承规划测验或指南，资源即将推出。",
        solid: true,
      },
    ];
    cards.forEach((card) => {
      const el = document.createElement("div");
      el.className = "a4-qrcard" + (card.solid ? " is-solid" : "");
      const no = document.createElement("span");
      no.className = "a4-qr-no";
      no.textContent = card.no;
      el.appendChild(no);
      const box = document.createElement("div");
      box.className = "a4-qr-box";
      let drawn = false;
      if (card.url) {
        try {
          const qr = qrcode(0, "M");
          qr.addData(card.url);
          qr.make();
          box.innerHTML = qr.createSvgTag({ cellSize: 2, margin: 0 });
          drawn = true;
        } catch (e) {
          /* a QR is a nice-to-have — never block printing over it */
        }
      }
      if (!drawn) {
        box.classList.add("is-empty");
        box.textContent = "QR";
      }
      el.appendChild(box);
      const text = document.createElement("div");
      text.className = "a4-qr-text";
      const strong = document.createElement("strong");
      strong.textContent = card.title;
      text.appendChild(strong);
      const en = document.createElement("p");
      en.textContent = card.en;
      text.appendChild(en);
      const zh = document.createElement("p");
      zh.className = "zh";
      zh.textContent = card.zh;
      text.appendChild(zh);
      el.appendChild(text);
      row.appendChild(el);
    });
  }

  // ---- fitting ----
  function fitScale(region, mount, cap) {
    mount.style.transform = "none";
    const s = Math.min(region.clientWidth / mount.offsetWidth, region.clientHeight / mount.offsetHeight, cap);
    return Math.max(s, 0.05);
  }

  function fitAll() {
    // Family half: the tree takes the largest scale that fits its panel.
    const tm = $("treeMount");
    tm.style.transform = `scale(${fitScale($("treeRegion"), tm, 3)})`;

    // Surname story: step the history type down until it fits its panel.
    const sm = $("surnameMount");
    let fs = 3.6;
    sm.style.fontSize = fs + "mm";
    while (sm.scrollHeight > sm.clientHeight + 1 && fs > 1.6) {
      fs -= 0.1;
      sm.style.fontSize = fs + "mm";
    }
    const tree = tm.querySelector(".family-tree");
    if (tree && tree.redrawConnectors) tree.redrawConnectors();

    // Journey sections: laid out at the region's width; scaled down uniformly
    // (width compensated so it still spans the region) only if too tall.
    const rm = $("routesMount");
    const rr = $("routesRegion");
    rm.style.transform = "none";
    rm.style.width = rr.clientWidth + "px";
    const rs = Math.min(1, rr.clientHeight / rm.offsetHeight);
    rm.style.width = rr.clientWidth / rs + "px";
    rm.style.transform = `scale(${rs})`;
    rm.style.top = Math.max(0, (rr.clientHeight - rm.offsetHeight * rs) / 2) + "px";
  }

  // ---- on-screen preview scaling (the sheet is always laid out at true A4) ----
  function scalePreview() {
    const scaler = $("scaler");
    const avail = Math.min(window.innerWidth - 24, ((window.innerHeight - 90) * SHEET_W) / SHEET_H);
    const s = Math.min(1.4, Math.max(0.2, avail / SHEET_W));
    scaler.style.transform = `scale(${s})`;
    scaler.style.width = SHEET_W + "px";
    scaler.style.height = SHEET_H * s + "px";
    scaler.style.marginBottom = "0";
    // the scaled box is narrower than its layout box: keep it centred
    scaler.style.marginLeft = scaler.style.marginRight = ((SHEET_W * s) - SHEET_W) / 2 + "px";
  }

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        fitAll();
        scalePreview();
        document.body.setAttribute("data-a4-ready", "1");
      })
    )
  );
  window.addEventListener("resize", scalePreview);

  // Tree connectors are measured in screen space: re-draw them right around
  // printing, when the preview scaling is removed.
  const redraw = () => {
    const tree = $("treeMount").querySelector(".family-tree");
    if (tree && tree.redrawConnectors) tree.redrawConnectors();
  };
  window.addEventListener("beforeprint", redraw);
  window.addEventListener("afterprint", () => { scalePreview(); redraw(); });

  $("a4Print").addEventListener("click", () => {
    redraw();
    window.print();
  });
  $("a4Back").addEventListener("click", () => {
    // opened from the admin portal or the take-home page: go back there, not to the kiosk
    if (document.referrer && /\/(admin|edit)\//.test(document.referrer)) history.back();
    else window.location.href = "index.html?resume=preview";
  });
})();
