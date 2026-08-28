export const BIO_MAX = 45;
export function pushBio(bio, text, now, kind = "e") {
  const list = Array.isArray(bio) ? bio : [];
  list.push({ t: now, k: kind, v: String(text).slice(0, 120) });
  return list.slice(-BIO_MAX);
}

// 「踏上仙路」那行是在 create 时写下的，可玩家接着还能逆天改命换灵根 ——
// 不重写这行，年谱就永远停在最初那副根骨上，跟洞府里显示的对不上。
export function amendBorn(bio, text) {
  const list = Array.isArray(bio) ? bio : [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i]?.k === "born") { list[i] = { ...list[i], v: String(text).slice(0, 120) }; break; }
  }
  return list;
}

// 老存档里可能躺着上一版留下的 120 条。pushBio 只在「有新事发生」时才裁，
// 于是不触发事件的玩家会一直占着那份体积 —— 读到就裁一次。
export function trimBio(bio) {
  const list = Array.isArray(bio) ? bio : [];
  return list.length > BIO_MAX ? list.slice(-BIO_MAX) : list;
}
