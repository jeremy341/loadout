import { describe, expect, test } from "bun:test";
import {
  DEFAULT_INPUTS,
  MAX_SCENARIOS,
  capFor,
  clampMultiplier,
  compareScenarios,
  deleteScenario,
  estimateFromInputs,
  estimateOre,
  hoursToAfford,
  meanScore,
  multiplierFor,
  renameScenario,
  saveScenario,
  scoreToMultiplier,
  signalTierFor,
  type CalcInputs,
  type Scenario,
} from "./ore-calc";

const NOW = "2026-10-20T10:00:00.000Z";

describe("caps", () => {
  test("20x normally, 30x only with a Great Signal claim", () => {
    expect(capFor("none")).toBe(20);
    expect(capFor("good")).toBe(20);
    expect(capFor("great")).toBe(30);
  });

  test("the multiplier is held between 1x and the cap for its tier", () => {
    expect(clampMultiplier(0, "none")).toBe(1);
    expect(clampMultiplier(25, "none")).toBe(20);
    expect(clampMultiplier(25, "good")).toBe(20);
    expect(clampMultiplier(25, "great")).toBe(25);
    expect(clampMultiplier(45, "great")).toBe(30);
    expect(clampMultiplier(Number.NaN, "great")).toBe(1);
  });
});

describe("estimateOre", () => {
  test("20 hours at 10x is 200 base Ore", () => {
    const result = estimateOre({ hours: 20, multiplier: 10, signal: "none", era: false });
    expect(result.baseOre).toBe(200);
    expect(result.total).toBe(200);
    expect(result.signalBonus).toBe(0);
  });

  test("a qualifying Era adds 10% of base Ore: 220 in total", () => {
    const result = estimateOre({ hours: 20, multiplier: 10, signal: "none", era: true });
    expect(result.eraBonus).toBe(20);
    expect(result.total).toBe(220);
  });

  test("a normal ship cannot pass 20x even if asked", () => {
    const result = estimateOre({ hours: 10, multiplier: 30, signal: "none", era: false });
    expect(result.multiplier).toBe(20);
    expect(result.capped).toBe(true);
    expect(result.total).toBe(200);
  });

  test("Good Signal adds a flat 50 Ore and does not lift the cap", () => {
    const result = estimateOre({ hours: 10, multiplier: 25, signal: "good", era: false });
    expect(result.multiplier).toBe(20);
    expect(result.goodBonus).toBe(50);
    expect(result.greatUplift).toBe(0);
    expect(result.total).toBe(250);
  });

  test("Great Signal at 30x: the rate above 20x is the uplift, not an extra 30x on top", () => {
    const result = estimateOre({ hours: 100, multiplier: 30, signal: "great", era: false });
    expect(result.baseOre).toBe(2000);
    expect(result.greatUplift).toBe(1000);
    expect(result.signalBonus).toBe(1050);
    expect(result.total).toBe(3050);
    // The naive "30x plus a 30x bonus" would be 6,000. The total never counts the hourly rate twice.
    expect(result.total).toBeLessThan(100 * 30 + 100 * 30);
    expect(result.total).toBe(100 * 30 + 50);
  });

  test("Great Signal at 20x or below has no uplift but still includes the Good reward", () => {
    const result = estimateOre({ hours: 50, multiplier: 12, signal: "great", era: false });
    expect(result.greatUplift).toBe(0);
    expect(result.signalBonus).toBe(50);
    expect(result.total).toBe(650);
  });

  test("the Signal bonus is held to 5,000 Ore per project", () => {
    const result = estimateOre({ hours: 1000, multiplier: 30, signal: "great", era: false });
    expect(result.baseOre).toBe(20000);
    expect(result.signalBonus).toBe(5000);
    expect(result.signalCapped).toBe(true);
    expect(result.total).toBe(25000);
  });

  test("the Era bonus is on base Ore only, not on the Signal bonus", () => {
    const result = estimateOre({ hours: 100, multiplier: 30, signal: "great", era: true });
    expect(result.eraBonus).toBe(200);
    expect(result.total).toBe(2000 + 1050 + 200);
  });

  test("zero or invalid hours give zero Ore", () => {
    expect(estimateOre({ hours: 0, multiplier: 10, signal: "none", era: false }).total).toBe(0);
    expect(estimateOre({ hours: Number.NaN, multiplier: 10, signal: "none", era: false }).total).toBe(0);
    expect(estimateOre({ hours: -5, multiplier: 10, signal: "none", era: false }).total).toBe(0);
  });

  test("half hours round to whole Ore", () => {
    expect(estimateOre({ hours: 2.5, multiplier: 7, signal: "none", era: false }).baseOre).toBe(18);
  });

  test("results are whole numbers and the steps explain the total", () => {
    const result = estimateOre({ hours: 13.7, multiplier: 8.3, signal: "good", era: true });
    for (const value of [result.baseOre, result.signalBonus, result.eraBonus, result.total]) expect(Number.isInteger(value)).toBe(true);
    expect(result.steps[result.steps.length - 1]).toContain(result.total.toLocaleString("en-GB"));
  });
});

describe("scores to multiplier (Draft preview curve)", () => {
  test("means of the four scores", () => {
    expect(meanScore([5, 5, 5, 5])).toBe(5);
    expect(meanScore([9, 9, 9, 9])).toBe(9);
    expect(meanScore([1, 1, 1, 1])).toBe(1);
    expect(meanScore([4, 5, 6, 7])).toBe(5.5);
    expect(meanScore([0, 12, 5, 5])).toBe(5);
  });

  test("the ends are 1x and the cap", () => {
    expect(scoreToMultiplier(1)).toBe(1);
    expect(scoreToMultiplier(9)).toBe(20);
    expect(scoreToMultiplier(9, 30)).toBe(30);
    expect(scoreToMultiplier(-3)).toBe(1);
    expect(scoreToMultiplier(40)).toBe(20);
  });

  test("rises with the score and a middling score lands near the 10x mean", () => {
    let last = 0;
    for (let score = 1; score <= 9; score += 0.5) {
      const value = scoreToMultiplier(score);
      expect(value).toBeGreaterThanOrEqual(last);
      last = value;
    }
    expect(Math.abs(scoreToMultiplier(5) - 10)).toBeLessThan(1.5);
  });

  test("a uniform spread of scores averages 10x", () => {
    let total = 0;
    const steps = 4000;
    for (let i = 0; i <= steps; i += 1) total += scoreToMultiplier(1 + (8 * i) / steps);
    expect(Math.abs(total / (steps + 1) - 10)).toBeLessThan(0.1);
  });
});

describe("inputs", () => {
  test("score mode uses the scores, direct mode uses the slider", () => {
    const scored: CalcInputs = { ...DEFAULT_INPUTS, mode: "scores", scores: [9, 9, 9, 9] };
    expect(multiplierFor(scored)).toBe(20);
    expect(multiplierFor({ ...scored, mode: "direct", multiplier: 7 })).toBe(7);
  });

  test("a Great Signal claim lets the score curve reach 30x", () => {
    const top: CalcInputs = { ...DEFAULT_INPUTS, scores: [9, 9, 9, 9], signal: "great" };
    expect(multiplierFor(top)).toBe(30);
    expect(estimateFromInputs({ ...top, hours: 10 }).total).toBe(300 + 50);
  });

  test("turning Great off pulls a direct 30x back to 20x", () => {
    const direct: CalcInputs = { ...DEFAULT_INPUTS, mode: "direct", multiplier: 30, signal: "great" };
    expect(multiplierFor(direct)).toBe(30);
    expect(multiplierFor({ ...direct, signal: "none" })).toBe(20);
  });
});

describe("hoursToAfford", () => {
  test("hours needed at an Ore-per-hour rate", () => {
    expect(hoursToAfford(200, 10)).toBe(20);
    expect(hoursToAfford(24, 10)).toBe(2.4);
    expect(hoursToAfford(100, 0)).toBeNull();
  });
});

describe("signalTierFor", () => {
  test("Reddit 25 and 500", () => {
    expect(signalTierFor("reddit", 24)).toBe("none");
    expect(signalTierFor("reddit", 25)).toBe("good");
    expect(signalTierFor("reddit", 499)).toBe("good");
    expect(signalTierFor("reddit", 500)).toBe("great");
  });

  test("Hacker News Great needs the front page", () => {
    expect(signalTierFor("hn", 10)).toBe("good");
    expect(signalTierFor("hn", 150)).toBe("good");
    expect(signalTierFor("hn", 150, { frontPage: true })).toBe("great");
    expect(signalTierFor("hn", 99, { frontPage: true })).toBe("good");
  });

  test("GitHub, YouTube, short video, social, app stores, packages and mods", () => {
    expect(signalTierFor("github", 25)).toBe("good");
    expect(signalTierFor("github", 100)).toBe("great");
    expect(signalTierFor("youtube", 250)).toBe("good");
    expect(signalTierFor("youtube", 50000)).toBe("great");
    expect(signalTierFor("short-video", 5000)).toBe("good");
    expect(signalTierFor("short-video", 100000)).toBe("great");
    expect(signalTierFor("social", 50)).toBe("good");
    expect(signalTierFor("social", 1500)).toBe("great");
    expect(signalTierFor("app-store", 100)).toBe("good");
    expect(signalTierFor("app-store", 10000)).toBe("great");
    expect(signalTierFor("package", 1000)).toBe("good");
    expect(signalTierFor("package", 50000)).toBe("great");
    expect(signalTierFor("mods", 2500)).toBe("good");
    expect(signalTierFor("mods", 100000)).toBe("great");
  });

  test("Instagram: 200 likes is Good, 10,000 likes or 100,000 views is Great", () => {
    expect(signalTierFor("instagram-likes", 200)).toBe("good");
    expect(signalTierFor("instagram-likes", 10000)).toBe("great");
    expect(signalTierFor("instagram-views", 99999)).toBe("none");
    expect(signalTierFor("instagram-views", 100000)).toBe("great");
  });

  test("unknown platforms and bad numbers give none", () => {
    expect(signalTierFor("nope", 1e9)).toBe("none");
    expect(signalTierFor("reddit", -1)).toBe("none");
    expect(signalTierFor("reddit", Number.NaN)).toBe("none");
  });
});

describe("scenarios", () => {
  function make(name: string, overrides: Partial<CalcInputs> = {}, id = name): Scenario {
    const result = saveScenario([], name, { ...DEFAULT_INPUTS, ...overrides }, id, NOW);
    if (!result.ok) throw new Error(result.error);
    return result.scenario;
  }

  test("saves with a name, or a numbered default", () => {
    const first = saveScenario([], "  Pi robot  ", DEFAULT_INPUTS, "s1", NOW);
    expect(first.ok && first.scenario.name).toBe("Pi robot");
    const second = saveScenario(first.ok ? first.list : [], "", DEFAULT_INPUTS, "s2", NOW);
    expect(second.ok && second.scenario.name).toBe("Scenario 2");
  });

  test("copies the inputs so later edits do not change a saved scenario", () => {
    const inputs: CalcInputs = { ...DEFAULT_INPUTS, scores: [5, 5, 5, 5] };
    const result = saveScenario([], "A", inputs, "s1", NOW);
    inputs.scores[0] = 9;
    expect(result.ok && result.scenario.inputs.scores[0]).toBe(5);
  });

  test("refuses duplicate names and a full list", () => {
    const first = saveScenario([], "Plan", DEFAULT_INPUTS, "s1", NOW);
    expect(saveScenario(first.ok ? first.list : [], "plan", DEFAULT_INPUTS, "s2", NOW).ok).toBe(false);
    let list: Scenario[] = [];
    for (let i = 0; i < MAX_SCENARIOS; i += 1) {
      const next = saveScenario(list, `S${i}`, DEFAULT_INPUTS, `id${i}`, NOW);
      if (next.ok) list = next.list;
    }
    expect(list).toHaveLength(MAX_SCENARIOS);
    expect(saveScenario(list, "extra", DEFAULT_INPUTS, "idx", NOW).ok).toBe(false);
  });

  test("renames, refusing empty and duplicate names", () => {
    const a = saveScenario([], "A", DEFAULT_INPUTS, "s1", NOW);
    const b = saveScenario(a.ok ? a.list : [], "B", DEFAULT_INPUTS, "s2", NOW);
    const list = b.ok ? b.list : [];
    const renamed = renameScenario(list, "s1", "Alpha");
    expect(renamed.ok && renamed.list[0].name).toBe("Alpha");
    expect(renameScenario(list, "s1", "b").ok).toBe(false);
    expect(renameScenario(list, "s1", "  ").ok).toBe(false);
    expect(renameScenario(list, "zzz", "New").ok).toBe(false);
    expect(renameScenario(list, "s1", "a").ok).toBe(true);
  });

  test("deletes by id", () => {
    const a = saveScenario([], "A", DEFAULT_INPUTS, "s1", NOW);
    expect(deleteScenario(a.ok ? a.list : [], "s1")).toEqual([]);
  });

  test("compares two scenarios row by row and names the higher one", () => {
    const low = make("Low", { hours: 10, mode: "direct", multiplier: 5 });
    const high = make("High", { hours: 20, mode: "direct", multiplier: 10 });
    const comparison = compareScenarios(low, high);
    const total = comparison.rows.find((row) => row.label === "Estimated total");
    expect(total).toEqual({ label: "Estimated total", a: 50, b: 200, delta: 150 });
    expect(comparison.higher).toBe("b");
    expect(compareScenarios(high, low).higher).toBe("a");
    expect(compareScenarios(low, { ...low, id: "copy" }).higher).toBeNull();
  });

  test("a comparison includes Signal and Era differences", () => {
    const plain = make("Plain", { mode: "direct", multiplier: 10, hours: 20 });
    const boosted = make("Boosted", { mode: "direct", multiplier: 10, hours: 20, signal: "good", era: true });
    const rows = compareScenarios(plain, boosted).rows;
    expect(rows.find((row) => row.label === "Signal bonus")?.delta).toBe(50);
    expect(rows.find((row) => row.label === "Era bonus")?.delta).toBe(20);
    expect(rows.find((row) => row.label === "Estimated total")?.delta).toBe(70);
  });
});
