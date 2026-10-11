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
          Choose the fields your project uses; one project can use more than one. Reviewers assign Track XP to each field based on the work they see.
        </p>
        <div className="row">
          <div className="card t">
            <div className="ct">
              <span>
                TRACK 01
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-wrench"></use>
              </svg>
            </div>
            <div className="cn">
              Tools
            </div>
            <div className="m dsc">
              Make tools that help people build and test software, such as command-line tools, debuggers, and automation.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                TRACK 02
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-gear"></use>
              </svg>
            </div>
            <div className="cn">
              Systems
            </div>
            <div className="m dsc">
              Build the software and infrastructure other projects rely on, such as runtimes, networks, and databases.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                TRACK 03
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-cpu"></use>
              </svg>
            </div>
            <div className="cn">
              Compute
            </div>
            <div className="m dsc">
              Make programs do more or run faster with graphics, GPUs, and model-running software.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                TRACK 04
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-board"></use>
              </svg>
            </div>
            <div className="cn">
              Hardware
            </div>
            <div className="m dsc">
              Build physical technology such as circuit boards, embedded devices, and robots.
            </div>
          </div>
        </div>
        <div className="strip" id="research">
          <svg className="ic l" viewBox="0 0 16 16" aria-hidden="true">
            <use href="#i-flask"></use>
          </svg>
          <div>
            <b>
              Research Mode
            </b>
            <div className="m dsc">
              Add it to any track. Publish a reproducible technical report with your project to earn bonus Track XP and reach that track&apos;s discounts sooner. It is not a fifth track.
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
