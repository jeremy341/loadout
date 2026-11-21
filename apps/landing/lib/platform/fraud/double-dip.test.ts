import { describe, expect, test } from "bun:test";
import { buildDoubleDip, findInArchive, findInLoadout, fmtDate, hasBeenApproved, indexArchive, MAX_APPROVED_UNIX, normalizeProjectUrl, saneUnixSeconds, type OtherShip, type PriorEntry } from "./double-dip";

const REPO = "https://github.com/someone/thing";
const OWNER = "U0OWNER";

const prior = (program: string, hours: number, slackId = OWNER, extra: Partial<PriorEntry> = {}): PriorEntry => ({ url: REPO, program, hours, approvedAt: 1789344000, slackId, ...extra });

const input = (matches: PriorEntry[], over: Record<string, unknown> = {}) => ({
  project: { name: "Thing" },
  matches,
  trackedSeconds: 23.2 * 3600,
  collaborators: [],
  ownerLabel: "owner",
  ownerSlackId: OWNER,
  ...over,
});

const ship = (over: Partial<OtherShip> = {}): OtherShip => ({
  id: "other",
  title: "Older ship",
  status: "approved",
  repoUrl: REPO,
  demoUrl: null,
  approvedMinutes: 600,
  approvedAt: new Date("2026-11-01T00:00:00Z"),
  ownerSlackId: OWNER,
  ...over,
});

describe("normalizeProjectUrl", () => {
  test("treats scheme, www, trailing slash, .git and case as the same link", () => {
    const forms = ["https://github.com/Someone/Thing", "http://www.github.com/someone/thing/", "github.com/someone/thing.git"];
    expect(new Set(forms.map(normalizeProjectUrl)).size).toBe(1);
  });
  test("empty and placeholder values normalize to nothing", () => {
    for (const v of ["", "  ", "null", "undefined"]) expect(normalizeProjectUrl(v)).toBe("");
  });
});

describe("archive index", () => {
  const rows = [
    { ysws: "Arcade", hours: 5, approved_at: 1789344000, slack_id: "U0A", code_url: REPO, demo_url: "https://thing.example.com/" },
    { ysws: "Arcade", hours: 3, approved_at: 1789344001, slack_id: "U0B", code_url: REPO },
    { ysws: "Other", hours: 9, code_url: "https://github.com/else/where" },
  ];
  test("accepts a bare array, entries or data, and ignores anything else", () => {
    expect(indexArchive(rows).size).toBe(3);
    expect(indexArchive({ entries: rows }).size).toBe(3);
    expect(indexArchive({ data: rows }).size).toBe(3);
    expect(indexArchive({ nope: rows }).size).toBe(0);
    expect(indexArchive(null).size).toBe(0);
  });
  test("returns one entry per credited person for a shared link", () => {
    const found = findInArchive(indexArchive(rows), "http://github.com/someone/thing/", "");
    expect(found.map((m) => m.hours)).toEqual([5, 3]);
  });
  test("the repo link wins; the demo link is used only when the repo has no rows", () => {
    const index = indexArchive(rows);
    expect(findInArchive(index, "https://github.com/none/none", "https://thing.example.com").map((m) => m.hours)).toEqual([5]);
    expect(findInArchive(index, REPO, "https://thing.example.com").map((m) => m.hours)).toEqual([5, 3]);
    expect(findInArchive(index, "", "").length).toBe(0);
  });

  test("insane approved_at values become null; a valid value is kept as whole seconds", () => {
    expect(saneUnixSeconds(1789344000)).toBe(1789344000);
    expect(saneUnixSeconds("1789344000")).toBe(1789344000);
    expect(saneUnixSeconds(1789344000.9)).toBe(1789344000);
    expect(saneUnixSeconds(MAX_APPROVED_UNIX)).toBe(MAX_APPROVED_UNIX);
    for (const value of [Infinity, -Infinity, NaN, 1e20, -1, 0, "abc", null, undefined, {}]) {
      expect(saneUnixSeconds(value)).toBeNull();
    }
    const index = indexArchive([
      { ysws: "Arcade", hours: 5, approved_at: 1e309, code_url: REPO },
      { ysws: "Arcade", hours: 5, approved_at: 1e20, code_url: "https://github.com/else/where" },
      { ysws: "Arcade", hours: 5, approved_at: "1789344000", code_url: "https://github.com/ok/thing" },
    ]);
    expect(findInArchive(index, REPO, "")[0].approvedAt).toBeNull();
    expect(findInArchive(index, "https://github.com/else/where", "")[0].approvedAt).toBeNull();
    expect(findInArchive(index, "https://github.com/ok/thing", "")[0].approvedAt).toBe(1789344000);
  });
});

describe("fmtDate", () => {
  test("formats a sane timestamp and never throws on malformed or extreme ones", () => {
    expect(fmtDate(1789344000)).toBe("2026-09-14");
    for (const value of [null, undefined, NaN, Infinity, -Infinity, 1e20, -1e20]) {
      expect(() => fmtDate(value as number | null)).not.toThrow();
      expect(fmtDate(value as number | null)).toBe("unknown date");
    }
  });

  test("a hand-built entry with an extreme approved_at still renders the note", () => {
    const r = buildDoubleDip(input([prior("Arcade", 1, OWNER, { approvedAt: 1e20 })]));
    expect(r.systemNote).toContain("approved unknown date");
  });
});

describe("findInLoadout", () => {
  const self = { id: "me", repoUrl: REPO, demoUrl: "" };
  test("matches an approved ship with the same link in any spelling", () => {
    const found = findInLoadout(self, [ship({ repoUrl: "http://www.github.com/Someone/Thing.git/" })]);
    expect(found.length).toBe(1);
    expect(found[0].hours).toBe(10);
    expect(found[0].program).toBe("LOADOUT");
  });
  test("never matches the same project (that is an update ship, not a double dip)", () => {
    expect(findInLoadout(self, [ship({ id: "me" })])).toEqual([]);
  });
  test("an unapproved ship is not credited work", () => {
    expect(findInLoadout(self, [ship({ status: "second-pass", approvedMinutes: 0 })])).toEqual([]);
  });
  test("an approved ship open again as an update still counts through its banked minutes", () => {
    expect(findInLoadout(self, [ship({ status: "draft", approvedMinutes: 120 })]).length).toBe(1);
  });
  test("hasBeenApproved reads status spellings, and never counts an unknown status", () => {
    expect(hasBeenApproved({ status: "APPROVED", approvedMinutes: 0 })).toBe(true);
    expect(hasBeenApproved({ status: "banned", approvedMinutes: 0 })).toBe(false);
  });
  test("an invalid approval date becomes null rather than a throwing timestamp", () => {
    const found = findInLoadout(self, [ship({ approvedAt: new Date("not-a-date") })]);
    expect(found.length).toBe(1);
    expect(found[0].approvedAt).toBeNull();
  });
  test("the demo link matches only when set and equal", () => {
    const withDemo = { id: "me", repoUrl: "", demoUrl: "https://thing.example.com" };
    expect(findInLoadout(withDemo, [ship({ repoUrl: null, demoUrl: "https://thing.example.com/" })]).length).toBe(1);
    expect(findInLoadout({ id: "me", repoUrl: "", demoUrl: "" }, [ship({ repoUrl: null, demoUrl: null })]).length).toBe(0);
  });
});

describe("buildDoubleDip", () => {
  test("no matches means no note and no flag", () => {
    expect(buildDoubleDip(input([]))).toEqual({ systemNote: "" });
  });

  test("subtracts every prior entry for a person, not just the first", () => {
    const r = buildDoubleDip(input([prior("Arcade", 1), prior("Arcade", 11)]));
    expect(r.systemNote).toContain("claims 23.2h here");
    expect(r.systemNote).toContain("got 12h before");
    expect(r.systemNote).toContain("at most 11.2h");
  });

  test("an archive match is flagged as undisclosed, with only the outside hours in the flag", () => {
    const r = buildDoubleDip(input([prior("LOADOUT", 2), prior("Summer of Making", 5)]));
    expect(r.systemNote).toContain('under "Summer of Making"');
    expect(r.systemNote).toContain("did NOT disclose");
    expect(r.flagDetail).toContain("Summer of Making, 5h");
    expect(r.flagDetail).not.toContain("2h");
  });

  test("a disclosed other program names that program and is not flagged", () => {
    const r = buildDoubleDip(input([prior("Arcade", 5)], { otherYsws: true }));
    expect(r.systemNote).toContain('Builder disclosed this was submitted to "Arcade"');
    expect(r.flagDetail).toBeUndefined();
  });

  test("another LOADOUT ship is flagged and names that ship", () => {
    const r = buildDoubleDip(input([prior("LOADOUT", 10, OWNER, { title: "Older ship" })]));
    expect(r.systemNote).toContain('another LOADOUT ship ("Older ship")');
    expect(r.flagDetail).toContain("another approved LOADOUT ship");
  });

  test("someone else's prior entry is not deducted from the owner", () => {
    const r = buildDoubleDip(input([prior("Arcade", 5, "U0SOMEONE")]));
    expect(r.systemNote).toContain("no prior entry found for them specifically");
  });

  test("an entry without a Slack id is the owner's when they are alone on the ship", () => {
    const r = buildDoubleDip(input([prior("Future", 4, "")], { trackedSeconds: 3.5 * 3600 }));
    expect(r.systemNote).toContain("owner got 4h");
    expect(r.systemNote).toContain("claims 3.5h here, got 4h before");
    expect(r.systemNote).toContain("at most 0h");
  });

  test("with collaborators an entry without a Slack id stays anonymous", () => {
    const r = buildDoubleDip(input([prior("Future", 4, "")], { collaborators: [{ slackId: "U0FRIEND", label: "friend", claimedHours: 2 }] }));
    expect(r.systemNote).toContain("someone got 4h");
    expect(r.systemNote).toContain("friend: claims 2h here, no prior entry found for them specifically");
  });
});
