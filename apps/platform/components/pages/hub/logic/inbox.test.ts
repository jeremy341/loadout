import { describe, expect, test } from "bun:test";
import type { PreviewNotification } from "../../../../lib/notifications";
import {
  DEFAULT_PREFS,
  filterNotifications,
  markAllRead,
  normalizePrefs,
  paginate,
  removeOne,
  setRead,
  sortNewestFirst,
  unreadCount,
  unreadSentence,
  validateQuietHours,
  visibleByPrefs,
} from "./inbox";

function note(n: number, over: Partial<PreviewNotification> = {}): PreviewNotification {
  return {
    id: `n${String(n).padStart(3, "0")}`,
    kind: "system",
    title: `Note ${n}`,
    at: `2026-10-${String(1 + (n % 28)).padStart(2, "0")}T08:00:00.000Z`,
    read: false,
    ...over,
  };
}

const sample: PreviewNotification[] = [
  note(1, { kind: "review", read: true }),
  note(2, { kind: "order" }),
  note(3, { kind: "social", read: true }),
  note(4, { kind: "review" }),
];

describe("sorting and filtering", () => {
  test("newest first", () => {
    expect(sortNewestFirst(sample).map((n) => n.id)).toEqual(["n004", "n003", "n002", "n001"]);
  });

  test("an unreadable date sorts last and ties break by id", () => {
    const odd = [note(1, { at: "not a date" }), note(2, { at: "2026-10-05T00:00:00.000Z" }), note(3, { at: "2026-10-05T00:00:00.000Z" })];
    expect(sortNewestFirst(odd).map((n) => n.id)).toEqual(["n003", "n002", "n001"]);
  });

  test("filter by kind", () => {
    expect(filterNotifications(sample, { kind: "review", status: "all" }, DEFAULT_PREFS).map((n) => n.id)).toEqual(["n004", "n001"]);
  });

  test("filter by unread, and the two filters combine", () => {
    expect(filterNotifications(sample, { kind: "all", status: "unread" }, DEFAULT_PREFS).map((n) => n.id)).toEqual(["n004", "n002"]);
    expect(filterNotifications(sample, { kind: "review", status: "unread" }, DEFAULT_PREFS).map((n) => n.id)).toEqual(["n004"]);
  });

  test("a kind turned off is hidden from the list and the unread count, but not removed", () => {
    const prefs = { ...DEFAULT_PREFS, inApp: { ...DEFAULT_PREFS.inApp, review: false } };
    expect(visibleByPrefs(sample, prefs)).toHaveLength(2);
    expect(filterNotifications(sample, { kind: "all", status: "all" }, prefs).map((n) => n.kind)).not.toContain("review");
    expect(unreadCount(sample, prefs)).toBe(1);
    expect(unreadCount(sample, DEFAULT_PREFS)).toBe(2);
    expect(sample).toHaveLength(4);
  });
});

describe("paging", () => {
  const many = Array.from({ length: 40 }, (_, i) => i);

  test("15 per page", () => {
    const first = paginate(many, 1);
    expect(first.items).toHaveLength(15);
    expect(first).toMatchObject({ page: 1, pages: 3, total: 40, from: 1, to: 15 });
    const last = paginate(many, 3);
    expect(last.items).toHaveLength(10);
    expect(last).toMatchObject({ from: 31, to: 40 });
  });

  test("the page number is clamped", () => {
    expect(paginate(many, 99).page).toBe(3);
    expect(paginate(many, 0).page).toBe(1);
    expect(paginate(many, Number.NaN).page).toBe(1);
  });

  test("empty and exactly one page", () => {
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pages: 1, total: 0, from: 0, to: 0 });
    expect(paginate(many.slice(0, 15), 1).pages).toBe(1);
    expect(paginate(many.slice(0, 16), 1).pages).toBe(2);
  });
});

describe("edits", () => {
  test("mark read and unread", () => {
    expect(setRead(sample, "n002", true).find((n) => n.id === "n002")?.read).toBe(true);
    expect(setRead(sample, "n001", false).find((n) => n.id === "n001")?.read).toBe(false);
    expect(sample.find((n) => n.id === "n002")?.read).toBe(false);
  });

  test("mark all read and remove", () => {
    expect(markAllRead(sample).every((n) => n.read)).toBe(true);
    expect(removeOne(sample, "n003").map((n) => n.id)).toEqual(["n001", "n002", "n004"]);
  });

  test("the unread sentence", () => {
    expect(unreadSentence(0)).toBe("No unread notifications.");
    expect(unreadSentence(1)).toBe("1 unread notification.");
    expect(unreadSentence(3)).toBe("3 unread notifications.");
  });
});

describe("preferences", () => {
  test("quiet hours validate only when on", () => {
    expect(validateQuietHours({ enabled: false, start: "", end: "" })).toBeNull();
    expect(validateQuietHours({ enabled: true, start: "22:00", end: "07:00" })).toBeNull();
    expect(validateQuietHours({ enabled: true, start: "22:00", end: "22:00" })).not.toBeNull();
    expect(validateQuietHours({ enabled: true, start: "25:00", end: "07:00" })).not.toBeNull();
  });

  test("normalizePrefs repairs bad data", () => {
    expect(normalizePrefs(undefined)).toEqual(DEFAULT_PREFS);
    const prefs = normalizePrefs({ inApp: { review: false, order: "no" }, quiet: { enabled: true, start: "bad", end: "06:30" } });
    expect(prefs.inApp.review).toBe(false);
    expect(prefs.inApp.order).toBe(true);
    expect(prefs.quiet).toEqual({ enabled: true, start: "22:00", end: "06:30" });
  });
});
