import { EquipmentSection } from "./EquipmentSection";
import { LoadoutIcon } from "./icons/LoadoutIcon";

const milestones = [
  { level: "LV.3", award: "I", variant: "one", icon: "requisition-i" },
  { level: "LV.6", award: "I", variant: "one", icon: "requisition-i" },
  { level: "LV.9", award: "II", variant: "two", icon: "requisition-ii" },
  { level: "LV.12", award: "II", variant: "two", icon: "requisition-ii" },
  { level: "LV.15", award: "Master", variant: "master", icon: "requisition-master" },
] as const;

export function ProgressionSection() {
  return (
    <section className="site-section progression-section" id="progression" aria-labelledby="progression-levels-title">
      <div className="progression-levels">
        <div className="subsection-heading">
          <span className="section-eyebrow">Lifetime levels</span>
          <h2 id="progression-levels-title">Track XP and levels</h2>
          <p>Track XP cannot be spent; it raises a separate level in each lifetime track, up to LV.15. As your level rises, so does your discount on prizes from that track. Track XP and levels persist through competitive Seasons.</p>
        </div>
        <p className="progression-milestone-caption">Reach a marked level to earn a one-use Field Requisition: an extra discount on an eligible prize from that track.</p>
        <div className="progression-rail" role="group" aria-label="Field Requisition milestones">
          {milestones.map((milestone) => (
            <div className="progression-stop" key={milestone.level}>
              <span className={`progression-marker progression-marker-${milestone.variant}`} aria-hidden="true"><LoadoutIcon name={milestone.icon} /></span>
              <strong className="progression-level">{milestone.level}</strong>
              <span className="progression-award">{milestone.variant === "master" ? "Master Requisition" : `Requisition ${milestone.award}`}</span>
            </div>
          ))}
        </div>
        <p className="progression-benefit"><strong>Choose where to grow.</strong> Level up several tracks for discounts across more fields, or focus on one track to build deeper skills and bigger discounts there.</p>
      </div>

      <EquipmentSection />
    </section>
  );
}
