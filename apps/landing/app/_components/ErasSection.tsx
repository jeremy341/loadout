import { SectionHeading } from "./SectionHeading";

const stages = ["STEAM", "ELECTRIFICATION", "COMPUTING", "NETWORKS", "ACCELERATION"];
const objectives = ["Measure", "Control", "Automate", "Optimize"];

export function ErasSection() {
  return (
    <section className="site-section eras-section" id="eras" aria-labelledby="eras-title">
      <SectionHeading eyebrow="Community Eras" title="LOADOUT advances when builders do." headingId="eras-title">
        An Era is a shared technical theme for the program. Approved projects add Era Points toward a community target. These non-spendable points are separate from your Track XP and Bolts. Optional objectives suggest things to build, but following one is not required for project review.
      </SectionHeading>
      <p className="era-intro">Era Points are shared progress, not currency. The sequence below is illustrative, not a promised launch order.</p>
      <ol className="era-sequence" aria-label="Illustrative Era sequence">
        {stages.map((stage, index) => <li className="era-stage" key={stage}><span className="era-stage-index">0{index + 1}</span><strong>{stage}</strong></li>)}
      </ol>
      <div className="era-objectives-block">
        <h3>Optional objectives can cross tracks</h3>
        <ul className="era-objectives">{objectives.map((objective) => <li className="era-objective" key={objective}>{objective}</li>)}</ul>
        <p>For example, builders might measure a system, control a device, automate a workflow, or optimize a runtime. These are examples, not a live objective list. A project can still be reviewed when it does not match an Era objective.</p>
      </div>
      <ul className="era-rules" aria-label="Era advancement rules">
        <li className="era-rule">An Era must last at least 14 days and reach its community target before it can change.</li>
        <li className="era-rule">The first check is the second scheduled weekly reset after the Era begins. If it has not reached its target, it continues until a later weekly check.</li>
        <li className="era-rule">An Era change does not reset your Track XP, Bolts, accepted projects, or Digital Loadout.</li>
      </ul>
      <p className="era-season-note">A Season is a period for competitive rankings; a Community Era is a shared technical theme. Rankings may reset with a Season, but your personal progress and projects stay with you when an Era changes.</p>
      <a className="era-faq-link" href="#faq">More about Community Eras in the FAQ →</a>
    </section>
  );
}
