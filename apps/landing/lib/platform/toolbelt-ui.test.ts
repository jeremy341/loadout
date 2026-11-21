import { describe, expect, test } from "bun:test";
import { filterTools, finderEscape, finderReduce, finderStatusText, handleLabel, meterPercents, slotsView, toolsCountText } from "./toolbelt-ui";

describe("slotsView", () => {
  test("two empty slots with no uses on a draft", () => {
    const view = slotsView([], "draft");
    expect(view.emptySlots).toBe(2);
    expect(view.closed).toBe(false);
    expect(view.full).toBe(false);
  });
  test("declined uses do not take a slot and are listed apart", () => {
    const view = slotsView([{ id: "a", status: "declined" }, { id: "b", status: "pending" }], "logging");
    expect(view.emptySlots).toBe(1);
    expect(view.declined.map((use) => use.id)).toEqual(["a"]);
    expect(view.active.map((use) => use.id)).toEqual(["b"]);
  });
  test("two active uses fill the belt", () => {
    const view = slotsView([{ id: "a", status: "pending" }, { id: "b", status: "confirmed" }], "needs_changes");
    expect(view.full).toBe(true);
    expect(view.emptySlots).toBe(0);
    expect(view.closed).toBe(false);
  });
  test("submitted, in review and approved projects are closed", () => {
    for (const status of ["submitted", "in-review", "in_review", "approved"]) expect(slotsView([], status).closed).toBe(true);
  });
});

describe("filterTools", () => {
  const tools = [
    { title: "Tinyparse", description: "A config parser", ownerHandle: "juniper_dev" },
    { title: "Orbit Sim", description: null, ownerHandle: "kestrel" },
  ];
  test("empty query keeps everything", () => expect(filterTools(tools, "  ")).toHaveLength(2));
  test("matches title, description and handle without case", () => {
    expect(filterTools(tools, "TINY")).toHaveLength(1);
    expect(filterTools(tools, "config")).toHaveLength(1);
    expect(filterTools(tools, "kest")[0].title).toBe("Orbit Sim");
  });
  test("no match gives an empty list", () => expect(filterTools(tools, "zzz")).toEqual([]));
});

describe("toolsCountText", () => {
  test("totals and matches", () => {
    expect(toolsCountText(12, 12, "")).toBe("12 tools.");
    expect(toolsCountText(1, 1, "")).toBe("1 tool.");
    expect(toolsCountText(12, 3, "ab")).toBe("3 tools match.");
    expect(toolsCountText(12, 1, "ab")).toBe("1 tool matches.");
    expect(toolsCountText(12, 0, "ab")).toBe("No tools match. Clear the search.");
  });
});

describe("meterPercents", () => {
  test("fills against 25 hours and never past the track", () => {
    expect(meterPercents(0, 0)).toEqual({ done: 0, pending: 0 });
    expect(meterPercents(10, 5)).toEqual({ done: 40, pending: 20 });
    expect(meterPercents(30, 10)).toEqual({ done: 100, pending: 0 });
    expect(meterPercents(20, 20).pending).toBe(20);
    expect(meterPercents(-4, -1)).toEqual({ done: 0, pending: 0 });
  });
});

describe("handleLabel", () => {
  test("handle or a builder", () => {
    expect(handleLabel("ferrite")).toBe("ferrite");
    expect(handleLabel(null)).toBe("a builder");
    expect(handleLabel("")).toBe("a builder");
  });
});

describe("finderReduce", () => {
  const closed = { open: false, active: -1 };
  test("Down on a closed list opens it on the first option, Up on the last", () => {
    expect(finderReduce(closed, { type: "next", count: 4 })).toEqual({ open: true, active: 0 });
    expect(finderReduce(closed, { type: "prev", count: 4 })).toEqual({ open: true, active: 3 });
  });
  test("the active option wraps at both ends", () => {
    expect(finderReduce({ open: true, active: 3 }, { type: "next", count: 4 })).toEqual({ open: true, active: 0 });
    expect(finderReduce({ open: true, active: 0 }, { type: "prev", count: 4 })).toEqual({ open: true, active: 3 });
    expect(finderReduce({ open: true, active: -1 }, { type: "prev", count: 4 }).active).toBe(3);
  });
  test("with no options nothing is active", () => {
    expect(finderReduce(closed, { type: "next", count: 0 })).toEqual({ open: true, active: -1 });
    expect(finderReduce({ open: true, active: -1 }, { type: "prev", count: 0 })).toEqual({ open: true, active: -1 });
  });
  test("new results leave nothing active, except a lone typed result", () => {
    expect(finderReduce({ open: true, active: 2 }, { type: "results", count: 3, auto: true })).toEqual({ open: true, active: -1 });
    expect(finderReduce({ open: true, active: -1 }, { type: "results", count: 1, auto: true })).toEqual({ open: true, active: 0 });
    expect(finderReduce({ open: true, active: -1 }, { type: "results", count: 1, auto: false })).toEqual({ open: true, active: -1 });
  });
  test("close and open reset the active option", () => {
    expect(finderReduce({ open: true, active: 1 }, { type: "close" })).toEqual(closed);
    expect(finderReduce(closed, { type: "open" })).toEqual({ open: true, active: -1 });
  });
});

describe("finderEscape", () => {
  test("once closes the list and keeps the text, twice clears it", () => {
    const first = finderEscape({ open: true, text: "tiny" });
    expect(first).toEqual({ open: false, text: "tiny" });
    expect(finderEscape(first)).toEqual({ open: false, text: "" });
  });
});

describe("finderStatusText", () => {
  test("says the exact lines", () => {
    expect(finderStatusText({ phase: "results", count: 5, query: "" })).toBe("Saved and most used tools.");
    expect(finderStatusText({ phase: "results", count: 1, query: "tiny" })).toBe("1 tool matches.");
    expect(finderStatusText({ phase: "results", count: 3, query: "t" })).toBe("3 tools match.");
    expect(finderStatusText({ phase: "results", count: 0, query: "zzz" })).toBe("No tools match. Clear the search.");
    expect(finderStatusText({ phase: "loading" })).toBe("Searching.");
    expect(finderStatusText({ phase: "error" })).toBe("Search is not available. Try again.");
    expect(finderStatusText({ phase: "limited" })).toBe("Searching too fast. Wait a moment.");
  });
});
