import { SectionHeading } from "./SectionHeading";

const stages = ["STEAM", "ELECTRIFICATION", "COMPUTING", "NETWORKS", "ACCELERATION"];
const objectives = ["Measure", "Control", "Automate", "Optimize"];

export function ErasSection() {
  return (
    <section className="site-section eras-section" id="eras" aria-labelledby="eras-title">
      <SectionHeading eyebrow="Community Eras" title="Build the next Era together." headingId="eras-title">
        Approved projects contribute to LOADOUT’s shared technical Era. Era Points measure community progress; they are separate from your personal Track XP and global spendable Bolts. Optional objectives can guide a build, but they do not change normal project eligibility.
      </SectionHeading>
      <p className="era-intro">The planned Era sequence is illustrative, not a promised launch order.</p>
      <dl className="era-records" aria-label="Three kinds of progress">
        <div><dt>Era Points</dt><dd>Shared, non-spendable community progress.</dd></div>
        <div><dt>Track XP</dt><dd>Your personal, lifetime progress in each track.</dd></div>
        <div><dt>Bolts</dt><dd>One global balance you can spend on prizes.</dd></div>
      </dl>
      <ol className="era-sequence" aria-label="Illustrative Era sequence">
        {stages.map((stage, index) => <li className="era-stage" key={stage}><span className="era-stage-index">0{index + 1}</span><strong>{stage}</strong></li>)}
      </ol>
      <div className="era-objectives-block">
        <h3>Optional objectives can cross tracks</h3>
        <ul className="era-objectives">{objectives.map((objective) => <li className="era-objective" key={objective}>{objective}</li>)}</ul>
        <p>For example, builders might measure a system, control a device, automate a workflow, or optimize a runtime. These are examples, not a live objective list. A project can still be reviewed when it does not match an Era objective.</p>
      </div>
      <div className="era-advancement">
        <h3>How an Era advances</h3>
        <ol className="era-rules">
          <li className="era-rule"><h4>Ship and contribute</h4><p>After review, your project’s contribution goes toward the community’s shared target.</p></li>
          <li className="era-rule"><h4>Reach the target</h4><p>An Era lasts at least 14 days, and the community must reach its target before it can advance. Reaching it early makes the Era ready; it does not trigger an immediate change.</p></li>
          <li className="era-rule"><h4>Advance at a weekly reset</h4><p>The first eligible check is the second reset after the Era begins. If the target is unmet, it continues to a later eligible reset. Your Track XP, Bolts, and projects persist.</p></li>
        </ol>
      </div>
      <p className="era-season-note">A Season is a period for competitive rankings; a Community Era is a shared technical theme. Rankings may reset with a Season, but your personal progress and projects stay with you when an Era changes.</p>
      <aside className="era-bonus" aria-label="Planned Era build bonus">
        <strong>Planned Era build bonus</strong>
        <p>A reviewer separately decides whether a project fits the active objectives. A qualifying project is planned to earn +10% of its approved base Bolts, with no extra Track XP.</p>
      </aside>
      <a className="era-faq-link" href="#faq">More about Community Eras in the FAQ →</a>
    </section>
  );
}
