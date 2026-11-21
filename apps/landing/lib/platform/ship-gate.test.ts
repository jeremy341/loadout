import { describe, expect, it } from "bun:test";
import { BUILDER_CODES, checkShip, firstTriggerBlocker, journalTextLength, journalTextNeeded, needsChangeNote, SHIP_CODES, type ShipContext, type ShipJournal, type ShipProject } from "./ship-gate";

const NOW = new Date("2026-11-17T12:00:00Z");
const good: ShipProject = {
  status: "draft",
  description: "A small tool that turns a messy log file into a clean table.",
  track: "Tools",
  repoUrl: "https://github.com/someone/log-table",
  demoUrl: null,
};
const entry = (hours = 2, length = 400): ShipJournal => ({ hours, body: "x".repeat(length) });
const codes = (project: ShipProject, journals: ShipJournal[], context: ShipContext = {}) => checkShip(project, journals, NOW, context).blockers.map((b) => b.code);
const ready: ShipContext = { attested: true, eligibilityRefusal: null };

describe("checkShip", () => {
  it("passes a complete project", () => {
    const result = checkShip(good, [entry()], NOW, ready);
    expect(result.ok).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it("lists blockers in checklist order", () => {
    const empty = { ...good, description: null, track: null, repoUrl: null };
    expect(codes(empty, [])).toEqual(["description_required", "track_required", "source_required", "journal_required", "eligibility_blocked", "attestation_required"]);
  });

  it("needs a description of 40 characters", () => {
    expect(codes({ ...good, description: "x".repeat(39) }, [entry()], ready)).toEqual(["description_required"]);
    expect(codes({ ...good, description: " ".repeat(10) + "x".repeat(40) + " " }, [entry()], ready)).toEqual([]);
    expect(checkShip({ ...good, description: "short" }, [entry()], NOW, ready).blockers[0].message).toContain("40 characters");
  });

  it("needs one of the four tracks", () => {
    expect(codes({ ...good, track: null }, [entry()], ready)).toEqual(["track_required"]);
    expect(codes({ ...good, track: "Games" }, [entry()], ready)).toEqual(["track_required"]);
    for (const track of ["Tools", "Systems", "Compute", "Hardware"]) expect(codes({ ...good, track }, [entry()], ready)).toEqual([]);
  });

  it("needs a public https source address", () => {
    expect(codes({ ...good, repoUrl: "" }, [entry()], ready)).toEqual(["source_required"]);
    expect(codes({ ...good, repoUrl: "http://github.com/a/b" }, [entry()], ready)).toEqual(["source_invalid"]);
    expect(codes({ ...good, repoUrl: "https://localhost/a" }, [entry()], ready)).toEqual(["source_invalid"]);
  });

  it("treats the demo as optional but checks it when given", () => {
    expect(codes({ ...good, demoUrl: "" }, [entry()], ready)).toEqual([]);
    expect(codes({ ...good, demoUrl: "https://demo.example.dev/app" }, [entry()], ready)).toEqual([]);
    expect(codes({ ...good, demoUrl: "ftp://x.dev" }, [entry()], ready)).toEqual(["demo_invalid"]);
  });

  it("needs a journal entry with 100 characters per logged hour", () => {
    expect(codes(good, [], ready)).toEqual(["journal_required"]);
    expect(codes(good, [entry(1, 99)], ready)).toEqual(["journal_too_short"]);
    expect(codes(good, [entry(1, 100)], ready)).toEqual([]);
    expect(codes(good, [entry(0.25, 100)], ready)).toEqual([]);
    expect(codes(good, [entry(4, 399)], ready)).toEqual(["journal_too_short"]);
    expect(codes(good, [entry(4, 400)], ready)).toEqual([]);
  });

  it("does not count image embeds as text", () => {
    const body = "x".repeat(60) + "![shot](https://img.example.dev/" + "a".repeat(200) + ".png)";
    expect(codes(good, [{ hours: 1, body }], ready)).toEqual(["journal_too_short"]);
  });

  it("makes the 8 hour rule a blocker at submit", () => {
    expect(codes(good, [entry(8, 800)], ready)).toEqual([]);
    expect(codes(good, [entry(12, 1200)], ready)).toEqual(["journal_due"]);
    expect(codes(good, [entry(12, 1200), entry(1, 100)], ready)).toEqual([]);
  });

  it("holds eligibility and the tick", () => {
    const refused: ShipContext = { attested: true, eligibilityRefusal: "We need your birthday." };
    expect(codes(good, [entry()], refused)).toEqual(["eligibility_blocked"]);
    expect(checkShip(good, [entry()], NOW, refused).blockers[0].message).toBe("We need your birthday.");
    expect(codes(good, [entry()], { attested: false })).toEqual(["eligibility_blocked", "attestation_required"]);
    expect(codes(good, [entry()])).toEqual(["eligibility_blocked", "attestation_required"]);
  });

  it("waits for the README text and never blocks on it", () => {
    const item = checkShip(good, [entry()], NOW, ready).items.find((i) => i.code === "readme_waiting");
    expect(item?.state).toBe("waiting");
    expect(item?.message).toBe("The README can't be read from this source address yet. It does not block you.");
  });

  it("blocks on README text that is too short or empty", () => {
    expect(codes(good, [entry()], { ...ready, readmeText: "too few words" })).toEqual(["readme_too_short"]);
    expect(codes(good, [entry()], { ...ready, readmeText: "" })).toEqual(["readme_missing"]);
    expect(codes(good, [entry()], { ...ready, readmeText: Array(120).fill("word").join(" ") })).toEqual([]);
  });

  it("marks uploads, Hackatime, Lapse and the bill of materials as waiting without blocking", () => {
    const software = checkShip(good, [entry()], NOW, ready).items;
    expect(software.filter((i) => i.state === "waiting").map((i) => i.code)).toEqual(["images_waiting", "readme_waiting", "hackatime_waiting"]);
    const hardware = checkShip({ ...good, track: "Hardware" }, [entry()], NOW, ready);
    expect(hardware.ok).toBe(true);
    expect(hardware.items.filter((i) => i.state === "waiting").map((i) => i.code)).toEqual(["images_waiting", "readme_waiting", "lapse_waiting", "bom_waiting"]);
    expect(hardware.items.find((i) => i.code === "bom_waiting")?.message).toContain("Waiting for the bill of materials");
  });

  it("refuses a locked project first", () => {
    for (const status of ["submitted", "in-review", "second-pass", "approved", "banned"]) {
      expect(codes({ ...good, status }, [entry()], ready)).toEqual(["status_locked"]);
    }
    expect(codes({ ...good, status: "logging" }, [entry()], ready)).toEqual([]);
  });

  it("needs a 100 character change note after needs-changes, on an update and on a repeat resubmit", () => {
    const note = "n".repeat(100);
    expect(codes({ ...good, status: "needs-changes" }, [entry()], ready)).toEqual(["change_note_required"]);
    expect(codes({ ...good, status: "needs-changes" }, [entry()], { ...ready, changeNote: "n".repeat(99) })).toEqual(["change_note_required"]);
    expect(codes({ ...good, status: "needs-changes" }, [entry()], { ...ready, changeNote: note })).toEqual([]);
    expect(codes({ ...good, isUpdate: true }, [entry(3)], ready)).toEqual(["change_note_required"]);
    expect(codes({ ...good, resubmitCount: 1 }, [entry()], ready)).toEqual(["change_note_required"]);
    expect(needsChangeNote(good)).toBe(false);
  });

  it("refuses an update with fewer than 2.5 new hours, counting from the prior approved minutes", () => {
    const update = { ...good, isUpdate: true };
    const note = "n".repeat(100);
    // 4 hours logged in all, 2 hours (120 minutes) already approved: 2 new hours, short by half an hour.
    const short = checkShip(update, [entry(4, 500)], NOW, { ...ready, changeNote: note, priorApprovedMinutes: 120 });
    expect(short.blockers.map((b) => b.code)).toEqual(["update_minimum"]);
    expect(short.blockers[0].message).toContain("2.5 new hours");
    // 4.5 hours in all: exactly 2.5 new hours passes.
    expect(codes(update, [entry(4.5, 500)], { ...ready, changeNote: note, priorApprovedMinutes: 120 })).toEqual([]);
    // No prior minutes: the whole journal counts.
    expect(codes(update, [entry(2, 300)], { ...ready, changeNote: note })).toEqual(["update_minimum"]);
    // A reviewed entry's claimed hours can exceed what the reviewer kept. Only kept minutes count as new work.
    const partiallyKept: ShipJournal = { ...entry(4, 500), keptMinutes: 120 };
    expect(codes(update, [partiallyKept], { ...ready, changeNote: note, priorApprovedMinutes: 120 })).toEqual(["update_minimum"]);
  });

  it("keeps Pixl's rule for a resubmit after needs changes: no hour minimum", () => {
    const note = "n".repeat(100);
    expect(codes({ ...good, status: "needs-changes" }, [entry(1, 300)], { ...ready, changeNote: note, priorApprovedMinutes: 600 })).toEqual([]);
  });

  it("only uses documented codes", () => {
    const result = checkShip({ ...good, track: "Hardware", status: "needs-changes" }, [entry(12, 10)], NOW, { readmeText: "few" });
    for (const item of result.items) expect(SHIP_CODES).toContain(item.code);
  });
});

describe("firstTriggerBlocker", () => {
  it("skips the two codes the dialog clears", () => {
    expect(firstTriggerBlocker(checkShip(good, [entry()], NOW, ready))).toBeNull();
    expect(firstTriggerBlocker(checkShip({ ...good, status: "needs-changes" }, [entry()], NOW, ready))).toBeNull();
    const blocked = firstTriggerBlocker(checkShip({ ...good, description: null }, [entry()], NOW, ready));
    expect(blocked?.code).toBe("description_required");
    expect(BUILDER_CODES).toEqual(["attestation_required", "change_note_required"]);
  });
});

describe("journal text helpers", () => {
  it("needs 100 characters per hour, at least 100", () => {
    expect(journalTextNeeded(0.25)).toBe(100);
    expect(journalTextNeeded(1)).toBe(100);
    expect(journalTextNeeded(2.5)).toBe(250);
    expect(journalTextNeeded(Number.NaN)).toBe(100);
  });
  it("measures text without image embeds", () => {
    expect(journalTextLength("  hello ![a](https://x.dev/i.png) ")).toBe(5);
  });
  it("does not count invisible characters, emoji, markup or link addresses as writing", () => {
    expect(journalTextLength("😀".repeat(50))).toBe(0);
    expect(journalTextLength("\u200B".repeat(100))).toBe(0);
    expect(journalTextLength('<img src="data:image/png;base64,AAAA" />')).toBe(0);
    expect(journalTextLength("[a very long label](https://example.com/a/very/long/url)")).toBe(17);
  });
});

describe("the image check and the uploads flag", () => {
  const withPhotos = (hours: number, photos: number, photoRule = true): ShipJournal => ({ ...entry(hours), photos, photoRule });
  const onReady: ShipContext = { ...ready, uploadsOn: true };

  it("only waits while uploads are off, even with entries that have no photos", () => {
    const result = checkShip(good, [withPhotos(9, 0)], NOW, ready);
    expect(result.items.find((i) => i.code === "images_waiting")?.state).toBe("waiting");
    expect(result.items.some((i) => i.code === "journal_images")).toBe(false);
    expect(result.blockers.map((b) => b.code)).not.toContain("journal_images");
  });

  it("blocks when uploads are on and an entry has fewer photos than its hours need", () => {
    expect(codes(good, [withPhotos(2, 0)], onReady)).toContain("journal_images");
    expect(codes(good, [withPhotos(4.25, 1)], onReady)).toContain("journal_images");
    expect(codes(good, [withPhotos(8.25, 2)], onReady)).toContain("journal_images");
    expect(checkShip(good, [withPhotos(2, 0)], NOW, onReady).items.some((i) => i.code === "images_waiting")).toBe(false);
  });

  it("passes when each entry has the photos its hours need", () => {
    expect(codes(good, [withPhotos(4, 1)], onReady)).not.toContain("journal_images");
    expect(codes(good, [withPhotos(8, 2)], onReady)).not.toContain("journal_images");
    expect(codes(good, [withPhotos(12, 3)], onReady)).not.toContain("journal_images");
  });

  it("leaves out entries created before the rule starts", () => {
    expect(codes(good, [withPhotos(8, 0, false)], onReady)).not.toContain("journal_images");
    expect(codes(good, [entry()], onReady)).not.toContain("journal_images");
  });
});
