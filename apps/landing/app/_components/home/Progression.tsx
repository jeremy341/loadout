import Link from "next/link";
import { ART } from "./art";
import { AsciiField } from "./AsciiField";

// Levels and rewards section; the level rail follows main's: one marker per Field Requisition milestone.
const MILESTONES = [
  { level: "LV.3", award: "Requisition I", icon: "requisition-i" },
  { level: "LV.6", award: "Requisition I", icon: "requisition-i" },
  { level: "LV.9", award: "Requisition II", icon: "requisition-ii" },
  { level: "LV.12", award: "Requisition II", icon: "requisition-ii" },
  { level: "LV.15", award: "Master Requisition", icon: "requisition-master" },
] as const;

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
          Each track has its own level, and you keep it. A higher level means better prices on that track’s prizes.
        </p>
        <p className="note" style={{ margin: "0 0 34px" }}>
          Marked levels award a one-use Field Requisition.
        </p>
        <div className="lad l5" role="group" aria-label="Field Requisition milestones">
          {MILESTONES.map((milestone) => (
            <div className="st" key={milestone.level}>
              <span className="bd" aria-hidden="true">
                <svg className="ic" viewBox="0 0 32 32">
                  <use href={"#i-" + milestone.icon}></use>
                </svg>
              </span>
              <strong className="cn">{milestone.level}</strong>
              <span className="m dsc">{milestone.award}</span>
            </div>
          ))}
        </div>
        <div className="lnks">
          <Link href="/docs/progress">XP &amp; levels guide →</Link>
        </div>
      </div>
    </>
  );
}
