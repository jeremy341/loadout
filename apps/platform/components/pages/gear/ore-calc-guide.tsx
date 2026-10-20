"use client";

import { Panel } from "../../ui/ui";
import { DRAFT_RULES, PLAN_RULES, SIGNAL_PLATFORMS } from "./data";

// "How multipliers work": the agreed rules in plain words (plans/02 sections 9, 10, 11, 17 and 18, plans/22
// sections 1 to 3). Anything the plans leave open is said to be open.

const DIMENSIONS = [
  { name: "Originality", question: "Is the idea, implementation or approach meaningfully interesting?" },
  { name: "Technical Depth", question: "How much real technical challenge, understanding and capability-building work is present?" },
  { name: "Execution", question: "How successfully did the builder realize the technical capability they attempted?" },
  { name: "Documentation", question: "How well can another builder understand, verify, reproduce or use the work?" },
];

export function MultiplierGuide() {
  return (
    <div className="gr-stack">
      <Panel title="From hours to Ore">
        <div className="gr-prose">
          <p>
            Ore for a ship is its approved hours times an hourly multiplier. Twenty approved hours at 10x earn 200 base Ore. If a reviewer marks the ship as qualifying for a Community Era, that adds {PLAN_RULES.eraBonusPercent}% of the base Ore (20 more Ore here, 220 in total).
          </p>
          <p>
            The multiplier normally runs from {PLAN_RULES.minMultiplier}x to {PLAN_RULES.normalCapMultiplier}x, with {PLAN_RULES.meanMultiplier}x as the mean. There is no minimum payout beyond the 1x end of the range, and a ship the team rejects receives no payout.
          </p>
        </div>
      </Panel>

      <Panel title="Who sets the multiplier">
        <div className="gr-prose">
          <p>
            The team first checks LOADOUT fit, the claimed hours and the submission requirements. Then peers decide the quality. Each peer review scores four dimensions from {PLAN_RULES.scoreMin} to {PLAN_RULES.scoreMax} and gives a written reason of at least ten words.
          </p>
          <ul>
            {DIMENSIONS.map((dimension) => (
              <li key={dimension.name}>
                <strong>{dimension.name}.</strong> {dimension.question}
              </li>
            ))}
          </ul>
          <p>
            A ship needs 12 countable peer reviews. For each dimension the median is taken, the four medians are averaged, and that overall score is placed among other ships and mapped through a percentile payout curve. Each builder owes eight valid reviews of other ships before their own payout. Reviewers are anonymous to the builder and nobody can buy a better score for their own ship.
          </p>
          <p className="gr-note">
            <strong>Draft preview rule.</strong> The plans do not publish the percentile curve or the group of ships it is measured against. The calculator treats a score&apos;s place between {PLAN_RULES.scoreMin} and {PLAN_RULES.scoreMax} as its percentile and bends it so an evenly spread group averages {PLAN_RULES.meanMultiplier}x (multiplier = 1 + 19 x place^{DRAFT_RULES.scoreCurveExponent.toFixed(2)}). The score sliders use your four scores directly as stand-ins for the four medians. Treat the result as a rough guide.
          </p>
        </div>
      </Panel>

      <Panel title="Signal">
        <div className="gr-prose">
          <p>
            Signal rewards real attention from outside LOADOUT. The ship must already pass normal review, be original and be open source. You submit a third-party link and a reviewer checks it. Internal Hack Club channels, bot reposts, SEO mirrors, bought views or stars, fake accounts and engagement rings do not count.
          </p>
          <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="tbl">
              <caption className="sr-only">Signal tiers</caption>
              <thead>
                <tr>
                  <th scope="col">Tier</th>
                  <th scope="col">Reward</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Good</th>
                  <td>+{PLAN_RULES.goodSignalOre} Ore, a Good Signal achievement and an exclusive shop reward.</td>
                </tr>
                <tr>
                  <th scope="row">Great</th>
                  <td>
                    Raises the hourly cap from {PLAN_RULES.normalCapMultiplier}x to {PLAN_RULES.greatCapMultiplier}x, plus every Good reward and a Great Signal achievement. It lifts the cap; it does not add a second {PLAN_RULES.greatCapMultiplier}x on top.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            The total Signal bonus is capped at {PLAN_RULES.signalCapOre.toLocaleString("en-GB")} Ore per project, and that cap includes the extra Ore from the higher hourly cap. Signal does not raise the {PLAN_RULES.normalCapMultiplier}x cap for ships without a Great claim. If a ship was already paid, a later upgrade credits only the difference.
          </p>
          <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="tbl">
              <caption className="sr-only">Signal thresholds by platform</caption>
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  <th scope="col" className="num">
                    Good
                  </th>
                  <th scope="col" className="num">
                    Great
                  </th>
                </tr>
              </thead>
              <tbody>
                {SIGNAL_PLATFORMS.map((platform) => (
                  <tr key={platform.id}>
                    <th scope="row">
                      {platform.label}
                      {platform.greatNeedsFrontPage ? <span className="mut"> (Great needs the front page)</span> : null}
                    </th>
                    <td className="num">{platform.good === null ? "None listed" : platform.good.toLocaleString("en-GB")}</td>
                    <td className="num">{platform.great.toLocaleString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mut">
            Third-party blog or news coverage qualifies at the reviewer&apos;s discretion. These are the current Stardance thresholds that the plan adopts as its reference, and they may change.
          </p>
        </div>
      </Panel>

      <Panel title="When Ore arrives">
        <div className="gr-prose">
          <p>
            A review cannot lock until 12 countable reviews are in and at least 24 hours have passed since the latest journal entry on the ship. A 24-hour flag window then opens, and Ore is issued after it closes unless a flag is pending. A builder whose flags are rejected three times within ten hours has 5% taken from their next final payout. There is no separate appeal.
          </p>
          <p className="gr-note">
            Usage Milestones, referrals and General Requisitions are separate from the multiplier and are not part of this estimate. Final rounding, Era stacking with Signal and curve versioning are still open in the plans.
          </p>
        </div>
      </Panel>
    </div>
  );
}
