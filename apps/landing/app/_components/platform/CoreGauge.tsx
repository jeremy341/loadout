import { LEVEL_CAP, levelCells, sampleTrackProgress } from "@/lib/platform/progress";

// Progress across the four tracks, drawn as a core sample: one band per track, fifteen cells per band, filled up to
// the level. The levels come from sampleTrackProgress until approved hours exist.
export function CoreGauge() {
  const rows = sampleTrackProgress();
  const total = rows.reduce((sum, row) => sum + row.level, 0);
  const max = LEVEL_CAP * rows.length;

  return (
    <section className="pf-gauge" aria-labelledby="gauge-heading">
      <div className="pf-gauge-head">
        <div>
          <h2 id="gauge-heading">Core depth across the four tracks</h2>
          <p className="pf-gauge-note">
            {total} of {max} levels. Approved hours raise each band.
          </p>
        </div>
      </div>
      <ul className="pf-bands">
        {rows.map((row) => (
          <li className="pf-band" data-track={row.track.toLowerCase()} key={row.track}>
            <div className="pf-band-top">
              <span className="pf-band-name">{row.track}</span>
              <span className="pf-band-level">{row.level === 0 ? "Not started" : `LV.${row.level}`}</span>
            </div>
            <div className="pf-cells" role="img" aria-label={`${row.track}: level ${row.level} of ${LEVEL_CAP}`}>
              {levelCells(row.level).map((filled, cell) => (
                <span key={cell} className={filled ? "pf-cell on" : "pf-cell"} aria-hidden="true" />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
