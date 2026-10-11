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
        <p className="lead">
          Use Bolts to get equipment. Build track levels to unlock better prices, then use a Field Requisition to stretch an eligible discount further.
        </p>
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
              Spend global currency on most prizes across tracks.
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
              A related level can lower a prize price or unlock some Mastery items.
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
              Use one on an eligible prize to apply an extra track discount.
            </div>
          </div>
        </div>
        <p className="note">
          Requisitions do not add Bolts, remove level requirements, or apply to Custom Orders.
        </p>
      </div>
    </>
  );
}
