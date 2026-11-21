// Journal rules (plans/proposals/platform-gap-analysis.md A4). Pure: no database. A journal entry holds self-reported hours.
// Those hours are "logged", not approved: only a reviewer approves hours, and only approved hours earn Ore or levels.

import { isLocked } from "./ship";

export const JOURNAL_TITLE_MAX = 120;
export const JOURNAL_BODY_MAX = 5000;
export const JOURNAL_HOURS_MIN = 0.25;
export const JOURNAL_HOURS_MAX = 12;
// One journal entry is due for every 8 hours logged.
export const JOURNAL_HOURS_PER_ENTRY = 8;
// Over this many hours in one entry, a timelapse is recommended.
export const TIMELAPSE_ADVICE_OVER = 7;
export type Checked<T> = { ok: true; value: T } | { ok: false; message: string };

// The journal can change exactly while the project is not locked (isLocked in ship.ts: draft, logging, needs-changes).
export function journalOpen(projectStatus: string): boolean {
  return !isLocked(projectStatus);
}

export function checkJournalTitle(raw: unknown): Checked<string> {
  const title = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (title.length === 0) return { ok: false, message: "Give the entry a title." };
  if (title.length > JOURNAL_TITLE_MAX) return { ok: false, message: `Keep the title under ${JOURNAL_TITLE_MAX} characters.` };
  return { ok: true, value: title };
}

export function wordCount(text: string): number {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

export function checkJournalBody(raw: unknown): Checked<string> {
  const body = typeof raw === "string" ? raw.replace(/\r\n/g, "\n").trim() : "";
  if (body.length === 0) return { ok: false, message: "Write what you did in this entry." };
  if (body.length > JOURNAL_BODY_MAX) return { ok: false, message: `Keep the entry under ${JOURNAL_BODY_MAX} characters.` };
  return { ok: true, value: body };
}

// Hours in quarter hour steps from 0.25 to 12. Accepts a number or a numeric string.
export function checkJournalHours(raw: unknown): Checked<number> {
  // Only numbers and numeric strings are valid input. Without this guard, Number() coerces booleans (true -> 1) and
  // single-item arrays ([2.5] -> 2.5) into plausible-looking hours, which must never be accepted as a logged time.
  if (typeof raw !== "string" && typeof raw !== "number") return { ok: false, message: "Hours must be a number." };
  const text = typeof raw === "string" ? raw.trim() : raw;
  if (text === "" || text === null || text === undefined) return { ok: false, message: "Enter the hours you worked." };
  const hours = typeof text === "number" ? text : Number(text);
  if (!Number.isFinite(hours)) return { ok: false, message: "Hours must be a number." };
  if (hours < JOURNAL_HOURS_MIN) return { ok: false, message: "Log at least a quarter of an hour." };
  if (hours > JOURNAL_HOURS_MAX) return { ok: false, message: `One entry covers up to ${JOURNAL_HOURS_MAX} hours. Split longer sessions.` };
  if (Math.abs(hours * 4 - Math.round(hours * 4)) > 1e-9) return { ok: false, message: "Use quarter hour steps, such as 1.25 or 2.5." };
  return { ok: true, value: Math.round(hours * 4) / 4 };
}

// Advice shown under the hours field. Null when there is nothing to say.
export function timelapseAdvice(hours: number): string | null {
  if (!Number.isFinite(hours) || hours <= TIMELAPSE_ADVICE_OVER) return null;
  return "A session over 7 hours is easier to review with a timelapse. Record one next time and link it in your entry.";
}

// Hours not yet covered by journal entries: each entry covers 8 hours. journalDue(20, 1) is 12. Never negative.
export function journalDue(totalLoggedHours: number, entryCount: number): number {
  const total = Number.isFinite(totalLoggedHours) ? Math.max(0, totalLoggedHours) : 0;
  // A NaN count must not poison the subtraction; treat it as no entries so the hours stay due (never return NaN).
  const count = Number.isNaN(entryCount) ? 0 : entryCount;
  const covered = Math.max(0, Math.trunc(count)) * JOURNAL_HOURS_PER_ENTRY;
  return Math.max(0, total - covered);
}

// How many more journal entries the logged hours call for. 0 when the journal is up to date.
export function entriesOwed(totalLoggedHours: number, entryCount: number): number {
  return Math.max(0, Math.ceil(journalDue(totalLoggedHours, entryCount) / JOURNAL_HOURS_PER_ENTRY - 1e-9)) || 0;
}

export function formatHours(hours: number): string {
  // Pluralise the number actually shown: hours such as 0.999 round to a displayed "1", which must read "1 hour".
  const shown = Number.isInteger(hours) ? hours : Math.round(hours * 100) / 100;
  return `${shown} ${shown === 1 ? "hour" : "hours"}`;
}
