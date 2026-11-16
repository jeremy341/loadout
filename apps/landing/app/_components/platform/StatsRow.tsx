import type { Hours } from "@/lib/platform/progress";
import { DepthValue } from "./DepthValue";
import "./project-page.css";

// The project's numbers in one ruled block: journal entries, approved hours, depth, and either Used by (an open-source project) or
// Pending hours (so the grid stays two by two). Every number comes from the project; none is invented.
export function StatsRow({
  hours,
  entries,
  usedBy,
}: Readonly<{ hours: Hours; entries: number; usedBy: number | null }>) {
  return (
    <div className="pf-proj-stats-wrap">
      <dl className="pf-proj-stats">
        <div>
          <dt>Journal entries</dt>
          <dd>{entries}</dd>
        </div>
        <div>
          <dt>Approved hours</dt>
          <dd>{hours.approved} H</dd>
        </div>
        <div>
          <dt>Depth</dt>
          <dd>
            <DepthValue hours={hours} />
          </dd>
        </div>
        <div>
          {usedBy === null ? (
            <>
              <dt>Pending hours</dt>
              <dd>{hours.pending} H</dd>
            </>
          ) : (
            <>
              <dt>Used by</dt>
              <dd>{usedBy}</dd>
            </>
          )}
        </div>
      </dl>
      <p className="pf-hint">Depth is your approved hours in metres: 1 M for every approved hour.</p>
    </div>
  );
}
