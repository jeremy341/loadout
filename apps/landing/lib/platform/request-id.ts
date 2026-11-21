// Request ids and one-line JSON logs for the API routes. A caller's `x-request-id` is reused when it is safe to echo;
// anything else gets a fresh id, so a client can never inject odd characters into the logs.
//
// API:
//   REQUEST_ID_HEADER                        "x-request-id"
//   requestId(request) -> string             reuses a valid incoming id or makes a new one
//   redactFields(fields) -> object           drops keys named like secrets, recursively
//   logLine(requestId, event, fields, now?) -> string   one JSON line, never includes a secret-named key

export const REQUEST_ID_HEADER = "x-request-id";

const VALID_ID = /^[A-Za-z0-9_-]{1,64}$/;

// Any key whose name suggests a credential is removed from logs, whatever its value.
const SECRET_KEY = /authorization|token|secret|key|password/i;

export function requestId(request: Pick<Request, "headers">): string {
  const incoming = request.headers.get(REQUEST_ID_HEADER);
  if (incoming && VALID_ID.test(incoming)) return incoming;
  return crypto.randomUUID();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

// Copies the fields with secret-named keys removed, at any depth. Arrays are walked so an object inside one is
// still cleaned.
export function redactFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(fields)) {
    if (SECRET_KEY.test(name)) continue;
    out[name] = redactValue(value);
  }
  return out;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (isPlainObject(value)) return redactFields(value);
  return value;
}

// `requestId` and `event` win over same-named keys in `fields`, so a caller cannot relabel a log line.
export function logLine(
  id: string,
  event: string,
  fields: Record<string, unknown> = {},
  now: number = Date.now(),
): string {
  return JSON.stringify({ ts: new Date(now).toISOString(), ...redactFields(fields), requestId: id, event });
}
