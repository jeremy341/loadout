// Pipeline strip: shows a reviewer where a ship is between submission and the recorded hours. Pure.
//
// API:
//   PIPELINE_STAGES = ["Submitted", "Claimed", "Verdict", "Hours recorded"]
//   pipelineStrip(facts) -> { key, label, state: "done" | "current" | "todo" }[]
//   facts: { submitted, claimed, verdict: "approved" | "needs-changes" | "rejected" | "banned" | null, hoursRecorded }
import { type JournalVerdict } from "./journal-verdict";

export const PIPELINE_STAGES = ["Submitted", "Claimed", "Verdict", "Hours recorded"] as const;

export type PipelineFacts = {
  submitted: boolean;
  claimed: boolean;
  verdict: JournalVerdict | "banned" | null;
  hoursRecorded: boolean;
};

export type StageState = "done" | "current" | "todo";

export function pipelineStrip(facts: PipelineFacts): { key: string; label: string; state: StageState }[] {
  const reached = [
    facts.submitted,
    facts.submitted && facts.claimed,
    facts.verdict !== null,
    facts.hoursRecorded,
  ];
  const lastReached = reached.lastIndexOf(true);
  return PIPELINE_STAGES.map((label, index) => {
    const state: StageState = index < lastReached ? "done" : index === lastReached ? "current" : "todo";
    return { key: label.toLowerCase().replace(/\s+/g, "-"), label, state };
  });
}
