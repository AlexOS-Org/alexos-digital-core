import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { WEEKLY_MONEY_SUMMARY_CRON } from "./schedules";

const readRepositoryFile = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

it("keeps the weekly Money Center summary on Cloudflare Saturday at 17:00 UTC", () => {
  const wranglerConfig = readRepositoryFile("../../wrangler.jsonc");
  const workerHandler = readRepositoryFile("../server.ts");
  const sender = readRepositoryFile("../server/notifications/weekly-money-summary-email.ts");

  // Cloudflare Workers numbers weekdays 1=Sunday through 7=Saturday.
  expect(WEEKLY_MONEY_SUMMARY_CRON).toBe("0 17 * * SAT");
  expect(wranglerConfig).toContain(`"${WEEKLY_MONEY_SUMMARY_CRON}"`);
  expect(workerHandler).toContain("controller.cron === WEEKLY_MONEY_SUMMARY_CRON");
  expect(sender).toContain("WEEKLY_MONEY_SUMMARY_CRON");
});
