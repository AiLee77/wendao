// v34：玩家反馈那一批。拍卖名额、坊市补货、能量供奉、补偿礼包、渡劫/突破的惩罚与透明度。
import test from "node:test";
import assert from "node:assert/strict";
import { Site } from "./harness.mjs";

const HOUR = 3600_000;

test("坊市：种子管够（至少两格、总数上得去），并且能花灵石请商队补货", async () => {
  const { SHOP_REFRESH_DAILY } = await import("../lib/game/shop.js");
  const s = new Site();
  await s.call(1, "boot", {});
  await s.call(1, "create", { name: "田舍郎" });
  s.setChar(1, (c) => { c.ls = 200000; });
  let v = await s.call(1, "shop");
  const seeds = v.data.shop.filter((x) => x.fx && x.fx.seed);
  assert.ok(seeds.length >= 2, `每天至少两格种子，实际 ${seeds.length}`);
  assert.ok(seeds.reduce((t, x) => t + x.n, 0) >= 10, "种子总数要够灵田种一天");
  assert.ok(v.data.shopRe.left === SHOP_REFRESH_DAILY && v.data.shopRe.cost > 0);
  // 补货换一批货
  const before = v.data.shop.map((x) => x.id).join(",");
  const ls0 = s.char(1).ls;
  const r = await s.call(1, "shop.refresh");
  assert.equal(r.ok, true, r.msg);
  assert.ok(s.char(1).ls < ls0, "补货要花灵石");
  assert.notEqual(r.data.shop.map((x) => x.id).join(","), before, "货架真的换了");
  assert.equal(r.data.shopRe.left, SHOP_REFRESH_DAILY - 1);
  // 用完就拒
  for (let i = 1; i < SHOP_REFRESH_DAILY; i++) assert.equal((await s.call(1, "shop.refresh")).ok, true);
  const no = await s.call(1, "shop.refresh");
  assert.equal(no.ok, false);
  assert.match(no.msg, /已请商队补货/);
});

test("坊市：补货后仍买不到今天已经买光的东西（刷新不能刷出重复存货）", async () => {
  const s = new Site();
  await s.call(2, "boot", {});
  await s.call(2, "create", { name: "囤货郎" });
  s.setChar(2, (c) => { c.ls = 500000; });
  let v = await s.call(2, "shop");
  const target = v.data.shop.find((x) => x.left > 0);
  for (let i = 0; i < target.n; i++) await s.call(2, "buy", { idx: target.idx });
  assert.equal((s.char(2).daily.shop ?? {})[target.id], target.n, "买光了");
  await s.call(2, "shop.refresh");
  const after = (await s.call(2, "shop")).data.shop.find((x) => x.id === target.id);
  if (after) assert.equal(after.left, 0, "刷新出来还是同一件的话，存货必须仍是 0");
});

test("能量供奉：扣的是真能量（负数 award），每日封顶，余额不够干净地拒", async () => {
  const { ENERGY_DAILY, lsPerEnergy } = await import("../lib/game/energy.js");
  const s = new Site();
  await s.call(3, "boot", {});
  await s.call(3, "create", { name: "供奉者" });
  s.points.set(3, 10);
  let v = await s.call(3, "energy");
  assert.equal(v.data.energy.balance, 10);
  assert.equal(v.data.energy.left, ENERGY_DAILY);
  assert.equal(v.data.energy.rate, lsPerEnergy(s.char(3).r));
  const ls0 = s.char(3).ls;
  const r = await s.call(3, "energy.offer", { n: 2 });
  assert.equal(r.ok, true, r.msg);
  assert.equal(s.char(3).ls - ls0, 2 * lsPerEnergy(s.char(3).r), "灵石按汇率入账");
  assert.equal(s.points.get(3), 8, "论坛能量真的被扣掉了");
  // 每日封顶
  const over = await s.call(3, "energy.offer", { n: ENERGY_DAILY });
  assert.equal(over.ok, false);
  assert.match(over.msg, /今日最多还能供奉/);
  // 余额不足
  s.points.set(3, 0);
  const broke = await s.call(3, "energy.offer", { n: 1 });
  assert.equal(broke.ok, false);
  assert.match(broke.msg, /只有 0 点能量/);
  assert.equal(s.char(3).ls - ls0, 2 * lsPerEnergy(s.char(3).r), "被拒时灵石一分不动");
});

test("补偿礼包：老玩家领一次，新号不发，转世后也不重发", async () => {
  const { GIFTS } = await import("../lib/game/gift.js");
  const g = GIFTS[0];
  const s = new Site();
  await s.call(4, "boot", {});
  await s.call(4, "create", { name: "苦主" });
  // 新建的号（创建时间在补偿线之后）不发
  let v = await s.call(4, "home");
  assert.equal(v.gift, undefined, "补偿线之后新建的号不该收到赔罪礼包");
  // 把创建时间挪到出事那会儿 —— 这才是受影响的老玩家
  s.setChar(4, (c) => { c.created = g.before - 1; c.tox = 60; c.hpP = 0.2; c.ls = 0; });
  v = await s.call(4, "home");
  assert.ok(v.gift, "老玩家该收到礼包");
  assert.ok(v.gift.lines.length >= 5, "礼包内容要有分量");
  assert.ok(s.char(4).ls >= 50000, `灵石到账，实际 ${s.char(4).ls}`);
  assert.equal(s.char(4).tox, 0, "丹毒清空");
  assert.equal(s.char(4).hpP, 1, "气血回满");
  assert.ok(s.char(4).inv.stack.t_bilei >= 5 && s.char(4).inv.stack.p_dingxin >= 5, "渡劫消耗品到账");
  // 只发一次
  const ls1 = s.char(4).ls;
  v = await s.call(4, "home");
  assert.equal(v.gift, undefined, "第二次不再发");
  assert.equal(s.char(4).ls, ls1);
});

test("突破失败不再赔掉大半天：掉一成修为、四小时迟滞，并当场告诉你下次多少", async () => {
  const { xpNeed } = await import("../lib/game/char.js");
  const s = new Site();
  await s.call(5, "boot", {});
  await s.call(5, "create", { name: "非酋" });
  s.setChar(5, (c) => { c.tutDone = true; c.xp = xpNeed(c); c.btStreak = 0; c.hpP = 1; });
  // 成功率不是 100%，所以反复重置到同一个关口，直到碰上一次失败
  let r = null, need = 0;
  for (let i = 0; i < 60; i++) {
    s.setChar(5, (c) => { c.r = 0; c.s = 0; c.btStreak = 0; c.dbf = {}; c.hpP = 1; c.xp = xpNeed(c); });
    need = xpNeed(s.char(5));
    r = await s.call(5, "bt");
    if (r.success === false) break;
  }
  assert.equal(r.success, false, "总能碰到一次失败");
  const c = s.char(5);
  assert.ok(c.xp >= need * 0.85, `只该掉一成修为，实际剩 ${Math.round(c.xp)}/${Math.round(need)}`);
  assert.ok(c.dbf.qi - s.now <= 4 * HOUR + 1000, "走火入魔压到四小时");
  assert.match(r.msg, /下次成功率 \d+%/, "要把下次的成功率直接说出来");
});

test("渡劫：面板给出每种应对的预估伤害，失败不跌境且下次减伤", async () => {
  const { stageNeed } = await import("../lib/data/realms.js");
  const s = new Site();
  await s.call(6, "boot", {});
  await s.call(6, "create", { name: "渡劫者" });
  s.setChar(6, (c) => { c.r = 0; c.s = 8; c.xp = stageNeed(0, 8); c.hpP = 1; c.mpP = 1; });
  const v = await s.call(6, "trib.start");
  assert.equal(v.ok, true, v.msg);
  const f = v.data.home.trib.forecast;
  assert.ok(f && f.tank > 0, "硬抗要给出预估掉血百分比");
  assert.ok(f.parry > 0 && f.parry < f.tank, "招架该比硬抗少掉血");
  assert.ok(f.dodge > 0 && f.dodge <= 100, "御剑给的是闪避成功率");
  // 一路硬抗到倒下
  let r = null;
  for (let i = 0; i < 20; i++) {
    r = await s.call(6, "trib.step", { act: "tank" });
    if (r.data && !r.data.home.trib) break;
  }
  const c = s.char(6);
  if (r.success === false) {
    assert.equal(c.s, 8, "失败不该跌小境界");
    assert.ok((c.tribStreak ?? 0) >= 1, "失败要累计减伤");
    assert.match(r.msg, /下次雷劫伤害 -\d+%/);
  }
});
