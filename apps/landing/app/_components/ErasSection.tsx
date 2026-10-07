import { SectionHeading } from "./SectionHeading";
import { erasCopy } from "../site-content";

export function ErasSection() {
  return (
    <section className="site-section eras-section" id="eras" aria-labelledby="eras-title">
      <SectionHeading eyebrow="Community Eras" title="Build the next Era together." headingId="eras-title">
        {erasCopy.description}
      </SectionHeading>
      <ol className="era-concept-rail" aria-label="How a Community Era works">
        {erasCopy.steps.map((step, index) => <li key={step}><span className="era-step-number">0{index + 1}</span><span>{step}</span></li>)}
      </ol>
      <div className="era-facts" aria-label="Community Era facts">
        <div className="era-fact">
          <strong>SHARED PROGRESS</strong>
          <span>Era Points are separate from Bolts and Track XP.</span>
        </div>
        <div className="era-fact era-bonus">
          <strong>+10% PLANNED</strong>
          <span>Qualifying projects may receive this Bolt bonus on the approved base award.</span>
        </div>
      </div>
      <p className="era-bonus-note">Planned rule; final launch configuration is still being finalized. Era changes do not reset lifetime Bolts, Track XP, or shipped work.</p>
    </section>
  );
}
