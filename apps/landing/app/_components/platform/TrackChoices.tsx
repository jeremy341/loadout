import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";

// The track picker of the Edit project dialog: four track cards, all native radios. The checked one is set by defaultValue.
// The "Decide later" row is only for a project made before the wizard that still has no track (allowLater); a new project
// always has one.
export function TrackChoices({ defaultValue = "", locked = false, allowLater = false }: Readonly<{ defaultValue?: string; locked?: boolean; allowLater?: boolean }>) {
  return (
    <>
      {locked ? <input type="hidden" name="track" value={defaultValue} /> : null}
      <div className="pf-choice-grid">
        {TRACK_BUILDS.map((build) => (
          <label className="pf-choice" data-track={build.name.toLowerCase()} key={build.name}>
            <input type="radio" name={locked ? undefined : "track"} value={build.name} defaultChecked={defaultValue === build.name} disabled={locked} />
            <span className="pf-choice-name">{build.name}</span>
            <span className="pf-hint">{build.text}</span>
          </label>
        ))}
      </div>
      {allowLater ? (
      <label className="pf-choice pf-choice-later">
        <input type="radio" name={locked ? undefined : "track"} value="" defaultChecked={defaultValue === ""} disabled={locked} />
        <span className="pf-choice-name">Decide later</span>
        <span className="pf-hint">No track for now.</span>
      </label>
      ) : null}
    </>
  );
}
