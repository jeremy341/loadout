import { ART } from "./art";
import { AsciiField } from "./AsciiField";

// Community Eras section ported from the LOADOUT redesign reference.
export function Eras() {
  return (
    <>
      <div className="pit">
        <b>
          −600 M
        </b>
        <span>
          2. Sohle
          <br />
          Community Eras
        </span>
      </div>
      <div className="sect" id="eras">
        <AsciiField html={ART["eras"]} side="right" top="60px" />
        <h2 className="h2">
          Build the next
          Era together.
        </h2>
        <p className="lead">
          A shared technical theme advanced by approved projects across the four tracks.
        </p>
        <div className="era">
          <div>
            <small>
              01
            </small>
            Approved projects
          </div>
          <div>
            <small>
              02
            </small>
            Shared Era Points
          </div>
          <div>
            <small>
              03
            </small>
            Next technical theme
          </div>
        </div>
        <div className="row r2">
          <div className="card sm">
            <div className="ct">
              <span>
                SHARED PROGRESS
              </span>
            </div>
            <div className="cn">
              Era Points
            </div>
            <div className="m dsc">
              Era Points are separate from Ore and Track XP.
            </div>
          </div>
          <div className="card sm">
            <div className="ct">
              <span>
                AT LAUNCH
              </span>
            </div>
            <div className="cn">
              Ore bonus
            </div>
            <div className="m dsc">
              Qualifying projects may earn it on the approved base award.
            </div>
          </div>
        </div>
        <p className="note">
          Planned rule; final launch configuration is still being finalized. Era changes do not reset lifetime Ore, Track XP, or shipped work.
        </p>
      </div>
    </>
  );
}
