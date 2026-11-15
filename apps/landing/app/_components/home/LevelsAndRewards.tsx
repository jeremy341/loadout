import Link from "next/link";
import { ART } from "./art";
import { AsciiField } from "./AsciiField";

// Levels and rewards in one section: the level rail (one marker per Field Requisition milestone), then the savings rules as plain
// rows. Ore and Track XP are taught once, in How it works, so this section only holds the numbers.
const MILESTONES = ["LV.5", "LV.8", "LV.11", "LV.15", "LV.18", "LV.20"] as const;

const SAVINGS = [
  { term: "Level discount", text: "Up to 20% off prizes in a track, at LV.20." },
  { term: "Field Requisition", text: "One use: 10% off the base price of a matching prize worth at least 400 Ore.", id: "requisitions" },
  { term: "Together", text: "Up to 40% off in total; a General Requisition only comes through a Flagship." },
  { term: "Price", text: "You see the final price before you order." },
] as const;

export function LevelsAndRewards() {
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
          Levels
          and rewards
        </h2>
        <p className="lead">
          Your levels never reset, and LV.20 takes about 275 approved hours in one track.
        </p>
        <div className="lad l6" role="group" aria-label="Field Requisition milestones">
          {MILESTONES.map((level) => (
            <div className="st" key={level}>
              <span className="bd" aria-hidden="true">
                <svg className="ic" viewBox="0 0 32 32">
                  <use href="#i-requisition-i"></use>
                </svg>
              </span>
              <strong className="cn">{level}</strong>
              <span className="m dsc">Requisition</span>
            </div>
          ))}
        </div>
        <dl className="facts">
          {SAVINGS.map((row) => (
            <div key={row.term} id={"id" in row ? row.id : undefined}>
              <dt>{row.term}</dt>
              <dd>{row.text}</dd>
            </div>
          ))}
        </dl>
        <div className="lnks">
          <Link href="/docs/pricing">Pricing, levels and Requisitions in full →</Link>
        </div>
      </div>
    </>
  );
}
