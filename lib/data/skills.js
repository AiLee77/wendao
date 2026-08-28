// 功法 (cultivation methods): one equipped, passive. grade 黄<玄<地<天.
// 神通 (battle arts): up to 3 equipped. `mult` scales atk; `elem` applies the five-element cycle.
export const GONGFA = [
  { id: "g_tuna", name: "太玄吐纳诀", grade: 0, elem: null, rate: 1.0, desc: "最基础的吐纳法门，凡人亦可修。" },
  { id: "g_qingfeng", name: "青风引气术", grade: 0, elem: "木", rate: 1.08, mods: { spd: 1.05 }, desc: "青山村猎户口口相传的法门。" },
  { id: "g_chiyan", name: "赤炎真经", grade: 1, elem: "火", rate: 1.15, mods: { atk: 1.08 }, desc: "修此功者，掌心常有余温。" },
  { id: "g_xuanshui", name: "玄水凝元经", grade: 1, elem: "水", rate: 1.15, mods: { mp: 1.15 }, desc: "云梦泽散修所传，水气绵长。" },
  { id: "g_houtu", name: "厚土不动功", grade: 1, elem: "土", rate: 1.12, mods: { def: 1.15, hp: 1.08 }, desc: "根基如山，突破成功率 +3%。", bt: 0.03 },
  { id: "g_jinque", name: "金阙锻体诀", grade: 1, elem: "金", rate: 1.12, mods: { atk: 1.1 }, desc: "以金气淬炼筋骨。" },
  { id: "g_wuxing", name: "五行归元功", grade: 2, elem: null, rate: 1.3, mods: { hp: 1.05, mp: 1.05 }, desc: "五行俱修，杂灵根者的福音：四灵根/杂灵根修此功额外 +20%。", zaBonus: 1.2 },
  { id: "g_leiting", name: "雷霆御劫诀", grade: 2, elem: "雷", rate: 1.28, mods: { crit: 0.05 }, desc: "以雷炼体，渡劫时天雷伤害 -15%。", trib: 0.15 },
  { id: "g_taiyi", name: "太乙玄清经", grade: 2, elem: null, rate: 1.35, desc: "道门正统，循序渐进，突破成功率 +5%。", bt: 0.05 },
  { id: "g_xuemo", name: "血魔噬元功", grade: 2, elem: null, rate: 1.55, mods: { atk: 1.2, life: 0.85 }, desc: "邪修功法，吞噬血气化为修为。折寿。", demon: true },
  { id: "g_wanjian", name: "万剑归宗诀", grade: 3, elem: "金", rate: 1.5, mods: { atk: 1.25, crit: 0.08 }, desc: "青云剑宗镇宗功法残篇。", path: "jian" },
  { id: "g_fanxu", name: "返虚合道经", grade: 3, elem: null, rate: 1.6, mods: { hp: 1.1, mp: 1.2 }, desc: "上界流落的残经，字字玄机。" },
  { id: "g_zhoutian", name: "周天星辰诀", grade: 3, elem: "无", rate: 1.55, mods: { mp: 1.3, spell: 1.15 }, desc: "观星而悟，法修至宝。", path: "fa" },
  { id: "g_buhuai", name: "不坏金身", grade: 3, elem: "土", rate: 1.4, mods: { hp: 1.4, def: 1.3 }, desc: "体修极道，渡劫可硬抗。", path: "ti", trib: 0.2 },
];

export const ARTS = [
  { id: "a_slash", name: "基础剑式", elem: null, mp: 0, mult: 1.0, desc: "一记平平无奇的挥击。" },
  { id: "a_fire", name: "火球术", elem: "火", mp: 8, mult: 1.5, desc: "最常见的术法，也最好用。" },
  { id: "a_water", name: "水幕术", elem: "水", mp: 10, mult: 0.9, effect: { shield: 0.25 }, desc: "造成伤害并凝水成盾。" },
  { id: "a_wood", name: "回春术", elem: "木", mp: 12, mult: 0, effect: { heal: 0.2 }, desc: "木气生生不息，回复两成气血。" },
  { id: "a_earth", name: "土墙术", elem: "土", mp: 10, mult: 0.6, effect: { defUp: 0.3, turns: 2 }, desc: "厚土护身，两回合防御大增。" },
  { id: "a_metal", name: "金刃术", elem: "金", mp: 9, mult: 1.4, effect: { bleed: 0.1, turns: 2 }, desc: "金气化刃，留下流血伤口。" },
  { id: "a_jianqi", name: "剑气纵横", elem: "金", mp: 15, mult: 2.0, crit: 0.15, path: "jian", desc: "剑修神通，暴击率大增。" },
  { id: "a_yujian", name: "御剑术", elem: "金", mp: 20, mult: 2.4, effect: { first: true }, path: "jian", desc: "先发制人，必定先手。" },
  { id: "a_thunder", name: "天雷引", elem: "雷", mp: 22, mult: 2.2, effect: { stun: 0.3 }, desc: "引天雷落下，可能令敌人僵直。" },
  { id: "a_frost", name: "寒冰诀", elem: "水", mp: 18, mult: 1.7, effect: { slow: 0.3, turns: 2 }, desc: "冰封敌人，减速两回合。" },
  { id: "a_inferno", name: "焚天炎诀", elem: "火", mp: 30, mult: 2.8, effect: { burn: 0.12, turns: 3 }, path: "fa", desc: "法修大招，灼烧三回合。" },
  { id: "a_fist", name: "裂山拳", elem: "土", mp: 12, mult: 1.8, scale: "hp", path: "ti", desc: "以气血为引，伤害按气血计算。" },
  { id: "a_iron", name: "铁布衫", elem: "土", mp: 10, mult: 0, effect: { shield: 0.4 }, path: "ti", desc: "体修护体，抵挡一记重击。" },
  { id: "a_zhen_kun", name: "困龙阵", elem: null, mp: 18, mult: 0.8, effect: { slow: 0.4, defDown: 0.2, turns: 3 }, path: "zhen", desc: "阵修布阵，削弱敌人三回合。" },
  { id: "a_fu_lei", name: "五雷符", elem: "雷", mp: 5, mult: 2.0, effect: { interrupt: 0.3 }, path: "fu", desc: "符修一符，三成几率震慑敌人一回合。" },
  { id: "a_drain", name: "噬血术", elem: null, mp: 14, mult: 1.5, effect: { lifesteal: 0.5 }, path: "xie", desc: "邪修吸血，以敌养己。" },
  { id: "a_demon", name: "魔焰焚心", elem: "火", mp: 26, mult: 2.6, effect: { burn: 0.15, turns: 2, selfHurt: 0.05 }, path: "xie", desc: "魔道大招，伤敌亦伤己。" },
  { id: "a_beast_roar", name: "兽王咆哮", elem: null, mp: 10, mult: 1.2, effect: { petBoost: 1.0 }, path: "shou", desc: "驭兽师激励灵兽，下回合灵兽伤害翻倍。" },
  { id: "a_star", name: "星陨术", elem: "无", mp: 40, mult: 3.5, desc: "引星辰坠落，上界之术。" },
  { id: "a_void", name: "虚空斩", elem: "无", mp: 35, mult: 3.0, effect: { pierce: 0.5 }, desc: "无视一半防御。" },
];

export function gongfaOf(id) {
  return GONGFA.find((g) => g.id === id) ?? GONGFA[0];
}
export function artOf(id) {
  return ARTS.find((a) => a.id === id) ?? ARTS[0];
}
