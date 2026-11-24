import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Eligibility depends only on Hack Club Auth's verification status; the app asks for the scopes in HCA_SCOPES and never reads a
// birthday. Nothing a participant can read may say otherwise.
const root = join(import.meta.dir, "..", "..");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("participant copy and Hack Club Auth scopes", () => {
  test("no participant page or component mentions a birthday", () => {
    const files = [...tsxFiles(join(root, "app", "(platform)")), ...tsxFiles(join(root, "app", "_components", "platform"))];
    expect(files.length).toBeGreaterThan(50);
    const hits = files.filter((file) => /birthday|birth date|date of birth/i.test(readFileSync(file, "utf8")));
    expect(hits).toEqual([]);
  });

  test("the Settings page names verification, not a birthday", () => {
    const text = readFileSync(join(root, "app", "(platform)", "dashboard", "(shell)", "settings", "page.tsx"), "utf8");
    expect(text).toContain("to refresh your verification status.");
  });

  test("the requested scopes do not include a birthday", async () => {
    const { HCA_SCOPES } = await import("./hca");
    expect(HCA_SCOPES.split(" ")).toEqual(["openid", "profile", "slack_id", "verification_status"]);
  });
});
