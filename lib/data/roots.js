export const ELEMENTS = ["金", "木", "水", "火", "土"];
// Five-element overcoming cycle: attacker element -> element it suppresses.
export const OVERCOME = { 金: "木", 木: "土", 土: "水", 水: "火", 火: "金" };

// Spirit roots. `mult` is the cultivation multiplier; rarer roots are faster.
export const ROOT_TYPES = [
  { id: "tian", name: "天灵根", count: 1, mult: 2.0, w: 2, desc: "万中无一，灵气亲和如呼吸" },
  { id: "bian", name: "变异雷灵根", count: 1, mult: 1.6, w: 4, elems: ["雷"], desc: "天生引雷，渡劫时自有感应" },
  { id: "dan", name: "单灵根", count: 1, mult: 1.5, w: 9, desc: "一脉纯粹，修行顺畅" },
  { id: "shuang", name: "双灵根", count: 2, mult: 1.25, w: 20, desc: "两行相济，资质上佳" },
  { id: "san", name: "三灵根", count: 3, mult: 1.05, w: 30, desc: "中人之资，勤可补拙" },
  { id: "si", name: "四灵根", count: 4, mult: 0.92, w: 18, desc: "灵气驳杂，修行缓慢" },
  { id: "za", name: "五行杂灵根", count: 5, mult: 0.8, w: 17, desc: "凡俗之躯，问道最难——但也最多人走过" },
];

export function rollRoot(rng) {
  const type = rng.weighted(ROOT_TYPES.map((t) => [t, t.w]));
  const elems = type.elems ? type.elems.slice() : rng.shuffle(ELEMENTS).slice(0, type.count);
  return { t: type.id, e: elems };
}
export function rootInfo(root) {
  return ROOT_TYPES.find((t) => t.id === root.t) ?? ROOT_TYPES[6];
}
