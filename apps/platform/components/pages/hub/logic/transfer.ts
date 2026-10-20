import { EXPORT_FORMAT, EXPORT_VERSION, HUB_RULES } from "./rules";
import { isRecord } from "./text";

// Export and import of every preview key. The page reads localStorage and hands this module plain data; this
// module builds the file and checks an incoming one before anything is written.

/** Keys look like "hub.profile" or "ore-ledger": letters, digits, dot, dash and underscore. */
const KEY_SHAPE = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  note: string;
  entries: Record<string, unknown>;
}

/**
 * Builds the export text from raw stored strings (key without the storage prefix -> the JSON text stored).
 * A stored value that is not valid JSON is skipped and counted.
 */
export function buildExport(raw: Readonly<Record<string, string>>, exportedAt: string): { text: string; count: number; skipped: number } {
  const entries: Record<string, unknown> = {};
  let skipped = 0;
  for (const key of Object.keys(raw).sort()) {
    if (!KEY_SHAPE.test(key) || FORBIDDEN_KEYS.has(key)) {
      skipped += 1;
      continue;
    }
    try {
      entries[key] = JSON.parse(raw[key]);
    } catch {
      skipped += 1;
    }
  }
  const file: ExportFile = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt,
    note: "LOADOUT platform preview data from one browser. Sample data only; it holds no account and was never sent to LOADOUT.",
    entries,
  };
  return { text: JSON.stringify(file, null, 2), count: Object.keys(entries).length, skipped };
}

/** File name for a download, from the export time. */
export function exportFileName(exportedAt: string): string {
  const day = /^\d{4}-\d{2}-\d{2}/.exec(exportedAt)?.[0] ?? "backup";
  return `loadout-preview-${day}.json`;
}

export type ImportResult =
  | { ok: true; entries: Record<string, unknown>; count: number; exportedAt: string | null; areas: string[] }
  | { ok: false; error: string };

function isLedgerEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.amount === "number" &&
    Number.isInteger(value.amount) &&
    typeof value.reason === "string" &&
    typeof value.source === "string" &&
    typeof value.at === "string"
  );
}

const NOTIFICATION_KINDS = ["review", "order", "social", "project", "journal", "mission", "system"];

function isNotification(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.at === "string" &&
    typeof value.read === "boolean" &&
    typeof value.kind === "string" &&
    NOTIFICATION_KINDS.includes(value.kind)
  );
}

const LEDGER_FORMAT_ERROR = "The Ore ledger in this file is not in the expected format.";
const LEDGER_NEGATIVE_ERROR = "The Ore ledger in this file would leave a negative balance.";
const NOTIFICATIONS_FORMAT_ERROR = "The notifications in this file are not in the expected format.";

function checkLedger(value: unknown): string | null {
  if (!Array.isArray(value) || !value.every(isLedgerEntry)) return LEDGER_FORMAT_ERROR;
  const balance = value.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
  return balance < 0 ? LEDGER_NEGATIVE_ERROR : null;
}

function checkNotifications(value: unknown): string | null {
  return Array.isArray(value) && value.every(isNotification) ? null : NOTIFICATIONS_FORMAT_ERROR;
}

const KNOWN_KEY_CHECKS: Readonly<Record<string, (value: unknown) => string | null>> = {
  "ore-ledger": checkLedger,
  notifications: checkNotifications,
};

/** Shape checks for the two shared stores every module reads. Other keys only have to be plain JSON. */
function checkKnown(key: string, value: unknown): string | null {
  const check = Object.hasOwn(KNOWN_KEY_CHECKS, key) ? KNOWN_KEY_CHECKS[key] : undefined;
  return check ? check(value) : null;
}

/** The part of a key before the first dot, for a short "what is in this file" list. */
export function areaOf(key: string): string {
  const dot = key.indexOf(".");
  return dot === -1 ? key : key.slice(0, dot);
}

type Envelope = { ok: true; entries: Record<string, unknown>; exportedAt: string | null } | { ok: false; error: string };

/** Reads the outer envelope of an export: format, version and a sensible entries section. */
function readEnvelope(data: unknown): Envelope {
  if (!isRecord(data) || data.format !== EXPORT_FORMAT) return { ok: false, error: "That is not a LOADOUT platform preview export." };
  if (typeof data.version !== "number" || data.version > EXPORT_VERSION || data.version < 1) {
    return { ok: false, error: "That export comes from a version this preview cannot read." };
  }
  const entries = data.entries;
  if (!isRecord(entries)) return { ok: false, error: "The export has no data section." };
  const count = Object.keys(entries).length;
  if (count === 0) return { ok: false, error: "The export holds no data." };
  if (count > HUB_RULES.importMaxEntries) return { ok: false, error: "The export holds more entries than a preview can have." };
  return { ok: true, entries, exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : null };
}

/** Checks one entry; returns an error message, or null when the entry can be imported. */
function checkEntry(key: string, value: unknown): string | null {
  if (!KEY_SHAPE.test(key) || FORBIDDEN_KEYS.has(key)) return `The export has a key this preview does not use: "${key.slice(0, 40)}".`;
  if (value === undefined) return `The entry "${key}" is empty.`;
  return checkKnown(key, value);
}

function parseJson(text: string): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

export function parseImport(text: string): ImportResult {
  if (text.length > HUB_RULES.importMaxChars) return { ok: false, error: "That file is too large to be a preview export." };
  const parsed = parseJson(text);
  if (!parsed.ok) return { ok: false, error: "That file is not valid JSON." };
  const envelope = readEnvelope(parsed.data);
  if (!envelope.ok) return envelope;

  const keys = Object.keys(envelope.entries);
  const entries: Record<string, unknown> = {};
  for (const key of keys) {
    const entryError = checkEntry(key, envelope.entries[key]);
    if (entryError) return { ok: false, error: entryError };
    entries[key] = envelope.entries[key];
  }
  const areas = Array.from(new Set(keys.map(areaOf))).sort();
  return { ok: true, entries, count: keys.length, exportedAt: envelope.exportedAt, areas };
}
