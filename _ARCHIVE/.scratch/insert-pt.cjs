const fs = require("fs");
const path = require("path");
const htmlPath = path.join(__dirname, "..", "demo", "gaming-dashboard.html");
const insPath = path.join(__dirname, "pt-locale-insert.txt");
let html = fs.readFileSync(htmlPath, "utf8");
const ins = fs.readFileSync(insPath, "utf8").trimEnd();
const needle =
  '          "sc.vendorPsp.short": "Proveedor · incid. PSP"\r\n        }\r\n      };';
const needleLf =
  '          "sc.vendorPsp.short": "Proveedor · incid. PSP"\n        }\n      };';
let idx = html.indexOf(needle);
if (idx === -1) idx = html.indexOf(needleLf);
if (idx === -1) {
  console.error("needle not found");
  process.exit(1);
}
const replacement =
  '          "sc.vendorPsp.short": "Proveedor · incid. PSP"\n        },\n\n' +
  ins +
  "\n      };";
if (html.includes(needle)) {
  html = html.replace(needle, replacement);
} else {
  html = html.replace(needleLf, replacement);
}
fs.writeFileSync(htmlPath, html);
console.log("insert-pt: ok");
