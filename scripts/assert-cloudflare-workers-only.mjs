import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const forbiddenTracked = trackedFiles.filter((file) =>
  /(^|\/)(netlify\.toml|\.netlify)(\/|$)/i.test(file),
);
if (forbiddenTracked.length > 0) {
  throw new Error(`Netlify deployment artifacts are tracked: ${forbiddenTracked.join(", ")}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const deployScript = packageJson.scripts?.deploy ?? "";
if (!/wrangler\s+deploy/.test(deployScript)) {
  throw new Error("The deploy script must invoke `wrangler deploy`.");
}

if (!existsSync("wrangler.jsonc")) {
  throw new Error("Missing wrangler.jsonc Cloudflare Workers manifest.");
}
const wranglerConfig = readFileSync("wrangler.jsonc", "utf8");
for (const required of [
  '"name": "alexos-business-os"',
  '"main": "src/server.ts"',
  '"compatibility_flags": ["nodejs_compat"]',
]) {
  if (!wranglerConfig.includes(required)) {
    throw new Error(`Cloudflare Workers manifest is missing: ${required}`);
  }
}

const productionWorkflow = readFileSync(".github/workflows/production-deploy.yml", "utf8");
for (const required of [
  "Deploy the verified main build to Cloudflare Workers",
  "run: npm run deploy",
]) {
  if (!productionWorkflow.includes(required)) {
    throw new Error(`Production workflow is missing: ${required}`);
  }
}

const deploymentSources = [
  "package.json",
  "wrangler.jsonc",
  ".github/workflows/production-deploy.yml",
  ".github/workflows/production-verify.yml",
  ".github/workflows/pr-verify.yml",
];
const netlifyReferences = deploymentSources.filter((file) =>
  /netlify|deploy-preview/i.test(readFileSync(file, "utf8")),
);
if (netlifyReferences.length > 0) {
  throw new Error(
    `Netlify references remain in deployment sources: ${netlifyReferences.join(", ")}`,
  );
}

console.log("PASS: Cloudflare Workers is the sole repository deployment target.");
