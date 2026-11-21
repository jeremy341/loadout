import { describe, expect, test } from "bun:test";
import { resolveAccess, type ReviewerAccess } from "./access";
import { groupStarts, matchRank, PALETTE_RECORD_CAP, paletteEntries, searchPalette, type PaletteEntry } from "./palette";

const who = (email: string, roles: string[]): ReviewerAccess => {
  const access = resolveAccess({ id: email, email }, { ownerEmails: ["owner@loadout.test"], roles });
  if (!access) throw new Error("expected access");
  return access;
};
const owner = who("owner@loadout.test", []);
const reviewer = who("r@loadout.test", ["reviewer"]);
const hardwareOnly = who("h@loadout.test", ["reviewer", "reviewer_hardware_only"]);
const helper = who("help@loadout.test", ["helper"]);
const fulfiller = who("ful@loadout.test", ["fulfiller"]);

const page = (label: string, group = "Pages", words = ""): PaletteEntry => ({ href: `/${label.toLowerCase()}`, label, group, words, record: false });
const record = (label: string, group: string): PaletteEntry => ({ href: `/x/${label}`, label, group, words: "", record: true });

describe("what each role may search", () => {
  test("an owner finds players, projects and ships as well as pages", () => {
    const groups = new Set(paletteEntries(owner).map((entry) => entry.group));
    for (const group of ["Pages", "Builders", "Projects", "Ships", "Orders", "Tickets"]) expect(groups.has(group)).toBe(true);
  });

  test("a reviewer finds projects and ships, never players, orders or tickets", () => {
    const groups = new Set(paletteEntries(reviewer).map((entry) => entry.group));
    expect(groups.has("Projects")).toBe(true);
    expect(groups.has("Ships")).toBe(true);
    for (const group of ["Builders", "Orders", "Tickets"]) expect(groups.has(group)).toBe(false);
  });

  test("a hardware-only reviewer finds hardware ships only", () => {
    const ships = paletteEntries(hardwareOnly).filter((entry) => entry.group === "Ships");
    expect(ships.length).toBeGreaterThan(0);
    expect(ships.length).toBeLessThan(paletteEntries(reviewer).filter((entry) => entry.group === "Ships").length);
    expect(ships.every((entry) => entry.words.includes("hardware"))).toBe(true);
  });

  test("a helper finds tickets and a fulfiller finds orders, and nothing about people or ships", () => {
    expect(new Set(paletteEntries(helper).map((entry) => entry.group))).toEqual(new Set(["Pages", "Tickets"]));
    expect(new Set(paletteEntries(fulfiller).map((entry) => entry.group))).toEqual(new Set(["Pages", "Orders"]));
  });

  test("every address is root-relative and none holds the internal prefix", () => {
    for (const entry of paletteEntries(owner)) {
      expect(entry.href.startsWith("/")).toBe(true);
      expect(entry.href).not.toMatch(/^\/reviewer(\/|$)/);
    }
  });
});

describe("search", () => {
  const entries = [page("Overview"), page("Projects"), page("Players", "Pages", "people"), record("Projector lamp", "Projects"), record("Project clock", "Projects")];

  test("no query lists every page and no record", () => {
    expect(searchPalette(entries, "").map((entry) => entry.label)).toEqual(["Overview", "Projects", "Players"]);
  });

  test("one letter finds pages only; two find records too", () => {
    expect(searchPalette(entries, "p").every((entry) => !entry.record)).toBe(true);
    expect(searchPalette(entries, "pr").some((entry) => entry.record)).toBe(true);
  });

  test("a word of the extra text matches", () => {
    expect(searchPalette(entries, "people").map((entry) => entry.label)).toEqual(["Players"]);
  });

  test("every typed word must match, in any order", () => {
    expect(searchPalette(entries, "clock project").map((entry) => entry.label)).toEqual(["Project clock"]);
    expect(searchPalette(entries, "zzz")).toEqual([]);
  });

  test("a label that starts with the query ranks above one that only contains it", () => {
    expect(matchRank(page("Reports"), "rep")).toBe(0);
    expect(matchRank(page("Team reports"), "rep")).toBe(1);
    expect(matchRank(page("Prepared"), "rep")).toBe(2);
    expect(matchRank(page("Bans", "Pages", "reports"), "rep")).toBe(3);
    expect(matchRank(page("Bans"), "rep")).toBeNull();
    // Two letters must start a word: "ke" is kestrel, not Tickets.
    expect(matchRank(page("Kestrel42"), "ke")).toBe(0);
    expect(matchRank(page("Tickets"), "ke")).toBeNull();
    expect(matchRank(page("Tickets"), "ick")).toBe(2);
  });

  test("a kind of record is capped so it cannot bury the pages", () => {
    const many = Array.from({ length: 12 }, (_, index) => record(`Lamp ${index}`, "Projects"));
    expect(searchPalette([page("Lamps"), ...many], "lamp").filter((entry) => entry.record)).toHaveLength(PALETTE_RECORD_CAP);
  });

  test("results keep each heading together", () => {
    const mixed = [page("Alpha"), page("Alpha two", "Admin"), record("Alpha one", "Players"), record("Alpha three", "Players")];
    const groups = searchPalette(mixed, "alpha").map((entry) => entry.group);
    expect(groups).toEqual(["Pages", "Admin", "Players", "Players"]);
    const starts = groupStarts(searchPalette(mixed, "alpha"));
    expect([...starts]).toEqual([0, 1, 2]);
  });

  test("the limit and a very long query are both safe", () => {
    expect(searchPalette(entries, "", 2)).toHaveLength(2);
    expect(searchPalette(entries, "x".repeat(500))).toEqual([]);
  });

  test("on the real index, an owner can type a handle, a ship or a page name", () => {
    const real = paletteEntries(owner);
    expect(searchPalette(real, "kestrel")[0].group).toBe("Builders");
    expect(searchPalette(real, "budget")[0].href).toBe("/budget");
    expect(searchPalette(real, "sh-2041")[0].href).toBe("/review/sh-2041");
  });
});
