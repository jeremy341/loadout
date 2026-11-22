import { describe, expect, test } from "bun:test";
import { BUILT_IN_MACROS, expandMacros, insertMacro, MACRO_BODY_MAX, validateMacro } from "./macros";

const track = BUILT_IN_MACROS.find((m) => m.trigger === "/track")!;

describe("validateMacro", () => {
  test("accepts a new trigger and cleans the body", () => {
    const result = validateMacro({ trigger: " /Hours ", body: "  Check   the hours. " }, BUILT_IN_MACROS);
    expect(result).toEqual({ ok: true, macro: { trigger: "/hours", body: "Check the hours." } });
  });

  test("rejects a trigger that is not /word shaped", () => {
    expect(validateMacro({ trigger: "hours", body: "x" }, []).ok).toBe(false);
    expect(validateMacro({ trigger: "/a", body: "x" }, []).ok).toBe(false);
    expect(validateMacro({ trigger: "/has space", body: "x" }, []).ok).toBe(false);
  });

  test("rejects duplicate triggers regardless of case", () => {
    const result = validateMacro({ trigger: "/TRACK", body: "x" }, BUILT_IN_MACROS);
    expect(result.ok).toBe(false);
  });

  test("rejects empty and oversized bodies", () => {
    expect(validateMacro({ trigger: "/new", body: "   " }, []).ok).toBe(false);
    expect(validateMacro({ trigger: "/new", body: "x".repeat(MACRO_BODY_MAX + 1) }, []).ok).toBe(false);
  });
});

describe("expandMacros", () => {
  test("expands a standalone trigger", () => {
    expect(expandMacros("Please read. /track", BUILT_IN_MACROS)).toContain("does not fit the track");
  });

  test("leaves unknown triggers and triggers inside words alone", () => {
    expect(expandMacros("/unknown and a/track", BUILT_IN_MACROS)).toBe("/unknown and a/track");
  });

  test("keeps the punctuation after a trigger", () => {
    const out = expandMacros("/track.", BUILT_IN_MACROS);
    expect(out.endsWith(".")).toBe(true);
    expect(out.startsWith(track.body)).toBe(true);
  });
});

describe("insertMacro", () => {
  test("replaces a partly typed trigger before the caret", () => {
    const result = insertMacro("Note: /tr", 9, track);
    expect(result.text).toBe(`Note: ${track.body}`);
    expect(result.caret).toBe(`Note: ${track.body}`.length);
  });

  test("inserts at the caret when no trigger is typed", () => {
    const result = insertMacro("ab", 1, track);
    expect(result.text).toBe(`a${track.body}b`);
    expect(result.caret).toBe(1 + track.body.length);
  });

  test("clamps a caret outside the text", () => {
    const result = insertMacro("ab", 99, track);
    expect(result.text).toBe(`ab${track.body}`);
  });
});
