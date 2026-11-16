import type { CSSProperties } from "react";
import { LevelCells, type LevelCell } from "./LevelCells";
import {
  discountForHours,
  formatDiscount,
  hoursForLevel,
  hoursToNextLevel,
  LEVEL_CAP,
  LEVEL_HOURS,
  LEVEL_REWARDS,
  levelForHours,
  type Hours,
} from "@/lib/platform/progress";

// A track's level laid out sideways: the level and the hours to the next one on the left, the discount earned on the
// right (depth stays on the Overview), the twenty levels as one row of cells (reached filled, the next one part-filled
// with hours waiting for review hatched; each cell shows its hours on hover, focus or tap), and the four reward levels
// hanging underneath with the hours they need. No per-level table and no per-level percentages: the docs only set the
// milestones. The hours are sample values until approved hours exist.
export function LevelStrip({ track, hours }: Readonly<{ track: string; hours: Hours }>) {
  const level = levelForHours(hours.approved);
  const next = level < LEVEL_CAP ? level + 1 : null;
  const missing = hoursToNextLevel(hours.approved);
  const from = hoursForLevel(level);
  const to = next ? LEVEL_HOURS[next - 1] : from;
  const span = to - from;
  const fill = next && span > 0 ? Math.min(100, Math.max(0, ((hours.approved - from) / span) * 100)) : 0;
  const pendingFill = next && span > 0 ? Math.min(100 - fill, (Math.min(hours.pending, to - hours.approved) / span) * 100) : 0;
  const discount = formatDiscount(discountForHours(hours.approved));
  const flags = Object.entries(LEVEL_REWARDS).map(([key, reward]) => ({ level: Number(key), reward }));
  const cells: LevelCell[] = LEVEL_HOURS.map((needed, index) => {
    const n = index + 1;
    const state = n <= level ? "done" : n === next ? "next" : "locked";
    return { level: n, hours: needed, state, milestone: Boolean(LEVEL_REWARDS[n]), fill: state === "next" ? fill : 0, pendingFill: state === "next" ? pendingFill : 0 };
  });

  return (
    <section className="pf-box pf-strip" aria-labelledby="strip-heading">
      <h2 id="strip-heading" className="pf-sr">
        Level and discount
      </h2>
      <div className="pf-strip-top">
        <div className="pf-strip-level">
          <span className="pf-strip-n">LV.{level}</span>
          <span className="pf-strip-next">{missing === null ? "Max level" : `${missing} H to LV.${level + 1}`}</span>
          {hours.pending > 0 ? <span className="pf-strip-hint">{hours.pending} H waiting for review</span> : null}
        </div>
        <div className="pf-strip-off">
          <span
            className="pf-strip-off-value"
            role="img"
            aria-label={`${discount} off ${track} prizes, at level ${level}, from ${hours.approved} approved hours`}
          >
            {discount}
          </span>
          <span className="pf-strip-off-note">off {track} prizes</span>
        </div>
      </div>

      <LevelCells cells={cells} start={Math.max(0, (next ?? level) - 1)} />

      <ul className="pf-strip-flags">
        {flags.map((flag) => {
          const reached = level >= flag.level;
          return (
            <li key={flag.level} data-reached={reached} style={{ "--lv": flag.level } as CSSProperties}>
              <span className="pf-strip-flag-mark" aria-hidden="true" />
              <span className="pf-strip-flag-lv">
                LV.{flag.level} / {LEVEL_HOURS[flag.level - 1]} H
              </span>
              <span className="pf-strip-flag-reward">{flag.reward}</span>
              <span className="pf-sr">{reached ? ", reached" : ""}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
