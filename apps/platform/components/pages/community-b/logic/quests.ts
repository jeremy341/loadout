// Contribution log and seasonal quest progress.
//
// Plan 11 treats missions, Era Objectives and seasonal quests as three separate layers and says seasonal
// quests are "short optional challenges during the longer competitive season". Plan 02 section 23 lists six
// example quests (2X, LOCAL, FIRST PCB, SHIP TO SOMEONE, 100 USERS, SMALLER) and says quest values are open.
// Those examples need reviewer verification, so the preview runs a Draft quest list that can be completed from
// the three actions the preview can really record: ship approved, review done, journal written.
// Quest progress is always derived from the stored log, so it cannot drift from it.

import type { TrackName } from "../../../../lib/sample/builders";
import { parseMs } from "./dates";
import { inWindow, type TimeWindow } from "./windows";

export type ActionType = "ship" | "review" | "journal";

export interface Contribution {
  id: string;
  type: ActionType;
  /** Whole number of ships, reviews or journal entries. */
  qty: number;
  /** Journal entries only: hours of build time the entries cover. */
  hours?: number;
  track: TrackName;
  /** ISO timestamp in Preview time. */
  at: string;
  note?: string;
}

export type QuestStep =
  | { id: string; label: string; kind: "count"; action: ActionType; target: number }
  | { id: string; label: string; kind: "streak"; target: number };

export interface QuestDef {
  id: string;
  name: string;
  blurb: string;
  steps: QuestStep[];
}

export interface StepProgress {
  step: QuestStep;
  value: number;
  target: number;
  done: boolean;
}

export interface QuestProgress {
  steps: StepProgress[];
  doneSteps: number;
  totalSteps: number;
  complete: boolean;
  /** 0 to 100, whole percent of steps done weighted by value/target. */
  pct: number;
}

export interface QuestContext {
  contributions: readonly Contribution[];
  /** The Season window quests count inside. */
  window: TimeWindow | null;
  streakCurrent: number;
}

export function countAction(contributions: readonly Contribution[], action: ActionType, window: TimeWindow | null): number {
  let sum = 0;
  for (const c of contributions) if (c.type === action && inWindow(parseMs(c.at), window)) sum += c.qty;
  return sum;
}

export function sumJournalHours(contributions: readonly Contribution[], window: TimeWindow | null): number {
  let sum = 0;
  for (const c of contributions) if (c.type === "journal" && inWindow(parseMs(c.at), window)) sum += c.hours ?? 0;
  return sum;
}

export function questProgress(def: QuestDef, ctx: QuestContext): QuestProgress {
  const steps: StepProgress[] = def.steps.map((step) => {
    const raw = step.kind === "count" ? countAction(ctx.contributions, step.action, ctx.window) : ctx.streakCurrent;
    const value = Math.min(raw, step.target);
    return { step, value, target: step.target, done: raw >= step.target };
  });
  const doneSteps = steps.filter((s) => s.done).length;
  const sum = steps.reduce((acc, s) => acc + s.value / s.target, 0);
  return {
    steps,
    doneSteps,
    totalSteps: steps.length,
    complete: steps.length > 0 && doneSteps === steps.length,
    pct: steps.length ? Math.round((sum / steps.length) * 100) : 0,
  };
}

/** Quest completions are stored per Season, so a new Season starts every quest fresh. */
export function completionKey(seasonId: string, questId: string): string {
  return `${seasonId}:${questId}`;
}

/** Quests that are complete by the log but not yet recorded as completed. */
export function newlyCompleted(
  defs: readonly QuestDef[],
  seasonId: string,
  done: Readonly<Record<string, string>>,
  ctx: QuestContext,
): QuestDef[] {
  return defs.filter((def) => !done[completionKey(seasonId, def.id)] && questProgress(def, ctx).complete);
}

export interface ContributionInput {
  type: ActionType;
  qty: string;
  hours: string;
  track: TrackName;
  /** `YYYY-MM-DD`. */
  date: string;
  note: string;
}

export interface ContributionErrors {
  qty?: string;
  hours?: string;
  date?: string;
  note?: string;
}

export const MAX_QTY = 20;
export const MAX_HOURS = 80;
export const MAX_BACKDATE_DAYS = 90;
export const MAX_NOTE = 140;

function qtyError(raw: string): string | undefined {
  const qty = Number(raw);
  const valid = raw.trim() !== "" && Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY;
  return valid ? undefined : `Enter a whole number from 1 to ${MAX_QTY}.`;
}

/** Hours for a journal entry: the cleaned value, or the message to show. */
function parseHours(raw: string): { hours: number } | { error: string } {
  const h = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(h) || h <= 0 || h > MAX_HOURS) {
    return { error: `Enter the hours these entries cover, more than 0 and at most ${MAX_HOURS}.` };
  }
  if (Math.round(h * 10) !== h * 10) return { error: "Use at most one decimal place." };
  return { hours: h };
}

function dateError(dateMs: number | null, todayMs: number): string | undefined {
  if (dateMs === null) return "Enter a real date as YYYY-MM-DD.";
  if (dateMs > todayMs) return "The date cannot be after the Preview date. Advance the Preview date first.";
  if (todayMs - dateMs > MAX_BACKDATE_DAYS * 86_400_000) return `The date cannot be more than ${MAX_BACKDATE_DAYS} days back.`;
  return undefined;
}

function noteError(note: string): string | undefined {
  return note.length > MAX_NOTE ? `Keep the note under ${MAX_NOTE} characters.` : undefined;
}

/** Keeps only the fields that actually have a message, in field order. */
function onlyMessages(messages: ContributionErrors): ContributionErrors {
  const errors: ContributionErrors = {};
  if (messages.qty) errors.qty = messages.qty;
  if (messages.hours) errors.hours = messages.hours;
  if (messages.date) errors.date = messages.date;
  if (messages.note) errors.note = messages.note;
  return errors;
}

/**
 * Validates the Log-work form. `todayMs` is the Preview date at UTC midnight and `parseDate` turns the date
 * field into UTC midnight (null when invalid). Returns the cleaned values or the messages to show.
 */
export function validateContribution(
  input: ContributionInput,
  todayMs: number,
  parseDate: (value: string) => number | null,
): { ok: true; qty: number; hours: number | undefined; dateMs: number; note: string } | { ok: false; errors: ContributionErrors } {
  const parsedHours = input.type === "journal" ? parseHours(input.hours) : undefined;
  const dateMs = parseDate(input.date);
  const note = input.note.trim();
  const errors = onlyMessages({
    qty: qtyError(input.qty),
    hours: parsedHours && "error" in parsedHours ? parsedHours.error : undefined,
    date: dateError(dateMs, todayMs),
    note: noteError(note),
  });
  if (Object.keys(errors).length > 0 || dateMs === null) return { ok: false, errors };
  const hours = parsedHours && "hours" in parsedHours ? parsedHours.hours : undefined;
  return { ok: true, qty: Number(input.qty), hours, dateMs, note };
}
