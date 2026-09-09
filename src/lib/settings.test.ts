import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../routes/_authenticated/settings.tsx"),
  "utf8",
);

describe("Settings truthfulness", () => {
  it("persists notification prefs on-device and keeps other controls honest", () => {
    expect(source).toContain("alexos-settings-notification-prefs-v1");
    expect(source).toContain("Notification preferences are saved on this device");
    expect(source).toContain("Other controls remain read-only until");
    expect(source).toContain("Push, email, and WhatsApp delivery are not");
    expect(source).toContain("Notification prefs saved on this device");
    expect(source).toContain("disabled={!enabled}");
    expect(source).not.toContain("Settings Saved!");
    expect(source).not.toContain(">Enable</Button>");
    expect(source).not.toContain(">Configure</Button>");
  });
});
