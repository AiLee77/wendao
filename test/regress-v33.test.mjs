// v33：档案（p:）与论道来袭（atk:）按 uid 折叠进 px:/ax: 桶 —— 配额大头收编。
// 不变式：榜单/论道/欠账全都读得到（散键优先、桶兜底）；在线玩家的散键不抖动；桶不超 8KB。
import test from "node:test";
import assert from "node:assert/strict";
import { Site } from "./harness.mjs";

const HOUR = 3600_000;
const ageTick = async (s) => { s.shared.set("world", { ...(s.shared.get("world") ?? {}), tickAt: s.now - 3 * HOUR }); await s.tick(); };

test("档案折叠进 px: 桶：散键清掉后榜单、论道选人、出手全都还认得这个人", async () => {
  const s = new Site();
  for (let i = 0; i < 6; i++) {
    const uid = 70 + i;
    await s.call(uid, "boot", {});
    await s.call(uid, "create", { name: `折档${i}` });
    s.setChar(uid, (c) => { c.r = 1; c.path = "jian"; });
    await s.call(uid, "home"); // 带 path 的快照落地
  }
  await ageTick(s);
  // 全员进桶（uid 70..75 → px:6,7,0,1,2,3）
  for (let i = 0; i < 6; i++) {
    const uid = 70 + i;
    assert.ok(s.shared.get(`px:${uid % 8}`)?.d?.[String(uid)], `uid ${uid} 在桶里`);
  }
  // 一小时内散键不动（在线玩家删了下个请求又建，纯属键抖动）
  assert.ok(s.shared.has("p:71"), "新鲜散键不删");
  // 过了一小时的散键当冗余清掉
  s.advance(2 * HOUR);
  await ageTick(s);
  s.advance(600_000);
  await ageTick(s);
  for (let i = 1; i < 6; i++) assert.equal(s.shared.has(`p:${70 + i}`), false, `p:${70 + i} 折叠后清掉`);
  // 榜单还满员
  const v = await s.call(70, "lb", { type: "power" });
  const rows = v.data.lb.rows;
  for (let i = 0; i < 6; i++) assert.ok(rows.some((r) => String(r.uid) === String(70 + i)), `uid ${70 + i} 还在榜上`);
  // 论道：候选来自桶，出手打得到（守方快照从桶里读）
  const a = await s.call(70, "arena");
  assert.ok(a.data.arena.list.length >= 1, "候选名单不空");
  const foe = a.data.arena.list[0];
  const f = await s.call(70, "arena.fight", { uid: foe.uid });
  assert.equal(f.ok, true, f.msg);
});

test("来袭折叠进 ax: 桶：散键清掉后守方照样还账，攻方续写从桶接种不丢旧账", async () => {
  const s = new Site();
  for (const [uid, n] of [[80, "攻方"], [81, "守方"]]) {
    await s.call(uid, "boot", {});
    await s.call(uid, "create", { name: n });
    await s.call(uid, "home");
  }
  s.advance(HOUR);
  const r = await s.call(80, "arena.fight", { uid: 81 });
  assert.equal(r.ok, true, r.msg);
  const ar0 = s.char(81).season.ar;
  // 折叠 + 冗余清扫（散键要过 1 小时才算冗余）
  s.advance(2 * HOUR);
  await ageTick(s);
  s.advance(600_000);
  await ageTick(s);
  assert.equal(s.shared.has("atk:80"), false, "来袭散键折叠后清掉");
  const fold = s.shared.get(`ax:${80 % 4}`)?.d?.["80"];
  assert.equal(fold?.list?.length, 1, "账在桶里");
  // 守方回来：从桶里读到来袭，论道值照动
  await s.call(81, "home");
  const paid = s.char(81).season.ar;
  assert.notEqual(paid, ar0, "缺席的守方还是还了账");
  assert.equal(paid < ar0, r.win, "论道值朝对局结果的方向动");
  // 攻方再出手：散键从桶接种，旧账 + 新账都在
  s.setChar(80, (c) => { c.daily.arena = 0; c.daily.arenaPool = null; });
  const r2 = await s.call(80, "arena.fight", { uid: 81 });
  assert.equal(r2.ok, true, r2.msg);
  assert.equal(s.shared.get("atk:80").list.length, 2, "续写以桶为底，旧账不丢");
  // 守方再同步：只结新账，不重复结旧账
  const before = s.char(81).season.ar;
  await s.call(81, "home");
  const after = s.char(81).season.ar;
  const delta2 = Math.abs(after - before);
  assert.ok(delta2 > 0 && delta2 < Math.abs(paid - ar0) + 40, "只结了第二笔");
});

test("桶顶着 8KB 单值上限：挤爆前请走最老的，仙籍不动", async () => {
  const s = new Site();
  await s.call(90, "boot", {});
  await s.call(90, "create", { name: "看门人" });
  // 同一个桶（uid%8==0）里塞 12 份 ~1KB 的档案，其中一份仙籍、一份最老
  for (let i = 0; i < 12; i++) {
    const uid = 800 + i * 8; // 全落 px:0
    s.shared.set(`p:${uid}`, { uid, n: `占位${i}`, t: s.now - (i === 3 ? 2.9 * 24 * HOUR : i * HOUR), asc: i === 5 ? 1 : 0, pad: "x".repeat(900) });
  }
  await ageTick(s);
  const bucket = s.shared.get("px:0");
  assert.ok(bucket, "桶写出来了");
  assert.ok(JSON.stringify(bucket).length <= 7500, `桶不超 8KB 护栏（${JSON.stringify(bucket).length}）`);
  assert.ok(bucket.d["840"], "仙籍（uid 840）挤不走");
  assert.equal(bucket.d["824"], undefined, "最老的（uid 824）先请出去");
});
