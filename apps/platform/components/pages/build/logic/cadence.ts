import { HOUR_MS, RULES } from "./constants";

// Journal cadence and the journal-age payout gate.
// Plan 01 section 6: one journal entry per eight hours of development, per project.
// Plan 22 section 2: the award cannot lock until 24 hours have passed since the latest journal entry attached to the ship.

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Hours worked on a project that no journal entry covers yet. */
export function uncoveredHours(loggedHours: number, entries: readonly { hours: number }[]): number {
  const covered = entries.reduce((sum, entry) => sum + entry.hours, 0);
  return roundHours(Math.max(0, loggedHours - covered));
}

export interface Cadence {
  uncovered: number;
  /** An entry is due once eight uncovered hours have built up. */
  due: boolean;
  /** Hours of work left before an entry becomes due (0 when it already is). */
  hoursUntilDue: number;
  threshold: number;
}

export function cadence(loggedHours: number, entries: readonly { hours: number }[]): Cadence {
  const uncovered = uncoveredHours(loggedHours, entries);
  const threshold = RULES.journalEveryHours;
  return {
    uncovered,
    due: uncovered >= threshold,
    hoursUntilDue: roundHours(Math.max(0, threshold - uncovered)),
    threshold,
  };
}

/** The most hours one entry may claim: the project's uncovered hours, plus the entry's own hours while editing it. */
export function maxEntryHours(loggedHours: number, entries: readonly { id: string; hours: number }[], editingId?: string): number {
  const others = entries.filter((entry) => entry.id !== editingId);
  return uncoveredHours(loggedHours, others);
}

export function latestEntryAt(entries: readonly { at: number }[]): number | null {
  if (entries.length === 0) return null;
  return entries.reduce((max, entry) => Math.max(max, entry.at), entries[0].at);
}

export interface JournalGate {
  /** True when at least 24 hours have passed since the latest entry. */
  met: boolean;
  hasEntry: boolean;
  hoursSince: number | null;
  hoursLeft: number | null;
  readyAt: number | null;
}

export function journalGate(latestAt: number | null, now: number): JournalGate {
  if (latestAt === null) return { met: false, hasEntry: false, hoursSince: null, hoursLeft: null, readyAt: null };
  const needed = RULES.journalAgeHours * HOUR_MS;
  const since = now - latestAt;
  const readyAt = latestAt + needed;
  return {
    met: since >= needed,
    hasEntry: true,
    hoursSince: roundHours(Math.max(0, since / HOUR_MS)),
    hoursLeft: roundHours(Math.max(0, (readyAt - now) / HOUR_MS)),
    readyAt,
  };
}
