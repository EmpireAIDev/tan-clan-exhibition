// Cities a sibling or child can live in now ("Where do they live now?" in the
// chart, and the "Our Routes" branches on the Roots-to-Routes screen). Kept
// separate from js/places.js: places are ancestral hometowns in China /
// Southeast Asia; these are present-day homes, mostly overseas.
//
// Art: where a city already has a real landmark photo in the migration theme
// (placeKey -> js/migration-theme.js), that photo is used; every other city
// gets a drawn skyline illustration (cityArtSvg) so the card always has a
// picture — offline, no image downloads.

const CITY_GROUPS = [
  { key: "sea", en: "Southeast Asia", zh: "东南亚" },
  { key: "asia", en: "Greater China & Asia", zh: "大中华及亚洲" },
  { key: "oceania", en: "Australia & New Zealand", zh: "澳洲及新西兰" },
  { key: "europe", en: "Europe", zh: "欧洲" },
  { key: "americas", en: "North America", zh: "北美洲" },
  { key: "mideast", en: "Middle East", zh: "中东" },
  { key: "other", en: "Other", zh: "其他" },
];

// art: skyline palette + signature landmark drawn by cityArtSvg.
// placeKey: reuse that place's photo (js/places.js + js/migration-theme.js).
const CITIES = [
  { key: "singapore", en: "Singapore", zh: "新加坡", group: "sea", placeKey: "singapore" },
  { key: "kualalumpur", en: "Kuala Lumpur", zh: "吉隆坡", group: "sea", placeKey: "kualalumpur" },
  { key: "penang", en: "Penang", zh: "槟城", group: "sea", art: { sky: ["#7FC8D6", "#F6E3B4"], landmark: "generic" } },
  { key: "johorbahru", en: "Johor Bahru", zh: "新山", group: "sea", art: { sky: ["#8FD0C8", "#F7E2B0"], landmark: "generic" } },
  { key: "bangkok", en: "Bangkok", zh: "曼谷", group: "sea", placeKey: "bangkok" },
  { key: "jakarta", en: "Jakarta", zh: "雅加达", group: "sea", art: { sky: ["#F4B183", "#FBE3B0"], landmark: "generic" } },
  { key: "manila", en: "Manila", zh: "马尼拉", group: "sea", art: { sky: ["#F7B267", "#FCE5B0"], landmark: "generic" } },
  { key: "hochiminh", en: "Ho Chi Minh City", zh: "胡志明市", group: "sea", art: { sky: ["#F6A585", "#FCE1B5"], landmark: "generic" } },

  { key: "hongkong", en: "Hong Kong", zh: "香港", group: "asia", placeKey: "hongkong" },
  { key: "shanghai", en: "Shanghai", zh: "上海", group: "asia", placeKey: "shanghai" },
  { key: "beijing", en: "Beijing", zh: "北京", group: "asia", art: { sky: ["#B9D6EA", "#F5E6C8"], landmark: "generic" } },
  { key: "shenzhen", en: "Shenzhen", zh: "深圳", group: "asia", art: { sky: ["#8CC5E8", "#F5E3BD"], landmark: "generic" } },
  { key: "guangzhou", en: "Guangzhou", zh: "广州", group: "asia", placeKey: "guangzhou" },
  { key: "taipei", en: "Taipei", zh: "台北", group: "asia", art: { sky: ["#9AD0E0", "#F6E4BD"], landmark: "generic" } },
  { key: "tokyo", en: "Tokyo", zh: "东京", group: "asia", art: { sky: ["#F9C5D0", "#FDEBD0"], landmark: "tokyo" } },
  { key: "seoul", en: "Seoul", zh: "首尔", group: "asia", art: { sky: ["#A9C8EC", "#F3E5CB"], landmark: "generic" } },

  { key: "sydney", en: "Sydney", zh: "悉尼", group: "oceania", art: { sky: ["#74C0E5", "#FBE7B8"], landmark: "sydney" } },
  { key: "melbourne", en: "Melbourne", zh: "墨尔本", group: "oceania", art: { sky: ["#8DB9E8", "#F8E5C0"], landmark: "generic" } },
  { key: "brisbane", en: "Brisbane", zh: "布里斯班", group: "oceania", art: { sky: ["#74CDE0", "#FBE6B5"], landmark: "generic" } },
  { key: "perth", en: "Perth", zh: "珀斯", group: "oceania", art: { sky: ["#7FC0E8", "#F9E3B4"], landmark: "generic" } },
  { key: "auckland", en: "Auckland", zh: "奥克兰", group: "oceania", art: { sky: ["#7FB8E0", "#F4E6C6"], landmark: "tower" } },

  { key: "london", en: "London", zh: "伦敦", group: "europe", art: { sky: ["#9DB7D5", "#F1DFC2"], landmark: "bigben" } },
  { key: "manchester", en: "Manchester", zh: "曼彻斯特", group: "europe", art: { sky: ["#A5B4CB", "#EBDDC6"], landmark: "generic" } },
  { key: "paris", en: "Paris", zh: "巴黎", group: "europe", art: { sky: ["#B7C6E6", "#F7E4C9"], landmark: "tower" } },
  { key: "amsterdam", en: "Amsterdam", zh: "阿姆斯特丹", group: "europe", art: { sky: ["#A9C6E3", "#F4E4C5"], landmark: "generic" } },

  { key: "newyork", en: "New York", zh: "纽约", group: "americas", art: { sky: ["#86B3DD", "#F7E1BA"], landmark: "nyc" } },
  { key: "losangeles", en: "Los Angeles", zh: "洛杉矶", group: "americas", art: { sky: ["#F6A97A", "#FCE3B6"], landmark: "generic" } },
  { key: "sanfrancisco", en: "San Francisco", zh: "旧金山", group: "americas", art: { sky: ["#9CC4DE", "#F6E2BE"], landmark: "bridge" } },
  { key: "seattle", en: "Seattle", zh: "西雅图", group: "americas", art: { sky: ["#93B7CF", "#EFE0C4"], landmark: "tower" } },
  { key: "vancouver", en: "Vancouver", zh: "温哥华", group: "americas", art: { sky: ["#8BBCD8", "#F1E2C5"], landmark: "generic" } },
  { key: "toronto", en: "Toronto", zh: "多伦多", group: "americas", art: { sky: ["#8FB4DC", "#F5E2BE"], landmark: "tower" } },

  { key: "dubai", en: "Dubai", zh: "迪拜", group: "mideast", art: { sky: ["#F2B880", "#FBE5B6"], landmark: "burj" } },

  { key: "elsewhere", en: "Somewhere else", zh: "其他地方", group: "other", art: { sky: ["#C5D3E0", "#F2E5CE"], landmark: "generic" } },
];

const CITIES_BY_KEY = CITIES.reduce((acc, c) => {
  acc[c.key] = c;
  return acc;
}, {});

function cityLabel(key) {
  const c = CITIES_BY_KEY[key];
  if (!c) return "";
  return I18n.lang === "zh" ? c.zh : c.en;
}

// Real photo path for a city, if its place has one (else null -> drawn art).
function cityPhoto(city) {
  if (!city.placeKey || typeof PLACES_BY_KEY === "undefined" || typeof getPlaceTheme !== "function") return null;
  const place = PLACES_BY_KEY[city.placeKey];
  const theme = place && getPlaceTheme(place);
  return theme && theme.image ? theme.image : null;
}

// ---- drawn skyline art ---------------------------------------------------
// 300x170 flat illustration: sky gradient, sun, two skyline layers, water
// strip and one signature landmark. Deterministic per city key (same city,
// same picture every time).
function hashKey(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededRand(seed) {
  let a = seed;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skylineRects(rand, y0, minH, maxH, fill, opacity) {
  let x = -4;
  let out = "";
  while (x < 304) {
    const w = 14 + Math.floor(rand() * 20);
    const h = minH + Math.floor(rand() * (maxH - minH));
    out += `<rect x="${x}" y="${y0 - h}" width="${w}" height="${h + 2}" fill="${fill}" opacity="${opacity}"/>`;
    x += w + 1 + Math.floor(rand() * 3);
  }
  return out;
}

function landmarkSvg(kind) {
  const dark = "#27435E";
  switch (kind) {
    case "sydney": // opera house sails + harbour bridge arch
      return `
        <path d="M70 128 q8 -34 38 -40 q-4 24 -2 40z" fill="#FFF8EC"/>
        <path d="M100 128 q10 -44 46 -50 q-6 30 -4 50z" fill="#FFF3DD"/>
        <path d="M138 128 q10 -30 38 -34 q-4 20 -2 34z" fill="#FFF8EC"/>
        <path d="M168 128 H70 V132 H168z" fill="#E9D7B5"/>
        <path d="M185 128 Q235 52 290 128" stroke="${dark}" stroke-width="5" fill="none"/>
        <path d="M195 128 V104 M215 128 V88 M235 128 V80 M255 128 V90 M275 128 V108" stroke="${dark}" stroke-width="2"/>
        <rect x="185" y="126" width="110" height="4" fill="${dark}"/>`;
    case "bigben": // Elizabeth Tower + the Eye
      return `
        <rect x="112" y="52" width="26" height="78" fill="#C9A66B"/>
        <path d="M112 52 L125 20 L138 52z" fill="#8A6E3E"/>
        <circle cx="125" cy="66" r="8" fill="#FFF6DD" stroke="#6B5430" stroke-width="2"/>
        <path d="M125 66 V60 M125 66 L130 68" stroke="#6B5430" stroke-width="1.5"/>
        <rect x="104" y="118" width="42" height="12" fill="#B8935A"/>
        <circle cx="222" cy="88" r="40" fill="none" stroke="${dark}" stroke-width="3"/>
        <circle cx="222" cy="88" r="3" fill="${dark}"/>
        <path d="M222 48 V128 M182 88 H262 M194 60 L250 116 M250 60 L194 116" stroke="${dark}" stroke-width="1.2"/>
        <path d="M214 128 L222 88 L230 128z" fill="${dark}"/>`;
    case "nyc": // Empire State-style spire + tall towers
      return `
        <rect x="150" y="70" width="34" height="60" fill="#3C5878"/>
        <rect x="156" y="52" width="22" height="20" fill="#436383"/>
        <rect x="161" y="36" width="12" height="18" fill="#4C6D8F"/>
        <path d="M167 36 V12" stroke="#4C6D8F" stroke-width="2"/>
        <rect x="108" y="86" width="30" height="44" fill="#33506E"/>
        <rect x="196" y="78" width="28" height="52" fill="#33506E"/>
        <rect x="230" y="96" width="26" height="34" fill="#3A5876"/>
        <g fill="#FFE9A8" opacity="0.8">
          <rect x="156" y="78" width="3" height="4"/><rect x="164" y="78" width="3" height="4"/><rect x="172" y="78" width="3" height="4"/>
          <rect x="156" y="90" width="3" height="4"/><rect x="164" y="90" width="3" height="4"/><rect x="172" y="90" width="3" height="4"/>
          <rect x="114" y="94" width="3" height="4"/><rect x="122" y="94" width="3" height="4"/>
          <rect x="202" y="86" width="3" height="4"/><rect x="210" y="86" width="3" height="4"/>
        </g>`;
    case "bridge": // golden-gate style suspension bridge
      return `
        <rect x="88" y="62" width="9" height="68" fill="#C8472B"/>
        <rect x="208" y="62" width="9" height="68" fill="#C8472B"/>
        <path d="M20 108 Q92 54 152 104 Q212 54 290 108" stroke="#C8472B" stroke-width="3" fill="none"/>
        <path d="M30 104 V118 M60 92 V118 M92 80 V118 M122 92 V118 M152 104 V118 M182 92 V118 M212 80 V118 M244 92 V118 M274 104 V118" stroke="#C8472B" stroke-width="1.2"/>
        <rect x="0" y="116" width="300" height="5" fill="#8E3A24"/>`;
    case "tokyo": // red lattice tower + Fuji
      return `
        <path d="M0 130 L60 70 L90 100 L120 130z" fill="#CFE0F2"/>
        <path d="M60 70 L72 84 L60 80 L50 86z" fill="#FFFFFF"/>
        <path d="M200 130 L216 30 L232 130z" fill="#D8452E"/>
        <path d="M204 100 H228 M209 70 H223 M212 52 H220" stroke="#FFF1E0" stroke-width="2"/>
        <path d="M200 130 L232 130" stroke="#A53321" stroke-width="3"/>`;
    case "tower": // slim observation tower (Sky Tower / CN / Eiffel-ish)
      return `
        <path d="M148 130 L158 52 H166 L176 130z" fill="${dark}"/>
        <ellipse cx="162" cy="50" rx="17" ry="7" fill="#3C5878"/>
        <rect x="160" y="14" width="4" height="36" fill="${dark}"/>
        <rect x="110" y="94" width="26" height="36" fill="#3A5876"/>
        <rect x="190" y="88" width="30" height="42" fill="#33506E"/>`;
    case "burj": // tapering super-tall spire
      return `
        <path d="M150 130 L160 70 L166 40 L170 10 L174 40 L180 70 L190 130z" fill="#44627F"/>
        <path d="M170 10 V130" stroke="#6E8CA9" stroke-width="1.5"/>
        <rect x="104" y="90" width="26" height="40" fill="#3A5876"/>
        <rect x="206" y="96" width="30" height="34" fill="#3A5876"/>`;
    default:
      return `<rect x="132" y="70" width="36" height="60" fill="#3A5876"/>
        <rect x="176" y="88" width="28" height="42" fill="#33506E"/>
        <rect x="96" y="96" width="30" height="34" fill="#3A5876"/>`;
  }
}

function cityArtSvg(city) {
  const art = city.art || { sky: ["#C5D3E0", "#F2E5CE"], landmark: "generic" };
  const rand = seededRand(hashKey(city.key));
  const id = "ca-" + city.key;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 170" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${city.en}">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${art.sky[0]}"/><stop offset="1" stop-color="${art.sky[1]}"/></linearGradient></defs>` +
    `<rect width="300" height="170" fill="url(#${id})"/>` +
    `<circle cx="${240 + Math.floor(rand() * 40)}" cy="34" r="17" fill="#FFF4D0" opacity="0.9"/>` +
    skylineRects(rand, 126, 18, 46, "#9FB4C9", 0.55) +
    skylineRects(rand, 130, 14, 36, "#6E8AA6", 0.8) +
    landmarkSvg(art.landmark) +
    `<rect y="128" width="300" height="42" fill="#5E8FB0" opacity="0.85"/>` +
    `<path d="M0 142 q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2" fill="none"/>` +
    `<path d="M0 156 q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="2" fill="none"/>` +
    `</svg>`
  );
}

// Fills `el` (an empty container) with the city's photo, or its drawn art.
function fillCityArt(el, city) {
  const photo = cityPhoto(city);
  if (photo) {
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.onerror = () => {
      img.remove();
      el.innerHTML = cityArtSvg(city);
    };
    img.src = photo;
    el.appendChild(img);
  } else {
    el.innerHTML = cityArtSvg(city);
  }
}
