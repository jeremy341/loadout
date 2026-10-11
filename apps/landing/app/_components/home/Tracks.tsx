import { ART } from "./art";
import { AsciiField } from "./AsciiField";

// Tracks section ported from the LOADOUT redesign reference.
export function Tracks() {
  return (
    <>
      <div className="pit">
        <b>
          −000 M
        </b>
        <span>
          Übertage
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
          Choose the fields your project uses. One project can use more than one.
        </p>
        <div className="row">
          <div className="card t">
            <div className="ct">
              <span>
                TRACK 01
              </span>
              <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-wrench"></use>
              </svg>
            </div>
            <div className="cn">
              Tools
            </div>
            <div className="m dsc">
              Command-line tools, debuggers, and automation that help people build software.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                TRACK 02
              </span>
              <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-gear"></use>
              </svg>
            </div>
            <div className="cn">
              Systems
            </div>
            <div className="m dsc">
              Runtimes, networks, and databases other projects rely on.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                TRACK 03
              </span>
              <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-cpu"></use>
              </svg>
            </div>
            <div className="cn">
              Compute
            </div>
            <div className="m dsc">
              Faster, more capable programs: graphics, GPUs, and model-running software.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                TRACK 04
              </span>
              <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-board"></use>
              </svg>
            </div>
            <div className="cn">
              Hardware
            </div>
            <div className="m dsc">
              Circuit boards, embedded devices, and robots.
            </div>
          </div>
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
              Add it to any track. Publish a reproducible report with your project for bonus Track XP and faster discounts in that track. It is not a fifth track.
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
