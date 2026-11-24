import { COMMUNITY_ERAS, SAMPLE_ERA, eraProgress, formatEraNumber, type EraState } from "@/lib/platform/community";

// The Era, as the centrepiece of Community: the current Era and its stage, the community's Era Points against the one fixed
// threshold, the days open against the 14-day minimum, and whether it is ready to advance. The owner confirms the advance; the
// page never implies a timer. The bars are decoration: the figures printed beside them carry the meaning, and each bar is a
// progressbar with its words as the text alternative.
export function EraHero({ state = SAMPLE_ERA }: Readonly<{ state?: EraState }>) {
  const era = eraProgress(state);
  const ready = era.status === "ready";
  const pips = Array.from({ length: state.minDays }, (_, index) => index < era.daysCapped);
  const pointsNow = Math.min(state.points, state.threshold);
  const daysWord = era.daysOpen === 1 ? "day" : "days";

  return (
    <section className="cm-hero" aria-labelledby="cm-era-title" data-status={era.status}>
      <h2 id="cm-era-title" className="cm-hero-label">
        Community Era
      </h2>

      <div className="cm-hero-grid">
        <div className="cm-hero-main">
          <p className="cm-hero-stage">
            Stage {era.stageNumber} of {era.stageCount}
          </p>
          <p className="cm-hero-name">{era.current}</p>

          <p className="cm-hero-points">
            <span className="cm-hero-big">{formatEraNumber(state.points)}</span>
            <span className="cm-hero-of">
              of {formatEraNumber(state.threshold)} Era Points <span className="cm-hero-pct">{era.percent}%</span>
            </span>
          </p>
          <div
            className="cm-bar cm-bar-lg"
            role="progressbar"
            aria-label={`${era.current} Era Points toward the threshold`}
            aria-valuemin={0}
            aria-valuemax={state.threshold}
            aria-valuenow={pointsNow}
            aria-valuetext={`${era.pointsText}, ${era.percent}%`}
          >
            <span className="cm-bar-fill" style={{ width: `${era.percent}%` }} />
          </div>
          <p className="cm-hero-note">
            {era.remaining > 0 ? `${formatEraNumber(era.remaining)} Era Points to go. ` : "The threshold is met. "}
            One community total; nobody is ranked by it.
          </p>
        </div>

        <div className="cm-hero-rack">
          <p className="cm-rack-label">Days open</p>
          <p className="cm-rack-value">
            {era.daysOpen} <span>of {state.minDays} minimum</span>
          </p>
          <div
            className="cm-pips"
            role="progressbar"
            aria-label="Days this Era has been open"
            aria-valuemin={0}
            aria-valuemax={state.minDays}
            aria-valuenow={era.daysCapped}
            aria-valuetext={`${era.daysOpen} ${daysWord} open, minimum ${state.minDays}`}
          >
            {pips.map((on, index) => (
              <i key={index} className={on ? "cm-pip cm-pip-on" : "cm-pip"} aria-hidden="true" />
            ))}
          </div>

          <p className="cm-rack-label cm-rack-gap">Status</p>
          <p className="cm-state" data-ready={ready ? "true" : undefined}>
            {era.statusLabel}
          </p>
          <p className="cm-rack-text">{era.statusText}</p>
        </div>
      </div>

      <ol className="cm-stages" aria-label="Era sequence: previous, current and next">
        <li data-state="earlier">
          <span className="cm-stages-tag">Previous</span>
          <span className="cm-stages-name">{era.previous ?? "No earlier Era"}</span>
          <span className="cm-stages-sub">
            {era.previous && state.previousClosedPoints !== null ? `Closed with ${formatEraNumber(state.previousClosedPoints)} Era Points, kept` : "This is the first Era"}
          </span>
        </li>
        <li data-state="current" aria-current="step">
          <span className="cm-stages-tag">Current</span>
          <span className="cm-stages-name">{era.current}</span>
          <span className="cm-stages-sub">
            {ready ? "Ready to advance" : `${era.percent}% of the threshold`}
          </span>
        </li>
        <li data-state="later">
          <span className="cm-stages-tag">Next</span>
          <span className="cm-stages-name">{era.next ?? "No later Era"}</span>
          <span className="cm-stages-sub">{era.next ? "Opens when the owner confirms the advance" : "End of the example sequence"}</span>
        </li>
      </ol>
      <p className="cm-hero-seq">Example sequence: {COMMUNITY_ERAS.join(", ")}.</p>
    </section>
  );
}
