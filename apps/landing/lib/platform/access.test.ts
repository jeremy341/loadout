import { describe, expect, test } from "bun:test";
import { localTestAccountsEnabled, LOCAL_TEST_ACCOUNTS } from "./local-accounts";
import { PARTICIPANT_NAV } from "./nav";

describe("local test accounts", () => {
  test("are off unless the flag is set outside production", () => {
    expect(localTestAccountsEnabled({ LOADOUT_LOCAL_TEST_ACCOUNTS: "true", NODE_ENV: "development" })).toBe(true);
    expect(localTestAccountsEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(localTestAccountsEnabled({ LOADOUT_LOCAL_TEST_ACCOUNTS: "true", NODE_ENV: "production" })).toBe(false);
  });

  test("use only reserved .test addresses", () => {
    for (const account of LOCAL_TEST_ACCOUNTS) {
      expect(account.email.endsWith(".test")).toBe(true);
    }
  });
});

describe("navigation", () => {
  test("has the seven agreed tabs and a Docs link, and no You tab", () => {
    const labels = PARTICIPANT_NAV.flatMap((group) => group.items.map((item) => item.label));
    expect(labels).toEqual(["Overview", "Projects", "Shop", "Explore", "Community", "Expeditions", "Docs"]);
    expect(labels).not.toContain("Settings");
    expect(labels).not.toContain("Ship");
  });

  test("has no staff group and no reviewer, admin, events or referrals tab", () => {
    expect(PARTICIPANT_NAV.map((group) => group.label)).not.toContain("Staff");
    const items = PARTICIPANT_NAV.flatMap((group) => group.items);
    for (const item of items) {
      expect(item.href).not.toMatch(/review|staff|users|audit|flags|events|referrals/);
    }
  });

  test("every tab is a dashboard route, except the Docs link", () => {
    const items = PARTICIPANT_NAV.flatMap((group) => group.items);
    for (const item of items) {
      expect(item.href.startsWith(item.label === "Docs" ? "/docs/" : "/dashboard")).toBe(true);
    }
  });
});
