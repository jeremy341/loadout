import { describe, expect, test } from "bun:test";
import { parseProjectTab, PROJECT_TABS, projectTabHref, shipChecksLeft, shipChecksLine } from "./project-tabs";

describe("parseProjectTab", () => {
  test("reads each tab in any case", () => {
    expect(parseProjectTab("ship")).toBe("ship");
    expect(parseProjectTab(" SETTINGS ")).toBe("settings");
    expect(parseProjectTab(["toolbelt", "x"])).toBe("toolbelt");
    expect(parseProjectTab("preview")).toBe("journal");
  });
  test("unknown or missing falls back to Journal", () => {
    for (const raw of [undefined, "", "zzz", "visitor-view", [], ["nope"]]) expect(parseProjectTab(raw as string | string[] | undefined)).toBe("journal");
  });
  test("the tabs are in the order shown", () => {
    expect(PROJECT_TABS.map((tab) => tab.label)).toEqual(["Journal", "Ship", "Toolbelt", "Settings"]);
  });
});

describe("projectTabHref", () => {
  test("the default tab has no query", () => {
    expect(projectTabHref("/dashboard/projects/p1", "journal")).toBe("/dashboard/projects/p1");
    expect(projectTabHref("/dashboard/projects/p1", "settings")).toBe("/dashboard/projects/p1?tab=settings");
  });
});

describe("ship checks line", () => {
  test("counts failing checks only", () => {
    expect(shipChecksLeft([{ state: "pass" }, { state: "fail" }, { state: "waiting" }, { state: "fail" }])).toBe(2);
    expect(shipChecksLeft([])).toBe(0);
  });
  test("says how many are left and says nothing when none are", () => {
    expect(shipChecksLine(1)).toBe("1 ship check left.");
    expect(shipChecksLine(3)).toBe("3 ship checks left.");
    expect(shipChecksLine(0)).toBeNull();
    expect(shipChecksLine(Number.NaN)).toBeNull();
  });
});
