import { undisclosedAiCommits, usedAi, type ReviewShip } from "@/lib/platform/review";

// The AI-usage panel's rules. The numbers are cached sample numbers; the check itself is a stub that opens with the review
// service. A failed or malformed result becomes a quiet line, never an exception. Rewritten for LOADOUT; the idea follows
// Pixl's fraudy check.

export type AiCheckOk = {
  state: "ok";
  // Minutes since the check ran.
  checkedMinutesAgo: number;
  commitsChecked: number;
  commitsFlagged: number;
  // The checker's estimate of the share of the code that a model wrote.
  estimatedPercent: number;
  signals: string[];
};
export type AiCheckFailed = { state: "unavailable"; reason: string };
export type AiCheckResult = AiCheckOk | AiCheckFailed;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const whole = (value: unknown, max: number): number | null => (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max ? value : null);

// Accepts anything. A result that is not shaped as expected becomes the quiet "unavailable" state.
export function safeAiResult(value: unknown): AiCheckResult {
  if (!isObject(value)) return { state: "unavailable", reason: "No result came back." };
  if (value.state === "unavailable") return { state: "unavailable", reason: typeof value.reason === "string" && value.reason.trim() ? value.reason.slice(0, 200) : "The check did not answer." };
  if (value.state !== "ok") return { state: "unavailable", reason: "The result was not in a shape we can read." };
  const checked = whole(value.checkedMinutesAgo, 100_000);
  const commitsChecked = whole(value.commitsChecked, 100_000);
  const commitsFlagged = whole(value.commitsFlagged, 100_000);
  const estimated = whole(value.estimatedPercent, 100);
  if (checked === null || commitsChecked === null || commitsFlagged === null || estimated === null || commitsFlagged > commitsChecked) {
    return { state: "unavailable", reason: "The numbers in the result did not add up." };
  }
  const signals = Array.isArray(value.signals) ? value.signals.filter((item): item is string => typeof item === "string").slice(0, 6).map((item) => item.slice(0, 160)) : [];
  return { state: "ok", checkedMinutesAgo: checked, commitsChecked, commitsFlagged, estimatedPercent: estimated, signals };
}

export function checkedLabel(minutesAgo: number): string {
  if (minutesAgo < 1) return "checked just now";
  if (minutesAgo < 60) return `checked ${Math.round(minutesAgo)} min ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 48) return `checked ${hours} h ago`;
  return `checked ${Math.floor(hours / 24)} days ago`;
}

// How far the estimate may sit from the declaration before it is worth a question.
export const AI_TOLERANCE_POINTS = 10;

export type AiComparison = { declared: number; estimated: number; difference: number; state: "matches" | "higher" | "lower"; sentence: string };

export function compareAi(declared: number, estimated: number): AiComparison {
  const difference = estimated - declared;
  if (Math.abs(difference) <= AI_TOLERANCE_POINTS) {
    return { declared, estimated, difference, state: "matches", sentence: `The estimate (${estimated}%) is within ${AI_TOLERANCE_POINTS} points of the declaration (${declared}%).` };
  }
  if (difference > 0) return { declared, estimated, difference, state: "higher", sentence: `The estimate (${estimated}%) is ${difference} points above the declaration (${declared}%). Ask the builder what the model wrote.` };
  return { declared, estimated, difference, state: "lower", sentence: `The estimate (${estimated}%) is ${-difference} points below the declaration (${declared}%). That is not a concern by itself.` };
}

export type AiPanelView =
  | { state: "ok"; checked: string; comparison: AiComparison; flagged: string; undisclosed: string | null; signals: string[] }
  | { state: "unavailable"; line: string; declaredLine: string };

export function aiPanelView(ship: Pick<ReviewShip, "ai" | "commits">, result: unknown): AiPanelView {
  const checked = safeAiResult(result);
  const declaredLine = usedAi(ship) ? `The builder declared ${ship.ai.percent}% AI use.` : "The builder declared no AI use.";
  if (checked.state === "unavailable") return { state: "unavailable", line: `The AI-usage check is not available. ${checked.reason}`, declaredLine };
  const undisclosed = undisclosedAiCommits(ship);
  return {
    state: "ok",
    checked: checkedLabel(checked.checkedMinutesAgo),
    comparison: compareAi(ship.ai.percent, checked.estimatedPercent),
    flagged: `${checked.commitsFlagged} of ${checked.commitsChecked} ${checked.commitsChecked === 1 ? "commit" : "commits"} looked model-written.`,
    undisclosed: undisclosed > 0 ? `${undisclosed} ${undisclosed === 1 ? "commit is" : "commits are"} signed by an AI tool and the builder declared no AI use.` : null,
    signals: checked.signals,
  };
}
