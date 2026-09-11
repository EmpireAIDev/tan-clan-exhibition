// Visual theming for the migration path journey (js/migration-map.js). This
// kiosk is offline-first with no image CDN (see PROJECT_STATUS.md), so a
// real landmark photo per place isn't an option — a hand-picked icon +
// gradient stands in instead, consistent with the rest of the app's flat,
// illustrated look (tree.js's emoji avatars, the hand-drawn SVG elsewhere).
//
// Every place (js/places.js) resolves to a theme + description via, in
// priority order:
//   1) an exact place-key override below (well-known / explicitly named
//      places — real landmark/cultural references)
//   2) its group's default theme + a generic templated description
//   3) a fully generic fallback
// This mirrors the "exact landmark → historical → cultural → local
// architecture → scenery → generic" fallback the design calls for.

const MIGRATION_THEMES = {
  diaolou: { icon: "🏯", gradient: ["#8B5E34", "#C9974A"] },
  cantonTower: { icon: "🗼", gradient: ["#7C4D99", "#1AA6A6"] },
  portCity: { icon: "⚓", gradient: ["#1AA6A6", "#0D2B45"] },
  tulou: { icon: "🏛️", gradient: ["#C9974A", "#8B5E34"] },
  pearlDelta: { icon: "🏙️", gradient: ["#39A96B", "#1AA6A6"] },
  chaoshan: { icon: "🛕", gradient: ["#C62828", "#D29A1A"] },
  hakkaHighlands: { icon: "⛰️", gradient: ["#39A96B", "#0D2B45"] },
  tropicalIsland: { icon: "🌴", gradient: ["#1AA6A6", "#39A96B"] },
  karst: { icon: "⛰️", gradient: ["#1AA6A6", "#39A96B"] },
  gardenCity: { icon: "🌸", gradient: ["#7C4D99", "#39A96B"] },
  artDeco: { icon: "🌆", gradient: ["#D29A1A", "#0D2B45"] },
  neonHarbour: { icon: "🌃", gradient: ["#7C4D99", "#C62828"] },
  mountainCapital: { icon: "🗻", gradient: ["#1AA6A6", "#7C4D99"] },
  singapore: { icon: "🦁", gradient: ["#0D2B45", "#D29A1A"] },
  petronas: { icon: "🕌", gradient: ["#39A96B", "#D29A1A"] },
  watTemple: { icon: "🛕", gradient: ["#C62828", "#D29A1A"] },
  volcano: { icon: "🌋", gradient: ["#39A96B", "#8B5E34"] },
  halongBay: { icon: "⛵", gradient: ["#1AA6A6", "#0D2B45"] },
  islandNation: { icon: "🏝️", gradient: ["#1AA6A6", "#D29A1A"] },
  angkor: { icon: "🛕", gradient: ["#8B5E34", "#D29A1A"] },
  generic: { icon: "📍", gradient: ["#E25A2C", "#D29A1A"] },
};

// One default theme per js/places.js group, used whenever a place has no
// specific override below.
const GROUP_THEME = {
  guangdong: "pearlDelta",
  fujian: "tulou",
  guangxi: "karst",
  zhejiang: "gardenCity",
  otherChina: "generic",
  southeastAsia: "watTemple",
  other: "generic",
};

// Generic description templates, per group, used for the long tail of
// smaller places without a specific write-up below.
const GROUP_DESCRIPTION = {
  guangdong: {
    en: "A hometown county in Guangdong Province — part of the historic heartland many overseas Chinese families trace their roots to.",
    zh: "广东省的一个家乡县城——许多海外华人家族寻根的历史故乡。",
  },
  fujian: {
    en: "A hometown county in Fujian Province, long connected to the sea and to generations who left to build new lives abroad.",
    zh: "福建省的一个家乡县城，自古与海洋相连，也是许多先辈出洋打拼的起点。",
  },
  guangxi: {
    en: "A city in Guangxi, on China's southern coast toward the sea routes south.",
    zh: "位于广西的一座城市，面向通往南方的海上航线。",
  },
  zhejiang: {
    en: "A city in Zhejiang Province, on China's eastern coast.",
    zh: "位于浙江省的一座城市，坐落在中国东部沿海。",
  },
  otherChina: {
    en: "A stop along the family's journey through China.",
    zh: "家族旅程中在中国境内的一站。",
  },
  southeastAsia: {
    en: "A stop in Southeast Asia along the family's journey to Singapore.",
    zh: "家族前往新加坡途中，在东南亚的一站。",
  },
  other: {
    en: "A place along the family's migration journey.",
    zh: "家族迁徙旅程中的一个地点。",
  },
};

const PLACE_OVERRIDES = {
  taishan: {
    theme: "diaolou",
    en: "Taishan, Guangdong — the single largest source of early Cantonese emigrants, famed for its UNESCO-listed Diaolou watchtowers built with money sent home from abroad.",
    zh: "广东台山——早期广府移民最主要的原乡之一，以侨汇建造、列入世界遗产的碉楼闻名。",
  },
  kaiping: {
    theme: "diaolou",
    en: "Kaiping, Guangdong — home to the iconic Kaiping Diaolou, fortified watchtowers blending Chinese and Western architecture, built by returning overseas emigrants.",
    zh: "广东开平——著名碉楼之乡，融合中西建筑风格的碉楼由归国华侨出资兴建。",
  },
  xinhui: {
    theme: "diaolou",
    en: "Xinhui, Guangdong — one of the historic Sze Yup counties, the ancestral home of many overseas Chinese families.",
    zh: "广东新会——历史上四邑之一，许多海外华人家族的祖籍地。",
  },
  enping: {
    theme: "diaolou",
    en: "Enping, Guangdong — part of the Sze Yup region, known alongside Kaiping for its watchtower architecture.",
    zh: "广东恩平——四邑地区之一，与开平同样以碉楼建筑闻名。",
  },
  heshan: {
    theme: "diaolou",
    en: "Heshan, Guangdong — one of the Sze Yup counties at the heart of Cantonese emigration history.",
    zh: "广东鹤山——四邑之一，广府移民历史的核心地区。",
  },
  guangzhou: {
    theme: "cantonTower",
    en: "Guangzhou (Canton), Guangdong's capital — a major historic trading port and gateway for emigrants leaving southern China.",
    zh: "广州，广东省会——历史上重要的通商口岸，也是华南移民出洋的门户。",
  },
  xiamen: {
    theme: "portCity",
    en: "Xiamen, Fujian — a historic treaty port and one of the main departure points for Hokkien emigrants heading overseas.",
    zh: "福建厦门——历史上的通商口岸，闽南人出洋的主要起点之一。",
  },
  fujianProvince: {
    theme: "tulou",
    en: "Fujian Province — ancestral home to the Hokkien and Teochew diaspora across Southeast Asia.",
    zh: "福建省——东南亚闽南与潮汕华侨华人的祖籍地。",
  },
  guangdongProvince: {
    theme: "pearlDelta",
    en: "Guangdong Province — the single largest source region for the Chinese diaspora across Southeast Asia.",
    zh: "广东省——东南亚华人华侨最主要的祖籍来源地。",
  },
  guangxi: {
    theme: "karst",
    en: "Guangxi, on China's southern coast, known for its dramatic karst landscapes.",
    zh: "广西，中国南部沿海地区，以壮丽的喀斯特地貌闻名。",
  },
  beihai: {
    theme: "karst",
    en: "Beihai, Guangxi — a coastal port city on the Beibu Gulf.",
    zh: "广西北海——北部湾畔的沿海港口城市。",
  },
  qinzhou: {
    theme: "karst",
    en: "Qinzhou, Guangxi — a coastal city with a long history as a maritime trading port.",
    zh: "广西钦州——历史悠久的海上贸易港口城市。",
  },
  zhejiang: {
    theme: "gardenCity",
    en: "Zhejiang Province, on China's eastern coast — home to a distinct emigrant community of its own.",
    zh: "浙江省，中国东部沿海——拥有自己独特的华侨社群。",
  },
  wenzhou: {
    theme: "gardenCity",
    en: "Wenzhou, Zhejiang — known for generations of entrepreneurial emigrants who settled around the world.",
    zh: "浙江温州——以世代下南洋、闯世界的经商传统闻名。",
  },
  ningbo: {
    theme: "gardenCity",
    en: "Ningbo, Zhejiang — a historic port city on China's eastern coast.",
    zh: "浙江宁波——中国东部沿海的历史港口城市。",
  },
  shanghai: {
    theme: "artDeco",
    en: "Shanghai — China's largest city, a major hub on the journey south for many families.",
    zh: "上海——中国最大的城市，许多家族南迁途中的重要枢纽。",
  },
  hongkong: {
    theme: "neonHarbour",
    en: "Hong Kong — for generations, a crossroads city where many families paused on their journey further south.",
    zh: "香港——数代人南迁途中，许多家族曾在此停留的十字路口。",
  },
  taipei: {
    theme: "mountainCapital",
    en: "Taipei, Taiwan — a stop for some families on the journey across the strait and further south.",
    zh: "台湾台北——部分家族跨越海峡、继续南迁途中的一站。",
  },
  singapore: {
    theme: "singapore",
    en: "Singapore — where the family put down roots and built the life that continues today.",
    zh: "新加坡——家族扎根落户、延续至今的地方。",
  },
  malaysia: {
    theme: "petronas",
    en: "Malaysia — home to a large, long-established Chinese diaspora community.",
    zh: "马来西亚——拥有悠久历史的华人社群聚居地。",
  },
  kualalumpur: {
    theme: "petronas",
    en: "Kuala Lumpur / Penang, Malaysia — historic centres of Chinese settlement in Malaysia.",
    zh: "马来西亚吉隆坡／槟城——马来西亚华人聚居的历史重镇。",
  },
  thailand: {
    theme: "watTemple",
    en: "Thailand — home to one of the largest and oldest overseas Chinese communities in the world.",
    zh: "泰国——全球历史最悠久、规模最大的海外华人社群之一。",
  },
  bangkok: {
    theme: "watTemple",
    en: "Bangkok, Thailand — a major destination for generations of Chinese emigrants.",
    zh: "泰国曼谷——数代华人移民的重要落脚地。",
  },
  indonesia: {
    theme: "volcano",
    en: "Indonesia — home to a large and long-established Chinese Indonesian community across its islands.",
    zh: "印度尼西亚——各岛屿上历史悠久的印尼华人社群聚居地。",
  },
  jakarta: {
    theme: "volcano",
    en: "Jakarta, Indonesia — a long-standing centre of Chinese settlement in the region.",
    zh: "印度尼西亚雅加达——本地区华人聚居的历史重镇。",
  },
  vietnam: {
    theme: "halongBay",
    en: "Vietnam — home to the Hoa people, a Chinese diaspora community with deep historical roots.",
    zh: "越南——华族（Hoa）聚居地，拥有深厚的历史渊源。",
  },
  philippines: {
    theme: "islandNation",
    en: "The Philippines — home to one of Southeast Asia's oldest continuous Chinese communities.",
    zh: "菲律宾——东南亚历史最悠久的华人社群之一。",
  },
  cambodia: {
    theme: "angkor",
    en: "Cambodia — home to a Chinese Cambodian community with a history stretching back centuries.",
    zh: "柬埔寨——历史长达数百年的柬埔寨华人社群聚居地。",
  },
  myanmar: {
    theme: "watTemple",
    en: "Myanmar — home to a long-established Chinese community, particularly in its northern regions.",
    zh: "缅甸——尤其在北部地区，华人社群历史悠久。",
  },
  laos: {
    theme: "watTemple",
    en: "Laos — home to a smaller but long-standing Chinese community.",
    zh: "老挝——华人社群规模虽小但历史悠久。",
  },
  brunei: {
    theme: "petronas",
    en: "Brunei — home to a small, well-established Chinese community on the island of Borneo.",
    zh: "文莱——婆罗洲岛上历史悠久的华人社群聚居地。",
  },
  timorLeste: {
    theme: "islandNation",
    en: "Timor-Leste — home to a small Chinese community with roots stretching back generations.",
    zh: "东帝汶——华人社群历史可追溯数代人之前。",
  },
  other: {
    theme: "generic",
    en: "A place along the family's migration journey.",
    zh: "家族迁徙旅程中的一个地点。",
  },
};

function getPlaceTheme(place) {
  const override = PLACE_OVERRIDES[place.key];
  const themeKey = (override && override.theme) || GROUP_THEME[place.group] || "generic";
  return MIGRATION_THEMES[themeKey] || MIGRATION_THEMES.generic;
}

function getPlaceDescription(place, lang) {
  const override = PLACE_OVERRIDES[place.key];
  if (override) return lang === "zh" ? override.zh : override.en;
  const tmpl = GROUP_DESCRIPTION[place.group] || GROUP_DESCRIPTION.other;
  return lang === "zh" ? tmpl.zh : tmpl.en;
}
