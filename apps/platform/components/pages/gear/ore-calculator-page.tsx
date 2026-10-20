"use client";

import { useId, useState, type FormEvent } from "react";
import { useOre } from "../../../lib/ore-ledger";
import { usePreviewState } from "../../../lib/preview-store";
import { Field, PageHeader, Panel, PreviewNote, Status, Tabs } from "../../ui/ui";
import { DRAFT_RULES, PLAN_RULES, SHOP_ITEMS, SIGNAL_PLATFORMS, findShopItem } from "./data";
import { navLead } from "./gear-nav";
import { GEAR_KEYS, INITIAL_CALC, saveScenarioNow, useGearProfile } from "./gear-store";
import { ProfilePanel, formatOre, useAnnounce } from "./gear-ui";
import { MultiplierGuide } from "./ore-calc-guide";
import { ScenarioList } from "./ore-calc-scenarios";
import {
  capFor,
  clampMultiplier,
  estimateFromInputs,
  hoursToAfford,
  meanScore,
  multiplierFor,
  scoreToMultiplier,
  signalTierFor,
  type CalcInputs,
  type SignalTier,
} from "./logic/ore-calc";
import { priceItem, progressPercent, shortfall } from "./logic/pricing";

// Plans/02 sections 10, 11 and 17 and plans/22 give the rules. This is an estimate: peer review decides the real
// multiplier. The pure maths is in logic/ore-calc.ts and is unit tested.

const SCORE_NAMES = ["Originality", "Technical Depth", "Execution", "Documentation"] as const;

const SIGNAL_OPTIONS: { value: SignalTier; label: string; detail: string }[] = [
  { value: "none", label: "No Signal", detail: "Normal range, 1x to 20x." },
  { value: "good", label: "Good Signal", detail: `Adds ${PLAN_RULES.goodSignalOre} Ore. The cap stays 20x.` },
  { value: "great", label: "Great Signal", detail: "Lifts the hourly cap to 30x and includes the Good reward." },
];

export function OreCalculatorPage() {
  const [message, announce] = useAnnounce();
  const [inputs, setInputs] = usePreviewState<CalcInputs>(GEAR_KEYS.calc, INITIAL_CALC);

  return (
    <>
      <PageHeader eyebrow="Gear" title="Ore calculator" lead={navLead("ore-calculator")} />
      <PreviewNote>
        This is an estimate. The final multiplier is decided by peer review, and the score-to-multiplier curve here is a draft for the preview. Your inputs and saved scenarios stay in this browser.
      </PreviewNote>
      <Status message={message} />
      <Tabs
        label="Ore calculator sections"
        tabs={[
          { id: "estimate", label: "Estimate", panel: <EstimateTab inputs={inputs} setInputs={setInputs} announce={announce} /> },
          { id: "how", label: "How multipliers work", panel: <MultiplierGuide /> },
        ]}
      />
    </>
  );
}

function EstimateTab({
  inputs,
  setInputs,
  announce,
}: {
  inputs: CalcInputs;
  setInputs: (next: CalcInputs | ((prev: CalcInputs) => CalcInputs)) => void;
  announce: (message: string) => void;
}) {
  const base = useId();
  const result = estimateFromInputs(inputs);
  const cap = capFor(inputs.signal);
  const [hoursDraft, setHoursDraft] = useState<string | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const hoursText = hoursDraft ?? String(inputs.hours);
  const hoursNumber = Number(hoursText);
  const hoursError =
    hoursText.trim() === "" || !Number.isFinite(hoursNumber) || hoursNumber < 0
      ? "Enter the approved hours as a number, 0 or more."
      : hoursNumber > DRAFT_RULES.maxHours
        ? `The preview accepts up to ${DRAFT_RULES.maxHours.toLocaleString("en-GB")} hours.`
        : null;

  const patch = (partial: Partial<CalcInputs>) => setInputs((prev) => ({ ...prev, ...partial }));

  function setScore(index: number, value: number) {
    setInputs((prev) => {
      const scores = [...prev.scores] as CalcInputs["scores"];
      scores[index] = value;
      return { ...prev, scores };
    });
  }

  function saveScenario(event: FormEvent) {
    event.preventDefault();
    const out = saveScenarioNow(scenarioName, inputs);
    if (!out.ok) {
      setSaveError(out.error);
      announce(`Not saved. ${out.error}`);
      return;
    }
    setSaveError(null);
    setScenarioName("");
    announce(`Scenario ${out.scenario.name} saved with an estimate of ${formatOre(estimateFromInputs(inputs).total)}.`);
  }

  const mean = meanScore(inputs.scores);
  const directValue = clampMultiplier(inputs.multiplier, inputs.signal);

  return (
    <div className="pg-cols">
      <div className="gr-stack">
        <Panel title="Your numbers">
          <div className="gr-stack">
            <Field label="Approved hours" hint="Hours the team approves for the ship, not hours you worked." error={hoursError}>
              <input
                type="text"
                inputMode="decimal"
                value={hoursText}
                aria-invalid={Boolean(hoursError)}
                onChange={(event) => {
                  const text = event.target.value;
                  setHoursDraft(text);
                  const value = Number(text);
                  if (text.trim() !== "" && Number.isFinite(value) && value >= 0 && value <= DRAFT_RULES.maxHours) patch({ hours: value });
                }}
                onBlur={() => setHoursDraft(null)}
              />
            </Field>

            <fieldset className="gr-fieldset">
              <legend>How to set the multiplier</legend>
              <div className="gr-seg">
                <label>
                  <input type="radio" name={`${base}-mode`} checked={inputs.mode === "scores"} onChange={() => patch({ mode: "scores" })} />
                  <span>From review scores</span>
                </label>
                <label>
                  <input type="radio" name={`${base}-mode`} checked={inputs.mode === "direct"} onChange={() => patch({ mode: "direct" })} />
                  <span>Set it directly</span>
                </label>
              </div>
            </fieldset>

            {inputs.mode === "scores" ? (
              <fieldset className="gr-fieldset">
                <legend>Expected review scores (1 to 9)</legend>
                <div className="gr-stack">
                  {SCORE_NAMES.map((name, index) => (
                    <label key={name} className="gr-range">
                      <span className="gr-range-head">
                        <span className="fld-label">{name}</span>
                        <span className="gr-range-value" aria-hidden="true">
                          {inputs.scores[index]}
                        </span>
                      </span>
                      <input
                        type="range"
                        min={PLAN_RULES.scoreMin}
                        max={PLAN_RULES.scoreMax}
                        step={1}
                        value={inputs.scores[index]}
                        aria-valuetext={`${inputs.scores[index]} out of ${PLAN_RULES.scoreMax}`}
                        onChange={(event) => setScore(index, Number(event.target.value))}
                      />
                    </label>
                  ))}
                  <p className="mut">
                    Mean score {mean}. On the draft curve that is {scoreToMultiplier(mean, cap)}x. Real scores are the median of 12 peer reviews for each dimension.
                  </p>
                </div>
              </fieldset>
            ) : (
              <label className="gr-range">
                <span className="gr-range-head">
                  <span className="fld-label">Hourly multiplier</span>
                  <span className="gr-range-value" aria-hidden="true">
                    {directValue}x
                  </span>
                </span>
                <input
                  type="range"
                  min={PLAN_RULES.minMultiplier}
                  max={cap}
                  step={0.5}
                  value={directValue}
                  aria-valuetext={`${directValue} times`}
                  onChange={(event) => patch({ multiplier: Number(event.target.value) })}
                />
                <span className="fld-hint">
                  1x to {cap}x. The mean across ships is {PLAN_RULES.meanMultiplier}x.
                  {inputs.multiplier > cap ? ` Held at ${cap}x because you have no Great Signal.` : ""}
                </span>
              </label>
            )}

            <fieldset className="gr-fieldset">
              <legend>Signal (outside attention)</legend>
              <div className="gr-stack">
                {SIGNAL_OPTIONS.map((option) => (
                  <label key={option.value} className="check">
                    <input type="radio" name={`${base}-signal`} checked={inputs.signal === option.value} onChange={() => patch({ signal: option.value })} />
                    <span>
                      <strong>{option.label}.</strong> {option.detail}
                    </span>
                  </label>
                ))}
                <EvidenceHelper onUse={(tier) => { patch({ signal: tier }); announce(`Signal set to ${tier}.`); }} />
              </div>
            </fieldset>

            <label className="check">
              <input type="checkbox" checked={inputs.era} onChange={(event) => patch({ era: event.target.checked })} />
              <span>
                A reviewer marks the ship as qualifying for a Community Era (+{PLAN_RULES.eraBonusPercent}% of base Ore)
              </span>
            </label>
          </div>
        </Panel>

        <Panel title="Save this scenario">
          <form className="gr-stack" onSubmit={saveScenario} noValidate>
            <Field label="Name" hint="Optional. Saved scenarios can be compared." error={saveError}>
              <input type="text" value={scenarioName} maxLength={40} aria-invalid={Boolean(saveError)} onChange={(event) => setScenarioName(event.target.value)} />
            </Field>
            <div className="gr-row">
              <button type="submit" className="btn btn-sm" aria-disabled={Boolean(hoursError)}>
                Save scenario
              </button>
            </div>
          </form>
        </Panel>
      </div>

      <div className="gr-stack">
        <Panel title="Estimate">
          <div className="gr-result">
            <p className="mut">Estimated Ore for the ship</p>
            <p className="gr-result-total" role="status" aria-live="polite" aria-atomic="true">
              {result.total.toLocaleString("en-GB")} Ore
            </p>
            <dl className="gr-dl">
              <dt>Approved hours</dt>
              <dd>{result.hours.toLocaleString("en-GB")}</dd>
              <dt>Multiplier used</dt>
              <dd>{multiplierFor(inputs)}x</dd>
              <dt>Base Ore</dt>
              <dd>{formatOre(result.baseOre)}</dd>
              <dt>Signal bonus</dt>
              <dd>{formatOre(result.signalBonus)}</dd>
              <dt>Era bonus</dt>
              <dd>{formatOre(result.eraBonus)}</dd>
            </dl>
          </div>
          <div className="gr-stack">
            <h3 className="gr-h4">How this was worked out</h3>
            <ol className="gr-steps">
              {result.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="gr-note">
              This is an estimate. The final multiplier is decided by peer review: 12 countable reviews, then a percentile payout curve. Rounding, Era stacking with Signal and curve versions are still open.
            </p>
          </div>
        </Panel>

        <DiscountPreview orePerHour={result.orePerHour} estimate={result.total} />
        <ScenarioList
          announce={announce}
          onLoad={(loaded, name) => {
            setInputs(loaded);
            setHoursDraft(null);
            announce(`Loaded ${name} into the calculator.`);
          }}
        />
      </div>
    </div>
  );
}

// --- Signal evidence ---------------------------------------------------------------------------------------------

function EvidenceHelper({ onUse }: { onUse: (tier: SignalTier) => void }) {
  const [platformId, setPlatformId] = useState(SIGNAL_PLATFORMS[0].id);
  const [count, setCount] = useState("");
  const [front, setFront] = useState(false);
  const platform = SIGNAL_PLATFORMS.find((p) => p.id === platformId) ?? SIGNAL_PLATFORMS[0];
  const number = Number(count.replace(/,/g, ""));
  const valid = count.trim() !== "" && Number.isFinite(number) && number >= 0;
  const tier = valid ? signalTierFor(platformId, number, { frontPage: front }) : "none";

  return (
    <details className="gr-profile">
      <summary>Check a link&apos;s numbers against the Signal thresholds</summary>
      <div className="gr-profile-body">
        <p className="mut">
          A reviewer verifies every Signal claim. This only shows which tier a number could reach. Internal Hack Club channels, bots, bought engagement and SEO mirrors do not count.
        </p>
        <div className="form-grid">
          <Field label="Measure">
            <select value={platformId} onChange={(event) => setPlatformId(event.target.value)}>
              {SIGNAL_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Count" error={count.trim() !== "" && !valid ? "Enter a number, 0 or more." : null}>
            <input type="text" inputMode="numeric" value={count} aria-invalid={count.trim() !== "" && !valid} onChange={(event) => setCount(event.target.value)} />
          </Field>
        </div>
        {platform.greatNeedsFrontPage ? (
          <label className="check">
            <input type="checkbox" checked={front} onChange={(event) => setFront(event.target.checked)} />
            <span>It reached the front page</span>
          </label>
        ) : null}
        <p role="status" aria-live="polite">
          {!valid
            ? "Enter a count to see the tier."
            : tier === "none"
              ? `Not enough for Good yet${platform.good !== null ? ` (Good starts at ${platform.good.toLocaleString("en-GB")})` : ""}.`
              : tier === "good"
                ? `Could reach Good. Great needs ${platform.great.toLocaleString("en-GB")}${platform.greatNeedsFrontPage ? " and the front page" : ""}.`
                : "Could reach Great."}
        </p>
        <div className="gr-row">
          <button type="button" className="btn btn-quiet btn-sm" disabled={tier === "none"} onClick={() => onUse(tier)}>
            Use {tier === "great" ? "Great" : "Good"} Signal in the estimate
          </button>
        </div>
      </div>
    </details>
  );
}

// --- Shop discount preview ---------------------------------------------------------------------------------------

function DiscountPreview({ orePerHour, estimate }: { orePerHour: number; estimate: number }) {
  const { levels } = useGearProfile();
  const { balance } = useOre();
  const [itemId, setItemId] = useState(SHOP_ITEMS[2].id);
  const item = findShopItem(itemId) ?? SHOP_ITEMS[0];
  const price = priceItem(item, levels);
  const missing = shortfall(balance, price.final);
  const hours = hoursToAfford(missing, orePerHour);
  const covers = missing === 0 ? 100 : progressPercent(estimate, missing);

  return (
    <Panel title="What it could buy">
      <div className="gr-stack">
        <p className="mut">Pick a sample item to see its price after your track discount and how much of the gap this estimate covers.</p>
        <Field label="Sample item">
          <select value={itemId} onChange={(event) => setItemId(event.target.value)}>
            {SHOP_ITEMS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </Field>
        <dl className="gr-dl">
          <dt>Base price</dt>
          <dd>{formatOre(price.base)}</dd>
          <dt>Track discount{price.permanentPercent > 0 && price.permanentTrack ? ` (${price.permanentPercent}%, ${price.permanentTrack})` : ""}</dt>
          <dd>{price.permanentSaving > 0 ? `-${formatOre(price.permanentSaving)}` : "None"}</dd>
          <dt className="gr-total">Your price</dt>
          <dd className="gr-total">{formatOre(price.final)}</dd>
          <dt>Your Ore now</dt>
          <dd>{formatOre(balance)}</dd>
          <dt>Still needed</dt>
          <dd>{formatOre(missing)}</dd>
        </dl>
        <p>
          {missing === 0
            ? "You can already afford this."
            : estimate >= missing
              ? `This estimate would cover the gap (${formatOre(estimate)} against ${formatOre(missing)}).`
              : `This estimate covers ${covers}% of the gap. At ${orePerHour}x it takes about ${hours ?? "?"} more approved hours to close it.`}
        </p>
        <p className="mut">
          Requisitions and level requirements are handled in the Shop. Sample prices are not final, and availability and delivery are confirmed once ordering opens.
        </p>
        <ProfilePanel />
      </div>
    </Panel>
  );
}
