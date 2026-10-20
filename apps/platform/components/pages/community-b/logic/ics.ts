// Client-side iCalendar (.ics) generation, RFC 5545. No network and no library: the file is built from the
// event record and downloaded as a Blob by the page.

export interface IcsEvent {
  /** Stable id, becomes UID. The same event always yields the same UID so calendars update, not duplicate. */
  id: string;
  title: string;
  description: string;
  startMs: number;
  durationMin: number;
  /** DTSTAMP, passed in so the output is deterministic. */
  stampMs: number;
  /** Optional LOCATION text. */
  location?: string;
}

const CRLF = "\r\n";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** `YYYYMMDDTHHMMSSZ` in UTC. */
export function icsDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** TEXT escaping: backslash, semicolon, comma and newlines. Control characters are dropped. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n")
    // Control characters are dropped on purpose.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

/** Folds a content line to 75 octets per line, continuing with a single space (RFC 5545 section 3.1). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  // First line may hold 75 octets, continuation lines 74 because of the leading space.
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74;
    }
    current += char;
    bytes += size;
  }
  if (current) parts.push(current);
  return parts.join(CRLF + " ");
}

export function buildIcs(event: IcsEvent): string {
  const end = event.startMs + event.durationMin * 60_000;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LOADOUT//Platform preview//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@platform-preview.loadout.invalid`,
    `DTSTAMP:${icsDate(event.stampMs)}`,
    `DTSTART:${icsDate(event.startMs)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  lines.push("STATUS:CONFIRMED", "TRANSP:OPAQUE", "END:VEVENT", "END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** A safe download name such as `loadout-build-night.ics`. */
export function icsFileName(id: string): string {
  const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `loadout-${slug || "event"}.ics`;
}
