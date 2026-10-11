import { ART } from "./art";
import { AsciiField } from "./AsciiField";

// How it works section ported from the LOADOUT redesign reference.
export function HowItWorks() {
  return (
    <>
      <div className="pit">
        <b>
          −100 M
        </b>
        <span>
          Hängebank
          <br />
          How it works
        </span>
      </div>
      <div className="sect" id="process">
        <AsciiField html={ART["process"]} side="left" top="50px" />
        <h2 className="h2">
          How it
          works
        </h2>
        <p className="lead">
          Build, ship, and use what you learn to take on the next project.
        </p>
        <div className="fl">
          <div className="card fn">
            <div className="ct">
              <span>
                STEP 01
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-list"></use>
              </svg>
            </div>
            <div className="cn">
              Choose a project and its tracks
            </div>
            <div className="m dsc">
              Pick something to make or improve, then choose the fields your project will use.
            </div>
          </div>
          <i className="fc"></i>
          <div className="card fn">
            <div className="ct">
              <span>
                STEP 02
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-code"></use>
              </svg>
            </div>
            <div className="cn">
              Build it and keep a journal
            </div>
            <div className="m dsc">
              A journal is a build log: note what changed, why you chose that approach, and how you checked the result. Hackatime and Lapse are the planned tools for tracking coding and eligible non-code work.
            </div>
          </div>
          <i className="fc"></i>
          <div className="card fn">
            <div className="ct">
              <span>
                STEP 03
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-document"></use>
              </svg>
            </div>
            <div className="cn">
              Share a working version
            </div>
            <div className="m dsc">
              Share your project, demo or other evidence, and instructions. Explain what you built, any AI help, and what still needs work. Research projects must include results others can reproduce.
            </div>
          </div>
          <i className="fc"></i>
          <div className="card fn">
            <div className="ct">
              <span>
                STEP 04
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-check"></use>
              </svg>
            </div>
            <div className="cn">
              Get your work reviewed
            </div>
            <div className="m dsc">
              Reviewers check that your project adds useful original technical work and that you show enough evidence. Then they score it and assign XP to the tracks your work used.
            </div>
          </div>
          <i className="fc"></i>
          <div className="br2">
            <div className="card fn">
              <div className="ct">
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-bolt"></use>
                </svg>
              </div>
              <div className="cn">
                Bolts to spend
              </div>
              <div className="m dsc">
                Bolts are your reward-shop balance, usable across all tracks.
              </div>
            </div>
            <div className="card fn">
              <div className="ct">
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-xp-star"></use>
                </svg>
              </div>
              <div className="cn">
                Track XP to keep
              </div>
              <div className="m dsc">
                XP cannot be spent. It raises a separate level in each track; those levels can affect gear prices and access.
              </div>
            </div>
          </div>
          <i className="fc"></i>
          <div className="br2">
            <div className="card fn">
              <div className="ct">
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-document"></use>
                </svg>
              </div>
              <div className="cn">
                Digital Loadout
              </div>
              <div className="m dsc">
                Your accepted projects and the portfolio you build from them.
              </div>
            </div>
            <div className="card fn">
              <div className="ct">
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-equipment-box"></use>
                </svg>
              </div>
              <div className="cn">
                Physical Loadout
              </div>
              <div className="m dsc">
                The equipment and tools you use to build your next project.
              </div>
            </div>
          </div>
          <i className="fc"></i>
          <div className="card fn">
            <div className="ct">
              <span>
                STEP 05
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-equipment-box"></use>
              </svg>
            </div>
            <div className="cn">
              Choose your next upgrade
            </div>
            <div className="m dsc">
              Use Bolts for gear. Your level in a related track can lower its price or unlock some items. A Field Requisition can apply an extra track discount. Custom Orders let you request equipment outside the shop.
            </div>
            <div className="lnks">
              <a href="#progression">
                How levels help
              </a>
              <a href="#requisitions">
                How Requisitions save
              </a>
              <a href="#eras">
                Community Eras
              </a>
            </div>
          </div>
          <i className="fc"></i>
          <div className="card fn">
            <div className="ct">
              <span>
                STEP 06
              </span>
              <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                <use href="#i-wrench"></use>
              </svg>
            </div>
            <div className="cn">
              Build again
            </div>
            <div className="m dsc">
              Put new skills and equipment to work on your next project.
            </div>
            <div className="loop">
              ↻ Back to step 01
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
