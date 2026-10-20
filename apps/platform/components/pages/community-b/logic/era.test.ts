import { describe, expect, test } from "bun:test";
import { ERA_CONFIG } from "../data";
import { eraProgressPct, simulateEras, type EraConfig, type ShipEvent } from "./era";

const utc = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h);
// ERA_CONFIG: starts Mon 12 Oct 2026 00:00 UTC, STEAM baseline 640 of 1000, then ELECTRIFICATION (300 of 1200).
const ship = (m: number, d: number, points = 120): ShipEvent => ({ atMs: utc(2026, m, d), points });

describe("era advancement (Plan 11)", () => {
  test("starts active with the sample baseline", () => {
    const sim = simulateEras(ERA_CONFIG, [], utc(2026, 10, 20));
    expect(sim.current).toMatchObject({ index: 0, status: "active", points: 640, yourPoints: 0, thresholdMet: false, minDurationMet: false });
    expect(sim.current.elapsedDays).toBe(8);
    expect(sim.eras).toHaveLength(1);
  });

  test("the first eligible check is the second weekly reset (14 days after the start)", () => {
    const sim = simulateEras(ERA_CONFIG, [], utc(2026, 10, 20));
    expect(sim.current.nextCheckMs).toBe(Date.UTC(2026, 9, 26));
    expect(sim.current.minDurationEndsMs).toBe(Date.UTC(2026, 9, 26));
  });

  test("reaching the threshold early sets ADVANCEMENT READY but never advances before the minimum", () => {
    const ships = [ship(10, 13, 360)];
    const early = simulateEras(ERA_CONFIG, ships, utc(2026, 10, 14));
    expect(early.current).toMatchObject({ index: 0, status: "ready", thresholdMet: true, minDurationMet: false });
    const day13 = simulateEras(ERA_CONFIG, ships, Date.UTC(2026, 9, 25, 23));
    expect(day13.current.index).toBe(0);
    expect(day13.current.status).toBe("ready");
    // The first weekly reset (7 days) is not an advancement check.
    const firstReset = simulateEras(ERA_CONFIG, ships, Date.UTC(2026, 9, 19, 1));
    expect(firstReset.current.index).toBe(0);
  });

  test("advances at the second reset when both conditions hold", () => {
    const ships = [ship(10, 13, 360)];
    const sim = simulateEras(ERA_CONFIG, ships, utc(2026, 10, 26));
    expect(sim.current.index).toBe(1);
    expect(sim.current.startMs).toBe(Date.UTC(2026, 9, 26));
    expect(sim.eras[0]).toMatchObject({ status: "completed", endMs: Date.UTC(2026, 9, 26), points: 1000 });
    expect(sim.current).toMatchObject({ status: "active", baseline: 300, yourPoints: 0 });
  });

  test("a threshold that is still unmet after 14 days leaves the Era active", () => {
    const ships = [ship(10, 13, 240)];
    const sim = simulateEras(ERA_CONFIG, ships, utc(2026, 10, 28));
    expect(sim.current).toMatchObject({ index: 0, status: "active", thresholdMet: false, minDurationMet: true });
    expect(sim.current.nextCheckMs).toBe(Date.UTC(2026, 10, 2));
  });

  test("once the threshold is met it advances at the next weekly reset, not immediately", () => {
    const ships = [ship(10, 13, 240), { atMs: utc(2026, 10, 29), points: 120 }];
    const ready = simulateEras(ERA_CONFIG, ships, utc(2026, 10, 30));
    expect(ready.current).toMatchObject({ index: 0, status: "ready", nextCheckMs: Date.UTC(2026, 10, 2) });
    const advanced = simulateEras(ERA_CONFIG, ships, utc(2026, 11, 2));
    expect(advanced.current.index).toBe(1);
    expect(advanced.eras[0].endMs).toBe(Date.UTC(2026, 10, 2));
  });

  test("ships logged at the reset instant or later count for the next Era", () => {
    const atReset = { atMs: Date.UTC(2026, 9, 26), points: 500 };
    const sim = simulateEras(ERA_CONFIG, [atReset], utc(2026, 10, 27));
    expect(sim.current.index).toBe(0);
    expect(sim.current.yourPoints).toBe(500);
    expect(sim.current.status).toBe("ready");
  });

  test("ships dated before the Era began or after the Preview date never count", () => {
    const sim = simulateEras(ERA_CONFIG, [ship(10, 5, 900), ship(11, 20, 900)], utc(2026, 10, 20));
    expect(sim.current.yourPoints).toBe(0);
    expect(sim.current.status).toBe("active");
  });

  test("can chain through several Eras and stops at the last", () => {
    const flood: ShipEvent[] = [];
    for (let day = 12; day <= 31; day += 1) flood.push({ atMs: utc(2026, 10, day), points: 5000 });
    for (let day = 1; day <= 30; day += 1) flood.push({ atMs: utc(2026, 11, day), points: 5000 });
    const sim = simulateEras(ERA_CONFIG, flood, utc(2027, 3, 1));
    expect(sim.current.index).toBe(ERA_CONFIG.specs.length - 1);
    expect(sim.current.hasNext).toBe(false);
    expect(sim.current.nextCheckMs).toBeNull();
    expect(sim.eras.filter((e) => e.status === "completed")).toHaveLength(ERA_CONFIG.specs.length - 1);
  });

  test("a different cadence config is honoured", () => {
    const config: EraConfig = { ...ERA_CONFIG, specs: [{ id: "a", name: "A", sampleBaseline: 10, threshold: 10 }, ERA_CONFIG.specs[1]] };
    // Threshold already met at the start, but 14 days must still pass.
    const early = simulateEras(config, [], utc(2026, 10, 25));
    expect(early.current).toMatchObject({ index: 0, status: "ready" });
    expect(simulateEras(config, [], utc(2026, 10, 26)).current.index).toBe(1);
  });

  test("progress percentage caps at 100", () => {
    expect(eraProgressPct({ points: 640, threshold: 1000 })).toBe(64);
    expect(eraProgressPct({ points: 5000, threshold: 1000 })).toBe(100);
    expect(eraProgressPct({ points: 5, threshold: 0 })).toBe(0);
  });
});
