import { describe, expect, test } from "bun:test";
import { draftDirty, EMPTY_DRAFT, parseDraft, parseSavedStep, reachableStep, stepOfField, stepProblem, stepValid, WIZARD_STEPS } from "./wizard";

const full = { track: "Systems", description: "A small packet router for my home network", title: "Mini router", repoUrl: "", demoUrl: "" };

describe("wizard steps", () => {
  test("there are five steps in order", () => {
    expect(WIZARD_STEPS.map((step) => step.key)).toEqual(["kind", "idea", "name", "links", "review"]);
  });

  test("the kind step needs a track", () => {
    expect(stepValid(0, EMPTY_DRAFT)).toBe(false);
    expect(stepValid(0, { ...EMPTY_DRAFT, track: "Hardware" })).toBe(true);
    expect(stepValid(0, { ...EMPTY_DRAFT, track: "Decide later" })).toBe(false);
  });

  test("the idea step needs 10 to 500 characters", () => {
    expect(stepValid(1, { ...full, description: "short" })).toBe(false);
    expect(stepValid(1, { ...full, description: "x".repeat(501) })).toBe(false);
    expect(stepValid(1, full)).toBe(true);
  });

  test("the name step needs a title", () => {
    expect(stepProblem(2, { ...full, title: "  " })).toMatchObject({ field: "title" });
    expect(stepValid(2, full)).toBe(true);
  });

  test("the links step passes when empty and stops a bad address", () => {
    expect(stepValid(3, full)).toBe(true);
    expect(stepProblem(3, { ...full, repoUrl: "http://example.com/x" })).toMatchObject({ field: "repoUrl" });
    expect(stepProblem(3, { ...full, demoUrl: "nope" })).toMatchObject({ field: "demoUrl" });
  });

  test("the review step is never stopped by itself", () => {
    expect(stepValid(4, EMPTY_DRAFT)).toBe(true);
  });

  test("reachableStep is the first invalid step, or the review", () => {
    expect(reachableStep(EMPTY_DRAFT)).toBe(0);
    expect(reachableStep({ ...EMPTY_DRAFT, track: "Tools" })).toBe(1);
    expect(reachableStep({ ...EMPTY_DRAFT, track: "Tools", description: full.description })).toBe(2);
    expect(reachableStep(full)).toBe(4);
  });

  test("a server error field maps to its step", () => {
    expect(["track", "description", "title", "repoUrl", "demoUrl", undefined].map(stepOfField)).toEqual([0, 1, 2, 3, 3, 4]);
  });
});

describe("draft storage", () => {
  test("nothing typed is not dirty", () => {
    expect(draftDirty(EMPTY_DRAFT)).toBe(false);
    expect(draftDirty({ ...EMPTY_DRAFT, title: "  " })).toBe(false);
    expect(draftDirty({ ...EMPTY_DRAFT, track: "Tools" })).toBe(true);
  });

  test("parseDraft survives missing, broken and odd text", () => {
    expect(parseDraft(null)).toEqual(EMPTY_DRAFT);
    expect(parseDraft("{nope")).toEqual(EMPTY_DRAFT);
    expect(parseDraft(JSON.stringify({ track: 4, title: "Hi" }))).toEqual({ ...EMPTY_DRAFT, title: "Hi" });
    expect(parseDraft(JSON.stringify(full))).toEqual(full);
  });
});

describe("parseSavedStep", () => {
  test("returns the saved step, never past what the draft allows", () => {
    expect(parseSavedStep(JSON.stringify({ ...full, step: 2 }), full)).toBe(2);
    expect(parseSavedStep(JSON.stringify({ ...full, step: 4 }), { ...full, title: "" })).toBe(2);
    expect(parseSavedStep(JSON.stringify({ ...full, step: -3 }), full)).toBe(0);
  });

  test("falls back to the furthest allowed step when nothing usable is saved", () => {
    expect(parseSavedStep(null, full)).toBe(4);
    expect(parseSavedStep("{nope", full)).toBe(4);
    expect(parseSavedStep(JSON.stringify(full), full)).toBe(4);
  });
});
