import { goalPercent, goalValueText, type CommunityGoalView } from "@/lib/platform/community";

// A goal as a plain bar. The fill is decoration: the words and the figures beside it carry the meaning, so colour is never
// the only signal. On the Overview strip the compact form keeps the bar but leaves the figures to the Goals page.
export function GoalBar({ goal, compact = false }: { goal: Pick<CommunityGoalView, "title" | "current" | "target">; compact?: boolean }) {
  const percent = goalPercent(goal.current, goal.target);
  const text = goalValueText(goal);
  return (
    <div className="cm-goal-meter">
      <div className="cm-bar" role="progressbar" aria-label={goal.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${text}, ${percent}%`}>
        <span className="cm-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      {compact ? null : (
        <p className="cm-goal-value">
          <span>{text}</span>
          <span className="cm-goal-pct">{percent}%</span>
        </p>
      )}
    </div>
  );
}
