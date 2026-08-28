// Exploration regions unlock by realm. `tier` indexes the monster and material tables.
export const REGIONS = [
  { id: "qingshan", name: "青山村", realm: 0, tier: 0, icon: "🏘", desc: "凡人村落，后山偶有灵草。夜里抬头，远处山巅有修士御剑而过。", env: "forest" },
  { id: "yunmeng", name: "云梦泽", realm: 1, tier: 1, icon: "🌫", desc: "雾锁千里的水泽，水妖出没，传说泽底沉着一座古修洞府。", env: "water" },
  { id: "wanyao", name: "万妖谷", realm: 2, tier: 2, icon: "🐺", desc: "妖族的地界。人修在此是客，也是猎物。", env: "forest" },
  { id: "beiming", name: "北冥寒渊", realm: 3, tier: 3, icon: "❄", desc: "极北之地，雷雪不歇。渡劫者多来此磨砺道心。", env: "storm" },
  { id: "shangjie", name: "上界裂隙", realm: 5, tier: 4, icon: "🌌", desc: "界壁裂开的缝隙，另一侧的气息让人心悸。", env: "void" },
  { id: "jiutian", name: "九天罡风层", realm: 5, tier: 5, icon: "🌪", desc: "上界之下、罡风之上。风刃削骨，雷霆常驻，化神以下一息即灭。", env: "storm" },
  { id: "taixu", name: "太虚古战场", realm: 7, tier: 6, icon: "⚔", desc: "仙魔大战的残骸悬在虚空里，断剑与神像还在互相厮杀。", env: "void" },
];
export const ENV_RULES = {
  forest: { name: "林地", bonus: { 火: 1.2, 木: 1.1 }, note: "林中火法借势，但也可能烧了满山药草" },
  water: { name: "水泽", bonus: { 水: 1.25, 火: 0.8 }, note: "水汽氤氲，火法难施" },
  storm: { name: "雷雪", bonus: { 雷: 1.3, 金: 1.1, 水: 0.9 }, note: "雷法与天相合" },
  void: { name: "虚空", bonus: { 无: 1.1 }, note: "五行失衡，唯有道心可凭" },
  arena: { name: "论道台", bonus: {}, note: "公平一战" },
};
export function regionOf(id) {
  return REGIONS.find((r) => r.id === id) ?? null;
}
