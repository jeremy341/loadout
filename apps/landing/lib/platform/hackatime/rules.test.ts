import { describe, expect, test } from "bun:test";
import {
  addDays,
  canManualRefresh,
  DAILY_CAP_SECONDS,
  dayKey,
  HISTORY_DAYS,
  median,
  MANUAL_REFRESH_MS,
  normaliseDays,
} from "./rules";

const NOW = new Date("2026-11-18T12:00:00Z");
const HOUR = 3600;

describe("dates", () => {
  test("dayKey is the UTC calendar day", () => {
    expect(dayKey(new Date("2026-11-18T23:59:59Z"))).toBe("2026-11-18");
  });

  test("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("median", () => {
  test("handles odd, even and empty lists", () => {
    expect(median([])).toBe(0);
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("normaliseDays: input clean-up", () => {
  test("drops future days, days older than the history window, and bad day strings", () => {
    const rows = normaliseDays(
      [
        { day: "2026-11-19", name: "a", seconds: HOUR },
        { day: addDays("2026-11-18", -HISTORY_DAYS - 1), name: "a", seconds: HOUR },
        { day: addDays("2026-11-18", -HISTORY_DAYS), name: "a", seconds: HOUR },
        { day: "18/11/2026", name: "a", seconds: HOUR },
        { day: "2026-11-18", name: "a", seconds: HOUR },
      ],
      NOW,
    );
    expect(rows.rows.map((r) => r.day)).toEqual([addDays("2026-11-18", -HISTORY_DAYS), "2026-11-18"]);
  });

  test("clamps negative and non-finite seconds to nothing", () => {
    const rows = normaliseDays(
      [
        { day: "2026-11-18", name: "a", seconds: -500 },
        { day: "2026-11-18", name: "b", seconds: Number.NaN },
        { day: "2026-11-18", name: "c", seconds: Infinity },
        { day: "2026-11-18", name: "d", seconds: 120.4 },
      ],
      NOW,
    );
    expect(rows.rows).toEqual([{ day: "2026-11-18", name: "d", projectId: null, seconds: 120 }]);
  });

  test("a repeated day and name keeps the largest value, not the sum", () => {
    const rows = normaliseDays(
      [
        { day: "2026-11-18", name: "a", seconds: 100 },
        { day: "2026-11-18", name: "a", seconds: 300 },
      ],
      NOW,
    );
    expect(rows.rows.map((r) => r.seconds)).toEqual([300]);
  });
});

describe("normaliseDays: overlap across projects mapped to one LOADOUT project", () => {
  test("two Hackatime projects on one LOADOUT project count the larger value once", () => {
    const { rows, flags } = normaliseDays(
      [
        { day: "2026-11-18", name: "proj-a", seconds: 2 * HOUR, projectId: "p1" },
        { day: "2026-11-18", name: "proj-b", seconds: HOUR, projectId: "p1" },
      ],
      NOW,
    );
    expect(rows.reduce((sum, r) => sum + r.seconds, 0)).toBe(2 * HOUR);
    expect(flags).toEqual([{ day: "2026-11-18", kind: "overlap", seconds: HOUR }]);
  });

  test("unmapped projects never merge with each other", () => {
    const { rows, flags } = normaliseDays(
      [
        { day: "2026-11-18", name: "x", seconds: HOUR, projectId: null },
        { day: "2026-11-18", name: "y", seconds: HOUR, projectId: null },
      ],
      NOW,
    );
    expect(rows.reduce((sum, r) => sum + r.seconds, 0)).toBe(2 * HOUR);
    expect(flags).toEqual([]);
  });

  test("different LOADOUT projects on the same day both count", () => {
    const { rows } = normaliseDays(
      [
        { day: "2026-11-18", name: "a", seconds: HOUR, projectId: "p1" },
        { day: "2026-11-18", name: "b", seconds: HOUR, projectId: "p2" },
      ],
      NOW,
    );
    expect(rows.reduce((sum, r) => sum + r.seconds, 0)).toBe(2 * HOUR);
  });
});

describe("normaliseDays: daily cap", () => {
  test("the default cap is 16 hours", () => {
    expect(DAILY_CAP_SECONDS).toBe(16 * HOUR);
  });

  test("a day over the cap is cut down to the cap and flagged", () => {
    const { rows, flags } = normaliseDays(
      [
        { day: "2026-11-18", name: "a", seconds: 10 * HOUR },
        { day: "2026-11-18", name: "b", seconds: 10 * HOUR },
      ],
      NOW,
    );
    expect(rows.reduce((sum, r) => sum + r.seconds, 0)).toBe(DAILY_CAP_SECONDS);
    expect(flags.filter((f) => f.kind === "capped")).toEqual([
      { day: "2026-11-18", kind: "capped", seconds: 20 * HOUR - DAILY_CAP_SECONDS },
    ]);
  });

  test("the cap does not depend on input order", () => {
    const a = normaliseDays(
      [
        { day: "2026-11-18", name: "b", seconds: 10 * HOUR },
        { day: "2026-11-18", name: "a", seconds: 10 * HOUR },
      ],
      NOW,
    );
    const b = normaliseDays(
      [
        { day: "2026-11-18", name: "a", seconds: 10 * HOUR },
        { day: "2026-11-18", name: "b", seconds: 10 * HOUR },
      ],
      NOW,
    );
    expect(a.rows).toEqual(b.rows);
  });

  test("a custom cap is honoured", () => {
    const { rows } = normaliseDays([{ day: "2026-11-18", name: "a", seconds: 5 * HOUR }], NOW, { capSeconds: 2 * HOUR });
    expect(rows[0].seconds).toBe(2 * HOUR);
  });
});

describe("normaliseDays: sudden jumps", () => {
  function steady(hoursPerDay: number, days: number) {
    const out = [];
    for (let i = 1; i <= days; i++) out.push({ day: addDays("2026-11-18", -i), name: "a", seconds: hoursPerDay * HOUR });
    return out;
  }

  test("a day above 3x the 14 day median and above 10 hours is suspicious", () => {
    const { flags } = normaliseDays([...steady(1, 14), { day: "2026-11-18", name: "a", seconds: 11 * HOUR }], NOW);
    expect(flags).toEqual([{ day: "2026-11-18", kind: "suspicious", seconds: 11 * HOUR }]);
  });

  test("a big day that is not 3x the usual is not flagged", () => {
    const { flags } = normaliseDays([...steady(5, 14), { day: "2026-11-18", name: "a", seconds: 11 * HOUR }], NOW);
    expect(flags.filter((f) => f.kind === "suspicious")).toEqual([]);
  });

  test("a spike under 10 hours is not flagged even against a tiny median", () => {
    const { flags } = normaliseDays([...steady(0.5, 14), { day: "2026-11-18", name: "a", seconds: 4 * HOUR }], NOW);
    expect(flags.filter((f) => f.kind === "suspicious")).toEqual([]);
  });

  test("days with no activity do not pull the median down", () => {
    // one active day (2 h) in the window, then a 12 h day: the median of non-zero days is 2 h, so 12 h is flagged
    const { flags } = normaliseDays(
      [{ day: addDays("2026-11-18", -3), name: "a", seconds: 2 * HOUR }, { day: "2026-11-18", name: "a", seconds: 12 * HOUR }],
      NOW,
    );
    expect(flags.some((f) => f.kind === "suspicious" && f.day === "2026-11-18")).toBe(true);
  });
});

describe("canManualRefresh", () => {
  test("allows a refresh when the person never synced", () => {
    expect(canManualRefresh(null, NOW)).toEqual({ ok: true });
  });

  test("blocks a refresh inside the 10 minute window and says when it opens", () => {
    const last = new Date(NOW.getTime() - MANUAL_REFRESH_MS + 60_000);
    const result = canManualRefresh(last, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAt.getTime()).toBe(last.getTime() + MANUAL_REFRESH_MS);
  });

  test("allows a refresh once the window has passed", () => {
    expect(canManualRefresh(new Date(NOW.getTime() - MANUAL_REFRESH_MS), NOW)).toEqual({ ok: true });
  });
});
