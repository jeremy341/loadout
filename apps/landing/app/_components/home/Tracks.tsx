import { ART } from "./art";
import { AsciiField } from "./AsciiField";

// Each track names one concrete thing you could build, with a tag for what kind of project it is.
const TRACKS = [
  { name: "Tools", icon: "wrench", tag: "CLI", text: "Build a command-line tool that removes a step you keep repeating." },
  { name: "Systems", icon: "gear", tag: "Database", text: "Build a small database or a chat server that other programs can use." },
  { name: "Compute", icon: "cpu", tag: "GPU", text: "Build a program that runs a machine-learning model on a GPU." },
  { name: "Hardware", icon: "board", tag: "Board", text: "Build a custom circuit board or a robot." },
] as const;

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
          Pick the fields your project touches. One project can sit in more than one.
        </p>
        <div className="row">
          {TRACKS.map((track, index) => (
            <div className="card t" key={track.name}>
              <div className="ct">
                <span>
                  {`TRACK 0${index + 1}`}
                </span>
                <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                  <use href={"#i-" + track.icon}></use>
                </svg>
              </div>
              <div className="cn">
                {track.name}
              </div>
              <div className="m dsc">
                {track.text}
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
              Add it to any track: publish a reproducible report with your project for bonus Track XP and faster discounts in that track. It is not a fifth track.
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
