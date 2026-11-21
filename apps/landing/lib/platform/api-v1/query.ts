// Query string parsing for /api/v1. Pure: no database, no framework. Every function has a bun test (query.test.ts).
// A bad value is a 400 with a sentence the caller can act on; nothing is silently clamped.
//
// API:
//   DEFAULT_LIMIT 25, MAX_LIMIT 100
//   parseLimit(raw) -> { ok, value } | { ok: false, message }        absent means 25; non-integer, zero or over 100 is an error
//   encodeCursor({ k, id }) -> string                                  opaque, base64url JSON
//   decodeCursor(raw) -> { ok, value: Cursor | null } | { ok: false, message }
//   parseDay(raw, name) -> { ok, value } | { ok: false, message }      strict YYYY-MM-DD that is a real UTC day
//   parseDayWindow(from, to, { defaultDays, maxDays }, now) -> { ok, from, to } | { ok: false, message }
//   addDaysUtc(day, n) -> "YYYY-MM-DD"
//   timeCursor(cursor) -> { ok, value: { at, id } | null } | { ok: false, message }   for newest-first lists
//   pagingFrom(url) -> { ok, limit, cursor: { at, id } | null } | { ok: false, message }   limit and cursor together
//   pageOf(rows, limit, keyOf) -> { items, nextCursor }                 rows fetched with take = limit + 1
export const DEFAULT_LIMIT = 25;
export const MAX_LIMIT = 100;

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

export type Cursor = { k: string; id: string };

const DAY_MS = 86_400_000;
const CURSOR_KEY_MAX = 200;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function parseLimit(raw: string | null): Parsed<number> {
  if (raw === null) return { ok: true, value: DEFAULT_LIMIT };
  if (!/^\d+$/.test(raw)) {
    return { ok: false, message: `limit has to be a whole number from 1 to ${MAX_LIMIT}.` };
  }
  const value = Number(raw);
  if (value < 1 || value > MAX_LIMIT) {
    return { ok: false, message: `limit has to be a whole number from 1 to ${MAX_LIMIT}.` };
  }
  return { ok: true, value };
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify([cursor.k, cursor.id]), "utf8").toString("base64url");
}

// An absent cursor is the first page (value null). Anything that does not decode to a [key, id] pair is refused.
export function decodeCursor(raw: string | null): Parsed<Cursor | null> {
  if (raw === null || raw === "") return { ok: true, value: null };
  const invalid = { ok: false as const, message: "cursor is not valid. Use the nextCursor from the last page." };
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) return invalid;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return invalid;
  }
  if (!Array.isArray(parsed) || parsed.length !== 2) return invalid;
  const [k, id] = parsed;
  if (typeof k !== "string" || k.length === 0 || k.length > CURSOR_KEY_MAX) return invalid;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) return invalid;
  return { ok: true, value: { k, id } };
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDay(raw: string, name: string): Parsed<string> {
  if (!DAY_PATTERN.test(raw)) return { ok: false, message: `${name} has to be a day in the form YYYY-MM-DD.` };
  const time = Date.parse(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== raw) {
    return { ok: false, message: `${name} is not a real day.` };
  }
  return { ok: true, value: raw };
}

export function addDaysUtc(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

// Both ends are inclusive. Missing ends get defaults: `to` is today (UTC) and `from` is defaultDays before it.
export function parseDayWindow(
  rawFrom: string | null,
  rawTo: string | null,
  options: { defaultDays: number; maxDays: number },
  now: Date,
): { ok: true; from: string; to: string } | { ok: false; message: string } {
  const today = now.toISOString().slice(0, 10);
  let to = today;
  if (rawTo !== null) {
    const parsed = parseDay(rawTo, "to");
    if (!parsed.ok) return parsed;
    to = parsed.value;
  }
  let from = addDaysUtc(to, -(options.defaultDays - 1));
  if (rawFrom !== null) {
    const parsed = parseDay(rawFrom, "from");
    if (!parsed.ok) return parsed;
    from = parsed.value;
  }
  if (from > to) return { ok: false, message: "from has to be on or before to." };
  const span = (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / DAY_MS + 1;
  if (span > options.maxDays) return { ok: false, message: `The window can be at most ${options.maxDays} days.` };
  return { ok: true, from, to };
}

// Takes `limit + 1` rows from the database. The extra row only says whether there is another page.
export function pageOf<T>(rows: readonly T[], limit: number, keyOf: (row: T) => Cursor): { items: T[]; nextCursor: string | null } {
  if (rows.length <= limit) return { items: [...rows], nextCursor: null };
  const items = rows.slice(0, limit);
  return { items, nextCursor: encodeCursor(keyOf(items[items.length - 1])) };
}

// A cursor whose key is a time (the newest-first lists). A key that is not a real time is refused, never sent to the database.
export function timeCursor(cursor: Cursor | null): { ok: true; value: { at: Date; id: string } | null } | { ok: false; message: string } {
  if (!cursor) return { ok: true, value: null };
  const at = new Date(cursor.k);
  if (Number.isNaN(at.getTime())) return { ok: false, message: "cursor is not valid. Use the nextCursor from the last page." };
  return { ok: true, value: { at, id: cursor.id } };
}

// The paging query of a newest-first list: `limit` and `cursor` together. Used by every list route.
export function pagingFrom(url: URL): { ok: true; limit: number; cursor: { at: Date; id: string } | null } | { ok: false; message: string } {
  const limit = parseLimit(url.searchParams.get("limit"));
  if (!limit.ok) return { ok: false, message: limit.message };
  const decoded = decodeCursor(url.searchParams.get("cursor"));
  if (!decoded.ok) return { ok: false, message: decoded.message };
  const time = timeCursor(decoded.value);
  if (!time.ok) return { ok: false, message: time.message };
  return { ok: true, limit: limit.value, cursor: time.value };
}
