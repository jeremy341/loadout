import { gateConditions, TOOLBELT_MIN_HOURS } from "@/lib/platform/toolbelt";
import { meterPercents } from "@/lib/platform/toolbelt-ui";
import "./toolbelt.css";

const CHECKED_AT_REVIEW = [
  "The tool is used in a core part of the project",
  "Your journal shows real use",
  "A reviewer confirms the use",
] as const;

// The four conditions of the significant-use gate (design spec 3.14). Only the hours line can ever show a tick, from the project's
// approved hours. The other three read "Checked at review" and never tick here. Nothing on this card says anything is paid.
export function ToolbeltGate({ projectId, hours }: Readonly<{ projectId: string; hours: { approved: number; pending: number } }>) {
  const gate = gateConditions({ id: projectId }, hours);
  const met = gate.conditions[0].state === "met";
  const bar = meterPercents(hours.approved, hours.pending);
  return (
    <section className="pf-belt-gate" aria-labelledby={`belt-gate-${projectId}`}>
      <h3 id={`belt-gate-${projectId}`}>Before a use counts</h3>
      <ul className="pf-checks">
        <li data-done={met ? "true" : "false"}>
          <span className="pf-check-box" aria-hidden="true">
            {met ? (
              <svg viewBox="0 0 12 12" width="12" height="12" shapeRendering="crispEdges" focusable="false">
                <path d="M1 6h2v2h2v2H3V8H1zM5 8h2V6h2V4h2v2H9v2H7v2H5z" />
              </svg>
            ) : null}
          </span>
          <span className="pf-belt-gate-text">
            The project has {TOOLBELT_MIN_HOURS} approved hours
            <span className="pf-sr">{met ? ", done" : ", not done"}</span>
          </span>
          <span className="pf-belt-gate-value">{hours.approved} of {TOOLBELT_MIN_HOURS} H</span>
        </li>
        <li className="pf-belt-meter-row" aria-hidden="true">
          <span className="pf-belt-meter">
            <span className="pf-belt-meter-fill" style={{ width: `${bar.done}%` }} />
            <span className="pf-belt-meter-pending" style={{ left: `${bar.done}%`, width: `${bar.pending}%` }} />
          </span>
        </li>
        {CHECKED_AT_REVIEW.map((label) => (
          <li data-done="false" key={label}>
            <span className="pf-check-box" aria-hidden="true" />
            <span className="pf-belt-gate-text">
              {label}
              <span className="pf-sr">, not done</span>
            </span>
            <span className="pf-belt-gate-value">Checked at review</span>
          </li>
        ))}
      </ul>
      <p className="pf-hint">A reviewer confirms each use after you submit. Nothing here pays Ore.</p>
    </section>
  );
}
