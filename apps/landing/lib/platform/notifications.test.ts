import { describe, expect, test } from "bun:test";
import {
  BODY_MAX,
  checkMarkReadIds,
  checkNotification,
  checkPrefKind,
  clipText,
  isKindEnabled,
  pageOf,
  parseCursor,
  prefsView,
  retentionCutoff,
  TITLE_MAX,
} from "./notifications";

describe("checkNotification", () => {
  test("a plain title passes and the kind is kept", () => {
    const result = checkNotification("kudos", { title: "Ada gave you kudos" });
    expect(result).toEqual({ ok: true, value: { kind: "kudos", title: "Ada gave you kudos", body: "", href: null } });
  });
  test("unknown kinds are refused", () => {
    expect(checkNotification("spam", { title: "Hi" }).ok).toBe(false);
  });
  test("the title is one line with control characters flattened", () => {
    const result = checkNotification("follow", { title: "  Ada\n followed\tyou  " });
    expect(result.ok && result.value.title).toBe("Ada followed you");
  });
  test("an empty title is refused", () => {
    expect(checkNotification("follow", { title: "   " }).ok).toBe(false);
  });
  test("a title of 120 characters passes and 121 is refused", () => {
    expect(checkNotification("follow", { title: "a".repeat(TITLE_MAX) }).ok).toBe(true);
    expect(checkNotification("follow", { title: "a".repeat(TITLE_MAX + 1) }).ok).toBe(false);
  });
  test("length limits count characters, not UTF-16 units", () => {
    // Titles are built with clipText, which counts code points; a clipped title with emoji must still be accepted.
    const clipped = clipText("😀".repeat(130), TITLE_MAX);
    expect(Array.from(clipped).length).toBe(TITLE_MAX);
    expect(checkNotification("kudos", { title: clipped }).ok).toBe(true);
    expect(checkNotification("kudos", { title: "😀".repeat(TITLE_MAX + 1) }).ok).toBe(false);
    const body = "😀".repeat(BODY_MAX);
    expect(Array.from(body).length).toBe(BODY_MAX);
    expect(checkNotification("kudos", { title: "Shipped", body }).ok).toBe(true);
    expect(checkNotification("kudos", { title: "Shipped", body: "😀".repeat(BODY_MAX + 1) }).ok).toBe(false);
  });
  test("the body is optional and capped", () => {
    expect(checkNotification("order-update", { title: "Shipped", body: "x".repeat(BODY_MAX + 1) }).ok).toBe(false);
    const ok = checkNotification("order-update", { title: "Shipped", body: "Your order left the depot." });
    expect(ok.ok && ok.value.body).toBe("Your order left the depot.");
  });
  test("hrefs must be paths under /dashboard/", () => {
    expect(checkNotification("kudos", { title: "x", href: "/dashboard/projects/abc" }).ok).toBe(true);
    expect(checkNotification("kudos", { title: "x", href: "https://evil.example/dashboard/x" }).ok).toBe(false);
    expect(checkNotification("kudos", { title: "x", href: "//evil.example/dashboard/x" }).ok).toBe(false);
    expect(checkNotification("kudos", { title: "x", href: "/settings" }).ok).toBe(false);
    expect(checkNotification("kudos", { title: "x", href: "/dashboard/a b" }).ok).toBe(false);
    expect(checkNotification("kudos", { title: "x", href: "/dashboard/a//b" }).ok).toBe(false);
  });
  test("an empty href means no link", () => {
    const result = checkNotification("kudos", { title: "x", href: "" });
    expect(result.ok && result.value.href).toBe(null);
  });
});

describe("clipText", () => {
  test("short text is returned as is", () => {
    expect(clipText("Ada", 10)).toBe("Ada");
  });
  test("long text is cut with an ellipsis inside the limit", () => {
    const out = clipText("abcdefghij", 5);
    expect(out).toBe("abcd…");
    expect(Array.from(out).length).toBe(5);
  });
});

describe("preferences", () => {
  test("a missing row means the kind is on", () => {
    expect(isKindEnabled("kudos", [])).toBe(true);
  });
  test("a stored off row turns the kind off and leaves the others on", () => {
    const prefs = [{ kind: "kudos", enabled: false }];
    expect(isKindEnabled("kudos", prefs)).toBe(false);
    expect(isKindEnabled("follow", prefs)).toBe(true);
  });
  test("prefsView lists every kind", () => {
    const view = prefsView([{ kind: "follow", enabled: false }]);
    expect(view.follow).toBe(false);
    expect(view.kudos).toBe(true);
    expect(Object.keys(view).length).toBe(9);
  });
  test("checkPrefKind accepts only known kinds", () => {
    expect(checkPrefKind("referral-qualified")).toBe("referral-qualified");
    expect(checkPrefKind("ban")).toBe(null);
  });
});

describe("paging", () => {
  test("parseCursor accepts id-like strings only", () => {
    expect(parseCursor("cm1abc_DEF-9")).toBe("cm1abc_DEF-9");
    expect(parseCursor("")).toBe(null);
    expect(parseCursor("a b")).toBe(null);
    expect(parseCursor(12)).toBe(null);
  });
  test("pageOf keeps a page and reports a cursor only when a row was left over", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(pageOf(rows, 2)).toEqual({ items: [{ id: "a" }, { id: "b" }], nextCursor: "b" });
    expect(pageOf(rows, 3)).toEqual({ items: rows, nextCursor: null });
  });
});

describe("checkMarkReadIds", () => {
  test("duplicates are dropped", () => {
    expect(checkMarkReadIds(["a", "a", "b"])).toEqual({ ok: true, ids: ["a", "b"] });
  });
  test("empty, non-string and oversized lists are refused", () => {
    expect(checkMarkReadIds([]).ok).toBe(false);
    expect(checkMarkReadIds(["ok", 3]).ok).toBe(false);
    expect(checkMarkReadIds(Array.from({ length: 101 }, (_, i) => `id${i}`)).ok).toBe(false);
    expect(checkMarkReadIds("a").ok).toBe(false);
  });
});

describe("retentionCutoff", () => {
  test("is 90 days before now", () => {
    const now = new Date("2026-11-18T00:00:00Z");
    expect(retentionCutoff(now).toISOString()).toBe("2026-08-20T00:00:00.000Z");
  });
});
