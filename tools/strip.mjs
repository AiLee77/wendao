// Strip comments, leading indentation and blank lines from JS source while copying strings,
// template literals (with nested ${}) and regex literals verbatim. Keeps the bundle small without
// touching the webview client (which lives inside template literals).
export function strip(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let lineStart = true;
  const prevSig = () => {
    for (let k = out.length - 1; k >= 0; k--) { const ch = out[k]; if (ch !== " " && ch !== "\t") return ch; }
    return "";
  };
  const regexAllowed = () => {
    const p = prevSig();
    if (p === "" || "(,=:[!&|?{};+-*%<>~^\n".includes(p)) return true;
    return /(?:^|[^\w$])(?:return|typeof|case|do|else|in|of|void|throw|new|delete)$/.test(out.slice(-12));
  };
  const skipQuoted = (j, q) => { j++; while (j < n && src[j] !== q) { if (src[j] === "\\") j++; j++; } return j + 1; };
  const skipTemplate = (j) => {
    j++;
    let depth = 0;
    while (j < n) {
      const ch = src[j];
      if (ch === "\\") { j += 2; continue; }
      if (depth === 0 && ch === "`") return j + 1;
      if (depth === 0 && ch === "$" && src[j + 1] === "{") { depth = 1; j += 2; continue; }
      if (depth > 0) {
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        else if (ch === "`") { j = skipTemplate(j); continue; }
        else if (ch === "\"" || ch === "'") { j = skipQuoted(j, ch); continue; }
      }
      j++;
    }
    return n;
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (lineStart) {
      if (c === " " || c === "\t" || c === "\r" || c === "\n") { i++; continue; }
      lineStart = false;
    }
    if (c === "/" && d === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && d === "*") { const e = src.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === "\n") { out += "\n"; i++; lineStart = true; continue; }
    if (c === " " || c === "\t") {
      // collapse runs; drop the space when it touches punctuation — never between two word chars,
      // never next to quotes/backticks/dots/slashes, never between two +/- signs
      let j = i;
      while (j < n && (src[j] === " " || src[j] === "\t")) j++;
      const p = out[out.length - 1] ?? "", q = src[j] ?? "";
      const W = /[\w$]/, P = /[(){}\[\];,=<>!&|?:+\-*%^~]/;
      const keep = !(P.test(p) || P.test(q)) || (W.test(p) && W.test(q)) || ((p === "+" || p === "-") && (q === "+" || q === "-")) || p === "/" || q === "/";
      if (keep) out += " ";
      i = j;
      continue;
    }
    if (c === "\"" || c === "'") { const j = skipQuoted(i, c); out += src.slice(i, j); i = j; continue; }
    if (c === "`") { const j = skipTemplate(i); out += src.slice(i, j); i = j; continue; }
    if (c === "/" && regexAllowed()) {
      let j = i + 1, cls = false;
      while (j < n) {
        const ch = src[j];
        if (ch === "\\") { j += 2; continue; }
        if (ch === "\n") break;
        if (cls) { if (ch === "]") cls = false; }
        else if (ch === "[") cls = true;
        else if (ch === "/") break;
        j++;
      }
      j++;
      while (j < n && /[a-z]/i.test(src[j])) j++;
      out += src.slice(i, j); i = j; continue;
    }
    out += c; i++;
  }
  return out;
}
