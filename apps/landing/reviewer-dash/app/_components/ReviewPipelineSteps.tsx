import { currentFirstPassAt } from "@/reviewer-dash/lib/reviewCycleDisplay";

type StepState = "done" | "current" | "upcoming";

const DOT: Record<StepState, string> = {
  done: "var(--hc-green)",
  current: "var(--hc-purple)",
  upcoming: "var(--border-strong)",
};

function Step({ label, state }: { label: string; state: StepState }) {
  return (
    <div className="flex items-center gap-1.5" aria-current={state === "current" ? "step" : undefined}>
      <span className="hc-dot shrink-0" style={{ background: DOT[state] }} />
      <span className={`text-xs ${state === "upcoming" ? "hc-muted" : "font-bold"}`}>{label}</span>
    </div>
  );
}

// Where a ship is on its way to a verdict. Each step is a word as well as a dot, and the current one is marked for screen readers.
export function ReviewPipelineSteps({
  shippedAt,
  firstPassAt,
  status,
}: {
  shippedAt: string | null;
  firstPassAt: string | null;
  status: string;
}) {
  const firstPassThisCycle = currentFirstPassAt(status, firstPassAt);
  const approved = status === "approved";
  const secondPass: StepState = approved ? "done" : status === "second_review" ? "current" : "upcoming";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <Step label="Submitted" state={shippedAt ? "done" : "upcoming"} />
      <Step label="First pass" state={firstPassThisCycle ? "done" : shippedAt ? "current" : "upcoming"} />
      <Step label="Second pass" state={secondPass} />
      <Step label="Approved" state={approved ? "done" : "upcoming"} />
    </div>
  );
}
