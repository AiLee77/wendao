// Local preview of the webview surface: serves the real page (html/css/js) and bridges
// window.community.call to the harness Site, so the UI can be iterated and screenshotted without the site.
// usage: node tools/preview.mjs [port]   then open http://localhost:PORT/?uid=1
import http from "node:http";
process.on("unhandledRejection", (e) => console.error("preview unhandledRejection:", e && e.stack ? e.stack : e));
process.on("uncaughtException", (e) => console.error("preview uncaughtException:", e && e.stack ? e.stack : e));
import { Site } from "../test/harness.mjs";
import * as app from "../lib/main.js";
import { stageNeed } from "../lib/data/realms.js";

const port = Number(process.argv[2] ?? 8787);
const site = new Site(Date.now() - 3 * 3600 * 1000);
// seed a few rivals so boards/arena have content
for (let i = 11; i <= 16; i++) {
  await site.call(i, "create", { name: ["青云子", "赤霞仙子", "铁牛", "顾寒", "白衣客", "老坛主"][i - 11] });
  site.setChar(i, (c) => { c.r = (i % 4); c.s = i % 3; c.ls = i * 700; c.season.ar = 900 + i * 23; c.season.ss = i * 7; c.path = ["jian", "fa", "ti", "xie", "dan", null][i - 11]; });
  await site.call(i, "home");
}
site.setChar(14, (c) => { c.r = 2; c.ls = 20000; });
await site.call(14, "sect.create", { name: "青云剑宗", desc: "一剑破万法" });
await site.tick();

const html = (uid) => {
  const ctx = { user: uid === null ? null : site.user(uid), state: {} };
  return app.webview(ctx, site.api(uid)).then((p) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>问道 preview</title><style>html,body{margin:0;background:#0b0f1a}${p.css}</style></head><body>${p.html}<script>
window.community={call:async function(method,params){const r=await fetch('/call?uid=${uid ?? ""}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:method,params:params||{}})});return r.json();}};
</script><script>${p.js}</script></body></html>`);
};

http.createServer(async (req, res) => {
  try {
  const url = new URL(req.url, "http://x");
  const uidRaw = url.searchParams.get("uid");
  const uid = uidRaw === "" || uidRaw === null ? null : Number(uidRaw);
  if (url.pathname === "/call" && req.method === "POST") {
    let body = ""; for await (const ch of req) body += ch;
    const { method, params } = JSON.parse(body || "{}");
    const out = await app.onMessage({ user: uid === null ? null : site.user(uid), state: {}, method, params, now: site.now }, site.api(uid));
    site.apply(uid, out.effects ?? []);
    res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ result: out.result, effects: out.effects }));
    return;
  }
  if (url.pathname === "/cheat") {
    // dev-only helpers for screenshots: ?what=trib|rich|dead
    const what = url.searchParams.get("what");
    if (uid !== null) await site.call(uid, "create", { name: "云中客" }); // no-op if the character exists
    site.setChar(uid, (c) => {
      if (what === "trib") { c.r = 0; c.s = 8; c.xp = stageNeed(0, 8); }
      if (what === "rich") { c.r = 2; c.s = 1; c.ls = 50000; c.xp = stageNeed(2, 1) * 0.6; c.inv.stack.m_lingcao = 20; c.inv.stack.m_tiekuang = 20; c.inv.stack.m_yaodan = 5; c.inv.stack.p_huixue = 5; c.inv.stack.t_huo = 3; c.path = "jian"; c.arts.push("a_jianqi", "a_metal"); c.eqArts = ["a_jianqi", "a_fire", "a_metal"]; c.wu = 6; }
      if (what === "dead") { c.born = site.now - 40 * 86400000; }
      if (what === "time") { site.advance(5 * 3600 * 1000); }
    });
    res.writeHead(302, { location: `/?uid=${uid}` }); res.end(); return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(await html(uid));
  } catch (e) {
    console.error("preview 500:", req.method, req.url, e && e.stack ? e.stack : e);
    try { res.writeHead(500, { "content-type": "application/json" }); res.end(JSON.stringify({ error: String(e && e.message || e) })); } catch {}
  }
}).listen(port, () => console.log(`preview: http://localhost:${port}/?uid=1  (guest: ?uid=)`));
