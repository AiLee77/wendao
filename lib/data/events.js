// 游历事件树。文案像小说旁白：玩家"自己发现"，而不是"系统提示发现"。
//
// Event: { id, region: regionId | "any", w: weight, realmMin?, realmMax?, once?: true (per life), flag?: "needs flag",
//          text, opts: [Option...] }
// Option: { id, label, req?: Req, out: Outcome }
// Req: { path?, sub?, elem? (root has this element), item?: [id, n], ls?, realm?, stat?: ["spd"|"atk"|..., value], flag? }
// Outcome: { text?, xp?, ls?, items?: [[id, n]], hp?: -0.3 (fraction of max), mp?, tox?, life?: years, st?: stamina,
//            wu?: 悟性 points, chance?: { p, ok: Outcome, fail: Outcome },
//            battle?: monsterId | { tier, boss?: true }, win?: Outcome, lose?: Outcome,
//            next?: eventId, flag?: "set flag", unflag?: "clear flag", gongfa?: id, art?: id, bio?: "传记文本",
//            legacy?: n (道统点), injury?: true (重伤), heart?: true (心魔) }
export const EVENTS = [
  // ---------- 青山村 ----------
  {
    id: "qs_pubu", region: "qingshan", w: 10,
    text: "你沿着后山的溪流往上走，水声越来越大。转过一块巨石，一道瀑布从崖上跌落，水雾里隐约有一个洞口。",
    opts: [
      { id: "in", label: "穿过瀑布进洞", out: { text: "水打在身上冰凉刺骨。洞里很黑，你摸索着往前走。", next: "qs_pubu_cave", hp: -0.05 } },
      { id: "look", label: "在水潭边采药", out: { text: "潭边长着几株灵草，你小心采下。", items: [["m_lingcao", 2]], xp: 5 } },
      { id: "back", label: "天色不早，回去", out: { text: "你记住了这个地方。", xp: 2 } },
    ],
  },
  {
    id: "qs_pubu_cave", region: "qingshan", w: 0,
    text: "洞深处有一具盘坐的骸骨，道袍早已朽烂。骸骨膝前放着半卷玉简，旁边是一个落满灰的蒲团。",
    opts: [
      { id: "read", label: "拜了三拜，取走玉简", out: { text: "玉简上只剩半篇《青风引气术》。你修炼之后，竟能隐约听见附近灵气流动的声音。", gongfa: "g_qingfeng", xp: 40, bio: "在瀑布后的洞府中得到前辈遗泽《青风引气术》", legacy: 1 } },
      { id: "sit", label: "在蒲团上打坐", out: { text: "蒲团下有一处细小的灵脉，你在这里坐了一整夜。", xp: 60, st: -1 } },
      { id: "rob", label: "搜刮骸骨身上的东西", out: { chance: { p: 0.5, ok: { text: "你在骨架下摸到一枚玉佩。", items: [["f_yupei", 1]] }, fail: { text: "骸骨忽然崩散，一股阴气钻入你的经脉。", hp: -0.3, tox: 10 } } } },
    ],
  },
  {
    id: "qs_jiudian", region: "qingshan", w: 8,
    text: "村口酒馆，几个猎户正在喝酒。一个独眼老汉说：'三百年前，天剑宗有位弟子就在这山里坐化的，谁都没找着他的洞府。'",
    opts: [
      { id: "ask", label: "请老汉喝一杯，细问", req: { ls: 5 }, out: { text: "老汉压低声音：'顺着溪往上，瀑布后面。'他说完就醉倒了。", ls: -5, flag: "qs_hint", wu: 1, xp: 3 } },
      { id: "listen", label: "默默听着", out: { text: "你记下了这个传说。", wu: 1 } },
      { id: "drink", label: "自己喝一杯", req: { ls: 3 }, out: { text: "酒很烈。你睡了一觉。", ls: -3, hp: 0.2, st: 2 } },
    ],
  },
  {
    id: "qs_lang", region: "qingshan", w: 12,
    text: "林间传来低低的嗥叫。三四双绿眼睛在暗处亮起来——野狼，它们闻到了你身上的血气。",
    opts: [
      { id: "fight", label: "拔剑迎战", out: { battle: "w_yelang", win: { text: "狼群退去了。", xp: 15, ls: 8 }, lose: { text: "你仓皇逃回村里，身上多了几道伤。", hp: -0.2 } } },
      { id: "tree", label: "爬上树等它们走", req: { stat: ["spd", 14] }, out: { text: "你身手够快。狼群在树下转了半夜，天亮才走。", xp: 5, st: -1 } },
      { id: "run", label: "撒腿就跑", out: { chance: { p: 0.6, ok: { text: "你跑得够快。", xp: 2 }, fail: { text: "被追上咬了一口。", hp: -0.25, battle: "w_yelang" } } } },
    ],
  },
  {
    id: "qs_laoren", region: "qingshan", w: 6, once: true,
    text: "一个在田里种菜的老人叫住你：'小娃，帮我把这筐菜挑回去。'他看起来普普通通，可你的灵觉在隐隐发烫。",
    opts: [
      { id: "help", label: "帮忙挑菜", out: { text: "挑到一半，你发现筐越来越沉，沉得像山。放下时你已满头大汗——可是气血比之前通畅了许多。老人笑而不语。", xp: 80, wu: 2, bio: "帮一位深藏不露的老人挑了一筐菜", legacy: 1 } },
      { id: "ignore", label: "装作没听见", out: { text: "老人摇摇头，继续种菜。", wu: 0 } },
    ],
  },
  {
    id: "qs_zei", region: "qingshan", w: 7,
    text: "官道上，几个蒙面山贼拦住了你：'此山是我开——留下灵石！'",
    opts: [
      { id: "fight", label: "打", out: { battle: "w_shanzei", win: { text: "山贼四散而逃，留下了几包精铁矿。", ls: 20, xp: 12 }, lose: { text: "你被抢了。", ls: -30, hp: -0.15 } } },
      { id: "pay", label: "破财消灾", req: { ls: 20 }, out: { text: "他们拿了钱放你过去。", ls: -20 } },
      { id: "talk", label: "以修士身份震慑", req: { realm: 1 }, out: { text: "你放出一丝筑基威压，山贼跪地磕头，把赃物都献了上来。", ls: 60, items: [["m_tiekuang", 3]], xp: 10 } },
    ],
  },
  {
    id: "qs_shuyao", region: "qingshan", w: 3, realmMin: 0,
    text: "村口那棵老槐树今晚在动。不是风——它的根从土里拔了出来，树洞里亮起两点幽光。",
    opts: [
      { id: "fight", label: "斩妖", out: { battle: "w_shuyao", win: { text: "树妖倒下，化作满地灵草。树心里嵌着一卷残页。", xp: 50, ls: 30 }, lose: { text: "你被树根抽飞出去。", hp: -0.4, injury: true } } },
      { id: "fire", label: "放火烧", req: { elem: "火" }, out: { text: "火势借林风而起，树妖哀嚎着化为焦炭——半座后山也跟着烧了。村民们看你的眼神变了。", xp: 40, items: [["m_lingcao", 1]], wu: -1 } },
      { id: "flee", label: "退走", out: { text: "你悄悄退走。它没追。", xp: 2 } },
    ],
  },
  {
    id: "qs_huo", region: "qingshan", w: 9,
    text: "草丛里窜出一只尾巴冒火的老鼠，叼着一株灵草就跑。",
    opts: [
      { id: "chase", label: "追上去", out: { battle: "w_huoshu", win: { text: "火鼠丢下灵草逃了。", items: [["m_lingcao", 2]], xp: 8 }, lose: { text: "你被烧了眉毛。", hp: -0.1 } } },
      { id: "ignore", label: "不理它", out: { text: "一只老鼠而已。", xp: 1 } },
    ],
  },
  {
    id: "qs_miao", region: "qingshan", w: 5,
    text: "破庙里住着一个疯癫道人，正对着神像说话。看到你，他忽然清醒了片刻：'你有灵根。要听我讲道吗？'",
    opts: [
      { id: "yes", label: "听他讲道", out: { chance: { p: 0.7, ok: { text: "他讲的东西颠三倒四，可你忽然有一句听懂了。", wu: 2, xp: 30 }, fail: { text: "他讲到一半又疯了，把你赶了出来。", wu: 0 } } } },
      { id: "give", label: "给他一点吃的", req: { item: ["x_jiecao", 1] }, out: { text: "他吃了野果，塞给你一张符。'拿着，别问。'", items: [["x_jiecao", -1], ["t_huo", 1]], wu: 1 } },
      { id: "no", label: "转身离开", out: { text: "疯子的话不能信。", xp: 1 } },
    ],
  },
  {
    id: "qs_tuduan", region: "qingshan", w: 6,
    text: "地面突然塌了一小块，一只貂钻了出来，嘴里叼着一块发亮的矿石，见了你就想往土里钻。",
    opts: [
      { id: "grab", label: "出手抓", out: { battle: "w_tuduan", win: { text: "它留下矿石跑了。", items: [["m_tiekuang", 2]], xp: 8 }, lose: { text: "它钻进土里，顺带把你绊倒了。", hp: -0.05 } } },
      { id: "follow", label: "跟着它挖的洞走", req: { stat: ["spd", 16] }, out: { text: "洞通向一个小矿脉！", items: [["m_tiekuang", 5]], xp: 10 } },
    ],
  },
  {
    id: "qs_dream", region: "qingshan", w: 4, realmMin: 0,
    text: "夜里露宿，你梦见自己站在一座云海之巅，远处有人御剑而过，回头看了你一眼。你醒来时，浑身灵气翻涌。",
    opts: [
      { id: "sit", label: "趁势打坐", out: { text: "这一坐，修为精进。", xp: 50 } },
      { id: "write", label: "记下梦中的剑势", req: { path: "jian" }, out: { text: "你凭记忆比划那一剑，竟有几分神韵。", xp: 30, wu: 2 } },
    ],
  },
  // ---------- 云梦泽 ----------
  {
    id: "ym_wu", region: "yunmeng", w: 10,
    text: "雾越来越浓，浓到看不见自己的手。你听到水里有东西在跟着你。",
    opts: [
      { id: "fight", label: "停下，等它上来", out: { battle: "w_shuigui", win: { text: "水鬼被你打散，雾里留下一枚水灵晶。", items: [["m_shuijing", 1]], xp: 40, ls: 25 }, lose: { text: "你差点被拖下水。", hp: -0.3 } } },
      { id: "water", label: "以水法探路", req: { elem: "水" }, out: { text: "你与水气相合，雾自然为你让开一条路。前方有一处干燥的石台。", xp: 30, items: [["m_hanlian", 1]] } },
      { id: "fu", label: "用遁地符脱身", req: { item: ["t_dun", 1] }, out: { text: "你瞬间出现在泽边。", items: [["t_dun", -1]] } },
    ],
  },
  {
    id: "ym_chuan", region: "yunmeng", w: 7,
    text: "一艘乌篷船从雾里漂出来，船头坐着一个卖鱼的老妪。'客官，要渡泽吗？我的船能去别人去不了的地方。'",
    opts: [
      { id: "pay", label: "付五十灵石渡泽", req: { ls: 50 }, out: { text: "船行了半日，停在一处从未见过的小岛。岛上有座荒废的丹炉。", ls: -50, next: "ym_island" } },
      { id: "fish", label: "买条鱼", req: { ls: 5 }, out: { text: "鱼肚子里有颗珠子。", ls: -5, items: [["m_shuijing", 1]] } },
      { id: "no", label: "谢绝", out: { text: "老妪笑了笑，船又漂回雾里。" } },
    ],
  },
  {
    id: "ym_island", region: "yunmeng", w: 0,
    text: "丹炉里还有余温。炉壁上刻着一篇炼丹口诀，结尾写着：'丹成九转，毒亦九重，慎之。'",
    opts: [
      { id: "learn", label: "抄录口诀", out: { text: "你读懂了其中三成。炼丹时心里更有数了。", wu: 3, xp: 60, bio: "在云梦泽的无名小岛上习得炼丹口诀", legacy: 1 } },
      { id: "dig", label: "翻找丹炉", out: { chance: { p: 0.5, ok: { text: "炉底压着两枚凝元丹。", items: [["p_ningyuan", 2]] }, fail: { text: "炉灰里只有丹毒残渣，呛了你一口。", tox: 15 } } } },
      { id: "dan", label: "以丹修之法重燃丹炉", req: { path: "dan" }, out: { text: "炉火复燃，你借前人余火炼了一炉养神丹。", items: [["p_yangshen", 2], ["p_ningyuan", 1]], xp: 40, wu: 2 } },
    ],
  },
  {
    id: "ym_jiao", region: "yunmeng", w: 3,
    text: "泽心浪涌如山，一条水蛟探出头来，鳞片泛着青光。它盯着你——不，它盯着你身上的灵石。",
    opts: [
      { id: "fight", label: "斩蛟", out: { battle: "w_jiao", win: { text: "蛟沉入水底，水面浮起几片蛟鳞。", items: [["m_jiaolin", 2]], xp: 120, ls: 80, bio: "在云梦泽斩杀一条水蛟" }, lose: { text: "你被浪拍回岸上，险些丧命。", hp: -0.5, injury: true } } },
      { id: "give", label: "扔给它一百灵石", req: { ls: 100 }, out: { text: "蛟吞了灵石，心满意足地沉下去。临走甩了你一片鳞。", ls: -100, items: [["m_jiaolin", 1]] } },
      { id: "shou", label: "尝试驯服", req: { path: "shou" }, out: { chance: { p: 0.35, ok: { text: "你与它对视良久，它低下了头。它愿意跟你走——以一枚卵的形式。", items: [["e_shuijiao", 1]], xp: 80, bio: "驯服了一条云梦泽水蛟" }, fail: { text: "它不吃这一套。", battle: "w_jiao", win: { xp: 100, items: [["m_jiaolin", 2]] }, lose: { hp: -0.5, injury: true } } } } },
    ],
  },
  {
    id: "ym_dongfu", region: "yunmeng", w: 4, realmMin: 1,
    text: "退潮后，泽底露出一座青石门。门上的禁制已经残破，你能感觉到里面有灵气——也有死气。",
    opts: [
      { id: "in", label: "进去", out: { battle: "w_guxiu", win: { text: "守尸倒下后，洞府深处露出一座聚灵阵的残盘。", xp: 150, ls: 60, items: [["m_jiaolin", 1]], next: "ym_dongfu_in" }, lose: { text: "你被尸傀打出洞府。", hp: -0.4, injury: true } } },
      { id: "zhen", label: "以阵法破禁", req: { path: "zhen" }, out: { text: "你看出禁制只剩一处枢纽，轻轻一点，石门无声开启。你绕过了守尸。", xp: 80, wu: 2, next: "ym_dongfu_in" } },
      { id: "no", label: "死气太重，不进", out: { text: "潮水很快又涨了上来。" } },
    ],
  },
  {
    id: "ym_dongfu_in", region: "yunmeng", w: 0,
    text: "这是一位元婴修士的洞府。他的遗骸已化为尘土，只留下一枚玉简和一个阵盘。玉简上写着：'吾寿尽于此，道未成。后来者，莫急。'",
    opts: [
      { id: "take", label: "收下遗物", out: { text: "你对着尘土拜了三拜。", items: [["x_julingzhen", 1]], gongfa: "g_xuanshui", xp: 100, wu: 2, bio: "在云梦泽底得到一位元婴前辈的洞府传承", legacy: 2 } },
    ],
  },
  {
    id: "ym_sanxiu", region: "yunmeng", w: 6,
    text: "一个衣衫褴褛的散修拦住你：'道友，借几颗灵石，来日必还。'他的手却按在剑柄上。",
    opts: [
      { id: "give", label: "给他三十灵石", req: { ls: 30 }, out: { chance: { p: 0.4, ok: { text: "他愣了一下，红着眼把一本功法塞给你：'我不配修这个。'", ls: -30, gongfa: "g_chiyan", wu: 1 }, fail: { text: "他拿了钱就走了。", ls: -30 } } } },
      { id: "fight", label: "不给", out: { battle: "w_sanxiu", win: { text: "他败了，跪地求饶，你饶了他。", xp: 50, ls: 40 }, lose: { text: "他抢了你的灵石。", ls: -50, hp: -0.2 } } },
      { id: "trade", label: "以商人之道与他做生意", req: { sub: "shang" }, out: { text: "你看出他有一批水灵晶急着出手。低价收了。", ls: -40, items: [["m_shuijing", 4]] } },
    ],
  },
  {
    id: "ym_duwa", region: "yunmeng", w: 7,
    text: "一只磨盘大的毒蟾趴在莲叶上，周围的水都泛着绿。它背后那株寒潭莲，开得正好。",
    opts: [
      { id: "fight", label: "杀蟾取莲", out: { battle: "w_duwa", win: { text: "毒蟾翻了肚皮。寒潭莲到手。", items: [["m_hanlian", 2]], xp: 45 }, lose: { text: "你中了毒雾。", hp: -0.2, tox: 20 } } },
      { id: "sneak", label: "绕到背后摘莲", req: { stat: ["spd", 40] }, out: { chance: { p: 0.6, ok: { text: "得手了。", items: [["m_hanlian", 1]], xp: 10 }, fail: { text: "它转过头来。", battle: "w_duwa", win: { items: [["m_hanlian", 2]], xp: 45 }, lose: { hp: -0.2, tox: 20 } } } } },
    ],
  },
  // ---------- 万妖谷 ----------
  {
    id: "wy_ruko", region: "wanyao", w: 8,
    text: "谷口立着一块石碑：'人修止步'。碑后，无数双眼睛在林中看着你。",
    opts: [
      { id: "in", label: "硬闯", out: { battle: "w_langwang", win: { text: "狼王退走，谷中妖兽暂时不敢近前。", xp: 200, ls: 100, items: [["m_yaopi", 3]] }, lose: { text: "你被赶出谷外。", hp: -0.4 } } },
      { id: "hide", label: "隐匿气息潜入", req: { stat: ["spd", 80] }, out: { text: "你屏住呼吸，像一片叶子一样飘了进去。", xp: 50, st: -1 } },
      { id: "xie", label: "以邪修身份亮出魔气", req: { path: "xie" }, out: { text: "妖兽们认得这股气味——它们让开了路，但眼神里是恨。", xp: 60, flag: "wy_hated" } },
    ],
  },
  {
    id: "wy_huli", region: "wanyao", w: 7,
    text: "溪边，一个白衣女子在梳头。她回头冲你一笑：'道友，可愿与我论道一夜？'你的灵力忽然有些不受控制地涌动。",
    opts: [
      { id: "yes", label: "与她论道", out: { chance: { p: 0.3, ok: { text: "她是狐族，却真的在论道。天明时你受益良多。", wu: 3, xp: 200 }, fail: { text: "你醒来时，修为被吸走了一截。", xp: -300, battle: "w_hulimei", win: { text: "你追上她，讨回了一些。", xp: 150 }, lose: { hp: -0.3 } } } } },
      { id: "no", label: "定心，拔剑", out: { battle: "w_hulimei", win: { text: "狐媚现出原形逃了。", xp: 150, ls: 80, items: [["m_longxue", 1]] }, lose: { text: "你败了。", hp: -0.3 } } },
      { id: "fu", label: "掷出一道符", req: { path: "fu" }, out: { text: "符修的符，专破幻术。她的笑僵在脸上。", xp: 120, items: [["m_longxue", 1]], wu: 1 } },
    ],
  },
  {
    id: "wy_yaowang", region: "wanyao", w: 2, realmMin: 2,
    text: "谷底，青蟒盘在一株龙血草上。它抬起头，吐出人言：'你身上有我族的气味。'",
    opts: [
      { id: "fight", label: "战", out: { battle: "w_yaowang", win: { text: "青蟒败退。龙血草归你。", xp: 600, ls: 300, items: [["m_longxue", 3]], bio: "在万妖谷击退谷主青蟒" }, lose: { text: "你差点死在谷底。", hp: -0.6, injury: true } } },
      { id: "talk", label: "与它谈", req: { path: "shou" }, out: { text: "你们谈了一夜。它允许你采一株龙血草，并送了你一枚卵。", items: [["m_longxue", 1], ["e_leiying", 1]], xp: 300, wu: 2 } },
      { id: "run", label: "退", out: { text: "它没追。" } },
    ],
  },
  {
    id: "wy_xiexiu", region: "wanyao", w: 6,
    text: "林中传来惨叫。几个血煞宗邪修正在抽取一只幼妖的精血。其中一人转过头，看到了你。",
    opts: [
      { id: "save", label: "救那只幼妖", out: { battle: "w_xiexiu", win: { text: "邪修逃了。幼妖舔了舔你的手。", xp: 200, items: [["m_yaodan", 1]], wu: 1, flag: "wy_saved" }, lose: { text: "你寡不敌众。", hp: -0.4 } } },
      { id: "join", label: "与他们同流", req: { path: "xie" }, out: { text: "他们分了你一份精血。修为暴涨，心里却空了一块。", xp: 400, tox: 20, heart: true } },
      { id: "go", label: "当作没看见", out: { text: "惨叫渐渐弱了。", wu: -1 } },
    ],
  },
  {
    id: "wy_saved_return", region: "wanyao", w: 4, flag: "wy_saved", once: true,
    text: "那只你救过的幼妖找到了你。它已经长大了一些，嘴里叼着一枚发光的妖丹——是它父亲的。它把妖丹放在你脚边。",
    opts: [
      { id: "take", label: "收下", out: { text: "你摸了摸它的头。", items: [["m_yaodan", 3]], xp: 100, bio: "万妖谷的幼妖归还了救命之恩", legacy: 1, unflag: "wy_saved" } },
    ],
  },
  // ---------- 北冥寒渊 ----------
  {
    id: "bm_lei", region: "beiming", w: 9, once: true,
    text: "雷雪中，你看见一个修士在渡劫。第七道雷落下时，他跪了下去。第八道雷之后，雪地上只剩一把剑。",
    opts: [
      { id: "take", label: "取剑", out: { chance: { p: 0.5, ok: { text: "剑上还带着雷劫的余威。", items: [["f_leijian", 1]], xp: 300, bio: "在北冥拾得一位渡劫失败者的佩剑" }, fail: { text: "劫雷余威未散，炸伤了你。", hp: -0.4, items: [["m_leijing", 1]] } } } },
      { id: "bury", label: "为他收敛", out: { text: "你在雪地里堆了一座坟。雪停了一瞬。", wu: 3, xp: 150, legacy: 1 } },
      { id: "watch", label: "远远看着，记下劫雷的走势", out: { text: "你记住了天雷落下的节奏。下次渡劫，你会更稳。", wu: 2, flag: "trib_insight" } },
    ],
  },
  {
    id: "bm_xinmo", region: "beiming", w: 5, realmMin: 3, once: true,
    text: "寒渊深处，你看见了自己。另一个你站在冰上，笑着说：'你修了这么久，其实一直在怕。'",
    opts: [
      { id: "fight", label: "斩心魔", out: { battle: "w_xinmo", win: { text: "它散了。你的道心更稳了。", xp: 500, wu: 3, bio: "在北冥寒渊斩却心魔" }, lose: { text: "它没杀你。它只是笑。", heart: true, hp: -0.3 } } },
      { id: "talk", label: "承认它说得对", out: { text: "'是。'你说。它愣住了，然后消散。", wu: 5, xp: 300, bio: "在北冥寒渊与心魔坦诚相对", legacy: 1 } },
    ],
  },
  {
    id: "bm_xuanwu", region: "beiming", w: 2, realmMin: 3,
    text: "整座冰原忽然动了一下。不——是冰原下的东西动了。一只足有山大的玄武睁开眼，看着你这只蚂蚁。",
    opts: [
      { id: "fight", label: "战", out: { battle: "w_xuanwu", win: { text: "你没有杀它。它沉回冰下，留下一枚卵。", items: [["e_xuanwu", 1], ["m_bingpo", 2]], xp: 1200, bio: "在北冥寒渊与镇渊玄武一战" }, lose: { text: "你被一甲拍进冰里。", hp: -0.7, injury: true } } },
      { id: "bow", label: "行礼退走", out: { text: "它闭上眼。冰原静了。", wu: 1 } },
    ],
  },
  {
    id: "bm_moxiu", region: "beiming", w: 4, realmMin: 3,
    text: "血煞宗的长老正在一块万年冰魄前布阵，他要把冰魄炼化成魔兵。",
    opts: [
      { id: "fight", label: "阻止他", out: { battle: "w_moxiu", win: { text: "长老败走，冰魄归你。", items: [["m_bingpo", 2]], xp: 800, ls: 500, bio: "在北冥击退血煞宗长老" }, lose: { text: "你被魔焰灼伤。", hp: -0.5, injury: true } } },
      { id: "deal", label: "提议合作", req: { path: "xie" }, out: { text: "同道中人。他分了你一半冰魄，顺手塞了本功法。", items: [["m_bingpo", 1]], gongfa: "g_xuemo", xp: 300, heart: true } },
    ],
  },
  // ---------- 上界裂隙 ----------
  {
    id: "sj_tianbing", region: "shangjie", w: 8,
    text: "裂隙边站着一队天兵，为首者开口：'凡修止步。再进一步，斩。'",
    opts: [
      { id: "fight", label: "进一步", out: { battle: "w_tianbing", win: { text: "天兵退去。你跨过了那条线。", xp: 5000, ls: 2000, bio: "在上界裂隙击退天兵" }, lose: { text: "你被斩落裂隙。", hp: -0.6, injury: true } } },
      { id: "wait", label: "在线外打坐", out: { text: "裂隙漏出的仙气浓郁得让人窒息。", xp: 3000, st: -1 } },
    ],
  },
  {
    id: "sj_duoxian", region: "shangjie", w: 3, realmMin: 6,
    text: "一个衣袍破碎的人坐在裂隙边缘，眼里没有神采。他是从上面掉下来的。他看见你，忽然哭了：'别上去。上面……'",
    opts: [
      { id: "ask", label: "问他上面有什么", out: { text: "他没说完就疯了。你只得到三个字：'也是牢'。", wu: 5, xp: 2000, bio: "听一位堕仙说起上界的真相" } },
      { id: "fight", label: "他要动手了", out: { battle: "w_xianshi", win: { text: "堕仙倒下，手里攥着一枚印。", xp: 8000, items: [["m_xingchen", 2]], bio: "在裂隙边战胜一位堕仙" }, lose: { text: "仙终究是仙。", hp: -0.8, injury: true } } },
    ],
  },
  // ---------- 任意地区 ----------
  {
    id: "any_rain", region: "any", w: 6,
    text: "忽然下起雨来。雨里灵气格外充沛，你找了个山洞避雨打坐。",
    opts: [
      { id: "sit", label: "打坐", out: { text: "雨声里，修为悄然增长。", xp: 20, mp: 0.3 } },
      { id: "lei", label: "引雷入体", req: { elem: "雷" }, out: { chance: { p: 0.6, ok: { text: "雷入体，雷灵根欢欣雀跃。", xp: 80 }, fail: { text: "雷太猛了。", hp: -0.3 } } } },
    ],
  },
  {
    id: "any_merchant", region: "any", w: 5,
    text: "一个行脚商人在路边歇脚，货担上什么都有。",
    opts: [
      { id: "buy", label: "买几颗回血丹", req: { ls: 40 }, out: { text: "成交。", ls: -40, items: [["p_huixue", 3]] } },
      { id: "haggle", label: "讲价", req: { sub: "shang" }, out: { text: "同行见同行。他给了你成本价，还白送一张符。", ls: -20, items: [["p_huixue", 3], ["t_hu", 1]] } },
      { id: "no", label: "不买", out: { text: "商人挑担走了。" } },
    ],
  },
  {
    id: "any_ruins", region: "any", w: 4, realmMin: 1,
    text: "一片荒废的道观。香炉里有半截未燃尽的香，像是刚有人走。",
    opts: [
      { id: "search", label: "搜寻", out: { chance: { p: 0.5, ok: { text: "神像后藏着一个匣子。", items: [["p_xiqi", 1], ["m_lingcao", 3]], xp: 20 }, fail: { text: "什么都没有，只有灰。", xp: 5 } } } },
      { id: "pray", label: "上一炷香", out: { text: "你拜了三拜。心里安静了一点。", wu: 1, heartCure: true } },
    ],
  },
  // ---------- 青山村（续） ----------
  {
    id: "qs_tiejiang", region: "qingshan", w: 7,
    text: "村东的铁匠铺整夜没熄火。老铁匠把一块烧红的铁反复折叠，锤声不急不缓，像在数着什么。他抬头看你一眼：'来搭把手？'",
    opts: [
      { id: "hammer", label: "接过锤子", req: { path: "qi" }, out: { text: "你一锤下去，铁里的杂质自己跳了出来。老铁匠盯着看了很久，把剩下的料都推给你：'你拿去。这个我打不出来。'", items: [["m_tiekuang", 4]], xp: 30, wu: 1, st: -1 } },
      { id: "test", label: "试一试新成的剑", req: { path: "jian" }, out: { text: "剑很钝。可你握住剑柄时，剑脊上浮起一层极薄的白光。老铁匠说：'这是它认你。拿走吧。'", items: [["f_tiejian", 1]], xp: 25 } },
      { id: "buy", label: "买一件粗布道袍", req: { ls: 40 }, out: { text: "布很硬。他说穿久了会软。", ls: -40, items: [["f_bupao", 1]] } },
      { id: "watch", label: "看他打完这一炉", out: { text: "锤起锤落之间，你忽然懂了什么叫火候——不是热，是知道什么时候停手。", wu: 1, xp: 8 } },
    ],
  },
  {
    id: "qs_fuhai", region: "qingshan", w: 6, once: true,
    text: "集市尽头蹲着一个卖符的小孩，符纸画得歪歪扭扭。'一张三个铜板，'她说，'很灵的。'日头偏西，她的影子在地上散成了九条。",
    opts: [
      { id: "buy", label: "买一张歪符", req: { ls: 3 }, out: { text: "符纸入手是温的。走出两条街你才看清，上面画的根本不是符，是一只狐狸。", ls: -3, items: [["t_huo", 1]], xp: 4, flag: "qs_fox" } },
      { id: "fu", label: "指出符画错了", req: { path: "fu" }, out: { text: "她瞪大眼，把整摞符塞进你怀里：'那你教我。'你教了一下午。她学得快，快得让人心里发毛。", items: [["t_huo", 2]], xp: 20, wu: 1, flag: "qs_fox" } },
      { id: "follow", label: "远远跟着她回家", req: { stat: ["spd", 15] }, out: { text: "她拐进后山，越走越快，最后四肢着地跑了起来。", next: "qs_fuhai_night" } },
      { id: "no", label: "小孩子的把戏", out: { text: "你走开了。身后传来一声叹息，很老。", wu: 1 } },
    ],
  },
  {
    id: "qs_fuhai_night", region: "qingshan", w: 0, once: true,
    text: "月亮升上来时，林中石上坐着的已经不是小孩。一只白狐盘在那里，尾巴慢慢扫过落叶。它说：'你跟得很好。可惜我今晚不想吃人。'",
    opts: [
      { id: "shou", label: "蹲下，伸出手", req: { path: "shou" }, out: { text: "它嗅了嗅你的掌心，忽然把一团毛茸茸的东西推过来——是它的崽。'替我养几年，别教坏了。'", items: [["e_linghu", 1]], xp: 60, wu: 2, bio: "在青山后山替一只白狐养起了幼崽" } },
      { id: "ask", label: "问它为什么卖符", out: { text: "'因为好玩。'它说，'你们人，买什么都当真。'临走它在土上划了几笔，是画符的巧劲。", art: "a_fu_lei", xp: 45, wu: 2 } },
      { id: "fight", label: "拔剑", out: { battle: "w_huoshu", win: { text: "扑上来的其实只是一只火鼠。白狐在树上笑得直不起腰。", xp: 20, items: [["m_lingcao", 2]] }, lose: { text: "你扑了个空，摔进溪里。笑声跟了你一路。", hp: -0.1, wu: -1 } } },
    ],
  },
  {
    id: "qs_yaotian", region: "qingshan", w: 8,
    text: "山坳里有一片没人管的药田。垄还整整齐齐，主人却像走了很多年。灵草长得比人高，中间夹着几株你认不出的东西。",
    opts: [
      { id: "dan", label: "辨认那几株", req: { path: "dan" }, out: { text: "是早该枯死的入丹野种，偏偏活到今天——地底下有什么在养它们。你挖出一小块温热的土。", items: [["m_lingcao", 4], ["p_juqi", 1]], xp: 35, wu: 2 } },
      { id: "fa", label: "以术法催熟一垄", req: { path: "fa" }, out: { chance: { p: 0.65, ok: { text: "灵草在你掌下抽了三寸。你收得干干净净。", items: [["m_lingcao", 6]], xp: 25 }, fail: { text: "灵气给得太急，整垄药一夜之间开花又枯。你站在焦土上，有点惭愧。", items: [["m_lingcao", 1]], wu: -1 } } } },
      { id: "pick", label: "老实采一筐", out: { text: "你按老法子只掐叶不断根。明年它还会长。", items: [["m_lingcao", 3]], xp: 10, st: -1 } },
    ],
  },
  {
    id: "qs_shuitian", region: "qingshan", w: 7,
    text: "连下三天雨，村里的水渠塌了半截，眼看要淹田。几个汉子泡在泥里搬石头，搬不动。",
    opts: [
      { id: "ti", label: "去扛那块最大的", req: { path: "ti" }, out: { text: "石头有半人高。你扛起来的时候，围观的孩子都不说话了。夜里有人往你门口放了一坛酒。", xp: 40, ls: 15, st: -2, wu: 1 } },
      { id: "zhen", label: "改一改渠的走向", req: { path: "zhen" }, out: { text: "你在泥地上画了几笔，水自己拐了个弯。'这娃懂风水。'老人们说。你知道那不是风水。", xp: 45, ls: 20, wu: 2 } },
      { id: "shui", label: "引洪水绕开田", req: { elem: "水" }, out: { text: "水听你的话。你没让任何人看见。", xp: 30, wu: 1, st: -1 } },
      { id: "go", label: "这不关你的事", out: { text: "你走了。第二天听说淹了七亩。", xp: 2, wu: -1 } },
    ],
  },
  {
    id: "qs_zongmen", region: "qingshan", w: 5, once: true,
    text: "一位穿青云剑宗外袍的执事在晒谷场上摆了张桌子，桌上放着一枚测灵石。'凡有灵根者，皆可一试。'他说话时并不看人。",
    opts: [
      { id: "test", label: "上前按住测灵石", out: { text: "石头亮了一下，又暗下去。执事在册子上记了一笔，抬头多看你一眼：'记住你自己的名字。'", xp: 20, flag: "sect_invite", bio: "在青山村被青云剑宗的执事记下了名字" } },
      { id: "tan", label: "问宗门在哪座山", req: { sub: "tan" }, out: { text: "他愣了愣，还是画了张潦草的舆图。图上三处红点，两处旁边写着'勿近'。", xp: 25, wu: 1, flag: "sect_invite" } },
      { id: "no", label: "散修也挺好", out: { text: "他收了桌子。走前留下一句：'散修活不过一百年。'", wu: 1 } },
    ],
  },
  {
    id: "qs_luanzang", region: "qingshan", w: 5, once: true,
    text: "村外乱葬岗新添了一座没有碑的坟，土还是松的。你路过时，听见土底下有人在数数：'……七十三，七十四……'",
    opts: [
      { id: "dig", label: "把土刨开", out: { chance: { p: 0.45, ok: { text: "坑里只有一件旧道袍，袖子里掉出半张地契。数数声停了。", items: [["f_bupao", 1]], xp: 30, next: "qs_luanzang_deep" }, fail: { text: "刨到一半，一只手从土里伸出来抓住你的脚踝。你踹开它，跑出很远才敢停。", hp: -0.2, heart: true } } } },
      { id: "xie", label: "以魔气镇住它", req: { path: "xie" }, out: { text: "土下的东西安静了，转而叫你'主人'。你从它嘴里问出了一个地名。", xp: 40, tox: 8, next: "qs_luanzang_deep" } },
      { id: "listen", label: "听它数完", out: { text: "数到一百，它停了，说了句'谢谢'。坟土塌下去一寸。", wu: 2, xp: 15, heartCure: true } },
    ],
  },
  {
    id: "qs_luanzang_deep", region: "qingshan", w: 0,
    text: "地契上写的是后山一处废弃炭窑。窑里干干净净，正中摆着一只陶罐，罐口用黄纸封着，纸上的朱砂还没干透。",
    opts: [
      { id: "open", label: "揭开黄纸", out: { chance: { p: 0.55, ok: { text: "罐里是灵石，压着一本翻烂了的册子——某个炼气修士攒了一辈子的全部家当。", ls: 70, items: [["p_juqi", 2]], xp: 50, bio: "在青山后山的炭窑里取走了一个无名修士毕生的积蓄" }, fail: { text: "罐里冲出一股黑烟，钻进你的眉心。你在窑里坐到天亮才压住它。", heart: true, hp: -0.25, xp: 20 } } } },
      { id: "seal", label: "重新封好，磕个头", out: { text: "你把黄纸压平，在窑口摆了三块石头。走的时候心里很静。", wu: 3, xp: 40, heartCure: true, legacy: 1 } },
      { id: "burn", label: "一把火烧了", req: { elem: "火" }, out: { text: "陶罐炸开，灰里滚出一枚玉佩。窑塌了，你没回头。", items: [["f_yupei", 1]], xp: 35, wu: -1 } },
    ],
  },
  // ---------- 云梦泽（续） ----------
  {
    id: "ym_zongmen_men", region: "yunmeng", w: 6, flag: "sect_invite", once: true,
    text: "泽东有一座浮在水上的牌楼，'青云'两个字被水汽泡得发白。守门的弟子拦住你：'报名字。'你报了。他翻册子的手停住——你的名字真的在上面。",
    opts: [
      { id: "jian", label: "递上你的剑", req: { path: "jian" }, out: { text: "他只看了一眼剑上的缺口，就把你让进了偏院。院里有人教了你一整夜怎么把剑气收回鞘里。", art: "a_jianqi", xp: 180, wu: 2, bio: "凭一柄缺口的剑进了青云剑宗的偏院" } },
      { id: "ti", label: "先过山门那一关", req: { path: "ti" }, out: { text: "九十九级石阶，每一级都比上一级重。你走到顶时，守门弟子把水囊递过来，什么也没说。", xp: 150, items: [["p_ningyuan", 1]], st: -2 } },
      { id: "water", label: "只讨一碗水喝", out: { text: "水是泽心取的，一碗下去，肺里凉了半日。他说：'名字记着就好，宗门不一定是好去处。'", xp: 40, wu: 2, mp: 0.3, st: 1 } },
    ],
  },
  {
    id: "ym_chenchuan", region: "yunmeng", w: 6, once: true,
    text: "退潮露出半截桅杆。船身早烂了，舱口却还封着，封条上的朱砂鲜红——像是昨天才贴上去的。",
    opts: [
      { id: "fu", label: "读那道封条", req: { path: "fu" }, out: { text: "是一道镇物符，不是镇人的。写符的人怕的是舱里的东西出来，不是怕人进去。你还是揭了。", xp: 50, wu: 1, next: "ym_chenchuan_cang" } },
      { id: "tan", label: "从破洞钻进去", req: { sub: "tan" }, hidden: true, out: { text: "船底有个人头大的洞，边缘很光滑——被人从里面磨了很多年。", xp: 45, next: "ym_chenchuan_cang" } },
      { id: "dive", label: "潜到船底摸一圈", out: { chance: { p: 0.6, ok: { text: "船底积着一层水灵晶，被泥半埋着。", items: [["m_shuijing", 3]], xp: 35 }, fail: { text: "水下有东西擦着你的小腿游过去。你浮上来时腿在抖。", hp: -0.1, xp: 10 } } } },
      { id: "away", label: "封条鲜红，不吉利", out: { text: "潮水又漫了上来。你记住了这个位置。", xp: 8 } },
    ],
  },
  {
    id: "ym_chenchuan_cang", region: "yunmeng", w: 0, once: true,
    text: "舱里没有水。一船的货捆得整整齐齐，绳还没朽。最里面坐着一个人，衣服是新的，脸是干的——他保持着记账的姿势，已经很多年了。",
    opts: [
      { id: "qi", label: "看他手里的算盘", req: { path: "qi" }, out: { text: "算珠是玄铁的，串珠的线是他自己的头发。你把算盘接过来时，它轻轻响了一声，像松了口气。", items: [["f_lingzhu", 1], ["m_jiaolin", 1]], xp: 160, wu: 2, bio: "在云梦泽的沉船里接过了一位商修的算盘" } },
      { id: "book", label: "翻他的账本", out: { text: "最后一页记着：'欠泽中某物三条命，已还两条。'再往后是空的。", wu: 3, xp: 90, items: [["m_shuijing", 2]] } },
      { id: "goods", label: "货舱里搬两箱", out: { chance: { p: 0.5, ok: { text: "两箱寒潭莲，保存得像刚采的。", items: [["m_hanlian", 3]], xp: 60 }, fail: { text: "箱子一动就散了，里面的东西早化成了泥。舱门在你背后合上过一次。", hp: -0.15, xp: 25, heart: true } } } },
    ],
  },
  {
    id: "ym_zuihan", region: "yunmeng", w: 5, once: true,
    text: "渡口的酒摊上趴着个醉汉，衣襟上全是酒渍。他忽然抬头对你说：'你的丹田左下角有个结，三年前留下的，对不对？'说完又趴回去了。",
    opts: [
      { id: "ask", label: "扶他起来细问", out: { text: "他醒了一半，用手指蘸酒在桌上画了个圈：'去这儿。我以前住那。'画完就睡死了。桌上的水痕不散。", xp: 60, wu: 2, next: "ym_zuihan_an" } },
      { id: "buy", label: "再请他一坛", req: { ls: 20 }, out: { text: "他一口气喝完，眼神清了一瞬：'金丹碎了的人，喝什么都不醉。'那一瞬里他替你把结拆了。", ls: -20, xp: 120, mp: 0.5, wu: 3, next: "ym_zuihan_an" } },
      { id: "away", label: "醉话罢了", out: { text: "你走了几步，忍不住摸了摸丹田。左下角，确实有个结。", wu: 1, xp: 10 } },
    ],
  },
  {
    id: "ym_zuihan_an", region: "yunmeng", w: 0, once: true,
    text: "酒渍画的地方是泽西一座孤岛。岛上只有一间草庐，庐里挂着一件洗得发白的道袍，袍子的品阶你认不出——但你的灵觉在发抖。桌上压着一张纸：'谁来了都行，别打扫。'",
    opts: [
      { id: "sit", label: "在庐里坐一夜", out: { text: "什么都没发生。可天亮时你发现自己的呼吸变了——变得和这间屋子一样慢。", xp: 200, wu: 3, mp: 0.6, bio: "在云梦泽孤岛的草庐里坐了一夜" } },
      { id: "robe", label: "取下那件道袍", out: { chance: { p: 0.35, ok: { text: "袍子入手极轻。袖口内侧绣着一行小字，是一门凝元的法子。", gongfa: "g_xuanshui", items: [["f_jiaolinjia", 1]], xp: 150, legacy: 1 }, fail: { text: "袍子一碰就化成了灰，扑了你一脸。你在灰里坐了很久。", xp: 40, wu: 1 } } } },
      { id: "clean", label: "还是打扫了一下", out: { text: "你扫完地，把纸压回原处。回渡口时，醉汉的摊子空了，桌上留着一坛没开封的酒和两枚丹。", items: [["p_ningyuan", 2]], xp: 100, wu: 2, heartCure: true } },
    ],
  },
  {
    id: "ym_shangren", region: "yunmeng", w: 6,
    text: "一个行商蹲在滩涂上数货，数着数着就不数了。他的船昨夜漏了，半船水灵晶沉在泽里，捞不上来。'道友，'他说，'你会水吗？'",
    opts: [
      { id: "shang", label: "谈个分成", req: { sub: "shang" }, out: { text: "三七分，你三。他一口答应——你于是知道沉的不止是水灵晶。捞上来时，箱子底下还压着一只没有钥匙的小匣。", ls: 90, items: [["m_shuijing", 3]], xp: 70, flag: "shang_debt" } },
      { id: "help", label: "白帮他捞", out: { text: "你捞了整整一天。他把仅剩的干粮塞给你，记下了你的名字：'算我欠你一次。'", xp: 60, st: -1, ls: 20, wu: 1, flag: "shang_debt" } },
      { id: "buy", label: "低价把货全吃下", req: { ls: 60 }, out: { text: "他没还价，收钱时手在抖。你转手就能翻三倍——你也确实翻了。", ls: -60, items: [["m_shuijing", 5], ["m_hanlian", 1]], xp: 30, wu: -1 } },
    ],
  },
  {
    id: "ym_wuqi", region: "yunmeng", w: 9,
    text: "雾在你面前聚成了一个人形，和你一样高，也做着和你一样的动作。你抬手，它抬手。你不动，它先动了。",
    opts: [
      { id: "fight", label: "先出手", out: { battle: "w_wuqi", win: { text: "雾散了，落下一地水珠，珠子里裹着晶。", items: [["m_shuijing", 2]], xp: 90, ls: 40 }, lose: { text: "你打中的全是雾。它打中的全是你。", hp: -0.25 } } },
      { id: "fa", label: "以术法搅乱雾气", req: { path: "fa" }, out: { text: "你不打它，只是把周围的水气抽干。人形塌了下去，剩下一颗指甲大的核。", items: [["m_shuijing", 3]], xp: 110, wu: 1 } },
      { id: "xie", label: "把它吞了", req: { path: "xie" }, out: { text: "雾从你的七窍钻进去，凉得像铁。修为涨了一截，此后你照镜子总觉得慢半拍。", xp: 190, tox: 12, heart: true } },
      { id: "still", label: "站着不动，看它怎么办", out: { text: "它也站着。天黑了，它先散了。你什么都没得到，除了一点说不清的东西。", wu: 2, xp: 30 } },
    ],
  },
  {
    id: "ym_duishou", region: "yunmeng", w: 5, once: true,
    text: "你伸手去够那株寒潭莲时，另一只手同时握住了它。对面是个和你差不多年纪的散修，眉骨上有一道旧疤。他笑了笑：'一人一半？'",
    opts: [
      { id: "split", label: "一人一半", out: { text: "他把根须那半让给了你——那半更值钱。'记住，我叫顾寒。'他说完就走了，没回头。", items: [["m_hanlian", 1]], xp: 70, wu: 1, flag: "rival", bio: "在云梦泽与散修顾寒分了一株寒潭莲" } },
      { id: "fight", label: "凭本事拿", out: { battle: "w_sanxiu", win: { text: "他倒在泥里，还在笑：'下次。'莲归你了。", items: [["m_hanlian", 2]], xp: 130, ls: 50, flag: "rival" }, lose: { text: "他把你按进水里，又把你捞起来。'别死。'他说，'死了就不好玩了。'", hp: -0.3, flag: "rival" } } },
      { id: "give", label: "整株让给他", out: { text: "他愣了很久，从怀里摸出一张符塞给你：'我不欠人东西。'", items: [["t_hu", 1]], xp: 50, wu: 2, flag: "rival" } },
    ],
  },
  // ---------- 万妖谷（续） ----------
  {
    id: "wy_shitou", region: "wanyao", w: 8,
    text: "谷中有一片乱石岗，石头的形状都很像人。你走过第三块时，它转过了'头'。",
    opts: [
      { id: "fight", label: "先下手", out: { battle: "w_shitou", win: { text: "石人碎了，碎块里嵌着几缕金线。", items: [["m_xuanjin", 2]], xp: 260, ls: 120 }, lose: { text: "它一拳没打中你，只是砸在你脚边。地裂了三尺。", hp: -0.35 } } },
      { id: "qi", label: "看石头里的纹路", req: { path: "qi" }, out: { text: "玄金在石头里长得像树的年轮。你顺着纹路敲，石人没醒，金子自己掉了出来。", items: [["m_xuanjin", 3]], xp: 200, wu: 2 } },
      { id: "ti", label: "以肉身硬接一拳", req: { path: "ti" }, out: { chance: { p: 0.6, ok: { text: "拳头砸在你胸口，你退了七步，没倒。石人愣住，然后自己坐了回去——像是认输了。", xp: 320, wu: 2, art: "a_iron" }, fail: { text: "你的肋骨响了三声。它还站着。", hp: -0.45, injury: true } } } },
      { id: "quiet", label: "屏息绕过去", req: { stat: ["spd", 75] }, out: { text: "你走得比落叶还轻。身后的石头一块也没醒。", xp: 100, st: -1 } },
    ],
  },
  {
    id: "wy_yaoshi", region: "wanyao", w: 7,
    text: "谷腹的凹地里居然有个市集。摊主全是化了半形的妖，货摆在石板上，明码标价——用的是人族的记法。一头老鹿看着你：'人？稀客。买什么？'",
    opts: [
      { id: "dan", label: "摆摊卖你的丹", req: { path: "dan" }, out: { text: "妖不会炼丹，也最缺丹。半日你就卖空了，价钱高得离谱。老鹿临走扔给你一句：'下次多带点。'", ls: 400, items: [["m_longxue", 1]], xp: 220, flag: "wy_market" } },
      { id: "shang", label: "换，不用灵石", req: { sub: "shang" }, out: { text: "你用三张人族的舆图换了它们眼里没用的东西。它们很高兴，你更高兴。", items: [["m_yaodan", 2], ["m_xuanjin", 1]], xp: 180, flag: "wy_market" } },
      { id: "buy", label: "花灵石买妖丹", req: { ls: 200 }, out: { text: "老鹿咬了咬灵石，才把妖丹推过来。'人族的钱，硌牙。'", ls: -200, items: [["m_yaodan", 2]], xp: 60 } },
      { id: "look", label: "只看不买", out: { text: "你看了一圈。它们的日子和人族的坊市没什么不同——也有赊账的，也有吵架的。", wu: 2, xp: 100 } },
    ],
  },
  {
    id: "wy_leiniao", region: "wanyao", w: 6, once: true,
    text: "谷中最高的那棵树上有电光在闪。树下落满了羽毛，捡起来会麻手。抬头看，枝桠间架着一个巢，巢里没有大鸟。",
    opts: [
      { id: "climb", label: "爬上去看看", req: { stat: ["spd", 80] }, out: { text: "你贴着树皮爬到一半，风忽然停了——鸟回来了，正悬在你头顶三尺。", next: "wy_leiniao_nest" } },
      { id: "wait", label: "藏起来等它回来", out: { text: "等到黄昏，一道白光落进巢里。它没发现你。", xp: 120, next: "wy_leiniao_nest" } },
      { id: "feather", label: "只捡羽毛就走", out: { text: "你捡了满怀的羽毛。手麻了三天，但活着。", items: [["m_yaopi", 4]], xp: 90 } },
    ],
  },
  {
    id: "wy_leiniao_nest", region: "wanyao", w: 0, once: true,
    text: "巢里铺着一层焦黑的枝条，正中卧着一枚蛋，蛋壳上有电光在爬。雷翼鸟停在你对面，翅膀半张，没有立刻扑上来——它在等你先动。",
    opts: [
      { id: "shou", label: "先把手背过身后", req: { path: "shou" }, out: { chance: { p: 0.5, ok: { text: "你退了半步，蹲下。它歪了歪头，忽然自己把蛋往你这边拨了拨——巢边有另外三枚，都碎了。", items: [["e_leiying", 1]], xp: 400, wu: 3, bio: "在万妖谷的高树上被一只雷翼鸟托付了最后一枚蛋" }, fail: { text: "它到底还是不放心，衔起蛋飞走了。你在巢里坐了一会儿，闻到烧焦的味道。", xp: 120, wu: 1 } } } },
      { id: "fight", label: "抢", out: { battle: "w_leiniao", win: { text: "鸟落在枝上，翅膀垂着，看着你把蛋拿走。它没有追。", items: [["m_yaodan", 1]], xp: 380, ls: 160, wu: -1 }, lose: { text: "一道雷把你劈下了树。你在树下躺到天亮。", hp: -0.5, injury: true } } },
      { id: "leave", label: "顺着树滑下去", out: { text: "你什么都没拿。下到地面时，一根带电的羽毛正好落在你肩上。", items: [["m_yaopi", 2]], xp: 150, wu: 2 } },
    ],
  },
  {
    id: "wy_zhengu", region: "wanyao", w: 5, once: true,
    text: "谷底一片开阔地上立着九根石柱，柱头朝里，围成一个圈。圈内寸草不生，圈外的草长得比人高。风到这里会绕开。",
    opts: [
      { id: "zhen", label: "看这阵的门在哪", req: { path: "zhen" }, out: { text: "这不是困阵，是养阵——有人把什么东西养在里面，养了很久。你从生门走了进去。", xp: 240, wu: 2, next: "wy_zhengu_in" } },
      { id: "fa", label: "以术法轰开一道口子", req: { path: "fa" }, out: { chance: { p: 0.55, ok: { text: "石柱裂了一根，阵光晃了晃，露出一条缝。你侧身钻了进去。", xp: 200, next: "wy_zhengu_in" }, fail: { text: "术法被原样弹了回来。你在草里躺了半晌，鼻血流个不停。", hp: -0.3, xp: 60 } } } },
      { id: "walk", label: "硬着头皮走进去", out: { chance: { p: 0.4, ok: { text: "你走了七步，第八步落下时，人已经在圈内了。", xp: 150, next: "wy_zhengu_in" }, fail: { text: "你绕了一个时辰，发现自己一直在原地。", st: -2, xp: 40 } } } },
    ],
  },
  {
    id: "wy_zhengu_in", region: "wanyao", w: 0, once: true,
    text: "圈内只有一口井，井里没有水，是一道往下的石阶。阶底坐着一个人，穿的是人族的道袍，背对着你。他说话时，声音是从井壁四面传来的：'终于来了个活的。'",
    opts: [
      { id: "talk", label: "问他在这多久了", out: { text: "'我在等这九根柱子朽掉。'他说，'还差两百年。'他教了你一套等待的法子——他说那才是修行。", xp: 450, wu: 3, art: "a_zhen_kun", bio: "在万妖谷的九柱阵底听一个活人讲了两百年" } },
      { id: "search", label: "沿井壁摸一圈", out: { chance: { p: 0.35, ok: { text: "壁上刻满了字，最后一段是一门功法。你抄了下来。背后的人没有回头。", gongfa: "g_wuxing", xp: 400, legacy: 1 }, fail: { text: "壁上全是抓痕，一层压一层。你数到第三百道就停了。", xp: 150, heart: true } } } },
      { id: "free", label: "试着把他带出去", out: { text: "你伸手扶他，手穿了过去。他叹了口气：'我要是能走，还用等柱子朽？'他把一枚妖丹推到你脚边。'替我出去。'", items: [["m_yaodan", 2]], xp: 300, wu: 2, heartCure: true } },
    ],
  },
  {
    id: "wy_rival2", region: "wanyao", w: 5, flag: "rival",
    text: "赤火猿的尸体还在冒烟。顾寒坐在旁边啃干粮，眉骨的疤比上次深了。'又是你。'他把半块饼扔过来，'这猴子归你了，我搬不动。'",
    opts: [
      { id: "jian", label: "和他比一剑", req: { path: "jian" }, out: { chance: { p: 0.5, ok: { text: "三十招后他收了剑：'你快了。'他把自己的剑诀口述了一遍，说反正他也用不惯。", art: "a_yujian", xp: 500, wu: 2, bio: "在万妖谷与顾寒比剑，胜了半招" }, fail: { text: "第九招你的剑就飞了。他捡回来递给你，柄朝着你。'再练。'", xp: 250, wu: 2 } } } },
      { id: "share", label: "接过饼，一起吃", out: { text: "你们聊到天黑。他说他师门没了，就剩他一个。走时他说：'下次别死。'", items: [["m_yaodan", 1], ["m_longxue", 1]], xp: 300, wu: 2, st: 2 } },
      { id: "rob", label: "趁他吃饭偷袭", out: { battle: "w_xiexiu", win: { text: "他没还手，是他身后那个人替他挡的——你这才知道他一直有同伴。他看着你，什么也没说，走了。", xp: 400, ls: 200, wu: -2, heart: true, unflag: "rival" }, lose: { text: "刀架在你脖子上，又拿开了。'我当没发生。'他说。这句比杀了你还难受。", hp: -0.4, heart: true } } },
    ],
  },
  {
    id: "wy_shangren_hui", region: "wanyao", w: 4, flag: "shang_debt", once: true,
    text: "妖市边上支着一个人族的摊子，摊主看见你就站了起来——是云梦泽那个漏了船的行商。他现在的货堆到了腰高。'我说过我欠你一次。'",
    opts: [
      { id: "take", label: "让他还这一次", out: { text: "他从箱底捧出一个匣子：'这是我压箱底的。'匣子里是一枚结丹用的丹药，和一张他自己画的谷内舆图。", items: [["p_jindan", 1]], xp: 350, unflag: "shang_debt", bio: "云梦泽那个行商在万妖谷还清了欠你的那一次" } },
      { id: "trade", label: "只谈生意，不谈人情", req: { sub: "shang" }, out: { text: "他笑了：'你适合做这行。'你们做了三笔，笔笔都赚，他也赚。人情留着，比用掉值钱。", ls: 500, items: [["m_longxue", 1]], xp: 300 } },
      { id: "waive", label: "算了，不用还", out: { text: "他红了脸，硬塞给你两株龙血草。'那我更欠你了。'", items: [["m_longxue", 2]], xp: 250, wu: 2, unflag: "shang_debt" } },
    ],
  },
  {
    id: "wy_huoyuan", region: "wanyao", w: 8,
    text: "山壁被烧成了琉璃色。一只赤火猿蹲在崖顶，正把烧红的石头一块一块往嘴里塞。它看见你，把手里那块递了过来。",
    opts: [
      { id: "eat", label: "接过来，咬一口", req: { elem: "火" }, out: { text: "石头在你嘴里化成了一线热流。猿高兴得直捶胸口，又抱来一堆。", items: [["m_yaodan", 1], ["m_xuanjin", 1]], xp: 380, wu: 2 } },
      { id: "fight", label: "拒绝，然后开打", out: { battle: "w_huoyuan", win: { text: "猿倒下前把那块石头塞进了你手里。它到最后都以为你只是不好意思。", items: [["m_yaodan", 1]], xp: 300, ls: 150, wu: -1 }, lose: { text: "你被一拳打下山崖，挂在树上。它还在崖顶等你。", hp: -0.4 } } },
      { id: "bow", label: "摆摆手，抱拳", out: { text: "它看懂了，把石头收了回去，让开半条路。你从它身边走过时，热得像走过一座炉。", xp: 160, wu: 1 } },
    ],
  },
  // ---------- 北冥寒渊（续） ----------
  {
    id: "bm_bingcheng", region: "beiming", w: 6, once: true,
    text: "风雪停的那一刻，你看见了冰层底下的东西：屋脊、街道、一座塔的尖顶。整座城冻在几十丈深的冰里，灯还亮着。",
    opts: [
      { id: "zhen", label: "找冰面上的阵眼", req: { path: "zhen" }, out: { text: "城不是被冻住的——是有人把它整个封了进去，封得极讲究。阵眼在塔尖正上方，只留了一个人的位置。", xp: 700, wu: 2, next: "bm_bingcheng_in" } },
      { id: "dig", label: "凿冰下去", out: { chance: { p: 0.45, ok: { text: "你凿了三天三夜。最后一层冰是自己裂开的，像有人从里面推了一把。", xp: 500, st: -3, next: "bm_bingcheng_in" }, fail: { text: "冰缝合得比你凿得快。第三天你抬头，发现自己凿出的洞已经不见了。", hp: -0.3, st: -3, xp: 200 } } } },
      { id: "look", label: "只在冰面上走一圈", out: { text: "你踩着屋顶走过整座城。有一扇窗底下，冰里冻着一个仰头看你的孩子。", wu: 3, xp: 400, heart: true } },
    ],
  },
  {
    id: "bm_bingcheng_in", region: "beiming", w: 0, once: true,
    text: "城里没有风，也没有人。灯是冰做的，光是冷的。街角的铺子门开着，柜上还摊着没做完的活——一件甲，缺最后一片。",
    opts: [
      { id: "qi", label: "把最后一片补上", req: { path: "qi" }, out: { text: "你用自己的料补齐了它。甲合拢的一瞬，满城的灯同时暗了一下，又亮起来——像是有人点了点头。", items: [["f_bingjia", 1]], xp: 1200, wu: 3, bio: "在北冥冰城里替一位陌生匠人补完了最后一片甲" } },
      { id: "tower", label: "去塔里看看", out: { chance: { p: 0.3, ok: { text: "塔顶只有一卷经，纸是暖的。你读到一半，外面的雪就下了三年。", gongfa: "g_fanxu", xp: 1000, legacy: 1 }, fail: { text: "塔梯走到一半就没有了。你在断口处坐了很久，下面是整座亮着灯的空城。", xp: 400, wu: 2 } } } },
      { id: "take", label: "沿街收拾些东西", out: { text: "冰魄堆在墙根，像别人家没扫的雪。你只拿了背得动的。", items: [["m_bingpo", 2], ["m_xuanyuan", 1]], xp: 600, ls: 400 } },
    ],
  },
  {
    id: "bm_rival3", region: "beiming", w: 5, flag: "rival", once: true,
    text: "雪地里插着一把剑，剑下压着一个人。顾寒的半边身子已经冻硬了，看见你，他先笑：'巧了。'他的丹田是空的——他刚替别人挡了一道劫雷。",
    opts: [
      { id: "save", label: "把定心丹喂给他", req: { item: ["p_dingxin", 1] }, out: { text: "他缓过一口气，把剑推给你：'先放你那儿。'你知道他的意思——他觉得自己拿不回去了。", items: [["p_dingxin", -1], ["f_leijian", 1]], xp: 900, wu: 3, bio: "在北冥的雪里救回了顾寒一条命", legacy: 1 } },
      { id: "jian", label: "拔起那把剑", req: { path: "jian" }, out: { text: "剑很沉。他躺在雪里看你握剑的姿势，纠正了最后一处：'手腕再低半寸。'说完就睡着了。醒来时他自己爬起来走了。", art: "a_yujian", xp: 800, wu: 2 } },
      { id: "go", label: "雪太大，先顾自己", out: { text: "你走出百步回头，雪已经把他埋了一半。后来你再没在任何地方见过他。", xp: 300, wu: -2, heart: true, unflag: "rival" } },
    ],
  },
  {
    id: "bm_leiling", region: "beiming", w: 8,
    text: "一团雷光贴着冰面滑过来，停在你三步外，忽然分成了九道。它们排成一圈，像在掂量你渡过几次劫。",
    opts: [
      { id: "fu", label: "以符引它们下来", req: { path: "fu" }, out: { text: "九道雷全落在你画的符纸上，纸没烧。你把这张纸叠好收进怀里，从此渡劫时心里有底。", items: [["t_bilei", 1], ["m_leijing", 1]], xp: 900, wu: 2, flag: "trib_insight" } },
      { id: "fa", label: "以法力硬接一道", req: { path: "fa" }, out: { chance: { p: 0.55, ok: { text: "一道雷在你掌心炸开，又被你揉圆了。剩下八道退了回去。", xp: 1100, art: "a_thunder", mp: -0.4 }, fail: { text: "九道一起来了。你在冰上躺了半日，头发全白，又慢慢黑回去。", hp: -0.5, injury: true, xp: 300 } } } },
      { id: "fight", label: "拔剑", out: { battle: "w_leiling", win: { text: "最后一道雷散在你脚边，留下一截焦黑的木头。", items: [["m_leijing", 1]], xp: 800, ls: 500 }, lose: { text: "你被劈得跪下了。它们绕着你转了三圈，走了。", hp: -0.45 } } },
      { id: "still", label: "站着，不还手", out: { text: "雷没有落。你站到天黑，它们一道一道熄了。你忽然明白劫从来不是冲着人来的。", wu: 3, xp: 600 } },
    ],
  },
  {
    id: "bm_xuejiao", region: "beiming", w: 6,
    text: "冰湖裂开，一条雪蛟探出上半身。它没有攻击的意思——它的鳞下卡着半截断矛，伤口结了冰，化不掉。",
    opts: [
      { id: "shou", label: "示意它低头", req: { path: "shou" }, out: { text: "它趴下来，把伤口凑到你面前。你拔矛的时候它一声没吭。血是热的，落在冰上冒烟。", items: [["m_xuanyuan", 1], ["m_bingpo", 1]], xp: 800, wu: 3, bio: "替北冥的一条雪蛟拔出了鳞下的断矛" } },
      { id: "dan", label: "用药替它化冰", req: { path: "dan" }, out: { text: "你把三味药嚼碎了敷上去。它盯着你看了很久，转身潜下去，衔上来一枚在渊底不知泡了多少年的丹。", items: [["p_tianyuan", 1]], xp: 900, wu: 2 } },
      { id: "fight", label: "趁它带伤动手", out: { battle: "w_xuejiao", win: { text: "它沉下去时看了你一眼。那半截断矛掉在冰上，和你的剑是同一种铁。", items: [["m_bingpo", 2], ["m_xuanyuan", 1]], xp: 1000, ls: 600, wu: -1 }, lose: { text: "带伤的蛟也是蛟。你被尾巴扫进了冰窟窿。", hp: -0.55, injury: true } } },
    ],
  },
  {
    id: "bm_jiaoyin", region: "beiming", w: 7,
    text: "雪地上有一行脚印，很新，通向渊心。走了半个时辰你才发现不对——脚印只有去的，没有回的，而且越往前越浅，最后变成了两个坑。",
    opts: [
      { id: "ti", label: "顺着走到尽头", req: { path: "ti" }, out: { text: "尽头是一块背风的岩，岩下坐着一具没倒的尸体，怀里抱着一个还在冒热气的铁盒。你替他合上眼，拿走了盒子。", items: [["m_xuanyuan", 2], ["p_dingxin", 1]], xp: 850, wu: 2, st: -2 } },
      { id: "tan", label: "先标记退路", req: { sub: "tan" }, hidden: true, out: { text: "你每走五十步就插一根雪杖。回头时风雪已起——十七根雪杖，一根不少地把你带了回来。", items: [["m_bingpo", 1]], xp: 700, wu: 2 } },
      { id: "back", label: "原路退回去", out: { text: "你退到第三个脚印时，发现自己的脚印也开始变浅了。", xp: 350, wu: 1 } },
    ],
  },
  {
    id: "bm_bingfeng", region: "beiming", w: 6,
    text: "一道冰缝横在面前，宽三丈，深不见底。缝的另一侧插着一面旗，旗上的字被雪磨没了，只剩下一个'归'字。",
    opts: [
      { id: "jump", label: "助跑跳过去", req: { stat: ["spd", 120] }, out: { text: "你在半空中听见底下传来风声，像很多人在同时呼气。落地时旗杆晃了晃，倒向你这边。", items: [["m_bingpo", 2]], xp: 700, st: -1 } },
      { id: "zhen", label: "在缝上布一道桥", req: { path: "zhen" }, out: { text: "你以四块冰魄为角，架了一道只能走一次的桥。走到中间时，你看清了缝底——底下也插着旗，很多面。", items: [["m_bingpo", 1], ["m_xuanyuan", 1]], xp: 900, wu: 3 } },
      { id: "down", label: "顺着缝壁爬下去", out: { chance: { p: 0.4, ok: { text: "缝底是一片背风的谷，长着北冥不该有的草。你采了一把，草在你怀里没有枯。", items: [["m_xuanyuan", 2], ["p_tianyuan", 1]], xp: 1000 }, fail: { text: "爬到一半冰壁塌了。你摔在半截凸岩上，肋骨断了两根，爬上来用了两天。", hp: -0.5, injury: true, xp: 300 } } } },
    ],
  },
  {
    id: "bm_deng", region: "beiming", w: 5, once: true,
    text: "雪夜里有一盏灯，悬在半空，不动。走近了才看清是一间小屋的窗——屋在雪里埋了大半，只露出这一扇窗。屋里没人，炉上煮着水，水刚开。",
    opts: [
      { id: "sit", label: "进去，坐下等主人", out: { text: "你等到水烧干，又添了一瓢。天亮时屋没了，只有你和一盏空灯坐在雪地里。可你的心魔没了。", xp: 600, wu: 3, heartCure: true, mp: 0.5 } },
      { id: "fire", label: "替他把火添上", out: { text: "你劈了柴，把炉子填满。走时你把门带上了。三日后你路过，灯还亮着，柴堆里多了一枚丹。", items: [["p_dingxin", 1]], xp: 500, wu: 2, legacy: 1 } },
      { id: "search", label: "屋里翻一翻", out: { chance: { p: 0.35, ok: { text: "床下压着一个阵盘，做工极老。你拿走时炉火灭了。", items: [["x_julingzhen2", 1]], xp: 800 }, fail: { text: "什么都没有。你转身时，窗上映出一个坐在炉边的影子——屋里明明没人。", heart: true, xp: 300 } } } },
    ],
  },
  // ---------- 上界裂隙（续） ----------
  {
    id: "sj_qiao", region: "shangjie", w: 6, realmMin: 5, once: true,
    text: "裂隙中央横着一道桥。桥面是断的，断口整整齐齐，像被人一刀切下——切口那侧，还留着半只没迈完的脚印。",
    opts: [
      { id: "zhen", label: "把断口接起来", req: { path: "zhen" }, out: { text: "你以星辰砂为引，在虚空里补了七尺。补完你才发现，桥不是断的——是有人特意切断的，切得很轻，怕伤着桥。", xp: 4000, wu: 3, next: "sj_qiao_end" } },
      { id: "ti", label: "跳过去", req: { path: "ti" }, out: { chance: { p: 0.6, ok: { text: "你落在对岸，膝盖没弯。回头看，断口比你跳之前又宽了一寸。", xp: 3500, next: "sj_qiao_end" }, fail: { text: "半空中一股力把你推了回来。不是恶意——像大人拦住往火边走的孩子。", hp: -0.4, xp: 2000 } } } },
      { id: "rush", label: "趁裂口未合冲过去", req: { stat: ["spd", 200] }, out: { text: "你冲过断口时，虚空在你脚下合拢又裂开。回头看，桥面比刚才短了一截——它一直在缩。", xp: 4500, st: -1, next: "sj_qiao_end" } },
      { id: "look", label: "在断口坐一会儿", out: { text: "断口下面什么都没有，连黑都没有。你坐了很久，什么也没想明白，只是不那么怕了。", xp: 2500, wu: 3, heartCure: true } },
    ],
  },
  {
    id: "sj_qiao_end", region: "shangjie", w: 0, once: true,
    text: "桥的那头是一间守桥的小屋，屋里的人已经走了很久，桌上留着一枚印和一行字：'桥是我断的。上面的人下来过一次，我拦不住第二次。谁接了这枚印，谁替我拦。'",
    opts: [
      { id: "take", label: "接下这枚印", out: { text: "印一入手，你就听见了裂隙那侧的声音——很多，很远，很有耐心。你把印收进怀里，坐到了他坐过的位置上。", items: [["f_xianyin", 1]], xp: 7500, wu: 3, bio: "在上界裂隙接下了守桥人的印", legacy: 1 } },
      { id: "read", label: "只把那行字抄下", out: { text: "你抄完就走了。走出很远还在想：他拦了多久，才等到有人经过。", xp: 4000, wu: 3, items: [["m_xianlu", 1]] } },
      { id: "burn", label: "把屋子烧了", req: { path: "xie" }, out: { text: "火在虚空里烧得很安静。印在灰里熔成一滴，被你收走。你替谁挡下了什么，从此没人知道。", items: [["m_xingchen", 2]], xp: 6000, heart: true, wu: -2 } },
    ],
  },
  {
    id: "sj_xingling", region: "shangjie", w: 8,
    text: "一片星灵浮在裂隙口，像一群不肯散的萤火。它们围着一样东西转——那东西的形状，是一柄没有铸完的剑。",
    opts: [
      { id: "qi", label: "把这柄剑铸完", req: { path: "qi" }, out: { chance: { p: 0.5, ok: { text: "你用了七日。最后一锤落下时，所有星灵一起熄灭了——它们本来就是为了等这一锤。", items: [["f_xingjian", 1]], xp: 8000, wu: 3, bio: "在上界裂隙铸完了一柄等了很久的剑" }, fail: { text: "剑坯在你手里碎了。星灵没有散，只是暗了下去，继续等下一个人。", items: [["m_xingchen", 2]], xp: 3000, wu: 2 } } } },
      { id: "fa", label: "以术法引星灵入体", req: { path: "fa" }, out: { text: "星光顺着经脉走了一圈，走过的地方都亮了一下。你的术法从此带着一点不属于此界的味道。", art: "a_star", xp: 5000, mp: 0.8 } },
      { id: "fight", label: "驱散它们", out: { battle: "w_xingling", win: { text: "最后一点星光落在剑坯上，剑坯灭了。你拿走了一把星辰砂。", items: [["m_xingchen", 2]], xp: 4500, ls: 3000 }, lose: { text: "它们没有伤你，只是把你推出了裂隙口。", hp: -0.5 } } },
    ],
  },
  {
    id: "sj_gumo", region: "shangjie", w: 3, realmMin: 6,
    text: "裂隙深处的封印裂了一道缝，缝里伸出一只手，手上戴着的镣铐比你见过的任何法宝都精致。一个声音说：'替我打开，我给你半个上界。'",
    opts: [
      { id: "jian", label: "一剑斩向那只手", req: { path: "jian" }, out: { battle: "w_gumo", win: { text: "手缩了回去。封印重新合拢时，你听见里面在笑：'再过一千年。'", items: [["m_xianlu", 2]], xp: 8000, ls: 6000, bio: "在上界裂隙一剑逼退了上古魔神的残念" }, lose: { text: "你被那只手按在虚空里，按了很久。它松手时，你已经忘了自己叫什么。", hp: -0.8, injury: true, heart: true } } },
      { id: "xie", label: "跟它谈条件", req: { path: "xie" }, out: { text: "它给了你一门功法，作为定金。你没有开封印——你只是把定金收下了。它似乎并不着急。", gongfa: "g_xuemo", xp: 6000, tox: 30, heart: true, flag: "gumo_deal" } },
      { id: "seal", label: "替它补上封印", req: { path: "fu" }, out: { text: "你贴了七十二张符。最后一张贴上时，里面安静了。你在原地站到手抖，才敢转身。", items: [["t_tianwang", 1], ["m_xukong", 1]], xp: 7000, wu: 3, legacy: 1 } },
      { id: "back", label: "退开，一步不进", out: { text: "你退了三步，那只手就停了。它没有再说话。你走出很远，还听得见镣铐轻轻碰在一起的声音。", xp: 2500, wu: 2 } },
    ],
  },
  {
    id: "sj_luan", region: "shangjie", w: 5, realmMin: 5,
    text: "一枚卵卡在两块虚空石之间，壳上有裂纹，裂纹里透出的光每隔一息亮一次——像心跳，很慢，快停了。",
    opts: [
      { id: "shou", label: "把它捂进怀里", req: { path: "shou" }, out: { chance: { p: 0.45, ok: { text: "你用体温焐了三天三夜。第四天早上，壳里的心跳和你的合上了拍。", items: [["e_qilin", 1]], xp: 7000, wu: 3, bio: "在上界裂隙用三天体温焐活了一枚卵" }, fail: { text: "第三天夜里，那一息没有再亮。你把壳埋进了虚空石的缝里。", xp: 3000, wu: 2, heart: true } } } },
      { id: "dan", label: "以丹药吊住它", req: { path: "dan" }, out: { text: "你把仙元丹化在掌心，一点一点渡进裂纹。心跳稳了下来。它还没孵，但已经认得你的气味。", items: [["e_qilin", 1]], xp: 6000, tox: 15, wu: 2 } },
      { id: "sell", label: "带走，它值大价钱", out: { text: "你把它裹进衣襟。走到裂隙口时，光已经不跳了。你还是把它卖了。", ls: 8000, xp: 2000, wu: -2 } },
    ],
  },
  {
    id: "sj_fu", region: "shangjie", w: 6, realmMin: 5,
    text: "虚空里贴着一张符。没有墙，没有柱，它就那么贴着'什么都没有'。符纸崭新，墨迹未干，落款处是一个你不认得的姓。",
    opts: [
      { id: "fu", label: "读符上的字", req: { path: "fu" }, out: { text: "读到第三行你就停了——这不是符，是一封信，写给贴符人自己的。最后一句：'若有人读到，说明我没回来。'", art: "a_void", xp: 5500, wu: 3 } },
      { id: "tan", label: "找贴符的人去了哪", req: { sub: "tan" }, hidden: true, out: { text: "你在虚空里循着一丝极淡的气味走了七日，尽头是一副没有主人的甲，甲还站着，保持着往前走的姿势。", items: [["f_xukongyi", 1]], xp: 6500, wu: 2 } },
      { id: "tear", label: "把符揭下来", out: { chance: { p: 0.4, ok: { text: "符揭下的一瞬，那片'什么都没有'裂了一条缝，缝里掉出几粒仙露。缝很快又合上了。", items: [["m_xianlu", 1], ["m_xukong", 1]], xp: 5000 }, fail: { text: "符纸在你指间化了。你听见很远的地方，有什么东西醒了一下，又睡了。", xp: 2500, heart: true } } } },
    ],
  },
  // ---------- 任意地区（续） ----------
  {
    id: "any_guanfu", region: "any", w: 5,
    text: "岔路口坐着一个背棺材的人，棺材立在路边，比他高。他问你：'往东还是往西？'你没回答，他又说：'我也不知道，我背了三年了。'",
    opts: [
      { id: "help", label: "替他背一段", out: { text: "棺材是空的，轻得离谱。走了十里他要回去，说：'空棺材最重的时候，是没人肯搭手的时候。'", xp: 40, wu: 3, st: -1 } },
      { id: "ask", label: "问棺材里是谁", out: { text: "'还没死的那个。'他拍拍棺材盖，'我自己的。备着。'他笑得很开心。", wu: 2, xp: 20 } },
      { id: "go", label: "指个方向就走", out: { text: "你随手一指。走出很远回头，他真的往那边去了。", xp: 10 } },
    ],
  },
  {
    id: "any_shushi", region: "any", w: 5,
    text: "路边一个旧书摊，摊主在打盹。摊上大半是凡人的杂书，压在最底下的一本没有名字，翻开是空白的——但纸很贵，贵得不像空白该用的纸。",
    opts: [
      { id: "buy", label: "买下那本空书", req: { ls: 30 }, out: { chance: { p: 0.4, ok: { text: "夜里你无意间把它放在灯下，纸上慢慢浮出字来。第二天再看，又空了——它只在你想不通的时候显字。", ls: -30, wu: 3, xp: 60 }, fail: { text: "翻到最后一页，只有一行小字：'骗你的。'摊主的笑声从很远的地方传来。", ls: -30, wu: 1 } } } },
      { id: "dan", label: "翻找丹方", req: { path: "dan" }, out: { text: "你在一本讲农事的书里找到了半张丹方，夹在'如何腌菜'那一页。写得比正经丹书还清楚。", items: [["m_lingcao", 2]], xp: 50, wu: 2 } },
      { id: "wake", label: "叫醒摊主问价", out: { text: "他睁开一只眼：'空的不卖，那是我记性。'翻了个身又睡了。", wu: 1, xp: 8 } },
    ],
  },
  {
    id: "any_yeyu", region: "any", w: 6,
    text: "夜里投宿一间无人的山神庙。半夜有人推门进来，蹲在你对面烤火，一句话不说，直到天快亮才开口：'你身上有一样东西，你自己还不知道。'",
    opts: [
      { id: "ask", label: "问是什么", out: { text: "'你要是知道了，就用不上了。'他把火拨旺，'留着吧。'天亮时他已经不在了，火还没灭。", wu: 3, xp: 70, heartCure: true } },
      { id: "qi", label: "把随身法器给他看", req: { path: "qi" }, out: { text: "他掂了掂，用指甲在器身上弹了三下：'第二下是空的，回去补。'你照做了，法器从此顺手了很多。", xp: 60, items: [["m_tiekuang", 2]], wu: 2 } },
      { id: "sleep", label: "翻个身继续睡", out: { text: "醒来时火堆边留着一枚野果，还是热的。", items: [["x_jiecao", 2]], xp: 15, st: 3 } },
    ],
  },
  {
    id: "meme_yangmao", region: "any", w: 2,
    text: "草丛里蹲着一只毛茸茸的蜘蛛，正在拆一件不知从哪叼来的旧道袍，一根线一根线地抽，抽得极有耐心。当地人叫它薅羊毛蛛——据说被它盯上的修士，法宝会一天比一天轻。",
    opts: [
      { id: "watch", label: "看它抽完", out: { text: "它把线绕成一个球，球比它自己还大，然后推着球走了。你摸了摸自己的储物袋，还好，还在。", wu: 2, xp: 25 } },
      { id: "shoo", label: "把它赶走", out: { text: "它跑了两步又回头，抱着线球冲你比划了一下——像是在问：'这个也不给？'", xp: 12 } },
      { id: "give", label: "扔给它一件破衣", out: { text: "它高兴坏了，抽了一夜，天亮时在原地留下一小卷缠得极整齐的丝。你不知道能干什么，但收下了。", items: [["m_yaopi", 1]], xp: 30, wu: 1 } },
    ],
  },
  {
    id: "meme_vps", region: "any", w: 2,
    text: "一个摆摊的修士神神秘秘地掀开布：'老毛鸡的令，认这个的地方多。'摊上一排巴掌大的木牌，刻着'老毛鸡 VPS 令'六个字。'挂在洞府门口，灵气自己往里跑，一年只要三块灵石。'",
    opts: [
      { id: "buy", label: "买一块试试", req: { ls: 3 }, out: { chance: { p: 0.5, ok: { text: "挂上去当晚，洞府里的灵气确实浓了一点点。你不确定是不是错觉，但你续了第二年。", ls: -3, xp: 25, mp: 0.2 }, fail: { text: "第三天木牌自己掉了下来，背面写着一行小字：'到期未续，已回收。'摊主早不见了。", ls: -3, wu: 1 } } } },
      { id: "shang", label: "问他还有没有货", req: { sub: "shang" }, out: { text: "他压低声音：'年付有折，三年付送一块。'你们蹲在路边谈了半个时辰，最后你批了十块——转手就卖光了。", ls: 60, xp: 40 } },
      { id: "no", label: "听着就不靠谱", out: { text: "你走了。半年后你在另一个州，看见同样的木牌挂了一整条街。", wu: 1, xp: 15 } },
    ],
  },
  {
    id: "meme_tanzhu", region: "any", w: 2,
    text: "山道上有一座亭子，亭里坐着个自称坛主的老者，面前摆着一块木牌：'此地讲道，禁止吵架，违者沉塘。'亭外果然有一口塘，塘边搭着几件湿衣服。",
    opts: [
      { id: "listen", label: "在亭里坐着听", out: { text: "他讲了两个时辰，一半在讲道，一半在骂人。骂的那一半你受用更多。", wu: 3, xp: 60 } },
      { id: "argue", label: "当场跟他抬杠", out: { chance: { p: 0.5, ok: { text: "他愣了半晌，把木牌翻过来——背面写着'除非有理'。他给你倒了杯茶。", wu: 2, xp: 70, items: [["x_jiecao", 1]] }, fail: { text: "你在塘里泡了一炷香。爬上来时他递了条干布：'下次先想清楚再开口。'", hp: -0.05, wu: 1, xp: 20 } } } },
      { id: "leave", label: "绕过亭子走", out: { text: "你绕开了。身后隐约传来一句：'年轻人，路过就路过吧。'", xp: 10 } },
    ],
  },
  {
    id: "meme_ding", region: "any", w: 2,
    text: "驿站的墙上贴满了留言。大多是求药、寻人、卖艺的，可其中几十张纸上只写了一个字：'顶'。字迹各不相同，日期从三年前排到今天。",
    opts: [
      { id: "read", label: "从头读到尾", out: { text: "你读完才发现，最早那张下面压着一行小字：'家母病重，求一味灵草。'后面几十个'顶'，是几十个陌生人替他把这张纸留在了最上面。", wu: 3, xp: 55 } },
      { id: "write", label: "也写一个顶", out: { text: "你写完贴上去。走出驿站时，看见一个背药篓的人正站在墙前，把那张最早的纸揭了下来。", wu: 2, xp: 45, items: [["m_lingcao", 1]] } },
      { id: "post", label: "贴一张自己的", req: { ls: 2 }, out: { text: "你写了自己要找的东西，压在最上面。三天后回来，纸上多了七个'顶'，还有一行字：'城南，问李瘸子。'", ls: -2, xp: 40, wu: 1 } },
    ],
  },
  // ---------- 九天罡风层 ----------
  {
    id: "jt_fengren", region: "jiutian", w: 10,
    text: "云层之上再无云。风从四面切过来，像有人绕着你同时挥了千百把刀——衣袂先碎，皮肉在后。",
    opts: [
      { id: "ride", label: "御风而行", req: { stat: ["spd", 240] }, out: { text: "你不再顶着它走，而是顺着风刃之间的缝隙走。走出三十里，风里的道理已经在心里了。", xp: 12000 } },
      { id: "tank", label: "硬扛", out: { text: "你以肉身撞进风口。血落下去，在风里凝成一粒晶。", hp: -0.3, items: [["m_gangfeng", 1]] } },
      { id: "hide", label: "躲入云隙", out: { chance: { p: 0.6, ok: { text: "你缩进一道云隙，风从头顶掠过去，像一列不肯停的车。", xp: 6000 }, fail: { text: "云隙里已经有东西在等你了。", battle: "w_fengpo" } } } },
    ],
  },
  {
    id: "jt_lei", region: "jiutian", w: 8,
    text: "一具三丈高的金属傀儡横在风道上。它胸口的雷池还亮着，一眼就认出你不是上界的人。",
    opts: [
      { id: "fight", label: "战", out: { battle: "w_leikui", win: { text: "傀儡单膝跪进云里，雷池熄了一半。", xp: 15000, ls: 8000 }, lose: { text: "它一掌把你拍出风道，你跌了三千丈才稳住身形。", injury: true } } },
      { id: "lead", label: "以雷引雷", req: { elem: "雷" }, out: { text: "你把自身雷意引向它的雷池。两股雷认作同源，傀儡侧身让开了半步。", xp: 18000, wu: 1 } },
      { id: "around", label: "绕行", out: { text: "你绕了很长一段风路。风比傀儡更耗人。", st: -1 } },
    ],
  },
  {
    id: "jt_leichi", region: "jiutian", w: 5, once: true,
    text: "风道尽头有一口方圆十里的池子。池里不是水，是雷。池边残着半座上古阵基，符纹还在走。",
    opts: [
      { id: "in", label: "入阵", out: { text: "你踏上阵基。雷池自中间分开一线，露出下面的东西。", next: "jt_leichi_in" } },
      { id: "take", label: "取池边晶", out: { text: "你在池沿凿下两粒罡风晶。指缝里的雷麻了整整一夜。", items: [["m_gangfeng", 2]], tox: 15 } },
      { id: "go", label: "走", out: { text: "你记下了这口池子的位置，然后走开。" } },
    ],
  },
  {
    id: "jt_leichi_in", region: "jiutian", w: 0,
    text: "池底盘着一条老蛟，鳞上落满雷痕。它睁眼看你，眼里没有恨，只有算数算到一半被打断的不耐。",
    opts: [
      { id: "fight", label: "战", out: { battle: "w_leiyujiao", win: { text: "蛟头垂进雷里。它最后说的是一个数：'九千零一。'", items: [["m_xianjin", 2]], bio: "在九天雷池底下斩了那条数了九千年雷的老蛟", legacy: 2 }, lose: { text: "一道雷把你掀出池口，你在风里滚了很久。", hp: -0.5, injury: true } } },
      { id: "array", label: "阵修破阵", req: { path: "zhen" }, out: { text: "你看懂了阵基：这不是镇蛟的阵，是它自己布的。你替它补上了最后一笔。", xp: 20000, wu: 2 } },
      { id: "back", label: "退", out: { text: "你退出阵基。身后雷池重新合拢。" } },
    ],
  },
  {
    id: "jt_peng", region: "jiutian", w: 8,
    text: "一片阴影盖了过来。抬头时那只鹏已经收翅，风被它带得停了一瞬——这一瞬比风更叫人心慌。",
    opts: [
      { id: "fight", label: "战", out: { battle: "w_gangfengpeng", win: { text: "鹏坠进云里。你捡起一根还在割风的翎羽。", xp: 12000 }, lose: { text: "你被翅风掀下三千丈，半边身子失了知觉。", hp: -0.4 } } },
      { id: "calm", label: "驭兽师安抚", req: { path: "shou" }, out: { text: "你散开神识，把自己摊成一片没有敌意的风。它低头蹭了蹭你的肩，飞走了。", xp: 15000, wu: 2 } },
      { id: "low", label: "伏低", out: { text: "你贴着风道伏了半个时辰。它没看你，也没走。", st: -1 } },
    ],
  },
  {
    id: "jt_daoyou", region: "jiutian", w: 6,
    text: "风口背面蹲着个炼虚散修，正在补护身罩。他抬眼看你：'搭个伴？风里的路我熟，钱你出。'",
    opts: [
      { id: "join", label: "同行", req: { ls: 5000 }, out: { text: "他确实熟。三日之内，你少走了三十年的弯路。", ls: -5000, xp: 20000 } },
      { id: "no", label: "拒绝", out: { text: "他耸耸肩，转身进了风里，很快看不见了。" } },
      { id: "kill", label: "趁机下手", req: { path: "xie" }, out: { chance: { p: 0.5, ok: { text: "他的护身罩还没补完。你收走了他的储物袋，和他没来得及说完的那半句话。", ls: 15000, heart: true }, fail: { text: "他早防着这一手——护身罩是补给你看的。他退开半步，让风里的东西替他动手。", battle: "w_fengpo" } } } },
    ],
  },
  {
    id: "jt_jianfeng", region: "jiutian", w: 7,
    text: "一段风道里悬着数十截断兵，都是被罡风削断的。它们在风里排成一条线，像有人特意摆过。",
    opts: [
      { id: "jian", label: "以风试剑", req: { path: "jian" }, out: { text: "你把剑意搭上风刃。风教了你三件事，其中一件你练了三十年都没想通。", xp: 14000, wu: 2 } },
      { id: "qi", label: "收残兵回炉", req: { path: "qi" }, out: { text: "断口齐整，材质还在。你挑了几截还能用的收进囊里。", items: [["m_xianjin", 1]], xp: 8000 } },
      { id: "look", label: "看一阵", out: { text: "你看了很久，只看出它们死得都很干脆。", xp: 4000 } },
    ],
  },
  {
    id: "jt_yunhai", region: "jiutian", w: 6,
    text: "云海裂开一道缝，缝里飘着几张没烧尽的符纸，符胆还亮着。看落款，是上一个到过这里的人。",
    opts: [
      { id: "fa", label: "推演法诀", req: { path: "fa" }, out: { text: "残符只剩三笔，你在心里把余下的七笔补完了。法诀通了，人也险些跟着散了。", xp: 15000, hp: -0.1, wu: 1 } },
      { id: "fu", label: "临摹符胆", req: { path: "fu" }, out: { text: "你就着罡风描了一遍。符胆认了你，纸却在收笔那一刻化了。", xp: 13000, wu: 2 } },
      { id: "burn", label: "烧了它", out: { text: "你把符纸放进雷里。烧得很干净，像有人终于把话说完了。", xp: 5000 } },
    ],
  },
  {
    id: "jt_tilian", region: "jiutian", w: 6,
    text: "风道有一处收窄，风被挤成一线，锋利得能听见声音。历来到过九天的人，多在这里留下一层皮。",
    opts: [
      { id: "ti", label: "以身受风", req: { path: "ti" }, out: { text: "你收了护体灵光，任风一层层剐。剐到第七日，皮下长出来的已经是新的了。", xp: 16000, hp: -0.25, wu: 1 } },
      { id: "dan", label: "就地起炉", req: { path: "dan" }, out: { text: "罡风做火，雷做引。你在风口炼了一炉在下界怎么也炼不成的东西。", xp: 12000, items: [["m_gangfeng", 2]] } },
      { id: "pass", label: "屏息挤过", out: { text: "你缩着肩挤了过去，只丢了一块衣角。", xp: 6000, st: -1 } },
    ],
  },
  // ---------- 太虚古战场 ----------
  {
    id: "tx_duanjian", region: "taixu", w: 10,
    text: "虚空里插着一柄断剑，只剩半截，锈是黑的。它插在什么上并不要紧——要紧的是它还在震。",
    opts: [
      { id: "pull", label: "拔剑", req: { path: "jian" }, out: { text: "剑认你。拔出的一瞬你看见了它最后那一战：主人已死，它自己又刺了三剑。", xp: 40000, wu: 2 } },
      { id: "jin", label: "金灵根共鸣", req: { elem: "金" }, out: { text: "你体内金气一颤，剑身上落下几点金屑。", items: [["m_xianjin", 2]] } },
      { id: "away", label: "避开", out: { chance: { p: 0.6, ok: { text: "你绕开了那柄剑。它在你背后又震了一下。", xp: 5000 }, fail: { text: "剑先动了。剑灵从锈里站起来，看了你一眼。", battle: "w_yunxian" } } } },
    ],
  },
  {
    id: "tx_shenxiang", region: "taixu", w: 6, once: true,
    text: "半座神像悬在战场中央，脸只剩下一边。你从它膝下过时，那只仅存的眼睛，睁开了。",
    opts: [
      { id: "bow", label: "叩拜", out: { text: "你伏在虚空里叩了三下。神像低下头，像是要说话。", next: "tx_shenxiang_in" } },
      { id: "smash", label: "砸", out: { battle: "w_shenxiang", win: { text: "神像碎成砂。砂比神像值钱。", items: [["m_taixu", 2]] }, lose: { text: "它一掌按下来。你在虚空里飘了三日才醒。", hp: -0.4 } } },
      { id: "go", label: "走", out: { text: "你没有回头。那只眼睛一直看着你走远。" } },
    ],
  },
  {
    id: "tx_shenxiang_in", region: "taixu", w: 0,
    text: "神像的声音直接落进你识海，只有三个字：'道在何？'它已经等了千年，不介意再等一句。",
    opts: [
      { id: "self", label: "答'道在己'", out: { text: "神像沉默良久，然后笑了——半张脸也能笑。'仙魔都输在这里。'说完它就碎了。", wu: 3, xp: 30000, bio: "在太虚古战场答了神像一句'道在己'" } },
      { id: "sky", label: "答'道在天'", out: { text: "神像不说话了。你忽然觉得头顶那片虚空，正在慢慢压下来。", heart: true } },
      { id: "mute", label: "沉默", out: { text: "你没有答。神像点了点头，像是这也算一种答案。", xp: 10000 } },
    ],
  },
  {
    id: "tx_shenzhan", region: "taixu", w: 8,
    text: "一片虚空里，两道法印还在互相绞杀。施法的人早就不在了，法却没有停手。",
    opts: [
      { id: "fa", label: "读那两道印", req: { path: "fa" }, out: { text: "一道是仙家正法，一道是魔门歪理。你看了三日，看不出哪一道更对。", xp: 35000, wu: 2 } },
      { id: "zhen", label: "布阵收之", req: { path: "zhen" }, out: { text: "你在两印之间落下九枚阵旗。绞杀停了，虚空静得吓人。", xp: 30000, items: [["m_taixu", 1]] } },
      { id: "pass", label: "远远绕开", out: { text: "你贴着战场边缘走。身后的绞杀声一直没停。", xp: 8000 } },
    ],
  },
  {
    id: "tx_yiguan", region: "taixu", w: 7,
    text: "一口棺横在断戟堆上，棺盖贴着七道封符，六道已经褪色。棺里没有声音，也不算安静。",
    opts: [
      { id: "qi", label: "取棺上钉", req: { path: "qi" }, out: { text: "七枚棺钉都是仙金锻的。你拔了三枚——剩下四枚，你没敢拔。", items: [["m_xianjin", 2]], xp: 20000 } },
      { id: "fu", label: "补上封符", req: { path: "fu" }, out: { text: "你重描了那六道符。落最后一笔时，棺里有人轻轻叹了一声，然后彻底静了。", xp: 32000, wu: 2 } },
      { id: "leave", label: "不碰它", out: { text: "你绕着棺走了很大一圈。这大概是你在这片战场上做过最聪明的事。", xp: 9000, wu: 1 } },
    ],
  },
  {
    id: "tx_guhun", region: "taixu", w: 6,
    text: "一队亡灵还在列阵而行，走向一个早已不存在的战场。领头那具甲胄里，只剩一只手还握着旗。",
    opts: [
      { id: "ti", label: "挡住去路", req: { path: "ti" }, out: { text: "你以肉身立在阵前。它们撞了你三个时辰，然后从你两侧绕了过去。", xp: 30000, hp: -0.3 } },
      { id: "dan", label: "焚香引路", req: { path: "dan" }, out: { text: "你就地起炉，焚了一炉安魂的香。队伍散了，甲胄一具一具倒下，很轻。", xp: 28000, items: [["m_taixu", 1]] } },
      { id: "shou", label: "唤散魂兽", req: { path: "shou" }, out: { text: "阵尾跟着几头早已死透的战兽。你叫了一声，它们真的回头了。", xp: 26000, wu: 2 } },
      { id: "watch", label: "让开路", out: { text: "你退到一边。旗过去的时候，你行了个礼。", xp: 10000, wu: 1 } },
    ],
  },
  {
    id: "tx_mozun", region: "taixu", w: 3, realmMin: 7,
    text: "战场深处的封印裂了。一个人从火里坐起来，随手拨开压着他的半座神像：'仗打完了？谁赢了？'",
    opts: [
      { id: "fight", label: "战", out: { battle: "w_mozun", win: { text: "他倒下时还在笑：'你赢了，那就是你输的开始。'", ls: 40000, items: [["p_zaohua", 1]], bio: "在太虚古战场斩了刚刚苏醒的太虚魔尊", legacy: 2 }, lose: { text: "他一指点在你眉心，只说了两个字：'再练。'", hp: -0.6, injury: true } } },
      { id: "kneel", label: "魔道归顺", req: { path: "xie" }, out: { text: "你跪下了。他很满意，扔给你一袋灵石，和一句你此后夜夜都会想起的话。", ls: 20000, heart: true } },
      { id: "flee", label: "遁走", out: { chance: { p: 0.5, ok: { text: "你走得很快。他没有追——他连看都没看你一眼。" }, fail: { text: "你转身时踩碎了一具亡灵的甲。它站起来了。", battle: "w_zhanhun" } } } },
    ],
  },
  // ---------- 商人副业：由代码挂入，不随机出现 (w: 0) ----------
  {
    id: "sh_trade_1", region: "any", w: 0,
    text: "坊市西头有人急着脱手一批灵草，价压得很低。你算了算，转手到东头能翻一倍。",
    opts: [
      { id: "press", label: "压价", out: { text: "你又往下压了三成。他脸色很难看，还是卖了。", ls: 40 } },
      { id: "fair", label: "随行就市", out: { text: "你按市价收下。他多谢了一句——下回他还会来找你。", ls: 25 } },
      { id: "no", label: "不做", out: { text: "你摇摇头走开了。这批草的来路，你闻得出来。" } },
    ],
  },
  {
    id: "sh_trade_2", region: "any", w: 0,
    text: "商队在坊市门口招押镖的：走三百里山路，货不问，人不问，只问一句敢不敢。",
    opts: [
      { id: "take", label: "接镖", out: { chance: { p: 0.7, ok: { text: "一路无事。交货时掌柜多塞了一个封红。", ls: 60 }, fail: { text: "山口那伙人已经等了很久了。", battle: { tier: 1 } } } } },
      { id: "no", label: "不接", out: { text: "你看了一眼那口箱子，退了半步。" } },
    ],
  },
  {
    id: "sh_trade_3", region: "any", w: 0,
    text: "一个货郎挑着担子从雾里出来，担上的东西一件比一件古怪。他只说一句：'看中了就买。'",
    opts: [
      { id: "buy", label: "买下奇货", req: { ls: 30 }, out: { text: "你挑了两枚水灵晶。付完钱一回头，货郎和雾一起没了。", ls: -30, items: [["m_shuijing", 2]] } },
      { id: "chat", label: "闲聊", out: { text: "他说他走了四十年，从没在同一处停过两次。你听懂了半句。", wu: 1 } },
    ],
  },
];
export const EVENT_MAP = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
export function eventOf(id) {
  return EVENT_MAP[id] ?? null;
}
