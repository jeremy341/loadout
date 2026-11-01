import { describe, expect, test } from "bun:test";
import { checkProjectInput, deleteConfirmed, PROJECT_DESCRIPTION_MAX, PROJECT_TITLE_MAX, projectStatusLabel } from "./projects";

describe("checkProjectInput", () => {
  test("accepts a name with an optional description and track", () => {
    const result = checkProjectInput({ title: "  Garden sensor  ", description: " Soil moisture ", track: "Hardware" });
    expect(result).toEqual({ ok: true, input: { title: "Garden sensor", description: "Soil moisture", track: "Hardware" } });
  });

  test("an empty description and no track are stored as null", () => {
    const result = checkProjectInput({ title: "Notes", description: "   ", track: "" });
    expect(result).toEqual({ ok: true, input: { title: "Notes", description: null, track: null } });
  });

  test("rejects a missing or blank name", () => {
    expect(checkProjectInput({ title: "   ", description: "", track: "" })).toMatchObject({ ok: false, field: "title" });
    expect(checkProjectInput({ title: undefined, description: "", track: "" })).toMatchObject({ ok: false, field: "title" });
  });

  test("rejects a name over the maximum length", () => {
    expect(checkProjectInput({ title: "x".repeat(PROJECT_TITLE_MAX + 1), description: "", track: "" })).toMatchObject({ ok: false, field: "title" });
    expect(checkProjectInput({ title: "x".repeat(PROJECT_TITLE_MAX), description: "", track: "" }).ok).toBe(true);
  });

  test("rejects a description over the maximum length", () => {
    expect(checkProjectInput({ title: "Name", description: "x".repeat(PROJECT_DESCRIPTION_MAX + 1), track: "" })).toMatchObject({
      ok: false,
      field: "description",
    });
  });

  test("rejects a track that is not one of the four", () => {
    expect(checkProjectInput({ title: "Name", description: "", track: "Art" })).toMatchObject({ ok: false, field: "track" });
  });
});

describe("deleteConfirmed", () => {
  test("matches the name ignoring case and surrounding spaces", () => {
    expect(deleteConfirmed("  signal lamp ", "Signal Lamp")).toBe(true);
  });

  test("rejects a different name, an empty entry and a non-string", () => {
    expect(deleteConfirmed("Signal", "Signal Lamp")).toBe(false);
    expect(deleteConfirmed("", "Signal Lamp")).toBe(false);
    expect(deleteConfirmed(undefined, "Signal Lamp")).toBe(false);
    expect(deleteConfirmed("", "")).toBe(false);
  });
});

describe("projectStatusLabel", () => {
  test("drafts read as Draft", () => {
    expect(projectStatusLabel("draft")).toBe("Draft");
  });
});
