import { describe, expect, test } from "bun:test";
import { dueHint, visitorNotice } from "./project-page";
import { stageView } from "./project-stage";

describe("stageView", () => {
  test("a draft is on the first step", () => {
    expect(stageView("draft").steps.map((s) => s.state)).toEqual(["active", "todo", "todo", "todo", "todo"]);
  });
  test("in review accepts both spellings", () => {
    for (const status of ["in-review", "in_review"]) expect(stageView(status).steps.map((s) => s.state)).toEqual(["done", "done", "done", "active", "todo"]);
  });
  test("needs changes has its own last step and is not step 0", () => {
    const view = stageView("needs-changes");
    expect(view.steps[4]).toEqual({ label: "Needs changes", state: "changes" });
    expect(view.steps[0].state).toBe("done");
    expect(view.outcome).toBe("changes");
  });
  test("rejected has its own state", () => {
    expect(stageView("rejected").steps[4]).toEqual({ label: "Rejected", state: "rejected" });
  });
  test("second pass sits at the In review step with its own text", () => {
    const view = stageView("second-pass");
    expect(view.steps.map((s) => s.state)).toEqual(["done", "done", "done", "active", "todo"]);
    expect(view.note).toBe("Second pass: a reviewer is checking it.");
  });
  test("banned has its own mark and text", () => {
    const view = stageView("banned");
    expect(view.steps[4]).toEqual({ label: "Banned", state: "rejected" });
    expect(view.note).toBe("This project was banned. Ask support.");
  });
  test("approved is all done", () => {
    expect(stageView("approved").steps.every((s) => s.state === "done")).toBe(true);
  });
  test("an unknown status reads as a draft", () => {
    expect(stageView("weird").steps[0].state).toBe("active");
  });
});

describe("dueHint", () => {
  test("null when up to date", () => expect(dueHint(0, 0)).toBeNull());
  test("plural and singular", () => {
    expect(dueHint(12, 2)).toBe("12 hours not covered by a journal yet: about 2 entries.");
    expect(dueHint(1, 1)).toBe("1 hour not covered by a journal yet: about 1 entry.");
  });
  test("pluralises the rounded number it actually displays", () => {
    expect(dueHint(0.999, 1)).toBe("1 hour not covered by a journal yet: about 1 entry.");
    expect(dueHint(1.004, 1)).toBe("1 hour not covered by a journal yet: about 1 entry.");
  });
});

describe("visitorNotice", () => {
  test("a draft has a plain notice and is not hidden", () => {
    expect(visitorNotice("draft")).toBe("This project is a draft. The builder is still setting it up.");
  });
  test("every stage before approval has a notice", () => {
    for (const status of ["logging", "submitted", "in-review", "second-pass", "needs-changes", "needs_changes"]) {
      expect(visitorNotice(status)).not.toBeNull();
    }
  });
  test("approved has none, and no notice mentions privacy", () => {
    expect(visitorNotice("approved")).toBeNull();
    for (const status of ["draft", "logging", "submitted", "in-review", "needs-changes"]) {
      expect(visitorNotice(status)).not.toMatch(/private|only approved/i);
    }
  });
});
