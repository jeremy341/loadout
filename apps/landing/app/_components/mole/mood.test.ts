import { describe, expect, test } from "bun:test";
import { Mood } from "./mood";

// Runs the mood for `seconds` in 0.05 s steps, calling `each` with the step length before every update.
function run(mood: Mood, seconds: number, each?: (dt: number) => void) {
  const dt = 0.05;
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    each?.(dt);
    mood.update(dt);
  }
}

// The first second at which `stage()` is true while `each` keeps being applied.
function secondsUntil(mood: Mood, limit: number, each: (dt: number) => void, stage: () => boolean) {
  const dt = 0.05;
  for (let t = 0; t < limit; t += dt) {
    each(dt);
    mood.update(dt);
    if (stage()) return t + dt;
  }
  return Infinity;
}

describe("affection", () => {
  test("gentle petting makes him happy at once, blissful only after the minimum time, never in a second", () => {
    const mood = new Mood();
    run(mood, 1, (dt) => mood.pet(dt));
    expect(mood.affectionStage).toBe("happy");
    run(mood, 3, (dt) => mood.pet(dt));
    expect(mood.affectionStage).toBe("happy"); // value is high, but he stays happy for at least 6 seconds
    run(mood, 4, (dt) => mood.pet(dt));
    expect(mood.affectionStage).toBe("bliss");
  });
  test("bliss comes in about 8 seconds of petting and overjoyed after another 6", () => {
    const mood = new Mood();
    const bliss = secondsUntil(mood, 30, (dt) => mood.pet(dt), () => mood.affectionStage === "bliss");
    expect(bliss).toBeGreaterThan(5.9);
    expect(bliss).toBeLessThan(9);
    const overjoyed = secondsUntil(mood, 30, (dt) => mood.pet(dt), () => mood.affectionStage === "overjoyed");
    expect(overjoyed).toBeGreaterThan(5.9);
    expect(overjoyed).toBeLessThan(9);
  });
  test("affection fades when nobody is petting him", () => {
    const mood = new Mood();
    run(mood, 5, (dt) => mood.pet(dt));
    const before = mood.affection;
    run(mood, 6);
    expect(mood.affection).toBeLessThan(before - 10);
  });
  test("a poke and a tickle add a fixed amount", () => {
    const mood = new Mood();
    mood.poke();
    expect(mood.affection).toBe(5);
    mood.tickle();
    expect(mood.affection).toBe(17);
  });
});

describe("irritation", () => {
  test("scribbling makes him wary in about 2 seconds, annoyed in about 12, angry in about 22 and furious in about 32", () => {
    const mood = new Mood();
    const each = (dt: number) => mood.scribble(dt);
    const wary = secondsUntil(mood, 60, each, () => mood.irritationStage === "wary");
    expect(wary).toBeGreaterThan(1.5);
    expect(wary).toBeLessThan(2.6);
    const annoyed = secondsUntil(mood, 60, each, () => mood.irritationStage === "annoyed");
    expect(annoyed).toBeGreaterThan(9.5);
    expect(annoyed).toBeLessThan(11);
    const angry = secondsUntil(mood, 60, each, () => mood.irritationStage === "angry");
    expect(angry).toBeGreaterThan(9.5);
    expect(angry).toBeLessThan(11);
    const furious = secondsUntil(mood, 60, each, () => mood.irritationStage === "furious");
    expect(furious).toBeGreaterThan(9.5);
    expect(furious).toBeLessThan(11);
  });
  test("a short scribble of three seconds can only make him wary", () => {
    const mood = new Mood();
    run(mood, 3, (dt) => mood.scribble(dt));
    expect(mood.irritationStage).toBe("wary");
    run(mood, 2, (dt) => mood.scribble(dt));
    expect(["wary", "annoyed"]).toContain(mood.irritationStage);
  });
  test("a pinch is wary at once, and annoyed only after the stage minimum", () => {
    const mood = new Mood();
    mood.pinchStart();
    run(mood, 2, (dt) => mood.pinch(dt));
    expect(mood.irritationStage).toBe("wary");
    expect(mood.irritation).toBeGreaterThan(25);
  });
  test("when you stop he calms down one stage at a time, about every ten seconds", () => {
    const mood = new Mood();
    run(mood, 35, (dt) => mood.scribble(dt));
    expect(mood.irritationStage).toBe("furious");
    const stages: string[] = [];
    run(mood, 70, () => {
      if (stages[stages.length - 1] !== mood.irritationStage) stages.push(mood.irritationStage);
    });
    expect(stages).toEqual(["furious", "angry", "annoyed", "wary", "calm"]);
  });
  test("kind things soothe him", () => {
    const mood = new Mood();
    mood.pinchStart();
    const before = mood.irritation;
    run(mood, 1, (dt) => mood.pet(dt));
    expect(mood.irritation).toBeLessThan(before);
  });
  test("being petted a long time makes him tired of it", () => {
    const mood = new Mood();
    run(mood, 20, (dt) => mood.pet(dt));
    expect(mood.enough).toBe(true);
    mood.update(0.05);
    expect(mood.affectionStage).toBe("overjoyed");
  });
  test("poke spam adds irritation", () => {
    const mood = new Mood();
    mood.spam();
    mood.spam();
    expect(mood.irritation).toBe(16);
  });
});

describe("the grudge", () => {
  test("after he stormed off, irritation grows half as fast again, for two minutes", () => {
    const touchy = new Mood();
    touchy.stormedOff();
    expect(touchy.grudge).toBe(true);
    touchy.pinchStart();
    expect(touchy.irritation).toBeCloseTo(21);
    run(touchy, 121);
    expect(touchy.grudge).toBe(false);
    const calm = new Mood();
    calm.pinchStart();
    expect(calm.irritation).toBe(14);
  });
});
