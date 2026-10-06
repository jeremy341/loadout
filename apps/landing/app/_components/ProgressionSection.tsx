import { EquipmentSection } from "./EquipmentSection";
import { LoadoutIcon } from "./icons/LoadoutIcon";
import { SectionHeading } from "./SectionHeading";

const milestones = [
  { level: "LV.3", award: "I", variant: "one" },
  { level: "LV.6", award: "I", variant: "one" },
  { level: "LV.9", award: "II", variant: "two" },
  { level: "LV.12", award: "II", variant: "two" },
  { level: "LV.15", award: "Master", variant: "master" },
] as const;

export function ProgressionSection() {
  return (
    <section className="site-section progression-section" id="progression" aria-labelledby="progression-title">
      <SectionHeading eyebrow="Progression" title="Progress & prizes" headingId="progression-title">
        Follow lifetime Track XP and levels, then see how they connect to Field Requisitions and planned prizes.
      </SectionHeading>

      <section className="progression-levels" aria-labelledby="progression-levels-title">
        <div className="subsection-heading">
          <span className="section-eyebrow">Lifetime levels</span>
          <h3 id="progression-levels-title">Track XP and levels</h3>
          <p>Track XP cannot be spent; it raises a separate level in each of the four lifetime tracks, up to LV.15. Track XP and levels persist through Era changes and competitive Seasons.</p>
        </div>
        <p className="progression-milestone-caption">Reach a marked level in a track to earn its Field Requisition.</p>
        <div className="progression-rail" role="group" aria-label="Field Requisition milestones">
          {milestones.map((milestone) => (
            <div className="progression-stop" key={milestone.level}>
              <span className={`progression-marker progression-marker-${milestone.variant}`} aria-hidden="true"><LoadoutIcon name="star" /></span>
              <strong className="progression-level">{milestone.level}</strong>
              <span className="progression-award">{milestone.variant === "master" ? "Master Requisition" : `Requisition ${milestone.award}`}</span>
            </div>
          ))}
        </div>
        <p className="progression-benefit"><strong>Choose where to grow.</strong> Progress in several tracks to build breadth, or focus on one to develop deeper skills in that field.</p>
      </section>

      <EquipmentSection />
    </section>
  );
}
