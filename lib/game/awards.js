import { dayKey } from "./time.js";

// 能量只在里程碑发放，每账号每种一次，每天最多一次。
export const MILESTONES = { 1: { key: "zhuji", amount: 2, reason: "问道：筑基成功" }, 2: { key: "jindan", amount: 3, reason: "问道：结成金丹" }, 3: { key: "yuanying", amount: 5, reason: "问道：元婴出世" }, 9: { key: "feisheng", amount: 10, reason: "问道：飞升" } };

export function milestoneAward(legacy, realm, now, effects) {
  const m = MILESTONES[realm];
  if (!m) return null;
  legacy.awards = legacy.awards ?? {};
  if (legacy.awards[m.key]) return null;
  const today = dayKey(now);
  if (legacy.awards.lastDay === today) { legacy.awards.pending = legacy.awards.pending ?? []; if (!legacy.awards.pending.includes(m.key)) legacy.awards.pending.push(m.key); return null; }
  legacy.awards[m.key] = now;
  legacy.awards.lastDay = today;
  effects.push({ type: "points.award", amount: m.amount, reason: m.reason });
  return { amount: m.amount, reason: m.reason };
}

// Hand out one pending award per day (milestones reached on the same day queue up).
export function flushPending(legacy, now, effects) {
  const p = legacy.awards?.pending;
  if (!p || !p.length) return null;
  const today = dayKey(now);
  if (legacy.awards.lastDay === today) return null;
  const key = p.shift();
  const m = Object.values(MILESTONES).find((x) => x.key === key);
  if (!m || legacy.awards[key]) return null;
  legacy.awards[key] = now;
  legacy.awards.lastDay = today;
  effects.push({ type: "points.award", amount: m.amount, reason: m.reason });
  return { amount: m.amount, reason: m.reason };
}

export function seasonAward(legacy, reward, now, effects) {
  if (!reward || !reward.energy) return null;
  legacy.awards = legacy.awards ?? {};
  const key = `season${reward.n}`;
  if (legacy.awards[key]) return null;
  legacy.awards[key] = now;
  effects.push({ type: "points.award", amount: reward.energy, reason: `问道：第${reward.n + 1}赛季论道第${reward.rank}名` });
  return { amount: reward.energy };
}
