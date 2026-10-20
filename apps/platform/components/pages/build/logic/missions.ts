import type { TrackName } from "./types";

// Mission rules: a structured path of steps, optional prerequisites, a submission, and a review outcome.
// plans/11-eras-and-community-progression.md ("Missions"): curated steps, prerequisites where useful,
// submissions and review, configured rewards, no map, NPC loop or energy. The shape follows Stardance's mission
// model (steps, prerequisite links, submission states) without copying its code. The reward amounts are NOT set by
// any plan, so the preview marks every one of them "Draft preview reward".

export type MissionKind = "mission" | "quest";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface MissionStep {
  id: string;
  title: string;
  detail: string;
}

export interface MissionDef {
  id: string;
  kind: MissionKind;
  title: string;
  summary: string;
  track: TrackName | "Any";
  difficulty: Difficulty;
  /** Rough time to finish, in minutes. */
  minutes: number;
  hardware: boolean;
  prerequisites: string[];
  steps: MissionStep[];
  /** What the reviewer expects to see in the submission. */
  submissionGuide: string;
  /** Whether the submission needs a link as well as text. */
  needsUrl: boolean;
  /** Ore shown as the draft preview reward. */
  rewardOre: number;
  /** Where the reward value comes from. */
  rewardSource: "draft" | "plan-example";
}

/** draft -> submitted -> in review -> approved or needs changes (then back to submitted). */
export type MissionStatus = "draft" | "submitted" | "in_review" | "approved" | "needs_changes";

export interface MissionProgress {
  missionId: string;
  status: MissionStatus;
  checkedStepIds: string[];
  text: string;
  url: string;
  startedAt: number;
  submittedAt?: number;
  reviewNote?: string;
}

export type MissionAction = "submit" | "pickup" | "approve" | "requestChanges";

const TRANSITIONS: Record<MissionStatus, Partial<Record<MissionAction, MissionStatus>>> = {
  draft: { submit: "submitted" },
  submitted: { pickup: "in_review" },
  in_review: { approve: "approved", requestChanges: "needs_changes" },
  approved: {},
  needs_changes: { submit: "submitted" },
};

/** Returns the next status, or null when the action is not allowed from the current one. */
export function transitionMission(status: MissionStatus, action: MissionAction): MissionStatus | null {
  return TRANSITIONS[status][action] ?? null;
}

/** Steps and the submission are editable only while the mission is a draft or has been sent back. */
export function isEditable(status: MissionStatus): boolean {
  return status === "draft" || status === "needs_changes";
}

export interface LockInfo {
  locked: boolean;
  /** Prerequisite mission ids that are not approved yet, in the order they are listed. */
  missing: string[];
}

/** A mission is locked until every prerequisite is approved. */
export function lockInfo(def: Pick<MissionDef, "prerequisites">, approvedIds: ReadonlySet<string> | readonly string[]): LockInfo {
  const approved = approvedIds instanceof Set ? approvedIds : new Set(approvedIds);
  const missing = def.prerequisites.filter((id) => !approved.has(id));
  return { locked: missing.length > 0, missing };
}

export function approvedIdsOf(progress: readonly MissionProgress[]): string[] {
  return progress.filter((p) => p.status === "approved").map((p) => p.missionId);
}

export function stepProgress(def: Pick<MissionDef, "steps">, checked: readonly string[]): { done: number; total: number } {
  const ids = new Set(def.steps.map((step) => step.id));
  return { done: checked.filter((id) => ids.has(id)).length, total: def.steps.length };
}

export function toggleStep(checked: readonly string[], stepId: string): string[] {
  return checked.includes(stepId) ? checked.filter((id) => id !== stepId) : [...checked, stepId];
}

/** Everything standing between a draft and a submission. Empty means it can be submitted. */
export function submissionBlockers(def: MissionDef, progress: Pick<MissionProgress, "checkedStepIds" | "text" | "url">, urlIsValid: (value: string) => boolean): string[] {
  const out: string[] = [];
  const { done, total } = stepProgress(def, progress.checkedStepIds);
  if (done < total) out.push(`Tick every step first (${done} of ${total} done).`);
  const text = progress.text.trim();
  if (!text) out.push("Describe what you did in the submission text.");
  else if (text.length > 2000) out.push("Keep the submission text to 2,000 characters or fewer.");
  const url = progress.url.trim();
  if (def.needsUrl && !url) out.push("Add a link to your work.");
  else if (url && !urlIsValid(url)) out.push("The link must be a public http or https address.");
  return out;
}

/** Catches a bad catalogue: a missing prerequisite, a self-reference or a cycle. Returns problem descriptions. */
export function prerequisiteProblems(defs: readonly Pick<MissionDef, "id" | "prerequisites">[]): string[] {
  const problems: string[] = [];
  const byId = new Map(defs.map((def) => [def.id, def]));
  for (const def of defs) {
    for (const pre of def.prerequisites) {
      if (pre === def.id) problems.push(`${def.id} lists itself as a prerequisite`);
      else if (!byId.has(pre)) problems.push(`${def.id} needs unknown mission ${pre}`);
    }
  }
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string, trail: string[]) => {
    const seen = state.get(id);
    if (seen === 2) return;
    if (seen === 1) {
      problems.push(`cycle: ${[...trail, id].join(" -> ")}`);
      return;
    }
    state.set(id, 1);
    for (const pre of byId.get(id)?.prerequisites ?? []) if (byId.has(pre) && pre !== id) visit(pre, [...trail, id]);
    state.set(id, 2);
  };
  for (const def of defs) visit(def.id, []);
  return problems;
}

/** A mission's chain from first prerequisite to itself, for display. */
export function prerequisiteChain(id: string, defs: readonly Pick<MissionDef, "id" | "prerequisites">[]): string[] {
  const byId = new Map(defs.map((def) => [def.id, def]));
  const out: string[] = [];
  const seen = new Set<string>();
  const walk = (cur: string) => {
    if (seen.has(cur)) return;
    seen.add(cur);
    for (const pre of byId.get(cur)?.prerequisites ?? []) walk(pre);
    out.push(cur);
  };
  walk(id);
  return out;
}

export function missionAwardKey(missionId: string): string {
  return `mission:${missionId}`;
}
