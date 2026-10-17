import { describe, expect, test } from "bun:test";
import { TUNING } from "./tuning";

describe("how long each beat stays on screen", () => {
  test("nothing that carries meaning is shorter than 0.35 s, since a person cannot read less", () => {
    const beats = Object.entries(TUNING.beat).flatMap(([name, value]) =>
      typeof value === "number" ? [[name, value] as [string, number]] : (value as readonly number[]).map((v, i) => [`${name}[${i}]`, v] as [string, number]),
    );
    for (const [name, value] of beats) expect(value, name).toBeGreaterThanOrEqual(0.35);
    expect(TUNING.flee.flinch).toBeGreaterThanOrEqual(0.6);
    expect(TUNING.held.yelpFor).toBeGreaterThanOrEqual(0.4);
  });

  test("the turned back, the stomp and the angry beats are long enough to notice", () => {
    expect(TUNING.beat.turn).toBeGreaterThanOrEqual(1.5);
    expect(TUNING.beat.stomp).toBeGreaterThanOrEqual(2);
    expect(TUNING.beat.madBeat).toBeGreaterThanOrEqual(0.6);
  });
});
