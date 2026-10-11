import { ART } from "./art";
import { AsciiField } from "./AsciiField";


// How rewards work section ported from the LOADOUT redesign reference.
export function Rewards() {
  return (
    <>
      <div className="sect" id="field-pricing">
        <AsciiField html={ART["rewards"]} side="left" top="20px" />
        <h2 className="h2">
          How rewards
          work
        </h2>
        <div className="row r3">
          <div className="card t">
            <div className="ct">
              <span>
                CURRENCY
              </span>
              <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-bolt"></use>
              </svg>
            </div>
            <div className="cn">
              Bolts
            </div>
            <div className="m dsc">
              Global currency for most prizes.
            </div>
          </div>
          <div className="card t">
            <div className="ct">
              <span>
                PROGRESSION
              </span>
              <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-xp-star"></use>
              </svg>
            </div>
            <div className="cn">
              Track levels
            </div>
            <div className="m dsc">
              A related level lowers prices or unlocks some Mastery items.
            </div>
          </div>
          <div className="card t" id="requisitions">
            <div className="ct">
              <span>
                ONE-USE BOOST
              </span>
              <svg className="ic" viewBox="0 0 32 32" aria-hidden="true">
                <use href="#i-requisition-i"></use>
              </svg>
            </div>
            <div className="cn">
              Field Requisition
            </div>
            <div className="m dsc">
              One use: an extra track discount on an eligible prize.
            </div>
          </div>
        </div>
        <p className="note">
          Requisitions do not add Bolts or remove level requirements. On a Custom Order, one applies only when the approved quote marks it eligible.
        </p>
      </div>
    </>
  );
}
