import { describe, expect, test } from "bun:test";
import { hoursToOre } from "./ledger";
import {
  checkLapseUrl,
  checkPhotoAlt,
  draftKey,
  joinHours,
  oreEstimate,
  oreEstimateLine,
  photoRuleApplies,
  photosNeeded,
  previewEntry,
  splitHours,
  uncoveredHours,
} from "./journal-writer";

describe("photosNeeded", () => {
  test("one photo per 4 hours, at least one, counted to 12 hours", () => {
    expect(photosNeeded(0.25)).toBe(1);
    expect(photosNeeded(4)).toBe(1);
    expect(photosNeeded(4.25)).toBe(2);
    expect(photosNeeded(8)).toBe(2);
    expect(photosNeeded(8.25)).toBe(3);
    expect(photosNeeded(12)).toBe(3);
  });
  test("over the cap still counts as 12 hours, and bad input counts as one photo", () => {
    expect(photosNeeded(20)).toBe(3);
    expect(photosNeeded(0)).toBe(1);
    expect(photosNeeded(Number.NaN)).toBe(1);
    expect(photosNeeded(-3)).toBe(1);
  });
});

describe("Ore estimate", () => {
  test("10 Ore per approved hour, rounded like the ledger", () => {
    expect(oreEstimate(1)).toBe(10);
    expect(oreEstimate(2.5)).toBe(25);
    expect(oreEstimate(0.25)).toBe(hoursToOre(0.25));
    expect(oreEstimate(1.75)).toBe(hoursToOre(1.75));
    expect(oreEstimate(Number.NaN)).toBe(0);
  });
  test("only the owner gets the line, and only when there are hours", () => {
    expect(oreEstimateLine(2.5, true)).toBe("About 25 Ore once approved.");
    expect(oreEstimateLine(2.5, false)).toBeNull();
    expect(oreEstimateLine(0, true)).toBeNull();
    expect(oreEstimateLine(Number.NaN, true)).toBeNull();
  });
});

describe("hours helpers", () => {
  test("split and join round trip in quarter hours", () => {
    expect(splitHours(2.75)).toEqual({ hours: 2, minutes: 45 });
    expect(joinHours(2, 45)).toBe(2.75);
    expect(joinHours("", "0")).toBe(0);
    expect(joinHours("x", "15")).toBe(0.25);
  });
  test("uncovered hours count this entry and each entry covers 8", () => {
    expect(uncoveredHours(0, 0, 3)).toBe(0);
    expect(uncoveredHours(10, 1, 6)).toBe(0);
    expect(uncoveredHours(20, 1, 4)).toBe(8);
    expect(uncoveredHours(0, 0, 0)).toBe(0);
  });
});

describe("alt text and Lapse rules", () => {
  test("alt text is required and capped", () => {
    expect(checkPhotoAlt("  A   board on a desk ")).toEqual({ ok: true, value: "A board on a desk" });
    expect(checkPhotoAlt("   ").ok).toBe(false);
    expect(checkPhotoAlt(undefined).ok).toBe(false);
    expect(checkPhotoAlt("x".repeat(201)).ok).toBe(false);
  });
  test("a Lapse link is optional, https and on lapse.hackclub.com", () => {
    expect(checkLapseUrl("")).toEqual({ ok: true, value: null });
    expect(checkLapseUrl("https://lapse.hackclub.com/timelapse/abc_123/")).toEqual({ ok: true, value: "https://lapse.hackclub.com/timelapse/abc_123" });
    expect(checkLapseUrl("http://lapse.hackclub.com/timelapse/abc").ok).toBe(false);
    expect(checkLapseUrl("https://evil.example/timelapse/abc").ok).toBe(false);
    expect(checkLapseUrl("javascript:alert(1)").ok).toBe(false);
  });
});

describe("previewEntry", () => {
  const date = new Date("2026-11-17T10:00:00Z");
  test("builds what a visitor reads and carries no Ore or Lapse", () => {
    const model = previewEntry({ title: "  Wired   the board ", body: "Soldered it.", hours: 2.5, date, photos: [{ id: "p1", alt: "Board", width: 10, height: 5 }] });
    expect(model.title).toBe("Wired the board");
    expect(model.hoursText).toBe("2.5 hours logged");
    expect(model.dateIso).toBe(date.toISOString());
    expect(model.empty).toBe(false);
    expect(model.photos).toHaveLength(1);
    expect(JSON.stringify(model)).not.toMatch(/ore|lapse/i);
  });
  test("an empty title and body get plain fallbacks", () => {
    const model = previewEntry({ title: " ", body: "  ", hours: 1, date });
    expect(model.title).toBe("Untitled entry");
    expect(model.empty).toBe(true);
    expect(model.hoursText).toBe("1 hour logged");
  });
});

test("the photo rule fails closed when the set day is missing or invalid", () => {
  const entry = new Date("2026-12-02T00:00:00Z");
  // With no usable cutoff the rule covers every entry, so the uploads-on gate still checks photos instead of passing them all.
  expect(photoRuleApplies(entry, {})).toBe(true);
  expect(photoRuleApplies(entry, { LOADOUT_PHOTO_RULE_FROM: "not-a-date" })).toBe(true);
  // A real cutoff still limits the rule to entries created on or after that day.
  expect(photoRuleApplies(entry, { LOADOUT_PHOTO_RULE_FROM: "2026-12-01" })).toBe(true);
  expect(photoRuleApplies(new Date("2026-11-30T00:00:00Z"), { LOADOUT_PHOTO_RULE_FROM: "2026-12-01" })).toBe(false);
});

test("the draft key is per project and per entry", () => {
  expect(draftKey("p1")).toBe("loadout-journal-draft:p1:new");
  expect(draftKey("p1", "e1")).toBe("loadout-journal-draft:p1:e1");
});
