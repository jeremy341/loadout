import { stageView, type StageNodeState } from "@/lib/platform/project-stage";

const SR_NOTE: Record<StageNodeState, string> = { done: ", done", active: ", current", todo: "", changes: ", current, needs changes", rejected: ", current, rejected" };

// The Stasis stage strip: numbered squares joined by a rule, done steps filled, the current step marked. The last square is the
// outcome. A project sent back for changes or rejected has its own mark there instead of dropping back to the first step.
export function StageProgress({ status }: Readonly<{ status: string }>) {
  const view = stageView(status);
  return (
    <section className="pf-stage" aria-labelledby="stage-heading" data-outcome={view.outcome ?? undefined}>
      <h2 id="stage-heading" className="pf-sr">Project stage</h2>
      <ol className="pf-stage-steps">
        {view.steps.map((step, index) => (
          <li
            className="pf-stage-step"
            data-state={step.state}
            aria-current={step.state === "active" || step.state === "changes" || step.state === "rejected" ? "step" : undefined}
            key={step.label}
          >
            <span className="pf-stage-node" aria-hidden="true">
              {step.state === "done" ? (
                <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" focusable="false">
                  <path d="M1 6h2v2h2v2H3V8H1zM5 8h2V6h2V4h2v2H9v2H7v2H5z" />
                </svg>
              ) : step.state === "todo" ? (
                index + 1
              ) : null}
            </span>
            <span className="pf-stage-label">
              {step.label}
              {SR_NOTE[step.state] ? <span className="pf-sr">{SR_NOTE[step.state]}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      <p className="pf-stage-note">{view.note}</p>
    </section>
  );
}
