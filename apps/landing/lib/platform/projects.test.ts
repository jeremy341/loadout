import { describe, expect, test } from "bun:test";
import {
  checkProjectInput,
  deleteConfirmed,
  descriptionProblem,
  kindOfTrack,
  PROJECT_DESCRIPTION_MAX,
  PROJECT_DESCRIPTION_MIN,
  PROJECT_TITLE_MAX,
  projectStatusLabel,
  titleProblem,
  trackLocked,
} from "./projects";

const IDEA = "A small packet router for my home network";
const good = { title: "Mini router", description: IDEA, track: "Systems", repoUrl: "", demoUrl: "" };

describe("checkProjectInput (create)", () => {
  test("accepts a complete project and trims it", () => {
    const result = checkProjectInput({ ...good, title: "  Garden sensor  ", description: `  ${IDEA}  `, track: "Hardware" });
    expect(result).toEqual({
      ok: true,
      input: { title: "Garden sensor", description: IDEA, track: "Hardware", repoUrl: null, demoUrl: null },
    });
  });

  test("a track is required, and Decide later is not a track", () => {
    expect(checkProjectInput({ ...good, track: "" })).toMatchObject({ ok: false, field: "track" });
    expect(checkProjectInput({ ...good, track: null })).toMatchObject({ ok: false, field: "track" });
    expect(checkProjectInput({ ...good, track: "Decide later" })).toMatchObject({ ok: false, field: "track" });
    expect(checkProjectInput({ ...good, track: "Art" })).toMatchObject({ ok: false, field: "track" });
  });

  test("each of the four tracks is accepted", () => {
    for (const track of ["Tools", "Systems", "Compute", "Hardware"]) expect(checkProjectInput({ ...good, track }).ok).toBe(true);
  });

  test("the description is 10 to 500 characters after trimming", () => {
    expect(checkProjectInput({ ...good, description: "" })).toMatchObject({ ok: false, field: "description" });
    expect(checkProjectInput({ ...good, description: "         x         " })).toMatchObject({ ok: false, field: "description" });
    expect(checkProjectInput({ ...good, description: "x".repeat(PROJECT_DESCRIPTION_MIN - 1) })).toMatchObject({ ok: false, field: "description" });
    expect(checkProjectInput({ ...good, description: "x".repeat(PROJECT_DESCRIPTION_MIN) }).ok).toBe(true);
    expect(checkProjectInput({ ...good, description: "x".repeat(PROJECT_DESCRIPTION_MAX) }).ok).toBe(true);
    expect(checkProjectInput({ ...good, description: "x".repeat(PROJECT_DESCRIPTION_MAX + 1) })).toMatchObject({ ok: false, field: "description" });
    expect(checkProjectInput({ ...good, description: undefined })).toMatchObject({ ok: false, field: "description" });
  });

  test("the name is 1 to 80 characters", () => {
    expect(checkProjectInput({ ...good, title: "   " })).toMatchObject({ ok: false, field: "title" });
    expect(checkProjectInput({ ...good, title: undefined })).toMatchObject({ ok: false, field: "title" });
    expect(checkProjectInput({ ...good, title: "x".repeat(PROJECT_TITLE_MAX + 1) })).toMatchObject({ ok: false, field: "title" });
    expect(checkProjectInput({ ...good, title: "x".repeat(PROJECT_TITLE_MAX) }).ok).toBe(true);
  });

  test("the source and demo addresses are optional and must be https", () => {
    const withLinks = checkProjectInput({ ...good, repoUrl: "https://github.com/example/router", demoUrl: " https://router.example.dev/demo " });
    expect(withLinks).toMatchObject({ ok: true, input: { repoUrl: "https://github.com/example/router", demoUrl: "https://router.example.dev/demo" } });
    expect(checkProjectInput({ ...good, repoUrl: "http://github.com/example/router" })).toMatchObject({ ok: false, field: "repoUrl" });
    expect(checkProjectInput({ ...good, repoUrl: "github.com/example/router" })).toMatchObject({ ok: false, field: "repoUrl" });
    expect(checkProjectInput({ ...good, demoUrl: "javascript:alert(1)" })).toMatchObject({ ok: false, field: "demoUrl" });
    expect(checkProjectInput({ ...good, demoUrl: "https://localhost/x" })).toMatchObject({ ok: false, field: "demoUrl" });
    expect(checkProjectInput({ ...good, demoUrl: "https://user:pw@example.com/" })).toMatchObject({ ok: false, field: "demoUrl" });
  });

  test("the first problem found is reported, name first", () => {
    expect(checkProjectInput({ title: "", description: "", track: "" })).toMatchObject({ ok: false, field: "title" });
    expect(checkProjectInput({ title: "Name", description: "", track: "" })).toMatchObject({ ok: false, field: "description" });
  });
});

describe("checkProjectInput (edit)", () => {
  test("a project from before the wizard can still be saved with no track and no description", () => {
    expect(checkProjectInput({ title: "Notes", description: "   ", track: "" }, "edit")).toEqual({
      ok: true,
      input: { title: "Notes", description: null, track: null, repoUrl: null, demoUrl: null },
    });
  });

  test("the name and description limits and the track list still apply", () => {
    expect(checkProjectInput({ title: "x".repeat(PROJECT_TITLE_MAX + 1), description: "", track: "" }, "edit")).toMatchObject({ ok: false, field: "title" });
    expect(checkProjectInput({ title: "Name", description: "x".repeat(PROJECT_DESCRIPTION_MAX + 1), track: "" }, "edit")).toMatchObject({ ok: false, field: "description" });
    expect(checkProjectInput({ title: "Name", description: "", track: "Art" }, "edit")).toMatchObject({ ok: false, field: "track" });
  });
});

describe("kindOfTrack", () => {
  test("Hardware is hardware, the other three are software, anything else has no kind", () => {
    expect(kindOfTrack("Hardware")).toBe("hardware");
    for (const track of ["Tools", "Systems", "Compute"]) expect(kindOfTrack(track)).toBe("software");
    for (const track of [null, undefined, "", "Decide later"]) expect(kindOfTrack(track)).toBeNull();
  });
});

describe("step problems", () => {
  test("descriptionProblem and titleProblem agree with the validator", () => {
    expect(descriptionProblem("short")).not.toBeNull();
    expect(descriptionProblem(IDEA)).toBeNull();
    expect(titleProblem("  ")).not.toBeNull();
    expect(titleProblem("Router")).toBeNull();
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

describe("trackLocked", () => {
  test("the track is open in a draft, while logging and after changes are asked for", () => {
    for (const status of ["draft", "logging", "needs-changes"]) expect(trackLocked(status)).toBe(false);
  });

  test("the track is locked once the project is submitted", () => {
    for (const status of ["submitted", "in-review", "approved", "rejected"]) expect(trackLocked(status)).toBe(true);
  });
});
