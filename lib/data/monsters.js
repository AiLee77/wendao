// Monsters are defined relative to their tier's base power (see game/stats.js).
// m: multipliers {hp, atk, def, spd}. drops: [itemId, chance, count]. boss: elite encounter.
export const TIER_REALM = [0, 1, 2, 3, 5, 6, 7]; // tier -> realm index whose power it matches
export const TIER_OF_REALM = [0, 1, 2, 3, 4, 4, 5, 6, 6]; // realm index -> content tier
export const MONSTERS = [
  // tier 0 青山村
  { id: "w_yelang", name: "野狼", t: 0, elem: "木", icon: "🐺", m: { hp: 0.8, atk: 0.9, def: 0.6, spd: 1.2 }, arts: ["a_slash"], drops: [["m_yaopi", 0.6, 1], ["x_jiecao", 0.3, 2]], desc: "后山的野狼，成群出没。" },
  { id: "w_shanzhu", name: "山猪精", t: 0, elem: "土", icon: "🐗", m: { hp: 1.3, atk: 0.8, def: 0.9, spd: 0.6 }, arts: ["a_slash"], drops: [["m_yaopi", 0.7, 1], ["m_lingcao", 0.3, 1]], desc: "开了一点灵智的山猪，皮糙肉厚。" },
  { id: "w_huoshu", name: "火鼠", t: 0, elem: "火", icon: "🐭", m: { hp: 0.6, atk: 1.1, def: 0.5, spd: 1.4 }, arts: ["a_fire"], drops: [["m_lingcao", 0.5, 1], ["t_huo", 0.1, 1]], desc: "尾巴上燃着小火苗。" },
  { id: "w_shanzei", name: "山贼", t: 0, elem: null, icon: "🗡", m: { hp: 1.0, atk: 1.0, def: 0.8, spd: 1.0 }, arts: ["a_slash", "a_metal"], drops: [["m_tiekuang", 0.5, 2], ["f_tiejian", 0.05, 1]], desc: "在官道上劫道的凡人，手上有几分功夫。" },
  { id: "w_shuyao", name: "百年树妖", t: 0, elem: "木", icon: "🌳", m: { hp: 2.0, atk: 0.9, def: 1.2, spd: 0.5 }, arts: ["a_wood", "a_slash"], drops: [["m_lingcao", 1.0, 3], ["g_qingfeng", 0.08, 1]], desc: "村口老槐成精，能自愈。", boss: true },
  { id: "w_tuduan", name: "土遁貂", t: 0, elem: "土", icon: "🦡", m: { hp: 0.7, atk: 0.8, def: 1.0, spd: 1.3 }, arts: ["a_earth"], drops: [["m_tiekuang", 0.6, 1], ["e_linghu", 0.02, 1]], desc: "擅长遁地，难以捉摸。" },
  // tier 1 云梦泽
  { id: "w_shuigui", name: "水鬼", t: 1, elem: "水", icon: "👻", m: { hp: 0.9, atk: 1.0, def: 0.7, spd: 1.1 }, arts: ["a_water", "a_slash"], drops: [["m_shuijing", 0.5, 1]], desc: "泽中溺死者所化，专拖人下水。" },
  { id: "w_jiao", name: "水蛟", t: 1, elem: "水", icon: "🐉", m: { hp: 1.8, atk: 1.2, def: 1.1, spd: 0.9 }, arts: ["a_water", "a_frost"], drops: [["m_jiaolin", 0.8, 2], ["e_shuijiao", 0.03, 1]], desc: "尚未化龙的蛟，已能兴风作浪。", boss: true },
  { id: "w_duwa", name: "毒蟾", t: 1, elem: "木", icon: "🐸", m: { hp: 1.2, atk: 0.9, def: 0.9, spd: 0.7 }, arts: ["a_wood", "a_slash"], drops: [["m_hanlian", 0.4, 1], ["p_huixue", 0.2, 1]], desc: "毒雾弥漫，中者修为受损。" },
  { id: "w_sanxiu", name: "落魄散修", t: 1, elem: "火", icon: "🧙", m: { hp: 1.0, atk: 1.1, def: 0.9, spd: 1.0 }, arts: ["a_fire", "a_metal"], drops: [["p_ningyuan", 0.3, 1], ["g_chiyan", 0.05, 1], ["f_shuijian", 0.04, 1]], desc: "在云梦泽讨生活的筑基散修，见财起意。" },
  { id: "w_wuqi", name: "雾妖", t: 1, elem: "水", icon: "🌫", m: { hp: 0.7, atk: 1.3, def: 0.5, spd: 1.5 }, arts: ["a_frost"], drops: [["m_shuijing", 0.7, 2]], desc: "雾气凝成的妖物，飘忽不定。" },
  { id: "w_guxiu", name: "洞府守尸", t: 1, elem: "土", icon: "💀", m: { hp: 1.5, atk: 1.0, def: 1.4, spd: 0.6 }, arts: ["a_earth", "a_slash"], drops: [["m_jiaolin", 0.4, 1], ["g_xuanshui", 0.1, 1], ["x_julingzhen", 0.05, 1]], desc: "古修洞府里的尸傀，千年不腐。", boss: true },
  // tier 2 万妖谷
  { id: "w_langwang", name: "妖狼王", t: 2, elem: "木", icon: "🐺", m: { hp: 1.2, atk: 1.3, def: 0.9, spd: 1.3 }, arts: ["a_slash", "a_wood"], drops: [["m_yaodan", 0.4, 1], ["m_yaopi", 1.0, 5]], desc: "狼群的王，已化出半个人形。" },
  { id: "w_huoyuan", name: "赤火猿", t: 2, elem: "火", icon: "🦍", m: { hp: 1.4, atk: 1.4, def: 0.8, spd: 1.0 }, arts: ["a_fire", "a_inferno"], drops: [["m_yaodan", 0.5, 1], ["f_huoyun", 0.03, 1]], desc: "浑身烈焰，拳风如炮。" },
  { id: "w_shitou", name: "玄金石人", t: 2, elem: "土", icon: "🗿", m: { hp: 2.0, atk: 0.9, def: 2.0, spd: 0.4 }, arts: ["a_earth", "a_fist"], drops: [["m_xuanjin", 0.6, 2]], desc: "玄金化形，刀枪不入。" },
  { id: "w_hulimei", name: "狐媚", t: 2, elem: "火", icon: "🦊", m: { hp: 0.9, atk: 1.2, def: 0.8, spd: 1.4 }, arts: ["a_fire", "a_drain"], drops: [["m_longxue", 0.3, 1], ["p_yangshen", 0.2, 1]], desc: "笑起来很好看，然后你就没了修为。" },
  { id: "w_yaowang", name: "万妖谷谷主·青蟒", t: 2, elem: "木", icon: "🐍", m: { hp: 2.5, atk: 1.5, def: 1.3, spd: 1.1 }, arts: ["a_wood", "a_frost", "a_slash"], drops: [["m_yaodan", 1.0, 3], ["m_longxue", 0.8, 2], ["e_leiying", 0.05, 1], ["g_wuxing", 0.08, 1]], desc: "万妖之主，已有化形之姿。", boss: true },
  { id: "w_xiexiu", name: "血煞宗邪修", t: 2, elem: null, icon: "🩸", m: { hp: 1.1, atk: 1.4, def: 0.9, spd: 1.1 }, arts: ["a_drain", "a_demon"], drops: [["g_xuemo", 0.06, 1], ["p_peiyuan", 0.3, 1], ["x_chuancheng", 0.02, 1]], desc: "在万妖谷猎杀妖兽炼血的邪修。" },
  { id: "w_leiniao", name: "雷翼鸟", t: 2, elem: "雷", icon: "🦅", m: { hp: 0.8, atk: 1.5, def: 0.6, spd: 1.8 }, arts: ["a_thunder"], drops: [["e_leiying", 0.04, 1], ["m_yaodan", 0.3, 1]], desc: "羽翼带电，快如闪电。" },
  // tier 3 北冥寒渊
  { id: "w_bingjing", name: "冰魄精", t: 3, elem: "水", icon: "❄", m: { hp: 1.0, atk: 1.3, def: 1.0, spd: 1.2 }, arts: ["a_frost", "a_water"], drops: [["m_bingpo", 0.5, 1]], desc: "寒渊中凝成的冰之精魄。" },
  { id: "w_leiling", name: "雷灵", t: 3, elem: "雷", icon: "⚡", m: { hp: 0.8, atk: 1.6, def: 0.7, spd: 1.7 }, arts: ["a_thunder", "a_fu_lei"], drops: [["m_leijing", 0.5, 1], ["t_bilei", 0.05, 1]], desc: "天劫余威所化，专克渡劫者。" },
  { id: "w_xuanwu", name: "玄武", t: 3, elem: "水", icon: "🐢", m: { hp: 3.0, atk: 1.0, def: 2.2, spd: 0.5 }, arts: ["a_water", "a_earth", "a_iron"], drops: [["e_xuanwu", 0.06, 1], ["m_bingpo", 1.0, 2], ["f_bingjia", 0.04, 1]], desc: "北冥镇渊之兽。", boss: true },
  { id: "w_xuejiao", name: "雪蛟", t: 3, elem: "水", icon: "🐉", m: { hp: 1.6, atk: 1.4, def: 1.2, spd: 1.0 }, arts: ["a_frost", "a_water", "a_slash"], drops: [["m_xuanyuan", 0.4, 1], ["m_bingpo", 0.5, 1]], desc: "在雷雪中修行的蛟龙。" },
  { id: "w_moxiu", name: "血煞宗长老", t: 3, elem: "火", icon: "👹", m: { hp: 1.4, atk: 1.6, def: 1.1, spd: 1.2 }, arts: ["a_demon", "a_drain", "a_inferno"], drops: [["f_leijian", 0.04, 1], ["m_xuanyuan", 0.5, 1], ["g_leiting", 0.05, 1]], desc: "魔道高手，来北冥抢夺天材地宝。", boss: true },
  { id: "w_xinmo", name: "心魔", t: 3, elem: null, icon: "🌀", m: { hp: 1.0, atk: 1.5, def: 1.0, spd: 1.5 }, arts: ["a_drain", "a_void"], drops: [["p_dingxin", 0.3, 1], ["g_taiyi", 0.05, 1]], desc: "你自己的心魔。它知道你所有的弱点。" },
  // tier 4 上界裂隙
  { id: "w_xukongshou", name: "虚空兽", t: 4, elem: "无", icon: "👁", m: { hp: 1.5, atk: 1.5, def: 1.2, spd: 1.3 }, arts: ["a_void", "a_slash"], drops: [["m_xukong", 0.5, 1]], desc: "裂隙另一侧爬过来的东西。" },
  { id: "w_xingling", name: "星灵", t: 4, elem: "无", icon: "✨", m: { hp: 1.0, atk: 1.8, def: 0.9, spd: 1.6 }, arts: ["a_star", "a_thunder"], drops: [["m_xingchen", 0.6, 1], ["g_zhoutian", 0.04, 1]], desc: "星辰碎片所化的灵体。" },
  { id: "w_tianbing", name: "天兵", t: 4, elem: "金", icon: "⚔", m: { hp: 1.6, atk: 1.6, def: 1.5, spd: 1.2 }, arts: ["a_jianqi", "a_yujian", "a_metal"], drops: [["f_xingjian", 0.02, 1], ["m_xianlu", 0.2, 1]], desc: "守在裂隙边的天兵，不许凡修僭越。" },
  { id: "w_gumo", name: "上古魔神残念", t: 4, elem: "火", icon: "😈", m: { hp: 3.5, atk: 2.0, def: 1.5, spd: 1.0 }, arts: ["a_demon", "a_inferno", "a_void"], drops: [["m_xianlu", 1.0, 2], ["f_xukongyi", 0.05, 1], ["e_qilin", 0.04, 1], ["g_fanxu", 0.06, 1]], desc: "封印松动的魔神残念。", boss: true },
  { id: "w_xianshi", name: "堕仙", t: 4, elem: "无", icon: "🕊", m: { hp: 2.0, atk: 2.2, def: 1.3, spd: 1.5 }, arts: ["a_star", "a_void", "a_wood"], drops: [["f_xianyin", 0.03, 1], ["p_jiuzhuan", 0.05, 1], ["m_xingchen", 1.0, 2]], desc: "从上界跌落的仙人，神志已失。", boss: true },
  // tier 5 九天罡风层
  { id: "w_gangfengpeng", name: "罡风鹏", t: 5, elem: "雷", icon: "🦅", m: { hp: 1.2, atk: 1.5, def: 0.9, spd: 1.7 }, arts: ["a_thunder", "a_slash"], drops: [["m_gangfeng", 0.6, 1]], desc: "以罡风为食的巨鹏，一振翅便牵起百里雷云。" },
  { id: "w_fengpo", name: "风魄", t: 5, elem: "无", icon: "🌬", m: { hp: 0.8, atk: 1.6, def: 0.6, spd: 1.8 }, arts: ["a_void", "a_frost"], drops: [["m_gangfeng", 0.5, 1], ["m_xingchen", 0.3, 1]], desc: "罡风里凝出的一缕意识，无形无相，割喉不见血。" },
  { id: "w_leikui", name: "天雷傀", t: 5, elem: "金", icon: "🤖", m: { hp: 1.8, atk: 1.3, def: 1.7, spd: 0.7 }, arts: ["a_metal", "a_thunder"], drops: [["m_xianjin", 0.4, 1], ["t_tianwang", 0.1, 1]], desc: "上界弃置的守阵傀儡。雷池不熄，它便不停。" },
  { id: "w_leiyujiao", name: "雷狱蛟", t: 5, elem: "雷", icon: "🐲", m: { hp: 2.4, atk: 1.8, def: 1.3, spd: 1.1 }, arts: ["a_thunder", "a_water", "a_inferno"], drops: [["m_gangfeng", 1.0, 2], ["m_xianjin", 0.5, 1], ["p_hunyuan", 0.08, 1], ["g_zhoutian", 0.04, 1]], desc: "镇在雷池底下的老蛟。九千年来，它一直在数雷。", boss: true },
  // tier 6 太虚古战场
  { id: "w_zhanhun", name: "古战亡灵", t: 6, elem: "无", icon: "💀", m: { hp: 1.3, atk: 1.7, def: 1.0, spd: 1.4 }, arts: ["a_drain", "a_void"], drops: [["m_taixu", 0.6, 1]], desc: "仙魔大战的死者，至今不知战事已了。" },
  { id: "w_shenxiang", name: "破碎神像", t: 6, elem: "土", icon: "🗿", m: { hp: 2.6, atk: 1.2, def: 2.4, spd: 0.4 }, arts: ["a_earth", "a_metal"], drops: [["m_xianjin", 0.5, 1], ["m_taixu", 0.3, 1]], desc: "只剩半身的神像，断臂里还攥着一截剑。" },
  { id: "w_yunxian", name: "陨仙剑灵", t: 6, elem: "金", icon: "🗡", m: { hp: 1.5, atk: 2.2, def: 1.1, spd: 1.6 }, arts: ["a_jianqi", "a_yujian", "a_void"], drops: [["m_taixu", 1.0, 1], ["f_taixujian", 0.02, 1]], desc: "剑主早已陨落，剑却还认得出剑修。" },
  { id: "w_mozun", name: "太虚魔尊", t: 6, elem: "火", icon: "👿", m: { hp: 4.0, atk: 2.3, def: 1.6, spd: 1.2 }, arts: ["a_demon", "a_inferno", "a_void", "a_drain"], drops: [["m_taixu", 1.0, 2], ["m_xianjin", 1.0, 1], ["p_zaohua", 0.06, 1], ["f_taixujian", 0.04, 1], ["e_qilin", 0.03, 1]], desc: "他睁眼的那一刻，整片战场的断剑齐齐嗡鸣。", boss: true },
];
export const MONSTER_MAP = Object.fromEntries(MONSTERS.map((m) => [m.id, m]));
export function monsterOf(id) {
  return MONSTER_MAP[id] ?? null;
}
