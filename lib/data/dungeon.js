// 秘境 content tables. Everything here is data only; the run logic lives in lib/game/dungeon.js.
// Ids are prefixed DG_ because top-level names are global once tools/build.mjs flattens lib/.

// Three difficulties. `n` floors, `fm` foe multiplier, `lm` loot multiplier, `realm` entry gate.
export const DG_DIFFS = [
  { id: 0, name: "寻幽", n: 8, fm: 1.0, lm: 1.0, realm: 0, desc: "浅探即回，路上多是些不成气候的东西。" },
  { id: 1, name: "探险", n: 10, fm: 1.3, lm: 1.5, realm: 1, desc: "深处已有精怪盘踞，收获也厚。" },
  { id: 2, name: "绝境", n: 12, fm: 1.62, lm: 2.0, realm: 2, desc: "十二层皆是死地。活着出来的人，都发了。" },
];

// 16 机缘. `k` is the hook the run logic reads; `v` the magnitude where it needs one.
export const DG_RELICS = [
  { id: "feng", n: "锋锐", k: "atk", v: 1.15, d: "攻击 ×1.15" },
  { id: "bi", n: "铁壁", k: "def", v: 1.2, d: "防御 ×1.2" },
  { id: "yan", n: "炎魂", k: "crit", v: 0.15, d: "暴击 +15%" },
  { id: "tu", n: "厚土", k: "hp", v: 1.2, d: "气血上限 ×1.2" },
  { id: "su", n: "神速", k: "spd", v: 1.3, d: "速度 ×1.3" },
  { id: "xi", n: "灵犀", k: "spell", v: 1.2, d: "术法 ×1.2" },
  { id: "jia", n: "玄甲", k: "tal", v: "t_hu", d: "每战自带护身符" },
  { id: "lei", n: "雷印", k: "tal", v: "t_lei", d: "每战开场五雷符" },
  { id: "chun", n: "回春", k: "regenHp", v: 0.1, d: "每进一层气血 +10%" },
  { id: "quan", n: "灵泉", k: "regenMp", v: 0.1, d: "每进一层灵力 +10%" },
  { id: "bao", n: "探宝", k: "drop2", v: 2, d: "妖兽掉落判定两次" },
  { id: "yao", n: "万钥", k: "chest", v: 1, d: "宝箱不再有诈，且多开一件" },
  { id: "yu", n: "轻羽", k: "trap", v: 1, d: "陷阱自动通过" },
  { id: "shou", n: "守护", k: "save", v: 0.3, d: "首次致命伤后留三成气血（一次）" },
  { id: "wu", n: "悟道", k: "xp", v: 1.5, d: "本次秘境修为 ×1.5" },
  { id: "ju", n: "聚宝", k: "ls", v: 1.5, d: "本次秘境灵石 ×1.5" },
];
export const DG_RELIC_MAP = Object.fromEntries(DG_RELICS.map((r) => [r.id, r]));
export function dgRelicOf(id) {
  return DG_RELIC_MAP[id] ?? null;
}

// Node weights. `f` is the floor gate (option only appears from that floor on).
export const DG_NODES = [
  { t: "mon", w: 35, f: 1, n: "妖兽", i: "🐾" },
  { t: "chest", w: 15, f: 1, n: "宝箱", i: "🧰" },
  { t: "ev", w: 12, f: 1, n: "异象", i: "❓" },
  { t: "spring", w: 10, f: 1, n: "灵泉", i: "💧" },
  { t: "trap", w: 8, f: 1, n: "机关", i: "🕸" },
  { t: "elite", w: 12, f: 3, n: "精怪", i: "👹" },
  { t: "shop", w: 8, f: 2, n: "行商", i: "🛒" },
  { t: "relic", w: 6, f: 1, n: "机缘", i: "✨" },
];

// Eight two-choice incidents. `out` fields: hp/mp (fraction), ls (in shop units u),
// xp (fraction of xpNeed), relic, item ('mat'), p {chance, ok, fail}, battle ('mon').
export const DG_EVENTS = [
  {
    t: "石壁上嵌着半截残碑，字迹古拙。",
    o: [
      { l: "参悟片刻", out: { xp: 0.04, mp: -0.1, text: "字里行间有道韵流转，你若有所悟。" } },
      { l: "拓下带走", out: { ls: 1, text: "拓片粗陋，也能换几个灵石。" } },
    ],
  },
  {
    t: "一名散修倚壁而坐，气息将绝。",
    o: [
      { l: "渡一口真气", out: { mp: -0.2, p: { chance: 0.6, ok: { relic: 1, text: "他把贴身的物件塞进你手里，笑了一下。" }, fail: { text: "真气渡尽，他还是没能撑住。" } } } },
      { l: "取其行囊", out: { ls: 2, item: "mat", text: "你取走了他的行囊。他没有说话。" } },
    ],
  },
  {
    t: "石缝里渗出一眼灵泉，水色微青。",
    o: [
      { l: "俯身饮下", out: { hp: 0.35, mp: 0.35, text: "凉意入腹，伤处微微发痒。" } },
      { l: "灌入瓶中", out: { ls: 1, item: "mat", text: "泉水封进瓷瓶，日后炼丹正好。" } },
    ],
  },
  {
    t: "一具妖兽尸骸横在路口，尚未僵冷。",
    o: [
      { l: "剖丹取材", out: { item: "mat", text: "你剖开胸腹，取出一枚温热的东西。" } },
      { l: "焚之祭道", out: { xp: 0.02, hp: 0.05, text: "火光里，你想起自己也是这样活下来的。" } },
    ],
  },
  {
    t: "石室门上刻着阵纹，隐隐流光。",
    o: [
      { l: "强行破阵", out: { p: { chance: 0.5, ok: { ls: 3, text: "阵纹碎裂，室内堆着旧年的收藏。" }, fail: { hp: -0.2, text: "阵光反噬，你被震得倒退三步。" } } } },
      { l: "绕道而行", out: { text: "你贴着墙根走了过去。" } },
    ],
  },
  {
    t: "前路被浓雾封死，雾里有窸窣声。",
    o: [
      { l: "疾行穿过", out: { p: { chance: 0.6, ok: { text: "你屏息冲了过去，身后一片死寂。" }, fail: { hp: -0.15, text: "雾里伸出一只手，抓在你肩上。" } } } },
      { l: "原地静待", out: { mp: 0.2, hp: 0.05, text: "雾散得很慢，你索性打坐了一会儿。" } },
    ],
  },
  {
    t: "一座陈旧祭坛，凹槽里积着灰。",
    o: [
      { l: "供上灵石", out: { ls: -2, relic: 1, text: "灰烬无风自散，凹槽里多了样东西。" } },
      { l: "砸开石台", out: { battle: "mon", text: "石台崩裂，里面的东西醒了。" } },
    ],
  },
  {
    t: "岔路口坐着个同道，抬眼看你：「切磋一场？」",
    o: [
      { l: "请", out: { battle: "mon", text: "他起身抱拳，也不多话。" } },
      { l: "各走各路", out: { ls: 1, text: "他笑了笑，扔给你一小袋灵石：「拿去，买个路过。」" } },
    ],
  },
];
