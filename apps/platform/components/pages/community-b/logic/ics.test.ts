import { describe, expect, test } from "bun:test";
import { buildIcs, escapeIcsText, foldLine, icsDate, icsFileName } from "./ics";

const event = {
  id: "sample-build-night",
  title: "Build night",
  description: "Bring a project.\nWork in the open, share; ask, help.",
  startMs: Date.UTC(2026, 9, 22, 18, 0, 0),
  durationMin: 120,
  stampMs: Date.UTC(2026, 9, 20, 12, 0, 0),
};

describe("ics", () => {
  test("formats UTC dates", () => {
    expect(icsDate(Date.UTC(2026, 9, 22, 18, 5, 9))).toBe("20261022T180509Z");
    expect(icsDate(Date.UTC(2026, 0, 2, 3, 4, 5))).toBe("20260102T030405Z");
  });

  test("escapes text values", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
    expect(escapeIcsText("tab\u0007bell")).toBe("tabbell");
  });

  test("folds long lines at 75 octets", () => {
    const folded = foldLine(`DESCRIPTION:${"x".repeat(200)}`);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(2);
    expect(new TextEncoder().encode(parts[0]).length).toBeLessThanOrEqual(75);
    for (const part of parts.slice(1)) {
      expect(part.startsWith(" ")).toBe(true);
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(`DESCRIPTION:${"x".repeat(200)}`);
  });

  test("never splits a multi-byte character", () => {
    const text = `SUMMARY:${"é".repeat(80)}`;
    const folded = foldLine(text);
    expect(folded.split("\r\n").map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(text);
  });

  test("builds a valid calendar with CRLF endings", () => {
    const ics = buildIcs(event);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(ics).toContain("VERSION:2.0\r\n");
    expect(ics).toContain("UID:sample-build-night@platform-preview.loadout.invalid\r\n");
    expect(ics).toContain("DTSTAMP:20261020T120000Z\r\n");
    expect(ics).toContain("DTSTART:20261022T180000Z\r\n");
    expect(ics).toContain("DTEND:20261022T200000Z\r\n");
    expect(ics).toContain("SUMMARY:Build night\r\n");
    expect(ics).toContain("Bring a project.\\nWork in the open\\, share\\; ask\\, help.");
    expect(ics.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
  });

  test("is deterministic and optionally includes a location", () => {
    expect(buildIcs(event)).toBe(buildIcs(event));
    expect(buildIcs({ ...event, location: "Online (sample)" })).toContain("LOCATION:Online (sample)\r\n");
    expect(buildIcs(event)).not.toContain("LOCATION");
  });

  test("file names are safe", () => {
    expect(icsFileName("sample-build-night")).toBe("loadout-sample-build-night.ics");
    expect(icsFileName("../../etc/passwd")).toBe("loadout-etc-passwd.ics");
    expect(icsFileName("!!!")).toBe("loadout-event.ics");
  });
});
