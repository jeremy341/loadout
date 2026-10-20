// Small text helpers shared by the Hub logic. Pure, no clock.

/** Characters as a person counts them (a surrogate pair is one). */
export function charLength(value: string): number {
  return Array.from(value).length;
}

/** Trims and collapses runs of whitespace to one space. */
export function tidy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export function hasControlChars(value: string): boolean {
  return CONTROL.test(value);
}

/** "20 Oct 2026". Always UTC so the server and the browser print the same text. */
export function formatDayUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Newest first. A value that is not a date sorts last. */
export function compareIsoDesc(a: string, b: string): number {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  const va = Number.isNaN(ta) ? -Infinity : ta;
  const vb = Number.isNaN(tb) ? -Infinity : tb;
  if (va === vb) return 0;
  return va < vb ? 1 : -1;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
