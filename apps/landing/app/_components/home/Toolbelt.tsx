// Toolbelt: use other builders' finished LOADOUT projects in your own work. The numbers are working numbers.
const STEPS = [
  { label: "STEP 01", title: "Build and ship", text: "Get an open-source project accepted." },
  { label: "STEP 02", title: "Equip it", text: "Another builder uses your tool in their own project." },
  { label: "STEP 03", title: "Prove the use", text: "It needs 25 approved hours, and a reviewer confirms the tool does real work." },
  { label: "STEP 04", title: "Both get rewarded", text: "Both builders earn Ore." },
] as const;

const REWARDS = [
  { term: "Builder who equips", text: "50 Ore, once per tool." },
  { term: "Maker of the tool", text: "10 Ore for each verified user, capped at 500 Ore per tool per season." },
] as const;

export function Toolbelt() {
  return (
    <>
      <div className="pit">
        <b>
          −150 M
        </b>
        <span>
          Toolbelt
          <br />
          Use each other&apos;s tools
        </span>
      </div>
      <div className="sect" id="toolbelt">
        <h2 className="h2">
          Toolbelt
        </h2>
        <p className="lead">
          Use other builders&apos; finished projects in your own, and both of you earn Ore.
        </p>
        <div className="row r2">
          {STEPS.map((step) => (
            <div className="card sm" key={step.label} role="group" aria-label={`${step.label} ${step.title}`}>
              <div className="ct">
                <span>
                  {step.label}
                </span>
              </div>
              <h3 className="cn">
                {step.title}
              </h3>
              <div className="m dsc">
                {step.text}
              </div>
            </div>
          ))}
        </div>
        <dl className="facts">
          {REWARDS.map((row) => (
            <div key={row.term}>
              <dt>{row.term}</dt>
              <dd>{row.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
