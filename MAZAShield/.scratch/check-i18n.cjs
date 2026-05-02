const fs = require("fs");

const html = fs.readFileSync("demo/gaming-dashboard.html", "utf8");
const src = fs.readFileSync("./.scratch/i18n.js", "utf8");
const obj = eval(
  "(" + src.replace(/^module\.exports=/, "").replace(/;\s*;\s*$/, "") + ")"
);
const enKeys = Object.keys(obj.en);
const enS = new Set(enKeys);
const baseEn = new Set(enKeys.map((k) => k.replace(/_(one|other)$/, "")));

// Static keys via data-i18n / data-i18n-attr
const staticUsed = new Set();
const reStatic = /data-i18n(?:-attr)?="([^"]+)"/g;
let m;
while ((m = reStatic.exec(html))) {
  const v = m[1];
  if (v.includes(":")) {
    // Pattern: "attr:key attr2:key2"
    v.split(/\s+/).forEach((p) => {
      const i = p.indexOf(":");
      if (i > -1) staticUsed.add(p.slice(i + 1));
    });
  } else {
    staticUsed.add(v);
  }
}
console.log("static keys used:", staticUsed.size);
const staticMissing = [...staticUsed].filter((k) => !enS.has(k) && !baseEn.has(k));
console.log("static missing from EN dict:", staticMissing);

// Dynamic keys via t("...")
const tUsed = new Set();
const reT = /\bt\(\s*["']([\w.+\-]+)["']/g;
let m2;
while ((m2 = reT.exec(html))) tUsed.add(m2[1]);
console.log("dynamic t() keys used:", tUsed.size);
const tMissing = [...tUsed].filter((k) => !enS.has(k) && !baseEn.has(k));
console.log("dynamic missing from EN dict:", tMissing);

// Reverse: dictionary keys never referenced anywhere
const allRefs = new Set([...staticUsed, ...tUsed]);
const allBaseRefs = new Set([...allRefs].map((k) => k.replace(/_(one|other)$/, "")));
const orphanKeys = enKeys
  .map((k) => k.replace(/_(one|other)$/, ""))
  .filter((k, i, a) => a.indexOf(k) === i)
  .filter((k) => !allBaseRefs.has(k) && !allRefs.has(k));
console.log("dictionary keys never referenced:", orphanKeys.length, orphanKeys.slice(0, 30));
