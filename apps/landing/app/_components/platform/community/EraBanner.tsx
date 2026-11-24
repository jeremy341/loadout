import Link from "next/link";
import { COMMUNITY_HOME, SAMPLE_ERA, eraProgress, formatEraNumber, type EraState } from "@/lib/platform/community";

// One line under the tab row on every Community page except the Overview, so the Era stays in view while someone reads News
// or Goals. No heading and no progressbar role: the words carry the figure and the thin bar is decoration. It links back to
// the Overview, which owns the full Era block.
export function EraBanner({ state = SAMPLE_ERA }: Readonly<{ state?: EraState }>) {
  const era = eraProgress(state);
  return (
    <Link className="cm-banner" href={COMMUNITY_HOME}>
      <span className="cm-banner-name">{era.current} Era</span>
      <span className="cm-banner-fig">
        {formatEraNumber(state.points)} of {formatEraNumber(state.threshold)} Era Points, {era.percent}%
      </span>
      <span className="cm-banner-state">{era.statusLabel}</span>
      <span className="cm-banner-bar" aria-hidden="true">
        <span style={{ width: `${era.percent}%` }} />
      </span>
      <span className="cm-banner-go">
        See the Era<span className="pf-sr"> on the Community Overview</span>
      </span>
    </Link>
  );
}
