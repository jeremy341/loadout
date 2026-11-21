import { monthLabels, heatmapSummary, heatmapWeeks, PROFILE_HEATMAP_WEEKS } from "@/lib/platform/activity";
import { HeatmapGrid } from "./HeatmapGrid";
import "./heatmap.css";

// After Stasis's Activity card: the heading with the streak, best streak and hours at the right, the 16 week grid, the Less to More
// legend and an encouragement line when nothing is logged.
export function ActivityHeatmap({ totals, now, own }: Readonly<{ totals: Record<string, number>; now: Date; own: boolean }>) {
  const weeks = heatmapWeeks(totals, now, "UTC", PROFILE_HEATMAP_WEEKS);
  const labels = monthLabels(weeks);
  const stats = heatmapSummary(weeks, totals, now);

  return (
    <section className="pf-sp-card pf-hm" aria-labelledby="heatmap-heading">
      <div className="pf-hm-head">
        <h2 id="heatmap-heading">Activity</h2>
        <p className="pf-hm-stats">
          {stats.current > 0 ? (
            <span>
              <strong className="pf-hm-hot">{stats.current}</strong> day streak
            </span>
          ) : null}
          {stats.best > 1 && stats.best !== stats.current ? (
            <span>
              <strong>{stats.best}</strong> best streak
            </span>
          ) : null}
          <span>
            <strong>{Math.round(stats.hours * 10) / 10}</strong> hrs
          </span>
        </p>
      </div>

      <HeatmapGrid weeks={weeks} labels={labels} />

      <div className="pf-hm-legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span className="pf-hm-cell pf-hm-key-cell" data-level={level} key={level} />
        ))}
        <span>More</span>
      </div>

      {stats.loggedDays === 0 ? (
        <p className="pf-hm-empty">{own ? "Add a journal entry to fill up your heatmap." : "No hours logged yet."}</p>
      ) : null}
    </section>
  );
}
