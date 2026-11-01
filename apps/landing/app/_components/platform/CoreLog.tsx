import { hoursForLevel, LEVEL_CAP, LEVEL_HOURS, LEVEL_REWARDS, levelForHours, type Hours } from "@/lib/platform/progress";

// The core log: the fifteen levels of a track as strata, with the hours each one needs on the right. Levels reached are
// filled in the track's colour, the next level shows how far you are into it, and the rest are locked. The levels' hours
// are sample values; only LV.5, 8, 11 and 15 are set (see LEVEL_HOURS).
export function CoreLog({ hours }: Readonly<{ hours: Hours }>) {
  const current = levelForHours(hours.approved);
  const next = current < LEVEL_CAP ? current + 1 : null;
  const from = hoursForLevel(current);
  const to = next ? LEVEL_HOURS[next - 1] : from;
  const fill = next && to > from ? Math.min(100, Math.max(0, ((hours.approved - from) / (to - from)) * 100)) : 0;

  return (
    <section className="pf-core-log" aria-labelledby="core-log-heading">
      <div className="pf-core-head">
        <h2 id="core-log-heading">Core log</h2>
        <span>Hours to reach</span>
      </div>
      <ol className="pf-core-rows">
        {LEVEL_HOURS.map((needed, index) => {
          const level = index + 1;
          const state = level <= current ? "done" : level === next ? "next" : "locked";
          const reward = LEVEL_REWARDS[level];
          const tag =
            level === current ? "You are here" : state === "next" ? `${Math.max(0, needed - hours.approved)} H to go` : reward ?? "";
          return (
            <li className="pf-core-row" data-state={state} data-milestone={reward ? "true" : undefined} key={level}>
              <span className="pf-core-lv">LV.{level}</span>
              <span className="pf-core-bar">
                {state === "next" ? <span className="pf-core-fill" style={{ width: `${fill}%` }} aria-hidden="true" /> : null}
                {tag ? <span className="pf-core-tag">{tag}</span> : null}
              </span>
              <span className="pf-core-h">{needed} H</span>
              <span className="pf-sr">{state === "done" ? "Reached" : state === "next" ? "Next level" : "Locked"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
