// Simulates the cultivation calendar for a few archetypes: how many real days to each realm,
// assuming N hours of effective cultivation per day (offline cap + breathing) and average multipliers.
import { REALMS, stageNeed } from "../lib/data/realms.js";

const ARCHETYPES = [
  { name: "杂灵根·纯挂机(12h)", mult: 0.8, hours: 12 },
  { name: "三灵根·普通(16h+吐纳)", mult: 1.05 * 1.15, hours: 19 },
  { name: "双灵根·阵盘+功法(24h)", mult: 1.25 * 1.3 * 1.05, hours: 27 },
  { name: "天灵根·全力(36h+丹)", mult: 2.0 * 1.5 * 1.15 * 1.2, hours: 39 },
];
const FAIL_RATE = 0.2; // average minor-breakthrough failure, costs 30% of a stage

for (const a of ARCHETYPES) {
  let days = 0;
  const marks = [];
  for (let r = 0; r < REALMS.length; r++) {
    const R = REALMS[r];
    for (let s = 0; s < R.stages; s++) {
      const need = stageNeed(r, s) * (1 + FAIL_RATE * 0.3);
      const perDay = R.rate * a.mult * a.hours;
      days += need / perDay;
    }
    marks.push(`${R.name}→ ${days.toFixed(0)}d`);
  }
  console.log(a.name.padEnd(22), marks.join("  "));
}
console.log("\n寿元（3年/天）: " + REALMS.map((R) => `${R.name} ${R.life}年=${Math.round(R.life / 3)}天`).join("  "));
