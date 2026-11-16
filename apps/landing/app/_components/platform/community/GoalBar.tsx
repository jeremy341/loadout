import { type Goal, goalPercent, goalValueText } from "@/lib/platform/community";

// A goal as a plain bar. The fill is decoration: the words and the figures beside it carry the meaning, so colour is never
// the only signal.
export function GoalBar({ goal }: { goal: Goal }) {
  const percent = goalPercent(goal.value, goal.target);
  const text = goalValueText(goal);
  return (
    <div className="cm-goal-meter">
      <div className="cm-bar" role="progressbar" aria-label={goal.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${text}, ${percent}%`}>
        <span className="cm-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="cm-goal-value">
        <span>{text}</span>
        <span className="cm-goal-pct">{percent}%</span>
      </p>
    </div>
  );
}
