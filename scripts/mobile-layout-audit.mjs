import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = ["src/routes", "src/components"];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) files.push(rel);
  }
}
for (const target of targets) walk(target);

const rules = [
  { name: "large fixed width", re: /(?:w|min-w|max-w)-\[[0-9]{3,}px\]/g },
  { name: "fixed viewport width", re: /w-(?:screen|full)\b/g },
  { name: "nowrap text", re: /whitespace-nowrap/g },
  { name: "horizontal overflow", re: /overflow-x-(?:auto|scroll|visible)/g },
  { name: "absolute viewport positioning", re: /(?:left|right)-\[[0-9]{2,}px\]/g },
];
const findings = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const rule of rules) {
    for (const match of text.matchAll(rule.re)) {
      const line = text.slice(0, match.index).split("\n").length;
      findings.push({ file, line, rule: rule.name, match: match[0] });
    }
  }
}

const requiredShellGuards = [
  ["src/routes/_authenticated/route.tsx", /overflow-x-hidden/],
  ["src/routes/_authenticated/route.tsx", /min-w-0/],
  ["src/components/ui/sidebar.tsx", /overflow-y-auto/],
  ["src/components/ui/sidebar.tsx", /min-h-0/],
  ["src/components/app-sidebar.tsx", /isMoneyCenterRoute/],
  ["src/components/app-sidebar.tsx", /!isMobile && state === "collapsed"/],
  ["src/routes/shop.products.tsx", /max-w-\[min\(78vw,24rem\)\]/],
  ["src/components/storefront/ProductCard.tsx", /Order now/],
];
const missing = requiredShellGuards
  .filter(([file, re]) => !re.test(fs.readFileSync(path.join(root, file), "utf8")))
  .map(([file, re]) => ({ file, expected: String(re) }));

console.log(
  JSON.stringify(
    {
      scannedFiles: files.length,
      suspiciousFindings: findings,
      requiredGuardFailures: missing,
      status: missing.length ? "FAIL" : "PASS",
    },
    null,
    2,
  ),
);
if (missing.length) process.exit(1);
