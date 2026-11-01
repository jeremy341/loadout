import { describe, expect, test } from "bun:test";
import { localTestAccountsEnabled, LOCAL_TEST_ACCOUNTS } from "./local-accounts";
import { navFor, PARTICIPANT_NAV, STAFF_NAV } from "./nav";

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
  test("hides the staff group from participants", () => {
    const labels = navFor(false).map((group) => group.label);
    expect(labels).not.toContain("Staff");
  });

  test("shows the staff group only to staff", () => {
    expect(navFor(true)).toContain(STAFF_NAV);
  });

  test("has the six agreed tabs, a Docs link and no You tab", () => {
    const labels = PARTICIPANT_NAV.flatMap((group) => group.items.map((item) => item.label));
    expect(labels).toEqual(["Overview", "Projects", "Shop", "Explore", "Community", "Expeditions", "Docs"]);
    expect(labels).not.toContain("Settings");
    expect(labels).not.toContain("Ship");
  });

  test("every tab is a dashboard route, except the Docs link", () => {
    const items = navFor(true).flatMap((group) => group.items);
    for (const item of items) {
      expect(item.href.startsWith(item.label === "Docs" ? "/docs/" : "/dashboard")).toBe(true);
    }
  });
});
