import { describe, expect, test } from "bun:test";
import { DRAFT_LABEL, draftReviewNote, submitReviewDraft } from "./ai-draft";

describe("review drafts", () => {
  test("a draft is labelled, marked not auto-submitted, and built from facts only", () => {
    const draft = draftReviewNote({ projectName: "Lamp", kind: "hardware", hoursTracked: 12, fraudStatus: "flagged", redFlags: ["Hours jump on one day"] });
    expect(draft.autoSubmit).toBe(false);
    expect(draft.label).toBe(DRAFT_LABEL);
    expect(draft.source).toBe("recorded-facts");
    expect(draft.text).toContain("Lamp is a hardware ship.");
    expect(draft.text).toContain("12 tracked hours");
    expect(draft.text).toContain("A fraud check flagged this ship.");
    expect(draft.text).toContain("Flag: Hours jump on one day");
  });
  test("missing hours and no fraud check are stated, not invented", () => {
    const draft = draftReviewNote({ projectName: "Site", kind: "software", hoursTracked: null, fraudStatus: "none", redFlags: [] });
    expect(draft.text).toContain("No tracked hours are recorded");
    expect(draft.text).toContain("No fraud check is recorded");
  });
  test("code never submits a draft", () => {
    const draft = draftReviewNote({ projectName: "A", kind: "software", hoursTracked: 1, fraudStatus: "cleared", redFlags: [] });
    expect(submitReviewDraft(draft)).toEqual({ ok: false, reason: "drafts-never-submit" });
  });
});
