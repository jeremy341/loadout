// The double-dip matcher: is this ship the same work as something already counted elsewhere? Pure, over records handed in. A match
// is a question for the reviewer, never a verdict. Rewritten for LOADOUT; the idea follows Pixl's lib/doubleDip.ts.

export type DipProgram = "another-ysws" | "another-loadout";

export type TrackedDay = { day: string; minutes: number };

// What the matcher needs to know about a ship, ours or another one.
export type DipRecord = {
  id: string;
  // The project the ship belongs to, so an update of the same project is not a match against itself.
  projectKey: string;
  program: DipProgram;
  // A short plain label, such as "a ship in another YSWS programme (sample)".
  label: string;
  source: string | null;
  demo: string | null;
  // Tracked minutes per day, "YYYY-MM-DD".
  days: readonly TrackedDay[];
};

export type DipKind = "same-repo" | "same-demo" | "overlapping-time";
export const DIP_KIND_LABELS: Record<DipKind, string> = { "same-repo": "the same repository", "same-demo": "the same demo address", "overlapping-time": "overlapping tracked time" };

// Overlap below this many minutes (summed over days both records have tracked time) is chance, not a match.
export const OVERLAP_MIN_MINUTES = 60;

// "https://www.Git.example/Owner/Repo.git/" and "git.example/owner/repo" are the same place.
export function normaliseAddress(value: string | null): string | null {
  if (value === null) return null;
  let text = value.trim().toLowerCase();
  if (text === "") return null;
  text = text.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/^www\./, "");
  text = text.replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/\.git$/, "");
  return text === "" ? null : text;
}

export type DayOverlap = { days: number; minutes: number };

// Minutes that both records tracked on the same day, as the smaller of the two for each such day.
export function overlap(a: readonly TrackedDay[], b: readonly TrackedDay[]): DayOverlap {
  const left = new Map<string, number>();
  for (const item of a) left.set(item.day, (left.get(item.day) ?? 0) + Math.max(0, item.minutes));
  const right = new Map<string, number>();
  for (const item of b) right.set(item.day, (right.get(item.day) ?? 0) + Math.max(0, item.minutes));
  let days = 0;
  let minutes = 0;
  for (const [day, mine] of left) {
    const theirs = right.get(day);
    if (theirs === undefined || mine === 0 || theirs === 0) continue;
    days += 1;
    minutes += Math.min(mine, theirs);
  }
  return { days, minutes };
}

export type DipMatch = { other: Pick<DipRecord, "id" | "program" | "label">; kinds: DipKind[]; detail: string };
export type DipResult = {
  matches: DipMatch[];
  // The kind of match to name first: another YSWS before another LOADOUT ship.
  program: DipProgram | null;
};

function minutesText(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function findDoubleDips(ship: DipRecord, others: readonly DipRecord[]): DipResult {
  const mySource = normaliseAddress(ship.source);
  const myDemo = normaliseAddress(ship.demo);
  const matches: DipMatch[] = [];
  for (const other of others) {
    if (other.id === ship.id || other.projectKey === ship.projectKey) continue;
    const kinds: DipKind[] = [];
    const details: string[] = [];
    const otherSource = normaliseAddress(other.source);
    const otherDemo = normaliseAddress(other.demo);
    if (mySource !== null && mySource === otherSource) {
      kinds.push("same-repo");
      details.push(`the same repository (${mySource})`);
    }
    if (myDemo !== null && myDemo === otherDemo) {
      kinds.push("same-demo");
      details.push(`the same demo address (${myDemo})`);
    }
    const shared = overlap(ship.days, other.days);
    if (shared.minutes >= OVERLAP_MIN_MINUTES) {
      kinds.push("overlapping-time");
      details.push(`${minutesText(shared.minutes)} of tracked time on ${shared.days} ${shared.days === 1 ? "day" : "days"} that both ships count`);
    }
    if (kinds.length > 0) matches.push({ other: { id: other.id, program: other.program, label: other.label }, kinds, detail: details.join("; ") });
  }
  // Most evidence first, then another YSWS before another LOADOUT ship, then by id so the order never changes.
  matches.sort((a, b) => b.kinds.length - a.kinds.length || (a.other.program === b.other.program ? 0 : a.other.program === "another-ysws" ? -1 : 1) || a.other.id.localeCompare(b.other.id));
  const program = matches.some((m) => m.other.program === "another-ysws") ? "another-ysws" : matches.length > 0 ? "another-loadout" : null;
  return { matches, program };
}

export const DIP_TITLES: Record<DipProgram, string> = {
  "another-ysws": "Possible double dip: the same work in another YSWS programme",
  "another-loadout": "Possible double dip: the same work in another LOADOUT ship",
};

export const DIP_ADVICE = "A match is a question, not a verdict. Ask the builder what is new in this ship before you decide.";

// "YYYY-MM-DD" from a desk day label such as "14 Oct", using the programme year of the samples.
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export function dayToIso(label: string, year = 2026): string | null {
  const match = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(label.trim());
  if (!match) return null;
  const month = MONTHS.indexOf(match[2].toLowerCase());
  const day = Number(match[1]);
  if (month < 0 || day < 1 || day > 31) return null;
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Per-day tracked minutes for a ship, from its journal entries (the samples have no finer record of the days).
export function daysFromJournals(journals: readonly { day: string; minutes: number }[]): TrackedDay[] {
  const out = new Map<string, number>();
  for (const entry of journals) {
    const iso = dayToIso(entry.day);
    if (iso) out.set(iso, (out.get(iso) ?? 0) + entry.minutes);
  }
  return [...out.entries()].map(([day, minutes]) => ({ day, minutes }));
}
