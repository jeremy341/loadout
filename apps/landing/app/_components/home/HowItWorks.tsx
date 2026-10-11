import { ART } from "./art";
import { Fragment, type ReactNode } from "react";
import { AsciiField } from "./AsciiField";

type Step = { label?: string; icon: string; title: string; text: string; nudge?: boolean };

const STEPS: Step[] = [
  { label: "STEP 01", icon: "list", title: "Choose a project and its tracks", text: "Pick something to make or improve, then choose the fields your project will use." },
  { label: "STEP 02", icon: "code", title: "Build it and keep a journal", text: "A journal is a build log: note what changed, why you chose that approach, and how you checked the result. Hackatime and Lapse are the planned tools for tracking coding and eligible non-code work." },
  { label: "STEP 03", icon: "document", title: "Share a working version", text: "Share your project, demo or other evidence, and instructions. Explain what you built, any AI help, and what still needs work. Research projects must include results others can reproduce." },
  { label: "STEP 04", icon: "check", title: "Get your work reviewed", text: "Reviewers check that your project adds useful original technical work and that you show enough evidence. Then they score it and assign XP to the tracks your work used." },
];

// Outcomes of a review, shown side by side.
const OUTCOMES: Step[][] = [
  [
    { icon: "bolt", nudge: true, title: "Bolts to spend", text: "Bolts are your reward-shop balance, usable across all tracks." },
    { icon: "xp-star", title: "Track XP to keep", text: "XP cannot be spent. It raises a separate level in each track; those levels can affect gear prices and access." },
  ],
  [
    { icon: "document", title: "Digital Loadout", text: "Your accepted projects and the portfolio you build from them." },
    { icon: "equipment-box", title: "Physical Loadout", text: "The equipment and tools you use to build your next project." },
  ],
];

const UPGRADE: Step = { label: "STEP 05", icon: "equipment-box", title: "Choose your next upgrade", text: "Use Bolts for gear. Your level in a related track can lower its price or unlock some items. A Field Requisition can apply an extra track discount. Custom Orders let you request equipment outside the shop." };
const UPGRADE_LINKS = [["#progression", "How levels help"], ["#requisitions", "How Requisitions save"], ["#eras", "Community Eras"]] as const;
const AGAIN: Step = { label: "STEP 06", icon: "wrench", title: "Build again", text: "Put new skills and equipment to work on your next project." };

function StepCard({ step, children }: { step: Step; children?: ReactNode }) {
  return (
    <div className="card fn">
      <div className="ct">
        {step.label && <span>{step.label}</span>}
        <svg className={step.nudge ? "ic nudge" : "ic"} viewBox="0 0 32 32" aria-hidden="true">
          <use href={"#i-" + step.icon}></use>
        </svg>
      </div>
      <div className="cn">{step.title}</div>
      <div className="m dsc">{step.text}</div>
      {children}
    </div>
  );
}

// How it works section ported from the LOADOUT redesign reference.
export function HowItWorks() {
  return (
    <>
      <div className="pit">
        <b>
          −100 M
        </b>
        <span>
          Hängebank
          <br />
          How it works
        </span>
      </div>
      <div className="sect" id="process">
        <AsciiField html={ART["process"]} side="left" top="50px" />
        <h2 className="h2">
          How it
          works
        </h2>
        <p className="lead">
          Build, ship, and use what you learn to take on the next project.
        </p>
        <div className="fl">
          {STEPS.map((step) => (
            <Fragment key={step.label}>
              <StepCard step={step} />
              <i className="fc"></i>
            </Fragment>
          ))}
          {OUTCOMES.map((pair) => (
            <Fragment key={pair[0].title}>
              <div className="br2">
                {pair.map((outcome) => <StepCard step={outcome} key={outcome.title} />)}
              </div>
              <i className="fc"></i>
            </Fragment>
          ))}
          <StepCard step={UPGRADE}>
            <div className="lnks">
              {UPGRADE_LINKS.map(([href, text]) => <a href={href} key={href}>{text}</a>)}
            </div>
          </StepCard>
          <i className="fc"></i>
          <StepCard step={AGAIN}>
            <div className="loop">
              ↻ Back to step 01
            </div>
          </StepCard>
        </div>
      </div>
    </>
  );
}
