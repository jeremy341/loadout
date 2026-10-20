// Pure pieces of the Log-work form submit: what to store, what changed, and what to tell the person.
// The component only wires these to state, notifications and focus.

import type { TrackName } from "../../../../lib/sample/builders";
import { MS_DAY, parseMs } from "./dates";
import type { EraState, ShipEvent } from "./era";
import type { ActionType, Contribution, ContributionErrors } from "./quests";

export const ACTION_PLURAL: Record<ActionType, string> = { ship: "ship", review: "review", journal: "journal entry" };

/** "1 ship", "3 reviews", "2 journal entries". */
export function plural(n: number, noun: string): string {
  if (n === 1) return `${n} ${noun}`;
  return noun === "journal entry" ? `${n} journal entries` : `${n} ${noun}s`;
}

const ERROR_FIELDS = ["qty", "hours", "date", "note"] as const;

/** The first field, in form order, that has an error message. */
export function firstErrorField(errors: ContributionErrors): keyof ContributionErrors | undefined {
  return ERROR_FIELDS.find((field) => errors[field]);
}

export interface SubmitForm {
  type: ActionType;
  track: TrackName;
}

export interface ValidatedContribution {
  qty: number;
  hours: number | undefined;
  dateMs: number;
  note: string;
}

/**
 * The entry to store. It is stamped at noon on the chosen day, but never later than the Preview "now", and only
 * ships carry the chosen track (reviews and journal entries use `defaultTrack`).
 */
export function buildContributionDraft(
  form: SubmitForm,
  result: ValidatedContribution,
  nowMs: number,
  defaultTrack: TrackName,
): Omit<Contribution, "id"> {
  return {
    type: form.type,
    qty: result.qty,
    hours: result.hours,
    track: form.type === "ship" ? form.track : defaultTrack,
    at: new Date(Math.min(result.dateMs + 12 * (MS_DAY / 24), nowMs)).toISOString(),
    note: result.note || undefined,
  };
}

/** Ship entries as Era Point events; reviews and journal entries add no Era Points. */
export function shipEvents(contributions: readonly Contribution[], pointsPerShip: number): ShipEvent[] {
  return contributions.filter((c) => c.type === "ship").map((c) => ({ atMs: parseMs(c.at), points: c.qty * pointsPerShip }));
}

/** True when this change moved the same Era from not ready to ADVANCEMENT READY. */
export function becameAdvancementReady(before: EraState, after: EraState): boolean {
  return after.index === before.index && after.status === "ready" && before.status !== "ready";
}

export interface LoggedSummary {
  type: ActionType;
  qty: number;
  /** Era Points gained by this entry (ships only). */
  eraPointsGained: number;
  completedQuestNames: readonly string[];
}

function eraSentence(type: ActionType, gained: number): string {
  if (type !== "ship") return "It counts toward quests and your streak, not Era Points.";
  return gained > 0 ? `+${gained} Era Points (Draft).` : "It is dated before this Era began, so it adds no Era Points.";
}

/** The screen-reader announcement after a successful add. */
export function describeLogged(summary: LoggedSummary): string {
  const parts = [`Logged ${plural(summary.qty, ACTION_PLURAL[summary.type])}.`, eraSentence(summary.type, summary.eraPointsGained)];
  if (summary.completedQuestNames.length > 0) parts.push(`Quest complete: ${summary.completedQuestNames.join(", ")}.`);
  return parts.join(" ");
}
