import Link from "next/link";
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
                <use href="#i-ore"></use>
              </svg>
            </div>
            <div className="cn">
              Ore
            </div>
            <div className="m dsc">
              Pay the final price in Ore.
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
              Apply the discount earned in that track.
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
              Apply more of your track discount to one eligible prize.
            </div>
          </div>
        </div>
        <div className="lnks">
          <Link href="/docs/pricing">Pricing guide →</Link>
          <Link href="/docs/requisitions">Field Requisitions →</Link>
        </div>
      </div>
    </>
  );
}
