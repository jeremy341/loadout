import { DRAFT_RULES, PLAN_RULES, SIGNAL_PLATFORMS } from "../data";

// The Ore estimate (plans/02 sections 9, 10, 11 and 17; plans/22 sections 1 to 3).
//
//   base Ore = approved hours x hourly multiplier            (plans/02 section 11)
//   multiplier: 1x to 20x, 10x mean; Great Signal lifts the cap to 30x (plans/02 sections 10 and 17)
//   Good Signal: +50 Ore; Great includes it. Total Signal bonus is capped at 5,000 Ore per project.
//   Era bonus: 10% of the approved base Ore, when a reviewer marks the ship as qualifying.
//
// This is an estimate. Peer reviewers decide the real multiplier from 12 countable reviews. The score-to-multiplier
// curve below is a Draft preview rule, because no plan fixes the percentile population or the curve.

export type SignalTier = "none" | "good" | "great";

export function capFor(signal: SignalTier): number {
  return signal === "great" ? PLAN_RULES.greatCapMultiplier : PLAN_RULES.normalCapMultiplier;
}

function round(value: number, places = 0): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function clampScore(value: number): number {
  return clamp(Math.round(value), PLAN_RULES.scoreMin, PLAN_RULES.scoreMax);
}

/** Mean of the four category scores, as the preview's stand-in for the mean of the four category medians. */
export function meanScore(scores: readonly number[]): number {
  if (scores.length === 0) return PLAN_RULES.scoreMin;
  const total = scores.reduce((sum, score) => sum + clampScore(score), 0);
  return round(total / scores.length, 2);
}

/** Draft preview curve: 1 + (cap - 1) x p ^ (10/9), where p is the score's place between 1 and 9. Result to one decimal. */
export function scoreToMultiplier(mean: number, cap: number = PLAN_RULES.normalCapMultiplier): number {
  const place = clamp((mean - PLAN_RULES.scoreMin) / (PLAN_RULES.scoreMax - PLAN_RULES.scoreMin), 0, 1);
  const multiplier = PLAN_RULES.minMultiplier + (cap - PLAN_RULES.minMultiplier) * Math.pow(place, DRAFT_RULES.scoreCurveExponent);
  return clamp(round(multiplier, 1), PLAN_RULES.minMultiplier, cap);
}

/** The multiplier is held to 1x..20x, or 1x..30x with a Great Signal claim. */
export function clampMultiplier(value: number, signal: SignalTier): number {
  return clamp(round(value, 1), PLAN_RULES.minMultiplier, capFor(signal));
}

export function clampHours(value: number): number {
  return clamp(round(value, 2), 0, DRAFT_RULES.maxHours);
}

export interface EstimateInput {
  hours: number;
  /** The hourly multiplier the estimate assumes, before the cap for the Signal tier. */
  multiplier: number;
  signal: SignalTier;
  era: boolean;
}

export interface EstimateResult {
  hours: number;
  /** The multiplier after the cap. */
  multiplier: number;
  capped: boolean;
  /** Hours x the multiplier up to 20x. */
  baseOre: number;
  /** Ore earned by the part of the rate above 20x, which only a Great Signal allows. */
  greatUplift: number;
  goodBonus: number;
  /** Good bonus plus Great uplift, after the 5,000 Ore ceiling. */
  signalBonus: number;
  signalCapped: boolean;
  eraBonus: number;
  total: number;
  /** Ore per approved hour at this estimate, before bonuses. */
  orePerHour: number;
  steps: string[];
}

export function estimateOre(input: EstimateInput): EstimateResult {
  const hours = clampHours(input.hours);
  const cap = capFor(input.signal);
  const multiplier = clampMultiplier(input.multiplier, input.signal);
  const capped = round(input.multiplier, 1) > cap;
  const normalRate = Math.min(multiplier, PLAN_RULES.normalCapMultiplier);

  const baseOre = Math.round(hours * normalRate);
  const fullRateOre = Math.round(hours * multiplier);
  const greatUplift = input.signal === "great" ? Math.max(0, fullRateOre - baseOre) : 0;
  const goodBonus = input.signal === "none" ? 0 : PLAN_RULES.goodSignalOre;
  const rawSignal = goodBonus + greatUplift;
  const signalBonus = Math.min(PLAN_RULES.signalCapOre, rawSignal);
  const signalCapped = rawSignal > PLAN_RULES.signalCapOre;
  const eraBonus = input.era ? Math.round((baseOre * PLAN_RULES.eraBonusPercent) / 100) : 0;
  const total = baseOre + signalBonus + eraBonus;

  const steps: string[] = [];
  steps.push(`Base Ore = ${hours} approved hours x ${normalRate}x = ${baseOre.toLocaleString("en-GB")} Ore`);
  if (input.signal === "great") {
    steps.push(
      greatUplift > 0
        ? `Great Signal lifts the cap from 20x to 30x. The rate above 20x adds ${greatUplift.toLocaleString("en-GB")} Ore. It is not a separate 30x on top.`
        : "Great Signal lifts the cap to 30x. At 20x or below there is no uplift.",
    );
  }
  if (input.signal !== "none") steps.push(`Good Signal adds ${PLAN_RULES.goodSignalOre} Ore (Great includes it).`);
  if (input.signal !== "none") {
    steps.push(
      signalCapped
        ? `Signal bonus ${rawSignal.toLocaleString("en-GB")} Ore is held to the ${PLAN_RULES.signalCapOre.toLocaleString("en-GB")} Ore per-project ceiling.`
        : `Signal bonus = ${signalBonus.toLocaleString("en-GB")} Ore (ceiling ${PLAN_RULES.signalCapOre.toLocaleString("en-GB")} Ore per project).`,
    );
  }
  if (input.era) steps.push(`Era bonus = ${PLAN_RULES.eraBonusPercent}% of base Ore = ${eraBonus.toLocaleString("en-GB")} Ore.`);
  steps.push(`Estimated total = ${total.toLocaleString("en-GB")} Ore`);

  return {
    hours,
    multiplier,
    capped,
    baseOre,
    greatUplift,
    goodBonus,
    signalBonus,
    signalCapped,
    eraBonus,
    total,
    orePerHour: multiplier,
    steps,
  };
}

// --- Inputs the form can save ---------------------------------------------------------------------------------

export type CalcMode = "scores" | "direct";

export interface CalcInputs {
  mode: CalcMode;
  hours: number;
  /** Originality, Technical Depth, Execution, Documentation. */
  scores: [number, number, number, number];
  /** Used when mode is "direct". */
  multiplier: number;
  signal: SignalTier;
  era: boolean;
}

export const DEFAULT_INPUTS: CalcInputs = {
  mode: "scores",
  hours: 20,
  scores: [5, 5, 5, 5],
  multiplier: 10,
  signal: "none",
  era: false,
};

/** The multiplier a set of inputs assumes. */
export function multiplierFor(inputs: CalcInputs): number {
  if (inputs.mode === "direct") return clampMultiplier(inputs.multiplier, inputs.signal);
  return scoreToMultiplier(meanScore(inputs.scores), capFor(inputs.signal));
}

export function estimateFromInputs(inputs: CalcInputs): EstimateResult {
  return estimateOre({ hours: inputs.hours, multiplier: multiplierFor(inputs), signal: inputs.signal, era: inputs.era });
}

/** Approved hours needed to cover a price at an Ore-per-hour rate. Null when the rate is zero. */
export function hoursToAfford(price: number, orePerHour: number): number | null {
  if (orePerHour <= 0) return null;
  return round(price / orePerHour, 1);
}

// --- Signal evidence ------------------------------------------------------------------------------------------

/**
 * Which Signal tier a count could reach on one platform. A reviewer verifies every claim, and Hacker News Great
 * needs the front page. This only tells a builder what to aim for.
 */
export function signalTierFor(platformId: string, count: number, options: { frontPage?: boolean } = {}): SignalTier {
  const platform = SIGNAL_PLATFORMS.find((candidate) => candidate.id === platformId);
  if (!platform || !Number.isFinite(count) || count < 0) return "none";
  if (count >= platform.great && (!platform.greatNeedsFrontPage || options.frontPage)) return "great";
  if (platform.good !== null && count >= platform.good) return "good";
  return "none";
}

// --- Scenarios ------------------------------------------------------------------------------------------------

export interface Scenario {
  id: string;
  name: string;
  createdAt: string;
  inputs: CalcInputs;
}

export const MAX_SCENARIOS = 20;
export const MAX_NAME = 40;

export function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
}

export type ScenarioResult = { ok: true; list: Scenario[]; scenario: Scenario } | { ok: false; error: string };

export function saveScenario(list: readonly Scenario[], rawName: string, inputs: CalcInputs, id: string, now: string): ScenarioResult {
  if (list.length >= MAX_SCENARIOS) return { ok: false, error: `You can keep up to ${MAX_SCENARIOS} scenarios. Delete one first.` };
  const name = cleanName(rawName) || `Scenario ${list.length + 1}`;
  if (list.some((scenario) => scenario.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "A scenario with that name already exists." };
  }
  const scenario: Scenario = { id, name, createdAt: now, inputs: { ...inputs, scores: [...inputs.scores] as CalcInputs["scores"] } };
  return { ok: true, list: [...list, scenario], scenario };
}

export function renameScenario(list: readonly Scenario[], id: string, rawName: string): ScenarioResult {
  const name = cleanName(rawName);
  if (!name) return { ok: false, error: "Enter a name." };
  if (list.some((scenario) => scenario.id !== id && scenario.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "A scenario with that name already exists." };
  }
  const target = list.find((scenario) => scenario.id === id);
  if (!target) return { ok: false, error: "That scenario no longer exists." };
  const scenario = { ...target, name };
  return { ok: true, list: list.map((candidate) => (candidate.id === id ? scenario : candidate)), scenario };
}

export function deleteScenario(list: readonly Scenario[], id: string): Scenario[] {
  return list.filter((scenario) => scenario.id !== id);
}

export interface CompareRow {
  label: string;
  a: number;
  b: number;
  /** b minus a. */
  delta: number;
}

export interface Comparison {
  rows: CompareRow[];
  /** The scenario with more estimated Ore, or null when they tie. */
  higher: "a" | "b" | null;
}

export function compareScenarios(a: Scenario, b: Scenario): Comparison {
  const ra = estimateFromInputs(a.inputs);
  const rb = estimateFromInputs(b.inputs);
  const rows: CompareRow[] = [
    { label: "Approved hours", a: ra.hours, b: rb.hours },
    { label: "Multiplier (x)", a: ra.multiplier, b: rb.multiplier },
    { label: "Base Ore", a: ra.baseOre, b: rb.baseOre },
    { label: "Signal bonus", a: ra.signalBonus, b: rb.signalBonus },
    { label: "Era bonus", a: ra.eraBonus, b: rb.eraBonus },
    { label: "Estimated total", a: ra.total, b: rb.total },
  ].map((row) => ({ ...row, delta: round(row.b - row.a, 2) }));
  return { rows, higher: ra.total === rb.total ? null : ra.total > rb.total ? "a" : "b" };
}
