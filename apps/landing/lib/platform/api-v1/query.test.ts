import { describe, expect, test } from "bun:test";
import { addDaysUtc, decodeCursor, encodeCursor, pageOf, pagingFrom, parseDay, parseDayWindow, parseLimit, timeCursor } from "./query";

const NOW = new Date("2026-11-18T09:30:00.000Z");

describe("parseLimit", () => {
  test("absent means 25", () => {
    expect(parseLimit(null)).toEqual({ ok: true, value: 25 });
  });

  test("accepts 1 to 100", () => {
    expect(parseLimit("1")).toEqual({ ok: true, value: 1 });
    expect(parseLimit("100")).toEqual({ ok: true, value: 100 });
    expect(parseLimit("007")).toEqual({ ok: true, value: 7 });
  });

  test("refuses zero, over 100, non-integers and garbage with a clear message", () => {
    for (const raw of ["0", "101", "2.5", "-1", "", " 5", "5 ", "abc", "1e2", "0x10"]) {
      const result = parseLimit(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toBe("limit has to be a whole number from 1 to 100.");
    }
  });
});

describe("cursor", () => {
  test("round-trips a key and an id", () => {
    const raw = encodeCursor({ k: "2026-11-18T09:00:00.000Z", id: "cabc123" });
    expect(decodeCursor(raw)).toEqual({ ok: true, value: { k: "2026-11-18T09:00:00.000Z", id: "cabc123" } });
  });

  test("absent or empty is the first page", () => {
    expect(decodeCursor(null)).toEqual({ ok: true, value: null });
    expect(decodeCursor("")).toEqual({ ok: true, value: null });
  });

  test("refuses anything that is not a cursor this API made", () => {
    const bad = [
      "not base64 !!",
      Buffer.from("{}").toString("base64url"),
      Buffer.from(JSON.stringify(["only-one"])).toString("base64url"),
      Buffer.from(JSON.stringify([1, "c1"])).toString("base64url"),
      Buffer.from(JSON.stringify(["k", "has space"])).toString("base64url"),
      Buffer.from(JSON.stringify(["k", "a".repeat(65)])).toString("base64url"),
      Buffer.from(JSON.stringify(["x".repeat(201), "c1"])).toString("base64url"),
      Buffer.from("[oops").toString("base64url"),
    ];
    for (const raw of bad) {
      expect(decodeCursor(raw).ok).toBe(false);
    }
  });
});

describe("parseDay", () => {
  test("accepts a real day in the strict form", () => {
    expect(parseDay("2026-02-28", "from")).toEqual({ ok: true, value: "2026-02-28" });
  });

  test("refuses other shapes and impossible days", () => {
    expect(parseDay("2026-2-3", "from").ok).toBe(false);
    expect(parseDay("2026-02-30", "from").ok).toBe(false);
    expect(parseDay("2026-13-01", "to").ok).toBe(false);
    expect(parseDay("18/11/2026", "to").ok).toBe(false);
    const result = parseDay("2026-02-30", "from");
    if (!result.ok) expect(result.message).toBe("from is not a real day.");
  });
});

describe("addDaysUtc", () => {
  test("moves across month and year ends", () => {
    expect(addDaysUtc("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysUtc("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysUtc("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("parseDayWindow", () => {
  const opts = { defaultDays: 30, maxDays: 366 };

  test("defaults to the last 30 days ending today (UTC)", () => {
    expect(parseDayWindow(null, null, opts, NOW)).toEqual({ ok: true, from: "2026-10-20", to: "2026-11-18" });
  });

  test("keeps explicit ends and counts both as inclusive", () => {
    expect(parseDayWindow("2026-11-01", "2026-11-07", opts, NOW)).toEqual({ ok: true, from: "2026-11-01", to: "2026-11-07" });
  });

  test("a from alone runs to today", () => {
    expect(parseDayWindow("2026-11-15", null, opts, NOW)).toEqual({ ok: true, from: "2026-11-15", to: "2026-11-18" });
  });

  test("refuses from after to", () => {
    expect(parseDayWindow("2026-11-10", "2026-11-01", opts, NOW)).toEqual({ ok: false, message: "from has to be on or before to." });
  });

  test("allows exactly maxDays, refuses one more", () => {
    expect(parseDayWindow("2025-11-18", "2026-11-18", { defaultDays: 30, maxDays: 366 }, NOW).ok).toBe(true);
    expect(parseDayWindow("2025-11-17", "2026-11-18", { defaultDays: 30, maxDays: 366 }, NOW).ok).toBe(false);
  });

  test("passes a bad day through as a 400", () => {
    expect(parseDayWindow("nope", null, opts, NOW).ok).toBe(false);
    expect(parseDayWindow(null, "2026-02-31", opts, NOW).ok).toBe(false);
  });
});

describe("pageOf", () => {
  const keyOf = (row: { id: string; at: string }) => ({ k: row.at, id: row.id });

  test("no next page when the rows fit", () => {
    const rows = [{ id: "a", at: "1" }];
    expect(pageOf(rows, 2, keyOf)).toEqual({ items: rows, nextCursor: null });
  });

  test("drops the extra row and points the cursor at the last kept row", () => {
    const rows = [
      { id: "a", at: "3" },
      { id: "b", at: "2" },
      { id: "c", at: "1" },
    ];
    const page = pageOf(rows, 2, keyOf);
    expect(page.items.map((r) => r.id)).toEqual(["a", "b"]);
    expect(page.nextCursor).not.toBeNull();
    expect(decodeCursor(page.nextCursor)).toEqual({ ok: true, value: { k: "2", id: "b" } });
  });
});

describe("timeCursor", () => {
  test("absent is the first page; a real time is kept as a Date", () => {
    expect(timeCursor(null)).toEqual({ ok: true, value: null });
    const result = timeCursor({ k: "2026-11-18T09:00:00.000Z", id: "c1" });
    expect(result.ok).toBe(true);
    if (result.ok && result.value) expect(result.value.at.toISOString()).toBe("2026-11-18T09:00:00.000Z");
  });

  test("a key that is not a time is refused", () => {
    expect(timeCursor({ k: "yesterday", id: "c1" }).ok).toBe(false);
  });
});

describe("pagingFrom", () => {
  test("defaults to 25 with no cursor", () => {
    expect(pagingFrom(new URL("https://x.test/api/v1/me/projects"))).toEqual({ ok: true, limit: 25, cursor: null });
  });

  test("reads limit and a time cursor together", () => {
    const cursor = encodeCursor({ k: "2026-11-18T09:00:00.000Z", id: "c1" });
    const out = pagingFrom(new URL(`https://x.test/?limit=10&cursor=${cursor}`));
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.limit).toBe(10);
      expect(out.cursor?.id).toBe("c1");
    }
  });

  test("a bad limit or a bad cursor is a message, not a value", () => {
    expect(pagingFrom(new URL("https://x.test/?limit=500")).ok).toBe(false);
    expect(pagingFrom(new URL("https://x.test/?cursor=%%%")).ok).toBe(false);
    expect(pagingFrom(new URL(`https://x.test/?cursor=${encodeCursor({ k: "soon", id: "c1" })}`)).ok).toBe(false);
  });
});
