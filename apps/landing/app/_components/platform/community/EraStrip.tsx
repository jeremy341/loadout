import Link from "next/link";
import { COMMUNITY_HOME, ERA_BONUS_PERCENT, ERA_MIN_DAYS, ERA_OBJECTIVES, eraStages } from "@/lib/platform/community";

const STATE_TEXT = { earlier: "Earlier", current: "Shown as current", later: "Later" } as const;

// The current Community Era. Plan 11 gives the sequence as an example and the rules for advancing, and says no threshold,
// percentage or countdown may appear until it is configured, so the strip shows the stages and the rules and no progress.
export function EraStrip() {
  const stages = eraStages();
  return (
    <section className="pf-box cm-era" aria-labelledby="cm-era-title">
      <div className="pf-box-head">
        <h2 id="cm-era-title">Community Era</h2>
        <span className="cm-tag">Proposed</span>
      </div>
      <p className="cm-era-lead">LOADOUT advances when builders do. The stages are an example sequence, not a schedule.</p>
      <ol className="cm-era-stages" aria-label="Example Era sequence">
        {stages.map((stage) => (
          <li key={stage.name} data-state={stage.state} aria-current={stage.state === "current" ? "step" : undefined}>
            <span className="cm-era-bar" aria-hidden="true" />
            <span className="cm-era-name">{stage.name}</span>
            <span className="cm-era-state">{STATE_TEXT[stage.state]}</span>
          </li>
        ))}
      </ol>
      <dl className="cm-facts">
        <div>
          <dt>Minimum length</dt>
          <dd>{ERA_MIN_DAYS} days</dd>
        </div>
        <div>
          <dt>Advances when</dt>
          <dd>the community threshold is met at an eligible weekly reset</dd>
        </div>
        <div>
          <dt>Qualifying project</dt>
          <dd>+{ERA_BONUS_PERCENT}% of base Ore (planned)</dd>
        </div>
      </dl>
      <p className="cm-era-foot">
        Example objectives: {ERA_OBJECTIVES.join(", ")}. No progress figure is shown until the threshold is set.{" "}
        <Link href={`${COMMUNITY_HOME}/goals`}>Community goals</Link>
      </p>
    </section>
  );
}
