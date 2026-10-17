import { ART } from "./art";
import { Fragment, type ReactNode } from "react";
import { AsciiField } from "./AsciiField";

type Step = { label?: string; icon: string; title: string; text: string; nudge?: boolean };

const STEPS: Step[] = [
  { label: "STEP 01", icon: "list", title: "Pick something to build", text: "Anything technical you want to make or fix. Choose the track it fits: Tools, Systems, Compute or Hardware." },
  { label: "STEP 02", icon: "code", title: "Build it and keep a journal", text: "Write down what you did, why you did it, and how you checked it. Your tracked hours come with it." },
  { label: "STEP 03", icon: "document", title: "Ship it", text: "Share a working version, a demo or other proof, and how to run it. Say what you built yourself, where AI helped, and what's still rough." },
  { label: "STEP 04", icon: "check", title: "Other builders rate it", text: "A team member checks that it's real. Then builders score it from 0 to 20: 10 is solid, 5 is rough, 20 is outstanding. That score is how many Ore each hour pays." },
];

// What an accepted review adds, side by side. The Physical Loadout is not one of them:
// it is what spending Ore buys, so it belongs to the upgrade step below.
const OUTCOMES: Step[] = [
  { icon: "ore", nudge: true, title: "Ore to spend", text: "Hours times your score. Ten hours at 10 is 100 Ore." },
  { icon: "xp-star", title: "Track XP to keep", text: "Your levels. They never reset, and they take money off prizes." },
  { icon: "document", title: "Digital Loadout", text: "Every accepted project goes on your profile." },
];

const UPGRADE: Step = { label: "STEP 05", icon: "equipment-box", title: "Spend your Ore", text: "Buy gear for your next build. What you buy is your Physical Loadout." };
const UPGRADE_LINKS = [["#shop", "See the prizes"], ["#progression", "How levels help"]] as const;
const AGAIN: Step = { label: "STEP 06", icon: "wrench", title: "Build again", text: "Keep going on the same project and ship it again, or start a new one. A new ship pays only for the new hours." };

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
        <div className="fl">
          {STEPS.map((step) => (
            <Fragment key={step.label}>
              <StepCard step={step} />
              <i className="fc"></i>
            </Fragment>
          ))}
          <div className="br2 br3">
            {OUTCOMES.map((outcome) => <StepCard step={outcome} key={outcome.title} />)}
          </div>
          <i className="fc"></i>
          <div className="we-calc" role="img" aria-label="Example: 20 hours at a rating of 10 earns 200 Ore, enough for a Raspberry Pi 5.">
            <span><b>20 h</b>tracked</span>
            <i>×</i>
            <span><b>10</b>rating</span>
            <i>=</i>
            <span><b>200 Ore</b>earned</span>
            <i>→</i>
            <span><b>Raspberry Pi 5</b>200 Ore</span>
          </div>
          <p className="we-cap">Rated 15 instead, the same 20 hours pay 300 Ore.</p>
          <i className="fc"></i>
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
