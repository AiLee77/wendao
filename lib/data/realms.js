// Cultivation realms. `hours` is the base hours of cultivation each minor stage
// needs at this realm's base rate; tools/balance.js turns these into a calendar.
export const REALMS = [
  { id: 0, name: "炼气", stages: 9, rate: 10, hours: [2, 3, 4, 6, 8, 10, 12, 14, 16], life: 100, power: 10, trib: false },
  { id: 1, name: "筑基", stages: 3, rate: 40, hours: [30, 40, 50], life: 200, power: 40, trib: true },
  { id: 2, name: "金丹", stages: 3, rate: 150, hours: [60, 80, 100], life: 400, power: 160, trib: true },
  { id: 3, name: "元婴", stages: 3, rate: 500, hours: [120, 160, 200], life: 800, power: 600, trib: true },
  { id: 4, name: "化神", stages: 3, rate: 1500, hours: [200, 260, 320], life: 1500, power: 2200, trib: true },
  { id: 5, name: "炼虚", stages: 3, rate: 4000, hours: [300, 400, 500], life: 2500, power: 8000, trib: true },
  { id: 6, name: "合体", stages: 3, rate: 10000, hours: [500, 600, 700], life: 4000, power: 28000, trib: true },
  { id: 7, name: "大乘", stages: 3, rate: 25000, hours: [800, 1000, 1200], life: 6000, power: 100000, trib: true },
  { id: 8, name: "渡劫", stages: 1, rate: 60000, hours: [1500], life: 10000, power: 350000, trib: true },
];
export const ASCEND_REALM = 9; // 飞升
export const STAGE_NAMES = ["初期", "中期", "后期"];

export function realmName(r, s) {
  if (r >= ASCEND_REALM) return "飞升仙人";
  const R = REALMS[r];
  if (r === 0) return `炼气${"一二三四五六七八九"[s]}层`;
  if (R.stages === 1) return R.name;
  return `${R.name}${STAGE_NAMES[s]}`;
}
export function stageNeed(r, s) {
  const R = REALMS[r];
  return Math.round(R.hours[s] * R.rate);
}
export function isMajorStep(r, s) {
  // the breakthrough that leaves this stage crosses into a new realm
  if (!REALMS[r]) return false; // 飞升 (r === ASCEND_REALM) has no further step
  return s === REALMS[r].stages - 1;
}
