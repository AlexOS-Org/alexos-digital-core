#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const base = process.argv[2] ?? "origin/main";
const tracked = execFileSync("git", ["diff", "--name-only", base], { encoding: "utf8" });
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
  encoding: "utf8",
});
const changed = [...new Set(`${tracked}\n${untracked}`.split(/\r?\n/).filter(Boolean))];

// This guard protects the *public-facing DailyGear storefront*. The
// authenticated admin commerce layer (src/lib/dailygear/*) is deliberately
// excluded so the owner can manage products, pricing, variants, stock and
// readiness without putting the customer-facing surface at risk.
const protectedPatterns = [
  /^src\/routes\/shop\./,
  /^src\/routes\/funnel\.\$slug\.tsx$/,
  /^src\/components\/storefront\//,
  /^src\/styles\.css$/,
  /^public\/storefront\//,
];

// Explicitly approved public-file changes. Phase 2 intentionally builds the
// reusable Premium Product Function on the existing product page. Every new
// approved path must be justified in code review and covered by a test here.
const approvedPublicPaths = [/^src\/routes\/shop\.product\.\$id\.tsx$/];

const violations = changed.filter(
  (file) =>
    protectedPatterns.some((pattern) => pattern.test(file)) &&
    !approvedPublicPaths.some((pattern) => pattern.test(file)),
);

console.log(`Base ref: ${base}`);
console.log(`Changed files inspected: ${changed.length}`);
console.log(`Protected public files changed: ${violations.length}`);

if (violations.length) {
  console.error("Public storefront immutability check failed:");
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log("PASS: protected public storefront paths remain untouched.");
