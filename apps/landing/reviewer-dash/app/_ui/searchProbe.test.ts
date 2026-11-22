import { describe, expect, test } from "bun:test";
import { searchIsAbsent } from "./searchProbe";

describe("searchIsAbsent", () => {
  test("a JSON answer means search is there", () => {
    expect(searchIsAbsent({ ok: true, status: 200, contentType: "application/json" })).toBe(false);
    expect(searchIsAbsent({ ok: true, status: 200, contentType: "application/json; charset=utf-8" })).toBe(false);
  });
  test("a 404, 401 or 403 means it is absent", () => {
    for (const status of [401, 403, 404]) expect(searchIsAbsent({ ok: false, status, contentType: "application/json" })).toBe(true);
  });
  test("an HTML body means it is absent, even with a 200", () => {
    expect(searchIsAbsent({ ok: true, status: 200, contentType: "text/html; charset=utf-8" })).toBe(true);
    expect(searchIsAbsent({ ok: false, status: 404, contentType: "text/html" })).toBe(true);
    expect(searchIsAbsent({ ok: true, status: 200, contentType: null })).toBe(true);
  });
  test("a server error with JSON is a bad moment, not absence", () => {
    expect(searchIsAbsent({ ok: false, status: 500, contentType: "application/json" })).toBe(false);
    expect(searchIsAbsent({ ok: false, status: 429, contentType: "application/json" })).toBe(false);
  });
});
