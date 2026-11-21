import { describe, expect, test } from "bun:test";
import { decodeCursor, encodeCursor, entriesLabel, FEED_MAX_OFFSET, FEED_PAGE_SIZE, nextCursor, openSourceFirst, prevCursor, relativeTime } from "./explore-feed";

describe("feed cursor", () => {
  test("round trips an offset", () => {
    expect(decodeCursor(encodeCursor(42))).toBe(42);
    expect(encodeCursor(21)).toBe("c21");
  });
  test("anything else is the first page", () => {
    for (const raw of [undefined, "", "21", "c", "cx", "c-1", "c1.5", ["nope"], 5]) expect(decodeCursor(raw)).toBe(0);
  });
  test("is capped at the ranked window", () => {
    expect(decodeCursor("c9999")).toBe(FEED_MAX_OFFSET);
    expect(encodeCursor(5000)).toBe(`c${FEED_MAX_OFFSET}`);
    expect(encodeCursor(-4)).toBe("c0");
  });
  test("an array takes its first value", () => {
    expect(decodeCursor(["c21", "c42"])).toBe(21);
  });
});

describe("nextCursor and prevCursor", () => {
  test("a full page with more behind it has a next cursor", () => {
    expect(nextCursor(0, FEED_PAGE_SIZE, 50)).toBe("c21");
    expect(nextCursor(21, FEED_PAGE_SIZE, 50)).toBe("c42");
  });
  test("the last page has none", () => {
    expect(nextCursor(42, 8, 50)).toBeNull();
    expect(nextCursor(0, FEED_PAGE_SIZE, FEED_PAGE_SIZE)).toBeNull();
    expect(nextCursor(0, 0, 0)).toBeNull();
  });
  test("stops at the ranked window", () => {
    expect(nextCursor(294, FEED_PAGE_SIZE, 1000)).toBeNull();
  });
  test("previous goes back one page and stops at the start", () => {
    expect(prevCursor(0)).toBeNull();
    expect(prevCursor(21)).toBe("c0");
    expect(prevCursor(42)).toBe("c21");
  });
});

describe("openSourceFirst", () => {
  test("is stable and puts source addresses first", () => {
    const rows = [
      { id: "a", hasRepo: false }, { id: "b", hasRepo: true }, { id: "c", hasRepo: false }, { id: "d", hasRepo: true },
    ];
    expect(openSourceFirst(rows).map((r) => r.id)).toEqual(["b", "d", "a", "c"]);
  });
  test("does not change its input", () => {
    const rows = [{ hasRepo: false }, { hasRepo: true }];
    openSourceFirst(rows);
    expect(rows[0].hasRepo).toBe(false);
  });
});

describe("relativeTime", () => {
  const now = Date.parse("2026-11-17T12:00:00Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();
  test("steps", () => {
    expect(relativeTime(ago(10_000), now)).toBe("just now");
    expect(relativeTime(ago(5 * 60_000), now)).toBe("5m ago");
    expect(relativeTime(ago(3 * 3_600_000), now)).toBe("3h ago");
    expect(relativeTime(ago(2 * 86_400_000), now)).toBe("2d ago");
  });
  test("older than a month is a date", () => {
    expect(relativeTime("2026-09-12T10:00:00Z", now)).toBe("12 Sep 2026");
  });
  test("a future time reads as just now and junk as empty", () => {
    expect(relativeTime(new Date(now + 5000).toISOString(), now)).toBe("just now");
    expect(relativeTime("not a date", now)).toBe("");
  });
});

describe("entriesLabel", () => {
  test("singular and plural", () => {
    expect(entriesLabel(0)).toBe("0 entries");
    expect(entriesLabel(1)).toBe("1 entry");
    expect(entriesLabel(7)).toBe("7 entries");
  });
});
