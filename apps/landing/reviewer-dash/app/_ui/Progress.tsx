// A thin progress bar for goal-style counters (community goals, events).
export default function Progress({
  value,
  max,
  tone = "green",
  label,
}: {
  value: number;
  max: number;
  tone?: "green" | "red" | "cyan";
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: "var(--sunken)", border: "1px solid var(--border)" }}
    >
      <div className="h-full" style={{ width: `${pct}%`, background: `var(--hc-${tone})` }} />
    </div>
  );
}
