// The stage stepper of a project page (Stasis project page, section 2 of plans/proposals/platform-gap-analysis.md). Pure: no database.
// Five positions: Draft, Logging, Submitted, In review (a second pass sits here too), then the outcome. The outcome shows Approved, Needs changes, Banned or
// Rejected, so a sent-back or rejected project has its own state and never falls back to the first step.
import { normalizeStatus } from "./profile";

export type StageNodeState = "done" | "active" | "todo" | "changes" | "rejected";
export type StageStep = { label: string; state: StageNodeState };
export type StageView = { steps: StageStep[]; note: string; outcome: "approved" | "changes" | "rejected" | null };

const LEAD = ["Draft", "Logging", "Submitted", "In review"] as const;

const NOTES = {
  draft: "Log your time and write a journal entry for every 8 hours. Ship opens once your journal is up to date.",
  logging: "Keep logging. A journal entry is due for every 8 hours of work.",
  submitted: "Your ship is in. A reviewer will pick it up.",
  "in-review": "A reviewer is looking at your ship.",
  "second-pass": "Second pass: a reviewer is checking it.",
  approved: "Approved. Your Ore and track hours are on their way.",
  "needs-changes": "A reviewer asked for changes. Your journal and track are open again. Update them, then ship again.",
  rejected: "This ship was not approved. The reason will show here once reviews open on the platform.",
  banned: "This project was banned. Ask support.",
} as const;

const POSITION: Record<string, number> = { draft: 0, logging: 1, submitted: 2, "in-review": 3, "second-pass": 3 };

export function stageView(rawStatus: string): StageView {
  const status = normalizeStatus(rawStatus);
  const lead = (current: number): StageStep[] =>
    LEAD.map((label, index) => ({ label, state: index < current ? "done" : index === current ? "active" : "todo" }));
  const allDone = (): StageStep[] => LEAD.map((label) => ({ label, state: "done" as const }));

  if (status === "approved") {
    return { steps: [...allDone(), { label: "Approved", state: "done" }], note: NOTES.approved, outcome: "approved" };
  }
  if (status === "needs-changes") {
    return { steps: [...allDone(), { label: "Needs changes", state: "changes" }], note: NOTES["needs-changes"], outcome: "changes" };
  }
  if (status === "banned") {
    return { steps: [...allDone(), { label: "Banned", state: "rejected" }], note: NOTES.banned, outcome: "rejected" };
  }
  if (status === "rejected") {
    return { steps: [...allDone(), { label: "Rejected", state: "rejected" }], note: NOTES.rejected, outcome: "rejected" };
  }
  const position = POSITION[status] ?? 0;
  const key = (status in POSITION ? status : "draft") as keyof typeof NOTES;
  return { steps: [...lead(position), { label: "Approved", state: "todo" }], note: NOTES[key], outcome: null };
}
