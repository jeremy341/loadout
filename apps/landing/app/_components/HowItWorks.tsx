import { LoadoutIcon, type IconName } from "./icons/LoadoutIcon";
import Reveal from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const steps = [
  { number: "01", icon: "list", title: "Choose a project and its tracks", detail: "Pick something to make or improve, then choose the fields your project will use." },
  { number: "02", icon: "code", title: "Build it and keep a journal", detail: "A journal is a build log: note what changed, why you chose that approach, and how you checked the result. Hackatime and Lapse are the planned tools for tracking coding and eligible non-code work." },
  { number: "03", icon: "document", title: "Share a working version", detail: "Share your project, demo or other evidence, and instructions. Explain what you built, any AI help, and what still needs work. Research projects must include results others can reproduce." },
  { number: "04", icon: "check", title: "Get your work reviewed", detail: "Reviewers check that your project adds useful original technical work and that you show enough evidence. Then they score it and assign XP to the tracks your work used." },
] satisfies { number: string; icon: IconName; title: string; detail: string }[];

export function HowItWorks() {
  return (
    <section className="site-section process-section" id="process" aria-labelledby="process-title">
      <Reveal><SectionHeading eyebrow="Process" title="How it works" headingId="process-title">
        Build, ship, and use what you learn to take on the next project.
      </SectionHeading></Reveal>
      <ol className="process-flow">
        {steps.map((step, index) => (
          <li className="flow-step" key={step.number}>
            <Reveal><article className="flow-node">
              <span className="flow-step-number">{step.number}</span>
              <span className="flow-icon" aria-hidden="true"><LoadoutIcon name={step.icon} /></span>
              <div className="flow-copy"><h3>{step.title}</h3><p>{step.detail}</p></div>
            </article></Reveal>
            {index < steps.length - 1 && <span className="flow-connector" aria-hidden="true" />}
            {index === steps.length - 1 && <>
              <div className="flow-outcomes">
                <span className="flow-fork" aria-hidden="true" />
                <Reveal><ul className="flow-branches" aria-label="Two outcomes of approved work">
                  <li className="flow-result"><LoadoutIcon name="bolt" /><h3>Bolts to spend</h3><p>Bolts are your reward-shop balance, usable across all tracks.</p></li>
                  <li className="flow-result"><LoadoutIcon name="star" /><h3>Track XP to keep</h3><p>XP cannot be spent. It raises a separate level in each track; those levels can affect gear prices and access.</p></li>
                </ul></Reveal>
                <span className="flow-merge" aria-hidden="true" />
              </div>
              <div className="flow-artifact">
                <span className="flow-fork" aria-hidden="true" />
                <Reveal><ul className="flow-branches flow-loadout-branches" aria-label="Two parts of your Loadout">
                  <li className="flow-result"><LoadoutIcon name="document" /><h3>Digital Loadout</h3><p>Your accepted projects and the portfolio you build from them.</p></li>
                  <li className="flow-result"><LoadoutIcon name="box" /><h3>Physical Loadout</h3><p>The equipment and tools you use to build your next project.</p></li>
                </ul></Reveal>
                <span className="flow-merge" aria-hidden="true" />
                <span className="flow-connector" aria-hidden="true" />
              </div>
            </>}
          </li>
        ))}
        <li className="flow-step">
          <Reveal><article className="flow-node">
            <span className="flow-step-number">05</span>
            <span className="flow-icon" aria-hidden="true"><LoadoutIcon name="box" /></span>
            <div className="flow-copy"><h3>Choose your next upgrade</h3><p>Use Bolts for gear. Your level in a related track can lower its price or unlock some items. A Field Requisition can apply an extra track discount. Custom Orders let you request equipment outside the shop.</p><p className="flow-links"><a href="#progression">How levels help</a><a href="#requisitions">How Requisitions save</a><a href="#eras">Community Eras</a></p></div>
          </article></Reveal>
          <span className="flow-connector" aria-hidden="true" />
        </li>
        <li className="flow-step">
          <Reveal><article className="flow-node">
            <span className="flow-step-number">06</span>
            <span className="flow-icon" aria-hidden="true"><LoadoutIcon name="wrench" /></span>
            <div className="flow-copy"><h3>Build again</h3><p>Put new skills and equipment to work on your next project.</p></div>
          </article></Reveal>
        </li>
      </ol>
    </section>
  );
}
