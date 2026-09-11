// Preset places for the "where did they live?" origin picker, grouped for
// the searchable popover in js/chart-editor.js. x/y are coordinates on the
// migration map's stylized SVG (0 0 500 620 viewBox) — only the original
// handful of places have them; everything added later deliberately leaves
// x/y null (the map itself is getting a full revamp separately, so there's
// no point hand-placing pins on the current one). A place with x === null
// is simply skipped by js/migration-map.js's getOriginSequence — it still
// works everywhere else (the chip label, the origin question, CSV/Firestore
// data), it just won't appear as an animated stop on the current map.
const PLACE_GROUPS = [
  { key: "guangdong", en: "Guangdong Province", zh: "广东省" },
  { key: "fujian", en: "Fujian Province", zh: "福建省" },
  { key: "guangxi", en: "Guangxi", zh: "广西" },
  { key: "zhejiang", en: "Zhejiang", zh: "浙江" },
  { key: "otherChina", en: "Other China", zh: "中国其他地区" },
  { key: "southeastAsia", en: "Southeast Asia", zh: "东南亚" },
  { key: "other", en: "Other", zh: "其他" },
];

const PLACES = [
  // ---- Guangdong Province 广东省 ----
  { key: "guangdongProvince", en: "Guangdong Province", zh: "广东省", group: "guangdong", x: null, y: null },
  { key: "taishan", en: "Taishan", zh: "台山", group: "guangdong", x: null, y: null },
  { key: "kaiping", en: "Kaiping", zh: "开平", group: "guangdong", x: null, y: null },
  { key: "xinhui", en: "Xinhui", zh: "新会", group: "guangdong", x: null, y: null },
  { key: "enping", en: "Enping", zh: "恩平", group: "guangdong", x: null, y: null },
  { key: "heshan", en: "Heshan", zh: "鹤山", group: "guangdong", x: null, y: null },
  { key: "guangzhou", en: "Guangzhou", zh: "广州", group: "guangdong", x: 330, y: 268 },
  { key: "shunde", en: "Shunde", zh: "顺德", group: "guangdong", x: null, y: null },
  { key: "nanhai", en: "Nanhai", zh: "南海", group: "guangdong", x: null, y: null },
  { key: "panyu", en: "Panyu", zh: "番禺", group: "guangdong", x: null, y: null },
  { key: "dongguan", en: "Dongguan", zh: "东莞", group: "guangdong", x: null, y: null },
  { key: "zhongshan", en: "Zhongshan", zh: "中山", group: "guangdong", x: null, y: null },
  { key: "chaozhou", en: "Chaozhou", zh: "潮州", group: "guangdong", x: null, y: null },
  { key: "shantou", en: "Shantou", zh: "汕头", group: "guangdong", x: null, y: null },
  { key: "jieyang", en: "Jieyang", zh: "揭阳", group: "guangdong", x: null, y: null },
  { key: "meizhou", en: "Meizhou", zh: "梅州", group: "guangdong", x: null, y: null },
  { key: "xingning", en: "Xingning", zh: "兴宁", group: "guangdong", x: null, y: null },
  { key: "haikou", en: "Haikou", zh: "海口", group: "guangdong", x: null, y: null },
  { key: "wenchang", en: "Wenchang", zh: "文昌", group: "guangdong", x: null, y: null },

  // ---- Fujian Province 福建省 ----
  { key: "fujianProvince", en: "Fujian Province", zh: "福建省", group: "fujian", x: null, y: null },
  { key: "jinjiang", en: "Jinjiang", zh: "晋江", group: "fujian", x: null, y: null },
  { key: "shishi", en: "Shishi", zh: "石狮", group: "fujian", x: null, y: null },
  { key: "nanan", en: "Nan'an", zh: "南安", group: "fujian", x: null, y: null },
  { key: "anxi", en: "Anxi", zh: "安溪", group: "fujian", x: null, y: null },
  { key: "yongchun", en: "Yongchun", zh: "永春", group: "fujian", x: null, y: null },
  { key: "dehua", en: "Dehua", zh: "德化", group: "fujian", x: null, y: null },
  { key: "huian", en: "Hui'an", zh: "惠安", group: "fujian", x: null, y: null },
  { key: "dongshi", en: "Dongshi", zh: "东石", group: "fujian", x: null, y: null },
  { key: "longxi", en: "Longxi", zh: "龙溪", group: "fujian", x: null, y: null },
  { key: "zhangpu", en: "Zhangpu", zh: "漳浦", group: "fujian", x: null, y: null },
  { key: "yunxiao", en: "Yunxiao", zh: "云霄", group: "fujian", x: null, y: null },
  { key: "dongshan", en: "Dongshan", zh: "东山", group: "fujian", x: null, y: null },
  { key: "zhaoan", en: "Zhao'an", zh: "诏安", group: "fujian", x: null, y: null },
  { key: "pinghe", en: "Pinghe", zh: "平和", group: "fujian", x: null, y: null },
  { key: "huaan", en: "Hua'an", zh: "华安", group: "fujian", x: null, y: null },
  { key: "nanjingFj", en: "Nanjing (Fujian)", zh: "南靖", group: "fujian", x: null, y: null },
  { key: "xiamen", en: "Xiamen", zh: "厦门", group: "fujian", x: 360, y: 240 },
  { key: "tongan", en: "Tong'an", zh: "同安", group: "fujian", x: null, y: null },
  { key: "putian", en: "Putian", zh: "莆田", group: "fujian", x: null, y: null },
  { key: "xianyou", en: "Xianyou", zh: "仙游", group: "fujian", x: null, y: null },

  // ---- Guangxi 广西 ----
  { key: "guangxi", en: "Guangxi", zh: "广西", group: "guangxi", x: null, y: null },
  { key: "beihai", en: "Beihai", zh: "北海", group: "guangxi", x: null, y: null },
  { key: "qinzhou", en: "Qinzhou", zh: "钦州", group: "guangxi", x: null, y: null },

  // ---- Zhejiang 浙江 ----
  { key: "zhejiang", en: "Zhejiang", zh: "浙江", group: "zhejiang", x: null, y: null },
  { key: "wenzhou", en: "Wenzhou", zh: "温州", group: "zhejiang", x: null, y: null },
  { key: "ningbo", en: "Ningbo", zh: "宁波", group: "zhejiang", x: 372, y: 168 },

  // ---- Other China (pre-existing entries not in the new list) ----
  { key: "shanghai", en: "Shanghai", zh: "上海", group: "otherChina", x: 383, y: 152 },
  { key: "hongkong", en: "Hong Kong", zh: "香港", group: "otherChina", x: 345, y: 288 },
  { key: "taipei", en: "Taipei", zh: "台北", group: "otherChina", x: 400, y: 260 },

  // ---- Southeast Asia 东南亚 ----
  { key: "singapore", en: "Singapore", zh: "新加坡", group: "southeastAsia", x: 290, y: 540 },
  { key: "malaysia", en: "Malaysia", zh: "马来西亚", group: "southeastAsia", x: null, y: null },
  { key: "kualalumpur", en: "Kuala Lumpur / Penang", zh: "吉隆坡／槟城", group: "southeastAsia", x: 270, y: 500 },
  { key: "thailand", en: "Thailand", zh: "泰国", group: "southeastAsia", x: null, y: null },
  { key: "bangkok", en: "Bangkok", zh: "曼谷", group: "southeastAsia", x: 245, y: 420 },
  { key: "indonesia", en: "Indonesia", zh: "印度尼西亚", group: "southeastAsia", x: null, y: null },
  { key: "jakarta", en: "Jakarta", zh: "雅加达", group: "southeastAsia", x: 300, y: 570 },
  { key: "vietnam", en: "Vietnam", zh: "越南", group: "southeastAsia", x: null, y: null },
  { key: "philippines", en: "Philippines", zh: "菲律宾", group: "southeastAsia", x: null, y: null },
  { key: "cambodia", en: "Cambodia", zh: "柬埔寨", group: "southeastAsia", x: null, y: null },
  { key: "myanmar", en: "Myanmar", zh: "缅甸", group: "southeastAsia", x: null, y: null },
  { key: "laos", en: "Laos", zh: "老挝", group: "southeastAsia", x: null, y: null },
  { key: "brunei", en: "Brunei", zh: "文莱", group: "southeastAsia", x: null, y: null },
  { key: "timorLeste", en: "Timor-Leste", zh: "东帝汶", group: "southeastAsia", x: null, y: null },

  // ---- fallback ----
  { key: "other", en: "Somewhere else", zh: "其他地方", group: "other", x: null, y: null },
];

const PLACES_BY_KEY = PLACES.reduce((acc, p) => {
  acc[p.key] = p;
  return acc;
}, {});

function placeLabel(key) {
  const p = PLACES_BY_KEY[key];
  if (!p) return "";
  return I18n.lang === "zh" ? p.zh : p.en;
}
