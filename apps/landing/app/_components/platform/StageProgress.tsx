const STEPS = ["Draft", "Logging", "Submitted", "In review", "Approved"] as const;

// Where each stored status sits on the strip. Only drafts exist in M1; the later stages are provisional until the ship
// flow is built.
const CURRENT: Record<string, number> = { draft: 0, logging: 1, submitted: 2, in_review: 3, approved: 4 };

const NOTES: Record<number, string> = {
  0: "Log your time and write a journal entry for every 8 hours. Ship opens once your journal is up to date.",
  1: "Keep logging. A journal entry is due for every 8 hours of work.",
  2: "Your ship is in. A reviewer will pick it up.",
  3: "A reviewer is looking at your ship.",
  4: "Approved. Your Ore and track hours are on their way.",
};

// The Stasis stage strip: numbered squares joined by a rule, done steps filled, the current step marked.
export function StageProgress({ status }: Readonly<{ status: string }>) {
  const current = CURRENT[status] ?? 0;
  return (
    <section className="pf-stage" aria-labelledby="stage-heading">
      <h2 id="stage-heading" className="pf-sr">Project stage</h2>
      <ol className="pf-stage-steps">
        {STEPS.map((label, index) => {
          const state = index < current ? "done" : index === current ? "active" : "todo";
          return (
            <li className="pf-stage-step" data-state={state} aria-current={state === "active" ? "step" : undefined} key={label}>
              <span className="pf-stage-node" aria-hidden="true">
                {state === "done" ? (
                  <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" focusable="false">
                    <path d="M1 6h2v2h2v2H3V8H1zM5 8h2V6h2V4h2v2H9v2H7v2H5z" />
                  </svg>
                ) : state === "todo" ? (
                  index + 1
                ) : null}
              </span>
              <span className="pf-stage-label">
                {label}
                {state === "done" ? <span className="pf-sr">, done</span> : state === "active" ? <span className="pf-sr">, current</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="pf-stage-note">{NOTES[current]}</p>
    </section>
  );
}
