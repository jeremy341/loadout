import { TRACK_BUILDS } from "@/app/_components/home/tracks-data";

// The track picker used by the New project and Edit project dialogs: four track cards and a "Decide later" row, all
// native radios. The checked one is set by defaultValue ("" means Decide later).
export function TrackChoices({ defaultValue = "" }: Readonly<{ defaultValue?: string }>) {
  return (
    <>
      <div className="pf-choice-grid">
        {TRACK_BUILDS.map((build) => (
          <label className="pf-choice" data-track={build.name.toLowerCase()} key={build.name}>
            <input type="radio" name="track" value={build.name} defaultChecked={defaultValue === build.name} />
            <span className="pf-choice-name">{build.name}</span>
            <span className="pf-hint">{build.text}</span>
          </label>
        ))}
      </div>
      <label className="pf-choice pf-choice-later">
        <input type="radio" name="track" value="" defaultChecked={defaultValue === ""} />
        <span className="pf-choice-name">Decide later</span>
        <span className="pf-hint">No track for now.</span>
      </label>
    </>
  );
}
