import { ART } from "./art";
import { AsciiField } from "./AsciiField";

// Levels and rewards section ported from the LOADOUT redesign reference.
export function Progression() {
  return (
    <>
      <div className="pit">
        <b>
          −300 M
        </b>
        <span>
          1. Sohle
          <br />
          Levels &amp; rewards
        </span>
      </div>
      <div className="sect" id="progression">
        <AsciiField html={ART["progression"]} side="right" top="50px" />
        <h2 className="h2">
          Track XP
          and levels
        </h2>
        <p className="lead">
          Track XP cannot be spent; it raises a separate level in each lifetime track, up to LV.15. As your level rises, so does your discount on prizes from that track. Track XP and levels persist through competitive Seasons.
        </p>
        <p className="note" style={{ margin: "0 0 34px" }}>
          Reach a marked level to earn a one-use Field Requisition: an extra discount on an eligible prize from that track.
        </p>
        <div className="lad l5">
          <div className="lf"></div>
          <div className="st">
            <div className="bd">
              <b>
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-requisition-i"></use>
                </svg>
              </b>
            </div>
            <div className="cn" style={{ fontSize: "24px" }}>
              LV.3
            </div>
            <div className="m dsc">
              Requisition I
            </div>
          </div>
          <div className="st">
            <div className="bd">
              <b>
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-requisition-i"></use>
                </svg>
              </b>
            </div>
            <div className="cn" style={{ fontSize: "24px" }}>
              LV.6
            </div>
            <div className="m dsc">
              Requisition I
            </div>
          </div>
          <div className="st">
            <div className="bd">
              <b>
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-requisition-ii"></use>
                </svg>
              </b>
            </div>
            <div className="cn" style={{ fontSize: "24px" }}>
              LV.9
            </div>
            <div className="m dsc">
              Requisition II
            </div>
          </div>
          <div className="st">
            <div className="bd">
              <b>
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-requisition-ii"></use>
                </svg>
              </b>
            </div>
            <div className="cn" style={{ fontSize: "24px" }}>
              LV.12
            </div>
            <div className="m dsc">
              Requisition II
            </div>
          </div>
          <div className="st">
            <div className="bd">
              <b>
                <svg className="ic" viewBox="0 0 16 16" aria-hidden="true">
                  <use href="#i-requisition-master"></use>
                </svg>
              </b>
            </div>
            <div className="cn" style={{ fontSize: "24px" }}>
              LV.15
            </div>
            <div className="m dsc">
              Master Requisition
            </div>
          </div>
        </div>
        <div className="asd" style={{ marginTop: "40px" }}>
          <b className="cn" style={{ fontSize: "22px" }}>
            Choose where to grow.
          </b>
          <div className="m dsc" style={{ marginTop: "8px" }}>
            Level up several tracks for discounts across more fields, or focus on one track to build deeper skills and bigger discounts there.
          </div>
        </div>
      </div>
    </>
  );
}
