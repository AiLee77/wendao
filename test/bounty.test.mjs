// 悬赏榜 + 成就。悬赏是"当日快照 + 三张任务"，成就是账号级一次性发奖。
import { test } from "node:test";
import assert from "node:assert/strict";
import { Site } from "./harness.mjs";
import { DAY } from "../lib/game/time.js";
import { ACH } from "../lib/data/achievements.js";

async function create(site, uid, name) {
  await site.call(uid, "boot");
  const r = await site.call(uid, "create", { name });
  assert.equal(r.ok, true, r.msg);
}
// 把当日三张悬赏钉死，进度由 stats 差值算，测试才可控
function fix(site, uid, ids, bump = {}) {
  site.setChar(uid, (c) => {
    c.daily.bo = ids;
    c.daily.bs = { ...c.stats };
    for (const [k, v] of Object.entries(bump)) c.stats[k] = (c.stats[k] ?? 0) + v;
  });
}
// 三张全领：返回最后一次的 view
async function clearAll(site, uid) {
  let v = null;
  for (let i = 0; i < 3; i++) v = await site.call(uid, "bounty.claim", { i });
  return v;
}

test("bounty: 当日抽三张互不重复，并冻结统计快照", async () => {
  const site = new Site();
  await create(site, 1, "悬赏客");
  const v = await site.call(1, "bounty");
  const b = v.data.bounty;
  assert.equal(b.list.length, 3);
  assert.equal(new Set(b.list.map((x) => x.id)).size, 3, "三张互异");
  const c = site.char(1);
  assert.ok(c.daily.bs && typeof c.daily.bs.kills === "number", "快照已冻结");
  assert.deepEqual(c.daily.bo.length, 3);
  // 快照之后涨的统计才算进度
  site.setChar(1, (x) => { x.stats.kills += 3; });
  const after = (await site.call(1, "bounty")).data.bounty;
  const kill = after.list.find((x) => x.id === "kill");
  if (kill) assert.equal(kill.cur, 3);
});

test("bounty: 同一天同一档位，人人拿到同样三张；换档就换题", async () => {
  const site = new Site();
  await create(site, 1, "甲子");
  await create(site, 2, "乙丑");
  const a = (await site.call(1, "bounty")).data.bounty.list.map((x) => x.id);
  const b = (await site.call(2, "bounty")).data.bounty.list.map((x) => x.id);
  assert.deepEqual(a, b, "同档同日一致");
  await create(site, 3, "丙寅");
  site.setChar(3, (c) => { c.r = 5; c.daily.bo = null; });
  const hi = (await site.call(3, "bounty")).data.bounty.list;
  assert.equal(hi.length, 3);
  assert.notDeepEqual(hi.map((x) => x.id), a, "高档另抽一组");
  // 高档的要求也更高
  const same = hi.find((x) => a.includes(x.id));
  if (same) assert.ok(same.need >= (await site.call(1, "bounty")).data.bounty.list.find((x) => x.id === same.id).need);
});

test("bounty: 游历真的会推进「踏遍山河」", async () => {
  const site = new Site();
  await create(site, 1, "行者");
  fix(site, 1, ["roam", "kill", "fight"]);
  let done = 0;
  for (let guard = 0; done < 5 && guard < 40; guard++) {
    site.setChar(1, (c) => { c.st = 20; c.hpP = 1; c.mpP = 1; }); // 体力气血不是这个测试要考的
    const v = await site.call(1, "explore", { region: "qingshan" });
    if (v.ok) done++;
    let ev = v.data?.event;
    for (let g2 = 0; ev?.opts?.length && g2 < 6; g2++) {
      const r = await site.call(1, "choose", { opt: (ev.opts.find((o) => o.ok) ?? ev.opts[0]).id });
      ev = r.ok ? r.data?.event : null;
    }
  }
  assert.equal(done, 5, "五次游历都成行");
  const b = (await site.call(1, "bounty")).data.bounty;
  const roam = b.list.find((x) => x.id === "roam");
  assert.equal(roam.cur, 5);
  assert.equal(roam.done, true);
  assert.equal(b.doneN >= 1, true);
});

test("bounty: 没完成不给领，完成发钱发材料，领过不能再领", async () => {
  const site = new Site();
  await create(site, 1, "赏金猎人");
  await site.call(1, "home"); // 先把每日入定的灵石领掉，下面才好数
  fix(site, 1, ["fight", "kill", "win"]);
  let v = await site.call(1, "bounty.claim", { i: 0 });
  assert.equal(v.ok, false);
  assert.match(v.msg, /尚未完成/);
  fix(site, 1, ["fight", "kill", "win"], { fights: 20 });
  const ls0 = site.char(1).ls;
  const mats0 = Object.keys(site.char(1).inv.stack).length;
  v = await site.call(1, "bounty.claim", { i: 0 });
  assert.equal(v.ok, true, v.msg);
  assert.equal(site.char(1).ls, ls0 + 40, "灵石 40 + 40×境界");
  assert.ok(v.data.drops?.length === 1, "掉一件材料");
  assert.ok(Object.keys(site.char(1).inv.stack).length >= mats0);
  v = await site.call(1, "bounty.claim", { i: 0 });
  assert.equal(v.ok, false);
  assert.match(v.msg, /已领/);
  assert.equal(site.char(1).daily.claim.b0, 1);
});

test("bounty: 三张齐结算悟性与连击，跨日续上，断一天归一", async () => {
  const site = new Site();
  await create(site, 1, "勤快人");
  const wu0 = site.char(1).wu;
  fix(site, 1, ["kill", "fight", "win"], { kills: 20, fights: 20, wins: 20 });
  let v = await clearAll(site, 1);
  assert.equal(v.ok, true, v.msg);
  assert.match(v.msg, /三赏皆结/);
  assert.equal(site.char(1).wu, wu0 + 1);
  assert.equal(site.char(1).bountyStreak, 1);
  assert.equal(site.char(1).daily.claim.all, 1);
  // 次日：悬赏重抽、claim 清空、连击 +1
  site.advance(DAY);
  await site.call(1, "home");
  assert.equal(site.char(1).daily.claim.all, undefined, "新的一天重新开始");
  fix(site, 1, ["kill", "fight", "win"], { kills: 20, fights: 20, wins: 20 });
  await clearAll(site, 1);
  assert.equal(site.char(1).bountyStreak, 2);
  // 断一天：连击归一
  site.advance(2 * DAY);
  await site.call(1, "home");
  fix(site, 1, ["kill", "fight", "win"], { kills: 20, fights: 20, wins: 20 });
  await clearAll(site, 1);
  assert.equal(site.char(1).bountyStreak, 1, "断了就从头数");
});

test("bounty: 连续七日得宝匣，并解锁「悬赏猎人」", async () => {
  const site = new Site();
  await create(site, 1, "七日客");
  let last = null;
  for (let d = 0; d < 7; d++) {
    if (d) { site.advance(DAY); await site.call(1, "home"); }
    fix(site, 1, ["kill", "fight", "win"], { kills: 20, fights: 20, wins: 20 });
    const ls0 = site.char(1).ls;
    last = await clearAll(site, 1);
    if (d === 6) {
      assert.match(last.msg, /宝匣/, "第七日开匣");
      assert.ok(site.char(1).ls - ls0 >= 500 + 3 * 40, "宝匣灵石到账");
    } else {
      assert.doesNotMatch(last.msg, /宝匣/);
    }
  }
  assert.equal(site.char(1).bountyStreak, 7);
  const v = await site.call(1, "home");
  assert.ok(v.notes.some((n) => n.k === "ach" && /悬赏猎人/.test(n.v)), "成就随之达成");
});

test("ach: 首次达成发一次奖并推 notes，称号可设可清、未达成的拒绝", async () => {
  const site = new Site();
  await create(site, 1, "成就党");
  await site.call(1, "home"); // 每日入定的灵石先落袋
  site.setChar(1, (c) => { c.stats.kills = 1; });
  const ls0 = site.char(1).ls;
  let v = await site.call(1, "home");
  const note = v.notes.find((n) => n.k === "ach" && /初试锋芒/.test(n.v));
  assert.ok(note, "达成时有提示");
  assert.equal(site.char(1).ls, ls0 + 100);
  const legacy = site.kv.get(1).get("legacy");
  assert.ok(legacy.ach.kill1 > 0, "记在道统里");
  // 再来一次不重复发
  const ls1 = site.char(1).ls;
  v = await site.call(1, "home");
  assert.equal(site.char(1).ls, ls1);
  assert.equal(v.notes.some((n) => n.k === "ach"), false);
  // 称号
  v = await site.call(1, "ach.title", { id: "kill100" });
  assert.equal(v.ok, false, "没达成的称号不给戴");
  site.setChar(1, (c) => { c.stats.kills = 100; });
  await site.call(1, "home");
  v = await site.call(1, "ach.title", { id: "kill100" });
  assert.equal(v.ok, true, v.msg);
  assert.equal(site.char(1).title, "斩妖人");
  const av = (await site.call(1, "ach")).data.ach;
  assert.equal(av.total, ACH.length);
  assert.ok(av.done >= 2);
  assert.ok(av.titles.some((t) => t.id === "kill100"));
  v = await site.call(1, "ach.title", { id: null });
  assert.equal(v.ok, true);
  assert.equal(site.char(1).title, null);
});

test("ach + bounty: 转世保留成就与连击", async () => {
  const site = new Site();
  await create(site, 1, "转世客");
  site.setChar(1, (c) => { c.stats.kills = 1; c.bountyStreak = 4; c.bountyLast = 12345; c.sectWeek = 7; });
  await site.call(1, "home");
  site.setChar(1, (c) => { c.born = site.now - 40 * DAY; });
  await site.call(1, "home");
  assert.ok(site.char(1).dead, "寿元耗尽");
  const v = await site.call(1, "rebirth", { name: "再来客" });
  assert.equal(v.ok, true, v.msg);
  const legacy = site.kv.get(1).get("legacy");
  assert.ok(legacy.ach.kill1 > 0, "成就随道统转世");
  assert.ok(legacy.ach.dead > 0, "坐化本身也是一项成就");
  const c = site.char(1);
  assert.equal(c.bountyStreak, 4);
  assert.equal(c.bountyLast, 12345);
  assert.equal(c.sectWeek, 7);
  assert.equal(c.stats.kills, 0, "本世的统计重来");
});
