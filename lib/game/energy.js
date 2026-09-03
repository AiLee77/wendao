// 能量供奉：拿论坛能量换灵石。
// 平台文档只列了 points.award（发放），没有扣除接口；实际用负数 amount 扣除
// （James 的「星球探索」就是这么花能量的）。effects 是单事务：万一平台拒收负数，
// 这一批连同灵石入账一起回滚，玩家不会白掉能量。
export const ENERGY_DAILY = 5; // 每日最多供奉几点能量
// 一点能量换多少灵石：按境界给，折下来大约「六天的日常收入」。
// 低境界给 5000（≈7 天收入），化神给 25000（≈6 天），高低境界都值得换。
export const lsPerEnergy = (r) => 5000 + 5000 * Math.max(0, r | 0);

export function energyView(c, balance) {
  const used = c.daily.energy ?? 0;
  return {
    balance: Math.max(0, balance | 0),
    left: Math.max(0, ENERGY_DAILY - used),
    rate: lsPerEnergy(c.r),
    daily: ENERGY_DAILY,
  };
}

// 返回 { ok, msg, effect? }：effect 由调用方 push 进 effects（负数 award = 扣除）
export function offerEnergy(c, balance, n) {
  n = Math.max(1, Math.floor(Number(n) || 0));
  const used = c.daily.energy ?? 0;
  if (used >= ENERGY_DAILY) return { ok: false, msg: `今日供奉已满 ${ENERGY_DAILY} 点能量，明日再来` };
  if (n > ENERGY_DAILY - used) return { ok: false, msg: `今日最多还能供奉 ${ENERGY_DAILY - used} 点能量` };
  if ((balance | 0) < n) return { ok: false, msg: `你只有 ${Math.max(0, balance | 0)} 点能量` };
  const rate = lsPerEnergy(c.r);
  const ls = rate * n;
  c.ls += ls;
  c.daily.energy = used + n;
  return {
    ok: true,
    msg: `供奉 ${n} 点能量，天机阁回赠灵石 +${ls}`,
    effect: { type: "points.award", amount: -n, reason: `问道：供奉 ${n} 点能量换取灵石` },
  };
}
