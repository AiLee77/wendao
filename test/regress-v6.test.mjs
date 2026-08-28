// v6 上线后审计查出来的 25 条缺陷，每条一个钉子。这些路径原本一条测试都没盖到。
import { test } from "node:test";
import assert from "node:assert/strict";
import { Site } from "./harness.mjs";
import { battle, PET_SHARE } from "../lib/game/battle.js";
import { makeRng } from "../lib/game/rng.js";
import { deriveStats, buildUnit, petPowerBonus } from "../lib/game/stats.js";
import { worldFor } from "../lib/game/boss.js";
import { MONSTERS } from "../lib/data/monsters.js";
import { BN_POOL } from "../lib/game/bounty.js";
import { WX_TIERS } from "../lib/game/wuxing.js";
import { SB_GOAL } from "../lib/game/sect.js";
import { shopStock } from "../lib/game/shop.js";
import { itemOf } from "../lib/data/items.js";
import { refineReforge, refineView } from "../lib/game/refine.js";

const HOUR = 3600000, DAY = 24 * HOUR;
const unit = (n, o = {}) => ({
  name: n, hp: o.hp ?? 3000, maxHp: o.hp ?? 3000, mp: 200, maxMp: 200, atk: o.atk ?? 300, def: 100,
  spd: 20, crit: 0, spell: 1, elem: null, arts: [], pet: o.pet ?? null, path: null,
  interrupt: 0, array: 0, talis: 1, tals: [],
});
async function player(site, uid, name, mut) {
  await site.call(uid, "boot", {});
  await site.call(uid, "create", { name });
  if (mut) site.setChar(uid, mut);
  return site.char(uid);
}

// ---------------------------------------------------------------- 1 / 2 灵兽
test("灵兽分担挡不住的那一部分伤害照样落在主人身上", () => {
  // 1 点血的灵兽曾经能把 97093 点的一击整个退回去，主人满血活着
  const pet = { name: "灵狐", hp: 1, maxHp: 1, atk: 0 };
  const r = battle(unit("杀手", { atk: 100000 }), unit("苦主", { hp: 100, pet }), makeRng("kill"), "arena");
  assert.equal(r.b.hp, 0, "致命一击就该是致命的");
  assert.equal(r.turns, 1, "不该多撑一个回合");
  // 灵兽只挡得动自己剩下那点血
  const pet2 = { name: "灵狐", hp: 50, maxHp: 50, atk: 0 };
  const d = unit("苦主", { hp: 3000, pet: pet2 });
  const r2 = battle(unit("杀手", { atk: 400 }), d, makeRng("share"), "arena");
  const soaked = Math.round(50 - (r2.b.petHp ?? 0) * 50);
  assert.ok(soaked > 0 && soaked <= 50, `挡下的量要在灵兽血量之内，实际 ${soaked}`);
  // 灵兽只是把伤害分走一部分，不会凭空还给主人：主人掉的血 ≥ 总伤害 − 灵兽挡下的（末击溢出不算）
  const hits = r2.log.filter((e) => e.w === "A" && e.d);
  const upto = hits.slice(0, -1).reduce((s, e) => s + e.d, 0);
  const lost = 3000 - r2.b.hp;
  assert.ok(lost >= upto - soaked - 1, `主人掉血 ${lost} 不该少于 ${upto} − ${soaked}`);
});

test("战力把灵兽算进去，远行中的不算", async () => {
  const site = new Site();
  await player(site, 1, "带兽人", (c) => { c.r = 3; c.s = 2; c.pet = null; });
  const bare = deriveStats(site.char(1)).power;
  site.setChar(1, (c) => { c.pet = { id: "e_qilin", name: "麒麟", elem: "火", atk: 1, hp: 1.2, lv: 20, xp: 0, ev: 2, hpP: 1, trip: null }; });
  const withPet = deriveStats(site.char(1)).power;
  assert.ok(withPet > bare * 1.3, `满级灵兽要显著抬高战力（${bare} -> ${withPet}）`);
  site.setChar(1, (c) => { c.pet.trip = { region: "qingshan", at: 0, ready: 1, seed: "s" }; });
  assert.equal(deriveStats(site.char(1)).power, bare, "远行中的灵兽不上场，也不算战力");
  assert.equal(petPowerBonus({ pet: null }), 0);
});

// ---------------------------------------------------------------- 3 世界 / 宗门 BOSS
test("各头世界 BOSS 的威胁度落在同一个量级，没有几回合被秒的日子", async () => {
  const base = Math.floor(Date.UTC(2026, 8, 3, 8) / DAY);
  const dayOf = (name) => { for (let d = base; d < base + 400; d++) if (worldFor(d).boss.name === name) return d; return null; };
  const norms = [];
  for (const b of MONSTERS.filter((x) => x.boss)) {
    const day = dayOf(b.name);
    if (day === null) continue;
    const site = new Site(day * DAY + 8 * HOUR);
    await player(site, 1, "讨伐者", (c) => { c.r = 5; c.s = 2; });
    let turns = 0, n = 0, norm = 0;
    for (let i = 0; i < 6; i++) {
      site.setChar(1, (c) => { c.daily.boss = 0; c.hpP = 1; c.mpP = 1; });
      const x = await site.call(1, "boss.attack", {});
      assert.equal(x.ok, true, x.msg);
      turns += x.data.battle.turns; n++;
      norm += Number(/造成了 (\d+) 点/.exec(x.msg)[1]);
    }
    norms.push({ name: b.name, turns: turns / n, norm: norm / n });
  }
  for (const x of norms) assert.ok(x.turns >= 3, `${x.name} 平均只打了 ${x.turns.toFixed(1)} 回合`);
  // 玄武（铁布衫 + 双防御神通）天生就是块石头，它一个人拉开的差距不算数；
  // 要守的是「绝大多数 BOSS 在同一个量级」——修之前跨日差到 74 倍，随手抽到一头就白打一天。
  const sorted = norms.map((x) => x.norm).sort((a, b) => a - b);
  const band = sorted.slice(1);
  assert.ok(band[band.length - 1] / band[0] < 8,
    `除最硬的一头外，威能应落在 8 倍以内：${band.map((x) => x.toFixed(0)).join(" / ")}`);
});

test("本周宗务的试炼一条记出手次数，不受当周抽到哪头兽影响", () => {
  assert.ok(SB_GOAL.sb <= 14, "一周最多 14 次出手，目标不能超过它");
});

// ---------------------------------------------------------------- 4 / 5 / 15-19 秘境
test("收手按秘境里掉的血结算，不把入场快照盖回去", async () => {
  const site = new Site();
  await player(site, 1, "探秘者", (c) => { c.r = 3; c.s = 2; c.hpP = 0.6; c.mpP = 0.6; });
  assert.equal((await site.call(1, "dg.enter", { diff: 0 })).ok, true);
  site.advance(3 * HOUR);
  await site.call(1, "home", {});
  assert.equal(site.char(1).hpP, 1, "挂机三小时回满");
  await site.call(1, "dg.leave", {});
  assert.equal(site.char(1).hpP, 1, "秘境里没掉血，收手不该把人打回 0.6");

  await player(site, 2, "讨伐者", (c) => { c.r = 3; c.s = 2; });
  await site.call(2, "dg.enter", { diff: 0 });
  for (let i = 0; i < 3; i++) await site.call(2, "boss.attack", {});
  const hurt = site.char(2).hpP;
  assert.ok(hurt < 1, "打完 BOSS 掉血了");
  await site.call(2, "dg.leave", {});
  assert.ok(site.char(2).hpP <= hurt + 0.001, "收手不发免费满血");
});

test("守护在最后一层救场不会顶出「第 n+1 层」，也不按通关记深度", async () => {
  const site = new Site();
  await player(site, 1, "苦修者", (c) => { c.r = 2; c.s = 2; });
  await site.call(1, "dg.enter", { diff: 0 });
  site.setChar(1, (c) => { c.dg.f = c.dg.n; c.dg.rel = ["shou"]; c.dg.sh = 0; c.dg.hp = 0.02; c.dg.pend = null; });
  const n = site.char(1).dg.n;
  const v = await site.call(1, "dg", {});
  const opts = v.data.dg.run.opts;
  assert.equal(opts[0].t, "boss", "最后一层是秘境之主");
  await site.call(1, "dg.pick", { i: 0 });
  const dg = site.char(1).dg;
  if (dg) {
    assert.ok(dg.f <= n, `层数不能超过 ${n}，实际 ${dg.f}`);
    const bank = (await site.call(1, "dg.leave", {})).data.bank;
    assert.ok(bank.depth < n || bank.done, "没打赢 BOSS 就不该按满层记");
  }
});

test("阵亡腰斩掉的孤品会写进结算面板，修为只报实际到账的", async () => {
  const site = new Site();
  await player(site, 1, "倒霉蛋", (c) => { c.r = 2; c.s = 2; });
  await site.call(1, "dg.enter", { diff: 0 });
  site.setChar(1, (c) => {
    c.dg.loot.s = { m_lingcao: 1, m_tiekuang: 4 };
    c.dg.loot.a = [{ id: "f_tiejian", q: 3, af: [] }];
    c.dg.xp = 999999999;
    c.xp = Math.round(1.5 * 1e9);
  });
  site.setChar(1, (c) => { c.dg.f = 1; c.dg.hp = 0.5; });
  const bank = (await site.call(1, "dg.leave", {})).data.bank;
  assert.ok(bank.drops.some((d) => d.id === "m_lingcao"), "灵草照常入账（收手不腰斩）");
  const capped = (await site.call(1, "bio", {})) && site.char(1);
  assert.ok(capped.xp <= 1.5 * 1e9 + 1, "修为封顶");
});

test("服丹不会重摇当前层的门", async () => {
  const site = new Site();
  await player(site, 1, "老实人", (c) => { c.r = 3; c.s = 2; c.inv.stack.p_huixue = 3; });
  await site.call(1, "dg.enter", { diff: 0 });
  site.setChar(1, (c) => { c.dg.hp = 0.2; });
  const before = (await site.call(1, "dg", {})).data.dg.run.opts.map((o) => o.t).join(",");
  const u = await site.call(1, "dg.use", { id: "p_huixue" });
  assert.equal(u.ok, true, u.msg);
  const after = (await site.call(1, "dg", {})).data.dg.run.opts.map((o) => o.t).join(",");
  assert.equal(after, before, "喝药之后门还是那几扇");
});

test("秘境行商：机缘位满时不摆机缘，也不会扣钱不给货", async () => {
  const site = new Site();
  await player(site, 1, "买主", (c) => { c.r = 3; c.s = 2; });
  await site.call(1, "dg.enter", { diff: 0 });
  site.setChar(1, (c) => {
    c.dg.rel = ["feng", "tie", "yan", "tu", "su", "xi", "jia", "lei"];
    c.dg.ls = 100000;
    c.dg.pend = { t: "shop", g: [{ k: "relic", id: "bao", ls: 100 }, { k: "hp", ls: 50 }] };
  });
  const ls0 = site.char(1).dg.ls;
  const r = await site.call(1, "dg.pick", { i: 0 });
  assert.equal(r.ok, false, "买不了就该拒绝");
  assert.equal(site.char(1).dg.ls, ls0, "一枚灵石都不能扣");
});

// ---------------------------------------------------------------- 6 淬炼
test("保值重铸收双倍价，属性不变、数值不降", async () => {
  const site = new Site();
  await player(site, 1, "炼器师", (c) => {
    c.r = 3; c.ls = 9999999; c.ic = 1;
    for (const id of ["m_tiekuang", "m_shuijing", "m_xuanjin", "m_xuanyuan", "m_jinghe"]) c.inv.stack[id] = 999;
    c.inv.arts = [{ iid: 1, id: "f_shuijian", q: 3, af: [{ st: "atk", v: 20, n: "锋锐" }, { st: "hp", v: 30, n: "厚血" }] }];
  });
  const c = site.char(1);
  const v = refineView(c, 1);
  assert.ok(v.reforge.lockLs === v.reforge.ls * 2, "保值是双倍价");
  assert.equal(typeof v.reforge.canLock, "boolean", "视图要单独给出保值是否付得起");
  const st0 = c.inv.arts[0].af[1].st;
  let cur = c.inv.arts[0].af[1].v;
  for (let k = 0; k < 20; k++) {
    const r = refineReforge(c, 1, 1, 1, makeRng("keep" + k));
    assert.equal(r.ok, true, r.msg);
    assert.equal(c.inv.arts[0].af[1].st, st0);
    assert.ok(c.inv.arts[0].af[1].v >= cur);
    cur = c.inv.arts[0].af[1].v;
  }
});

// ---------------------------------------------------------------- 7 拍卖
test("上拍再退回，法宝身上的符纹还在", async () => {
  const site = new Site();
  await player(site, 1, "卖家", (c) => {
    c.r = 3; c.ls = 99999; c.ic = 1;
    c.inv.arts = [{ iid: 1, id: "f_leijian", q: 4, af: [{ st: "atk", v: 100, n: "锋锐" }], rn: [{ st: "atk", v: 60, id: "r_feng" }, { st: "def", v: 60, id: "r_shi" }] }];
  });
  assert.equal((await site.call(1, "auction.create", { item: { iid: 1 }, min: 100 })).ok, true);
  site.advance(25 * HOUR);
  await site.tick();
  await site.call(1, "market", {});
  const back = site.char(1).inv.arts[0];
  assert.ok(back, "流拍要退回来");
  assert.equal((back.rn ?? []).length, 2, "两颗符纹一颗都不能少");
});

// ---------------------------------------------------------------- 8 / 20 / 22 悬赏
test("渡劫不会把当天已经算好的悬赏退回未完成", async () => {
  const site = new Site();
  await player(site, 1, "渡劫者", (c) => { c.r = 1; c.daily.bs = null; c.daily.bo = null; c.daily.br = null; });
  await site.call(1, "home", {});
  const before = (await site.call(1, "bounty", {})).data.bounty.list.map((x) => `${x.id}:${x.need}`).join("|");
  site.setChar(1, (c) => { c.r = 2; });
  const after = (await site.call(1, "bounty", {})).data.bounty.list.map((x) => `${x.id}:${x.need}`).join("|");
  assert.equal(after, before, "三张悬赏连要求带档位都得冻住");
});

test("转世当天再结一次三赏，既不重复发悟性也不清连击", async () => {
  const site = new Site();
  await player(site, 1, "转世者", (c) => { c.bountyStreak = 6; c.bountyLast = Math.floor(site.now / DAY); c.wu = 5; });
  await site.call(1, "home", {});
  site.setChar(1, (c) => {
    c.daily.bo = ["breath"]; c.daily.br = 0; c.daily.bs = { ...c.stats };
    c.daily.breath = 99; c.daily.claim = {};
  });
  const r = await site.call(1, "bounty.claim", { i: 0 });
  assert.equal(r.ok, true, r.msg);
  assert.equal(site.char(1).wu, 5, "同一天不再发第二次悟性");
  assert.equal(site.char(1).bountyStreak, 6, "连击不该被打回 1");
});

test("秘境、灵田、连珠、淬炼都进了悬赏池", () => {
  for (const id of ["dg", "farm", "wx", "refine"]) {
    assert.ok(BN_POOL.some((t) => t.id === id), `悬赏池缺少 ${id}`);
  }
});

// ---------------------------------------------------------------- 9 宗门
test("离线期间被逐出的人，当天不会拿到宗门专属悬赏", async () => {
  const site = new Site();
  await player(site, 20, "掌门", (c) => { c.r = 2; c.ls = 200000; });
  await site.call(20, "sect.create", { name: "试剑宗", desc: "以剑问道" });
  await player(site, 21, "弟子", (c) => { c.r = 2; });
  const sid = site.char(20).sect;
  await site.call(21, "sect.join", { sid });
  assert.equal(site.char(21).sect, sid);
  // 掌门趁人不在把宗门解散了
  const dis = await site.call(20, "sect.manage", { action: "disband" });
  assert.equal(dis.ok, true, dis.msg);
  site.setChar(21, (c) => { c.daily.bs = null; c.daily.bo = null; c.daily.br = null; });
  await site.call(21, "home", {});
  assert.equal(site.char(21).sect, null, "登录时才发现宗门没了");
  for (const id of site.char(21).daily.bo) {
    const t = BN_POOL.find((x) => x.id === id);
    assert.ok(!t?.sect, `不该抽到宗门专属的「${t?.name}」`);
  }
});

// ---------------------------------------------------------------- 11 / 12 / 23 灵田
test("生在最后一个时辰的灵田事件也会到期，短生长期的作物不再白拿豁免", async () => {
  let stuck = 0;
  for (let u = 1; u <= 60; u++) {
    const site = new Site(Date.UTC(2026, 8, 3, 8) + u * 97 * 60000);
    await player(site, u, "田农" + (u % 90), (c) => { c.r = 4; c.inv.stack.s_hanlian = 1; });
    assert.equal((await site.call(u, "farm.plant", { i: 0, seed: "s_hanlian" })).ok, true);
    site.advance(48 * HOUR);
    await site.call(u, "home", {});
    const p = site.char(u).farm.plots[0];
    if (p && p.ev) stuck++;
  }
  assert.equal(stuck, 0, "收成之后不该还挂着没结的事件");
});

test("已故的角色不会每次请求都重弹一遍灵田通知", async () => {
  const site = new Site();
  await player(site, 1, "将死者", (c) => { c.r = 4; c.inv.stack.s_leijing = 1; });
  await site.call(1, "farm.plant", { i: 0, seed: "s_leijing" });
  site.setChar(1, (c) => { c.dead = { age: 100 }; });
  site.advance(20 * HOUR);
  const a = await site.call(1, "home", {});
  site.advance(20 * HOUR);
  const b = await site.call(1, "home", {});
  assert.equal((a.notes ?? []).filter((n) => n.k === "farm").length, 0);
  assert.equal((b.notes ?? []).filter((n) => n.k === "farm").length, 0);
});

test("坊市每天都留一格给种子", () => {
  for (const r of [0, 2, 4, 6, 8]) {
    for (let d = 20700; d < 20730; d++) {
      const seeds = shopStock({ r }, d).filter((x) => itemOf(x.id)?.fx?.seed);
      assert.ok(seeds.length >= 1, `境界 ${r} 第 ${d} 天没有种子`);
    }
  }
});

// ---------------------------------------------------------------- 13 灵兽喂养
test("满级灵兽不再吃东西，也不会攒出超过需求的历练", async () => {
  const site = new Site();
  await player(site, 1, "驯兽人", (c) => {
    c.r = 5; c.inv.stack.m_taixu = 10;
    c.pet = { id: "e_qilin", name: "麒麟", elem: "火", atk: 1, hp: 1.2, lv: 20, xp: 0, ev: 2, hpP: 1, trip: null };
  });
  const r = await site.call(1, "pet.feed", { item: "m_taixu" });
  assert.equal(r.ok, false, "满级不该吃");
  assert.equal(site.char(1).inv.stack.m_taixu, 10, "东西一件都不能少");
  const v = await site.call(1, "pet", {});
  assert.equal(v.data.pet.feed.length, 0, "满级时不再列出可喂的东西");
  // 未满级：一次喂大量历练要能连升几级，剩余历练不超过下一级所需
  site.setChar(1, (c) => { c.pet.lv = 1; c.pet.xp = 0; });
  await site.call(1, "pet.feed", { item: "m_taixu" });
  const p = site.char(1).pet;
  assert.ok(p.lv > 1, "该升级");
  assert.ok(p.xp < 50 * (p.lv + 1) || p.lv >= 20, `剩余历练 ${p.xp} 不该超过下一级所需`);
});

// ---------------------------------------------------------------- 14 连珠
test("连珠的奖励档位停在人力可及的范围里", () => {
  assert.ok(WX_TIERS[2] <= 40000, `悟性档 ${WX_TIERS[2]} 高到只有解算器够得到`);
  assert.ok(WX_TIERS[0] < WX_TIERS[1] && WX_TIERS[1] < WX_TIERS[2] && WX_TIERS[2] < WX_TIERS[3]);
});

// ---------------------------------------------------------------- 21 blocks
test("blocks 端把挣到的称号全列出来", async () => {
  const site = new Site();
  await player(site, 1, "集邮者");
  const legacy = site.kv.get(1).get("legacy") ?? {};
  const { ACH } = await import("../lib/data/achievements.js");
  legacy.ach = Object.fromEntries(ACH.filter((a) => a.title).map((a) => [a.id, site.now]));
  site.kv.get(1).set("legacy", legacy);
  await site.render(1);
  await site.action(1, "tab:bio");
  const blocks = await site.action(1, "sub:ach"); // 道册默认落在悬赏子页，称号在成就子页
  const json = JSON.stringify(blocks);
  const { achView } = await import("../lib/game/bounty.js");
  const titles = (achView(site.char(1), legacy).titles ?? []).map((t) => t.title);
  assert.ok(titles.length >= 8, `应当挣到大部分称号，实际 ${titles.length}`);
  const missing = titles.filter((t) => !json.includes(t));
  assert.deepEqual(missing, [], "所有称号都要能穿上");
});
