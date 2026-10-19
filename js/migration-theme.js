// Visual theming for the migration path journey (js/migration-map.js). This
// kiosk is offline-first with no image CDN (see PROJECT_STATUS.md), so each
// theme also carries a real landmark/cultural photo vendored locally into
// assets/migration/ (freely-licensed Wikimedia Commons images). The
// hand-picked icon + gradient remains the graceful fallback for any theme
// without a photo, or if a photo file ever fails to load — js/migration-map.js
// removes a broken <img> on error and leaves the icon+gradient showing,
// consistent with the rest of the app's flat, illustrated look (tree.js's
// emoji avatars, the hand-drawn SVG elsewhere).
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
  diaolou: { icon: "🏯", gradient: ["#8B5E34", "#C9974A"], image: "assets/migration/diaolou.jpg" },
  cantonTower: { icon: "🗼", gradient: ["#7C4D99", "#1AA6A6"], image: "assets/migration/cantonTower.jpg" },
  portCity: { icon: "⚓", gradient: ["#1AA6A6", "#0D2B45"], image: "assets/migration/portCity.jpg" },
  tulou: { icon: "🏛️", gradient: ["#C9974A", "#8B5E34"], image: "assets/migration/tulou.jpg" },
  pearlDelta: { icon: "🏙️", gradient: ["#39A96B", "#1AA6A6"], image: "assets/migration/pearlDelta.jpg" },
  chaoshan: { icon: "🛕", gradient: ["#C62828", "#D29A1A"], image: "assets/migration/chaoshan.jpg" },
  hakkaHighlands: { icon: "⛰️", gradient: ["#39A96B", "#0D2B45"], image: "assets/migration/hakkaHighlands.jpg" },
  tropicalIsland: { icon: "🌴", gradient: ["#1AA6A6", "#39A96B"] },
  karst: { icon: "⛰️", gradient: ["#1AA6A6", "#39A96B"], image: "assets/migration/karst.jpg" },
  gardenCity: { icon: "🌸", gradient: ["#7C4D99", "#39A96B"], image: "assets/migration/gardenCity.jpg" },
  artDeco: { icon: "🌆", gradient: ["#D29A1A", "#0D2B45"], image: "assets/migration/artDeco.jpg" },
  neonHarbour: { icon: "🌃", gradient: ["#7C4D99", "#C62828"], image: "assets/migration/neonHarbour.jpg" },
  mountainCapital: { icon: "🗻", gradient: ["#1AA6A6", "#7C4D99"], image: "assets/migration/mountainCapital.jpg" },
  singapore: { icon: "🦁", gradient: ["#0D2B45", "#D29A1A"], image: "assets/migration/singapore.jpg" },
  petronas: { icon: "🕌", gradient: ["#39A96B", "#D29A1A"], image: "assets/migration/petronas.jpg" },
  watTemple: { icon: "🛕", gradient: ["#C62828", "#D29A1A"], image: "assets/migration/watTemple.jpg" },
  volcano: { icon: "🌋", gradient: ["#39A96B", "#8B5E34"], image: "assets/migration/volcano.jpg" },
  halongBay: { icon: "⛵", gradient: ["#1AA6A6", "#0D2B45"], image: "assets/migration/halongBay.jpg" },
  islandNation: { icon: "🏝️", gradient: ["#1AA6A6", "#D29A1A"], image: "assets/migration/islandNation.jpg" },
  angkor: { icon: "🛕", gradient: ["#8B5E34", "#D29A1A"], image: "assets/migration/angkor.jpg" },
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
    en: "A hometown in Guangdong Province, part of the historic heartland where many overseas Chinese families trace their roots.",
    zh: "广东省的一处家乡，许多海外华人家族寻根溯源的历史故乡。",
  },
  fujian: {
    en: "A hometown in Fujian Province, long connected to the sea and to the generations who left to build new lives abroad.",
    zh: "福建省的一处家乡，自古与大海相连，也是许多先辈出洋开创新生活的起点。",
  },
  guangxi: {
    en: "A city in Guangxi, on China's southern coast, facing the sea routes south.",
    zh: "广西的一座城市，位于中国南部沿海，面向通往南方的海上航线。",
  },
  zhejiang: {
    en: "A city in Zhejiang Province, on China's eastern coast, with long traditions of trade and travel.",
    zh: "浙江省的一座城市，位于中国东部沿海，有悠久的经商与远行传统。",
  },
  otherChina: {
    en: "A place in China that holds a chapter of the family's story.",
    zh: "中国境内的一处地方，记录着家族故事的一个篇章。",
  },
  southeastAsia: {
    en: "A place in Southeast Asia where the family's journey continued, and where new roots were laid down.",
    zh: "家族旅程延续到东南亚的一站，新的根在这里扎下。",
  },
  other: {
    en: "A place along the family's journey. Every stop adds another chapter to the story of where we come from.",
    zh: "家族旅程中的一个地点。每一站，都为我们从哪里来的故事添上新的一章。",
  },
};

// Genealogy-flavoured write-up for every preset place (js/places.js). `theme`
// is only set where a place has its own artwork; the rest follow GROUP_THEME.
const PLACE_OVERRIDES = {
  guangdongProvince: {
    theme: "pearlDelta",
    en: "Guangdong Province is the ancestral home of countless overseas Chinese families. From its river-delta towns to its Hakka hills and the Teochew coast, generations set out from here carrying their dialects, customs and clan names.",
    zh: "广东省是无数海外华人家族的祖籍地。从珠江三角洲的城镇、客家山区到潮汕沿海，一代又一代人带着乡音、习俗与宗族之名，从这里出发。",
  },
  taishan: {
    theme: "diaolou",
    en: "Taishan sent more early emigrants overseas than almost anywhere else. Families here watched their sons cross the Pacific, and the money they sent home built the village houses and watchtowers that still stand today.",
    zh: "台山是早期海外移民最多的故乡之一。许多家庭送儿子远渡重洋，他们寄回的侨汇建起了至今仍屹立的乡间宅院与碉楼。",
  },
  kaiping: {
    theme: "diaolou",
    en: "Kaiping is celebrated for its diaolou, fortified watchtowers built with money sent home by family members overseas. Each one quietly records the families who left and the homes they hoped to return to.",
    zh: "开平以碉楼闻名，这些碉楼由海外亲人汇款兴建。每一座都默默记录着远行的家人，以及他们期盼归来的故园。",
  },
  xinhui: {
    theme: "diaolou",
    en: "Xinhui is one of the historic Sze Yup counties that sent generations of emigrants abroad. Its clan lineages and ancestral halls still trace family names back across the centuries.",
    zh: "新会是历史上四邑之一，世代都有人远赴海外。这里的宗族谱系与祠堂，至今仍可追溯家族姓氏数百年的脉络。",
  },
  enping: {
    theme: "diaolou",
    en: "Part of the Sze Yup region, Enping is a hometown to many overseas families. Its villages, ancestral halls and watchtowers hold the stories of those who left, and the relatives who waited for them.",
    zh: "恩平属四邑地区，是许多海外家族的故乡。村落、祠堂与碉楼里，留存着远行者的故事，也记着守候他们的亲人。",
  },
  heshan: {
    theme: "diaolou",
    en: "Heshan, in the Pearl River Delta, is one of the historic emigrant counties of Guangdong. Many families trace their roots to its villages and clan halls, and to the family names carried abroad.",
    zh: "鹤山位于珠江三角洲，是广东历史上的侨乡之一。许多家族的根在这里的村落与宗祠，也在那些被带到海外的姓氏之中。",
  },
  guangzhou: {
    theme: "cantonTower",
    en: "As the great trading port of southern China, Guangzhou (Canton) was where many families gathered before setting sail. It remains a meeting place of Cantonese clans, with ancestral halls that trace lineages back generations.",
    zh: "广州是华南的通商大港，许多家庭在此汇聚，再扬帆出海。它至今仍是广府宗族的交汇之地，宗祠与族谱可上溯数代先人。",
  },
  shunde: {
    en: "Shunde, in the Pearl River Delta, is a Cantonese heartland of clan villages and ancestral halls. Many families trace their lineage here, carrying their surnames and village ties overseas through the generations.",
    zh: "顺德位于珠江三角洲，是广府文化的腹地，遍布宗族村落与祠堂。许多家族的世系源于此，姓氏与乡情随着一代代人传到海外。",
  },
  nanhai: {
    en: "Nanhai, beside Foshan in the Pearl River Delta, is an old Cantonese hometown of weavers, traders and clan villages. Its families carried their trades and surnames to communities across Southeast Asia and beyond.",
    zh: "南海毗邻佛山，位于珠江三角洲，是历史悠久的广府故乡，有织工、商贾与宗族村落。这里的家族把手艺与姓氏带到东南亚及更远的地方。",
  },
  panyu: {
    en: "Panyu, on the southern edge of Guangzhou, is a historic Cantonese hometown of riverside villages and clan halls. Many overseas families trace their ancestry here and keep alive the village names of their forebears.",
    zh: "番禺位于广州南部，是历史悠久的广府故乡，河畔村落与宗祠相连。许多海外家族的祖先出自此地，先人的村名也一代代流传下来。",
  },
  dongguan: {
    en: "Dongguan, along the Pearl River Delta, is an ancestral home to Cantonese and Hakka families alike. Its walled villages and ancestral halls remember the clans who stayed, and those who set out overseas.",
    zh: "东莞位于珠江三角洲，是广府与客家家族共同的祖籍地。围村与宗祠记得留下的宗族，也记得远渡重洋的人。",
  },
  zhongshan: {
    en: "Zhongshan, birthplace of Dr Sun Yat-sen, sent many of its sons and daughters overseas. Its emigrant families kept close ties to their villages, linking Zhongshan to communities around the world.",
    zh: "中山是孙中山先生的故乡，许多儿女远赴海外。侨居各地的家族始终与故乡保持联系，把中山与世界各地的社群连在一起。",
  },
  chaozhou: {
    en: "Chaozhou is the cultural heart of the Teochew people. Its dialect, cuisine, opera and ancestral customs travelled with generations of emigrants who carried a strong Teochew identity to new homes abroad.",
    zh: "潮州是潮人文化的中心。潮语、美食、潮剧与祭祖习俗，随着一代代移民远行，也把鲜明的潮人身份带到了海外的新家。",
  },
  shantou: {
    en: "Once a bustling port and gateway to Southeast Asia, Shantou was where many migrants began their journey across the sea, leaving familiar shores in search of new opportunities.",
    zh: "汕头曾是繁忙的港口，也是通往东南亚的门户。许多移民从这里起程渡海，告别熟悉的海岸，去寻找新的机会。",
  },
  jieyang: {
    en: "Jieyang, in the Teochew-speaking region of eastern Guangdong, is an ancestral hometown for many families. Its villages and clan halls hold the roots of those who sailed to Southeast Asia.",
    zh: "揭阳位于广东东部的潮汕地区，是许多家族的祖籍地。村落与宗祠里，留存着远渡南洋的先辈们的根。",
  },
  meizhou: {
    en: "Located in northeastern Guangdong, Meizhou is a heartland of Hakka culture. For generations, its people have carried their language, traditions and heritage to communities around the world.",
    zh: "梅州位于广东东北部，是客家文化的腹地。世世代代，这里的人们把语言、传统与文化传承带到世界各地的社群。",
  },
  xingning: {
    en: "Xingning, in the Hakka heartland of northeastern Guangdong, is a hometown for many Hakka families. Its hill villages and clan halls hold the lineages of those who carried their heritage overseas.",
    zh: "兴宁位于广东东北部的客家腹地，是许多客家家族的故乡。山间村落与宗祠里，记录着把客家传统带往海外的先辈世系。",
  },
  haikou: {
    en: "Haikou, on Hainan Island, is the gateway to a homeland of seafarers. Many Hainanese families trace their journey from this island, sailing overseas to build new lives while holding on to their heritage.",
    zh: "海口位于海南岛，是海南人出海的门户。许多海南家族的旅程由这座岛开始，他们远渡重洋开创新生活，也始终守护着自己的传统。",
  },
  wenchang: {
    en: "Wenchang, on Hainan Island, sent generations of emigrants across the sea. Hainanese families abroad still remember it as an ancestral home, a place of village ties and proud heritage.",
    zh: "文昌位于海南岛，世代都有人从这里渡海远行。海外的海南家族仍把它当作祖籍地，那里有乡情，也有引以为傲的传承。",
  },
  fujianProvince: {
    theme: "tulou",
    en: "Fujian Province is the ancestral land of many Hokkien families and others across Southeast Asia. Its coastal towns and hill villages were the starting point for generations who crossed the sea.",
    zh: "福建省是许多闽南家族及东南亚其他华人的祖籍地。沿海城镇与山间村落，是一代代渡海远行者的起点。",
  },
  jinjiang: {
    en: "Jinjiang, on Fujian's southern coast, is the ancestral home of countless overseas families. A long maritime tradition carried generations of Hokkien emigrants to Southeast Asia, where many built new lives.",
    zh: "晋江位于福建南部沿海，是无数海外家族的祖籍地。悠久的航海传统，把一代代闽南人带到东南亚，在那里开创新生活。",
  },
  shishi: {
    en: "Shishi, a seafaring town on the Fujian coast, was a departure point for many emigrants. Its families sent generations overseas and kept close ties to the hometown through clans and ancestral halls.",
    zh: "石狮是福建沿海的航海小城，许多移民从这里启程。这里的家族世代送人出洋，并通过宗族与祠堂与故乡保持联系。",
  },
  nanan: {
    en: "Nan'an, in southern Fujian, is the ancestral hometown of many overseas Chinese families. Its clan villages and ancestral halls hold the memory of those who left and the lineages they carried abroad.",
    zh: "南安位于福建南部，是许多海外华人家族的祖籍地。宗族村落与祠堂记得远行的人，也记着他们带往海外的世系。",
  },
  anxi: {
    en: "Anxi, in the hills of southern Fujian, is known for its tea and its emigrants. Many families trace their roots to its villages, bringing their traditions and trades to communities overseas.",
    zh: "安溪位于闽南山区，以茶叶与侨民闻名。许多家族的根在这里的村落，他们把传统与手艺带到了海外。",
  },
  yongchun: {
    en: "Yongchun, in the mountains of southern Fujian, is an ancestral hometown for many overseas families. Its villages remember those who left to seek a living, and the family names they carried far away.",
    zh: "永春位于闽南山区，是许多海外家族的祖籍地。村落记得那些为生计远行的人，以及被带到远方的家族姓氏。",
  },
  dehua: {
    en: "Dehua, in the hills of central Fujian, is famed for its porcelain. Craftsmen and emigrants from its families carried the family name and their skills to new places.",
    zh: "德化位于福建中部山区，以瓷器闻名。这里的工匠与移民，把家族之名与手艺带到了新的地方。",
  },
  huian: {
    en: "Hui'an, a coastal county in Fujian, is famed for its stonemasons and seafarers. Many families trace their roots here, with generations who set out across the sea carrying their craft and clan name.",
    zh: "惠安是福建沿海县城，以石雕匠人与航海人闻名。许多家族的根在这里，一代代人带着手艺与宗族之名远渡重洋。",
  },
  dongshi: {
    en: "Dongshi, a coastal town in Fujian, is a place whose families looked to the sea. Many set out from here for Southeast Asia, keeping the ties of village and clan alive across the generations.",
    zh: "东石是福建沿海的小镇，这里的人家世代向海而生。许多人从这里前往东南亚，让乡情与宗族之谊代代相传。",
  },
  longxi: {
    en: "Longxi, in southern Fujian, is the ancestral home of many Hokkien families. Its villages and clan halls hold the lineages of those who sailed overseas and made new homes across the sea.",
    zh: "龙溪位于福建南部，是许多闽南家族的祖籍地。村落与宗祠保存着渡海远行、在海外安家的先辈世系。",
  },
  zhangpu: {
    en: "Zhangpu, in southern Fujian, is a hometown for many overseas families. Its coastal villages and clan halls hold the memory of generations who left to seek new opportunities across the sea.",
    zh: "漳浦位于福建南部，是许多海外家族的故乡。沿海村落与宗祠，留存着一代代人渡海寻找新机会的记忆。",
  },
  yunxiao: {
    en: "Yunxiao, in southern Fujian, is a coastal hometown with a long tradition of emigration. Families here kept close ties to their villages and clans while building new lives overseas.",
    zh: "云霄位于福建南部沿海，有悠久的出洋传统。这里的家族在海外开创新生活的同时，始终与村落和宗族保持联系。",
  },
  dongshan: {
    en: "Dongshan, an island county off Fujian's southern coast, is a place of fishermen and seafarers. Many families trace their roots here, with generations who set sail to find new homes.",
    zh: "东山是福建南部海上的岛县，渔民与航海人世代生活于此。许多家族的根在这里，一代代人扬帆出海，去寻找新的家园。",
  },
  zhaoan: {
    en: "Zhao'an, on the border of Fujian and Guangdong, is an ancestral home where Hokkien and Hakka heritage meet. Its clan villages hold the lineages of families who left for Southeast Asia.",
    zh: "诏安位于闽粤交界，是闽南与客家文化交汇的祖籍地。宗族村落里，保存着前往东南亚的家族世系。",
  },
  pinghe: {
    en: "Pinghe, in the hills of southern Fujian, is known for its pomelo orchards and clan villages. Many families trace their roots here, with generations who carried their traditions overseas.",
    zh: "平和位于闽南山区，以柚园与宗族村落闻名。许多家族的根在这里，一代代人把传统带到了海外。",
  },
  huaan: {
    en: "Hua'an, in the hills of southern Fujian, is known for its tulou, great earthen houses where whole clans lived together. Many families trace their lineage here, with traditions carried across the generations.",
    zh: "华安位于闽南山区，以土楼闻名，整个宗族曾聚居在这些巨大的夯土楼里。许多家族的世系源于此，传统代代相传。",
  },
  nanjingFj: {
    en: "Nanjing County, in southern Fujian, is home to the famous tulou, great earthen houses where whole clans once lived together. Many overseas families trace their lineage here, a place that holds the memory of the clan.",
    zh: "福建南靖是著名土楼之乡，整个宗族曾聚居于巨大的夯土楼中。许多海外家族的世系源于此，这里保存着宗族的记忆。",
  },
  xiamen: {
    theme: "portCity",
    en: "Xiamen was a major port of departure for Hokkien emigrants. For many families, this is where the journey began, as they left familiar shores in search of a new life across the sea.",
    zh: "厦门是闽南移民出洋的重要港口。对许多家庭而言，旅程从这里开始，他们告别熟悉的海岸，渡海去寻找新生活。",
  },
  tongan: {
    en: "Tong'an, in the Xiamen area, is an ancestral hometown for many Hokkien families. Its villages and clan halls hold the roots of generations who sailed overseas from the nearby port.",
    zh: "同安位于厦门一带，是许多闽南家族的祖籍地。村落与宗祠保存着从附近港口出海的一代代先人的根。",
  },
  putian: {
    en: "Putian, on Fujian's central coast, has a proud tradition of seafaring and commerce. Many overseas families trace their roots here, with generations who carried their language, faith and clan name abroad.",
    zh: "莆田位于福建中部沿海，有引以为傲的航海与经商传统。许多海外家族的根在这里，一代代人把乡音、信仰与宗族之名带到海外。",
  },
  xianyou: {
    en: "Xianyou, near Putian in Fujian, is an ancestral home for many Henghwa (Hinghwa) families. Its villages hold the roots of generations who carried their dialect and customs overseas.",
    zh: "仙游毗邻莆田，是许多兴化家族的祖籍地。村落里留存着把乡音与习俗带往海外的世代先人的根。",
  },
  guangxi: {
    theme: "karst",
    en: "Guangxi, in China's far south, borders the sea routes toward Southeast Asia. Families here carried their dialects and customs along these routes, leaving traces in clan records and family stories.",
    zh: "广西位于中国最南端，通向东南亚的海路在此相接。这里的家族沿着这些航路带着乡音与习俗远行，并留在宗族记录与家族故事里。",
  },
  beihai: {
    theme: "karst",
    en: "Beihai, a port on the Gulf of Tonkin, has long been a gateway to the south. Its families took part in the coastal trade, carrying their heritage along sea routes to Southeast Asia.",
    zh: "北海是北部湾边的港口，自古是通往南方的门户。这里的人家参与沿海贸易，把传统沿海路带到东南亚。",
  },
  qinzhou: {
    theme: "karst",
    en: "Qinzhou, on Guangxi's southern coast, is a port with deep ties to the sea. Its families travelled the coastal routes to Vietnam and Southeast Asia, carrying their traditions with them.",
    zh: "钦州位于广西南部沿海，与大海渊源深厚。这里的家族沿着海岸航线前往越南与东南亚，把传统带在身边。",
  },
  zhejiang: {
    theme: "gardenCity",
    en: "Zhejiang, on China's eastern coast, is a land of rivers, ports and merchants. Families from here travelled far, carrying their trades, dialects and clan names to new homes overseas.",
    zh: "浙江位于中国东部沿海，江河、港口与商贾汇聚。这里的家族远行四方，把手艺、乡音与宗族之名带到海外的新家。",
  },
  wenzhou: {
    theme: "gardenCity",
    en: "Wenzhou, on Zhejiang's southern coast, is known for its enterprising families. Generations of Wenzhou people set out to trade and build new lives, carrying their language and clan ties with them.",
    zh: "温州位于浙江南部沿海，以敢闯敢拼的家族闻名。一代代温州人外出经商、开创新生活，也带着乡音与宗族情谊远行。",
  },
  ningbo: {
    theme: "gardenCity",
    en: "Ningbo, one of China's great historic ports, was a gateway for merchants and migrants. Its families, with strong clan and trading traditions, carried the Ningbo name to cities across the world.",
    zh: "宁波是中国历史上的重要港口，商人与移民由此出入。这里的家族有深厚的宗族与经商传统，把宁波之名带到世界各地的城市。",
  },
  shanghai: {
    theme: "artDeco",
    en: "Shanghai, the great port city of the Yangtze delta, drew families from across China. For many, it was a place of transit and fresh starts before journeys further overseas.",
    zh: "上海是长江三角洲的大港，吸引着来自全国各地的家庭。对许多人而言，这里是中转与重新开始之地，之后才继续远渡重洋。",
  },
  hongkong: {
    theme: "neonHarbour",
    en: "Hong Kong, a gateway between China and the world, was a stopping point for countless families. For many, it was the first harbour on the journey to a new home overseas.",
    zh: "香港是连接中国与世界的门户，无数家庭曾在此驻足。对许多人而言，这里是通往海外新家路上的第一个港湾。",
  },
  taipei: {
    theme: "mountainCapital",
    en: "Taipei, the capital of Taiwan, is home to families whose roots cross the Taiwan Strait. Many carry the traditions of ancestral villages in Fujian and Guangdong.",
    zh: "台北是台湾的首都，许多家庭的根跨越台湾海峡。他们承载着福建、广东祖籍村落的传统。",
  },
  singapore: {
    theme: "singapore",
    en: "In Singapore, generations of migrants built new lives, raised families and established communities. Their traditions and stories live on through the generations that followed.",
    zh: "在新加坡，一代代移民开创新生活、养育家人、建立社群。他们的传统与故事，在后世子孙中延续下去。",
  },
  malaysia: {
    theme: "petronas",
    en: "Malaysia is home to long-established Chinese communities, from the old ports of Penang and Malacca to the tin towns of the peninsula. Many families here share close ties of dialect, clan and kinship with Singapore.",
    zh: "马来西亚有历史悠久的华人社群，从槟城、马六甲的古老港口到半岛上的锡矿小镇。许多家庭与新加坡在乡音、宗族与亲缘上血脉相连。",
  },
  kualalumpur: {
    theme: "petronas",
    en: "Kuala Lumpur and Penang grew into centres of Chinese community life. Clan associations, temples and shophouses mark where generations of families settled and built their communities.",
    zh: "吉隆坡与槟城成长为华人社群生活的中心。会馆、庙宇与店屋，标记着一代代家庭落脚并建立社群的地方。",
  },
  thailand: {
    theme: "watTemple",
    en: "Thailand has welcomed Chinese migrants for centuries, many of them Teochew, who settled, married and made it home. Their descendants have woven Chinese heritage into Thai life across generations.",
    zh: "泰国数百年来接纳了许多华人移民，其中不少是潮州人，他们在此定居、成家。后代把华人传统融入泰国生活，代代相传。",
  },
  bangkok: {
    theme: "watTemple",
    en: "Bangkok's Yaowarat, one of the world's great Chinatowns, grew around generations of Teochew and other Chinese migrants. Its shophouses, shrines and family trades keep their stories alive.",
    zh: "曼谷的耀华力路是世界著名的唐人街之一，由一代代潮州及其他华人移民逐渐形成。店屋、神庙与家族生意，让他们的故事延续至今。",
  },
  indonesia: {
    theme: "volcano",
    en: "Indonesia is home to one of Southeast Asia's oldest Chinese communities, with roots going back centuries. Families here built lives across the islands, blending their heritage with local traditions.",
    zh: "印度尼西亚拥有东南亚最古老的华人社群之一，根源可追溯数百年。这里的家庭遍布群岛，把自己的传统与当地文化融合在一起。",
  },
  jakarta: {
    theme: "volcano",
    en: "In Jakarta, the old quarter of Glodok holds the story of Chinese families who settled here over centuries. Their shops, temples and family names are part of the city's history.",
    zh: "在雅加达，旧城区格洛多克承载着华人家庭数百年来在此定居的故事。他们的店铺、庙宇与姓氏，是这座城市历史的一部分。",
  },
  vietnam: {
    theme: "halongBay",
    en: "Vietnam has a long history of Chinese settlement, from Hoi An's old merchant houses to Cholon in Ho Chi Minh City. Families here carried their clan names and customs through generations.",
    zh: "越南的华人定居历史悠久，从会安的古老商铺到胡志明市的堤岸。这里的家庭世代守着宗族之名与习俗。",
  },
  philippines: {
    theme: "islandNation",
    en: "The Philippines has welcomed Chinese traders and settlers for centuries, many from southern Fujian. Their descendants have built families, businesses and communities that are part of the nation's story.",
    zh: "菲律宾数百年来接纳了许多华人商人与移民，其中不少来自闽南。他们的后代建立家庭、事业与社群，成为这个国家故事的一部分。",
  },
  cambodia: {
    theme: "angkor",
    en: "Cambodia is home to a longstanding Chinese community, many of Teochew descent, who settled in its towns and trading centres. Their families have kept their heritage alive across generations.",
    zh: "柬埔寨有历史悠久的华人社群，许多人祖籍潮州，定居在城镇与商贸中心。他们的家庭把传统一代代传承下来。",
  },
  myanmar: {
    theme: "watTemple",
    en: "Myanmar has long had Chinese communities, from traders on the old overland routes to families who settled in Yangon's streets. Their clan ties and customs have travelled through the generations.",
    zh: "缅甸自古就有华人社群，从古老陆路上的商人到在仰光街巷落户的家庭。他们的宗族情谊与习俗代代相传。",
  },
  laos: {
    theme: "watTemple",
    en: "Laos is home to a small but long-established Chinese community. Families who settled here as traders carried their dialects, customs and clan ties across the border and through generations.",
    zh: "老挝有一个规模不大却历史悠久的华人社群。当年来此经商的家庭，把乡音、习俗与宗族情谊带过边境，并传承数代。",
  },
  brunei: {
    theme: "petronas",
    en: "Brunei is home to a small, well-established Chinese community on the island of Borneo. Its families have built their lives here over generations, keeping their heritage and clan ties.",
    zh: "文莱在婆罗洲岛上有一个规模不大却根基稳固的华人社群。这里的家庭世代在此生活，守护着自己的传统与宗族情谊。",
  },
  timorLeste: {
    theme: "islandNation",
    en: "Timor-Leste is home to a small Chinese community with roots stretching back generations. Its families have kept their traditions alive far from the villages their ancestors left.",
    zh: "东帝汶有一个小型华人社群，根源可追溯数代之前。这里的家庭，在远离先辈故乡的地方，依然守护着自己的传统。",
  },
  other: {
    theme: "generic",
    en: "A place along the family's journey. Every stop adds another chapter to the story of where we come from.",
    zh: "家族旅程中的一个地点。每一站，都为我们从哪里来的故事添上新的一章。",
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
