import { ART } from "./art";
import { AsciiField } from "./AsciiField";


// Who is behind LOADOUT section ported from the LOADOUT redesign reference.
export function BehindLoadout() {
  return (
    <>
      <div className="pit">
        <b>
          −900 M
        </b>
        <span>
          Tiefste Sohle
          <br />
          The people
        </span>
      </div>
      <div className="sect" id="behind-loadout">
        <AsciiField html={ART["people"]} side="left" top="40px" />
        <h2 className="h2">
          Who’s behind
          LOADOUT?
        </h2>
        <div className="ppl">
          <div>
            <div className="org">
              <svg className="ic l" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-builder"></use>
              </svg>
              <div>
                <h4>
                  Jerry
                </h4>
                <div className="m">
                  Lead organizer
                </div>
                <div className="m dsc">
                  Leads LOADOUT and develops its website.
                </div>
              </div>
            </div>
            <div className="org">
              <svg className="ic l" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-code"></use>
              </svg>
              <div>
                <h4>
                  Fazin / Wind
                </h4>
                <div className="m">
                  Developer &amp; co-organizer
                </div>
                <div className="m dsc">
                  Plans the program and helps develop LOADOUT.
                </div>
              </div>
            </div>
            <div className="org">
              <svg className="ic l" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-terminal"></use>
              </svg>
              <div>
                <h4>
                  Netic
                </h4>
                <div className="m">
                  Developer &amp; co-organizer
                </div>
                <div className="m dsc">
                  Builds Rivet, LOADOUT’s Slack bot, and helps organize.
                </div>
              </div>
            </div>
            <a className="gh" href="https://github.com/jeremy341/loadout">
              Follow the build on GitHub →
            </a>
          </div>
          <aside className="asd">
            <div className="m">
              Community context
            </div>
            <h4 style={{ marginTop: "8px" }}>
              What is Hack Club?
            </h4>
            <p className="dsc">
              Hack Club is a nonprofit community of teenagers who learn by making. Its You Ship, We Ship programs offer prizes for projects.
            </p>
            <p className="dsc">
              <b>
                LOADOUT is a YSWS proposal in development. Hack Club acceptance hasn’t been confirmed yet.
              </b>
            </p>
            <a href="https://hackclub.com/">
              Explore Hack Club
            </a>
            <a href="https://readme.hackclub.com/ysws">
              Read about YSWS
            </a>
          </aside>
        </div>
      </div>
    </>
  );
}
