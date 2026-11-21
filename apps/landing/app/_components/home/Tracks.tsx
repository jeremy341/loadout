import { ART } from "./art";
import { AsciiField } from "./AsciiField";
import { TRACK_BUILDS } from "./tracks-data";

// Tracks section ported from the LOADOUT redesign reference.
export function Tracks() {
  return (
    <>
      <div className="pit">
        <b>
          −000 M
        </b>
        <span>
          <span lang="de">Übertage</span>
          <br />
          Tracks
        </span>
      </div>
      <div className="sect" id="tracks">
        <AsciiField html={ART["tracks"]} side="right" top="40px" />
        <h2 className="h2">
          Build across
          four tracks
        </h2>
        <p className="lead">
          Pick the one track your project fits. A project has one track, and all its Track XP goes there.
        </p>
        <div className="row">
          {TRACK_BUILDS.map((track, index) => (
            <div className="card t" key={track.name}>
              <div className="ct">
                <span>
                  {`TRACK 0${index + 1}`}
                </span>
                <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                  <use href={"#i-" + track.icon}></use>
                </svg>
              </div>
              <h3 className="cn">
                {track.name}
              </h3>
              <div className="m dsc">
                {track.short}
              </div>
              <span className="chip tag-chip">
                {track.tag}
              </span>
            </div>
          ))}
        </div>
        <div className="strip" id="research">
          <svg className="ic l" viewBox="0 0 32 32" aria-hidden="true">
            <use href="#i-flask"></use>
          </svg>
          <div>
            <b>
              Research Mode
            </b>
            <div className="m dsc">
              Publish a reproducible report with a project for bonus Track XP. It is not a fifth track.
            </div>
          </div>
          <span className="chip">
            {"Bonus Track XP // report required"}
          </span>
        </div>
      </div>
    </>
  );
}
