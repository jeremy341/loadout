// One-line JSON logger (spec section 12). API: createLogger(level, write?, now?) -> Logger.
// Fields whose key looks like a secret or like message text are dropped before writing, so tokens, keys and
// message text never reach the logs. Errors are reduced to their name and code (their message can echo input).
import type { Logger } from "./types";

export type LogLevel = "debug" | "info" | "warn" | "error";

const RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const DROPPED_KEY = /token|secret|key|authorization|password|text/i;
const MAX_STRING = 300;
const MAX_ITEMS = 20;
const MAX_DEPTH = 3;

export function scrubFields(input: Record<string, unknown>, depth = 0): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (DROPPED_KEY.test(key)) continue;
    out[key] = scrubValue(value, depth);
  }
  return out;
}

function scrubValue(value: unknown, depth: number): unknown {
  if (value instanceof Error) {
    return { errorName: value.name, errorCode: (value as { code?: unknown }).code };
  }
  if (typeof value === "string") return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}...` : value;
  if (Array.isArray(value)) return value.slice(0, MAX_ITEMS).map((item) => scrubValue(item, depth + 1));
  if (value !== null && typeof value === "object" && depth < MAX_DEPTH) {
    return scrubFields(value as Record<string, unknown>, depth + 1);
  }
  return value;
}

export function createLogger(
  level: LogLevel,
  write: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
  now: () => Date = () => new Date(),
): Logger {
  const min = RANK[level];

  const emit = (lvl: LogLevel, event: string, fields?: Record<string, unknown>): void => {
    if (RANK[lvl] < min) return;
    const base = { ts: now().toISOString(), level: lvl, event };
    try {
      // The base fields go last so a field can never overwrite the event name or the level.
      write(JSON.stringify({ ...scrubFields(fields ?? {}), ...base }));
    } catch {
      write(JSON.stringify({ ...base, logError: "serialise_failed" }));
    }
  };

  return {
    debug: (event, fields) => emit("debug", event, fields),
    info: (event, fields) => emit("info", event, fields),
    warn: (event, fields) => emit("warn", event, fields),
    error: (event, fields) => emit("error", event, fields),
  };
}
