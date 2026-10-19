// Builds js/countries.js from the images in assets/siblingMigration/ (one
// .jpg per country, filename = the country key). Run after adding / renaming
// images:  node scripts/build-countries.js
// It refuses to write anything if an image has no Chinese name below (or a
// name here has no image), so the picker and the picture can never disagree.
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "assets", "siblingMigration");
const files = fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort();

// English display names where the filename isn't simply "Name With Spaces".
const EN = {
  Cote_d_Ivoire: "Côte d'Ivoire",
  Cabo_Verde: "Cabo Verde",
  Congo: "Congo",
  Democratic_Republic_of_the_Congo: "Democratic Republic of the Congo",
  Guinea_Bissau: "Guinea-Bissau",
  Timor_Leste: "Timor-Leste",
  State_of_Palestine: "Palestine",
  Sao_Tome_and_Principe: "São Tomé and Príncipe",
};

const ZH = {
  Afghanistan: "阿富汗", Albania: "阿尔巴尼亚", Algeria: "阿尔及利亚", Andorra: "安道尔", Angola: "安哥拉",
  Antigua_and_Barbuda: "安提瓜和巴布达", Argentina: "阿根廷", Armenia: "亚美尼亚", Australia: "澳大利亚",
  Austria: "奥地利", Azerbaijan: "阿塞拜疆", Bahamas: "巴哈马", Bahrain: "巴林", Bangladesh: "孟加拉国",
  Barbados: "巴巴多斯", Belarus: "白俄罗斯", Belgium: "比利时", Belize: "伯利兹", Benin: "贝宁", Bhutan: "不丹",
  Bolivia: "玻利维亚", Bosnia_and_Herzegovina: "波斯尼亚和黑塞哥维那", Botswana: "博茨瓦纳", Brazil: "巴西",
  Brunei: "文莱", Bulgaria: "保加利亚", Burkina_Faso: "布基纳法索", Burundi: "布隆迪", Cabo_Verde: "佛得角",
  Cambodia: "柬埔寨", Cameroon: "喀麦隆", Canada: "加拿大", Central_African_Republic: "中非共和国", Chad: "乍得",
  Chile: "智利", China: "中国", Colombia: "哥伦比亚", Comoros: "科摩罗", Congo: "刚果（布）",
  Costa_Rica: "哥斯达黎加", Cote_d_Ivoire: "科特迪瓦", Croatia: "克罗地亚", Cuba: "古巴", Cyprus: "塞浦路斯",
  Czechia: "捷克", Democratic_Republic_of_the_Congo: "刚果（金）", Denmark: "丹麦", Djibouti: "吉布提",
  Dominica: "多米尼克", Dominican_Republic: "多米尼加共和国", Ecuador: "厄瓜多尔", Egypt: "埃及",
  El_Salvador: "萨尔瓦多", Equatorial_Guinea: "赤道几内亚", Eritrea: "厄立特里亚", Estonia: "爱沙尼亚",
  Eswatini: "斯威士兰", Ethiopia: "埃塞俄比亚", Fiji: "斐济", Finland: "芬兰", France: "法国", Gabon: "加蓬",
  Gambia: "冈比亚", Georgia: "格鲁吉亚", Germany: "德国", Ghana: "加纳", Greece: "希腊", Grenada: "格林纳达",
  Guatemala: "危地马拉", Guinea: "几内亚", Guinea_Bissau: "几内亚比绍", Guyana: "圭亚那", Haiti: "海地",
  Honduras: "洪都拉斯", Hong_Kong: "香港", Hungary: "匈牙利", Iceland: "冰岛", India: "印度",
  Indonesia: "印度尼西亚", Iran: "伊朗", Iraq: "伊拉克", Ireland: "爱尔兰", Israel: "以色列", Italy: "意大利",
  Jamaica: "牙买加", Japan: "日本", Jordan: "约旦", Kazakhstan: "哈萨克斯坦", Kenya: "肯尼亚",
  Kiribati: "基里巴斯", Kosovo: "科索沃", Kuwait: "科威特", Kyrgyzstan: "吉尔吉斯斯坦", Laos: "老挝",
  Latvia: "拉脱维亚", Lebanon: "黎巴嫩", Lesotho: "莱索托", Liberia: "利比里亚", Libya: "利比亚",
  Liechtenstein: "列支敦士登", Lithuania: "立陶宛", Luxembourg: "卢森堡", Macau: "澳门", Madagascar: "马达加斯加",
  Malawi: "马拉维", Malaysia: "马来西亚", Maldives: "马尔代夫", Mali: "马里", Malta: "马耳他",
  Marshall_Islands: "马绍尔群岛", Mauritania: "毛里塔尼亚", Mauritius: "毛里求斯", Mexico: "墨西哥",
  Micronesia: "密克罗尼西亚", Moldova: "摩尔多瓦", Monaco: "摩纳哥", Mongolia: "蒙古", Montenegro: "黑山",
  Morocco: "摩洛哥", Mozambique: "莫桑比克", Myanmar: "缅甸", Namibia: "纳米比亚", Nauru: "瑙鲁", Nepal: "尼泊尔",
  Netherlands: "荷兰", New_Zealand: "新西兰", Nicaragua: "尼加拉瓜", Niger: "尼日尔", Nigeria: "尼日利亚",
  North_Korea: "朝鲜", North_Macedonia: "北马其顿", Norway: "挪威", Oman: "阿曼", Pakistan: "巴基斯坦",
  Palau: "帕劳", Panama: "巴拿马", Papua_New_Guinea: "巴布亚新几内亚", Paraguay: "巴拉圭", Peru: "秘鲁",
  Philippines: "菲律宾", Poland: "波兰", Portugal: "葡萄牙", Qatar: "卡塔尔", Romania: "罗马尼亚", Russia: "俄罗斯",
  Rwanda: "卢旺达", Saint_Kitts_and_Nevis: "圣基茨和尼维斯", Saint_Lucia: "圣卢西亚",
  Saint_Vincent_and_the_Grenadines: "圣文森特和格林纳丁斯", Samoa: "萨摩亚", San_Marino: "圣马力诺",
  Sao_Tome_and_Principe: "圣多美和普林西比", Saudi_Arabia: "沙特阿拉伯", Senegal: "塞内加尔", Serbia: "塞尔维亚",
  Seychelles: "塞舌尔", Sierra_Leone: "塞拉利昂", Singapore: "新加坡", Slovakia: "斯洛伐克", Slovenia: "斯洛文尼亚",
  Solomon_Islands: "所罗门群岛", Somalia: "索马里", South_Africa: "南非", South_Korea: "韩国",
  South_Sudan: "南苏丹", Spain: "西班牙", Sri_Lanka: "斯里兰卡", State_of_Palestine: "巴勒斯坦", Sudan: "苏丹",
  Suriname: "苏里南", Sweden: "瑞典", Switzerland: "瑞士", Syria: "叙利亚", Taiwan: "台湾", Tajikistan: "塔吉克斯坦",
  Tanzania: "坦桑尼亚", Thailand: "泰国", Timor_Leste: "东帝汶", Togo: "多哥", Tonga: "汤加",
  Trinidad_and_Tobago: "特立尼达和多巴哥", Tunisia: "突尼斯", Turkey: "土耳其", Turkmenistan: "土库曼斯坦",
  Tuvalu: "图瓦卢", Uganda: "乌干达", Ukraine: "乌克兰", United_Arab_Emirates: "阿拉伯联合酋长国",
  United_Kingdom: "英国", United_States: "美国", Uruguay: "乌拉圭", Uzbekistan: "乌兹别克斯坦", Vanuatu: "瓦努阿图",
  Vatican_City: "梵蒂冈", Venezuela: "委内瑞拉", Vietnam: "越南", Yemen: "也门", Zambia: "赞比亚", Zimbabwe: "津巴布韦",
};

const keys = files.map((f) => f.replace(/\.[^.]+$/, ""));
const missingZh = keys.filter((k) => !ZH[k]);
const orphanZh = Object.keys(ZH).filter((k) => !keys.includes(k));
if (missingZh.length || orphanZh.length) {
  console.error("Mismatch — nothing written.");
  if (missingZh.length) console.error("  image without a Chinese name:", missingZh.join(", "));
  if (orphanZh.length) console.error("  Chinese name without an image:", orphanZh.join(", "));
  process.exit(1);
}

const countries = files.map((file, i) => {
  const key = keys[i];
  return { key, en: EN[key] || key.replace(/_/g, " "), zh: ZH[key], file };
});

const out = `// Generated by scripts/build-countries.js from assets/siblingMigration/ —
// do not hand-edit; add/rename an image and re-run the script instead.
// Where a sibling lives now (chart: "Where do they live now?"; migration
// screen: "<name> starts a new life in <place>"). One entry per image.
const COUNTRIES = ${JSON.stringify(countries, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, "..", "js", "countries.js"), out + fs.readFileSync(path.join(__dirname, "countries-helpers.js"), "utf8"), "utf8");
console.log(`Wrote js/countries.js with ${countries.length} countries.`);
