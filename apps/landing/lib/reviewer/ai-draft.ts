// Review-note drafts for a reviewer. A draft is text to edit; it is never submitted. Every draft carries autoSubmit: false and the
// label below, so a screen cannot show it as a decision. There is no model in this staging build: the text is built from recorded
// facts only, and the label says so. A model draft (integrations/external-ai.ts) would use the same shape.
export const DRAFT_LABEL = "Draft for a reviewer to edit. Nothing has been submitted.";

export type DraftFacts = {
  projectName: string;
  kind: "software" | "hardware";
  /** Hours tracked, or null when none are recorded. */
  hoursTracked: number | null;
  /** The fraud checks already recorded for this ship, if any. */
  fraudStatus: "cleared" | "flagged" | "none";
  redFlags: readonly string[];
};

export type ReviewDraft = {
  status: "draft";
  autoSubmit: false;
  label: typeof DRAFT_LABEL;
  source: "recorded-facts";
  text: string;
};

export function draftReviewNote(facts: DraftFacts): ReviewDraft {
  const lines: string[] = [];
  lines.push(`${facts.projectName} is a ${facts.kind} ship.`);
  lines.push(
    facts.hoursTracked === null
      ? "No tracked hours are recorded, so the time cannot be checked from here."
      : `${facts.hoursTracked} tracked hours are recorded; check them against the journal before crediting.`,
  );
  if (facts.fraudStatus === "flagged") lines.push("A fraud check flagged this ship. Read its note before deciding.");
  else if (facts.fraudStatus === "cleared") lines.push("The recorded fraud checks did not flag this ship.");
  else lines.push("No fraud check is recorded for this ship yet.");
  for (const flag of facts.redFlags.slice(0, 10)) lines.push(`Flag: ${flag.trim().slice(0, 200)}`);
  return { status: "draft", autoSubmit: false, label: DRAFT_LABEL, source: "recorded-facts", text: lines.join("\n") };
}

/** Always refused: drafts are never submitted by code. A reviewer copies the text into the real form. */
export function submitReviewDraft(_draft: ReviewDraft): { ok: false; reason: "drafts-never-submit" } {
  return { ok: false, reason: "drafts-never-submit" };
}
