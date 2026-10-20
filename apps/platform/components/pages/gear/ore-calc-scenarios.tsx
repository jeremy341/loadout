"use client";

import { useEffect, useRef, useState } from "react";
import { EmptyState, Field, Panel, Tag } from "../../ui/ui";
import { usePreviewState } from "../../../lib/preview-store";
import { GEAR_KEYS, NO_SCENARIOS, deleteScenarioNow, renameScenarioNow } from "./gear-store";
import { formatStamp } from "./gear-ui";
import { MAX_NAME, compareScenarios, estimateFromInputs, type CalcInputs, type Scenario } from "./logic/ore-calc";

// Saved scenarios: rename, delete (with an inline confirm), load back into the calculator, and compare any two.

export function ScenarioList({ onLoad, announce }: { onLoad: (inputs: CalcInputs, name: string) => void; announce: (message: string) => void }) {
  const [scenarios] = usePreviewState<Scenario[]>(GEAR_KEYS.scenarios, NO_SCENARIOS);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const ids = new Set(scenarios.map((s) => s.id));
  const active = compareIds.filter((id) => ids.has(id));
  const a = scenarios.find((s) => s.id === active[0]);
  const b = scenarios.find((s) => s.id === active[1]);

  function toggleCompare(id: string, checked: boolean) {
    setCompareIds((prev) => {
      const clean = prev.filter((x) => ids.has(x) && x !== id);
      return checked ? [...clean, id].slice(-2) : clean;
    });
  }

  return (
    <Panel title="Saved scenarios">
      <div id="gr-scn-top" tabIndex={-1} className="gr-stack gr-focus-target">
        {scenarios.length === 0 ? (
          <EmptyState title="No saved scenarios">Save an estimate from the Estimate tab to compare it with another one later.</EmptyState>
        ) : (
          <>
            <p className="mut">Tick two scenarios to compare them. Estimates are recalculated from the saved inputs.</p>
            <ul className="gr-stack" aria-label="Saved scenarios">
              {scenarios.map((scenario) => (
                <li key={scenario.id} className="gr-scenario">
                  <ScenarioRow
                    scenario={scenario}
                    checked={active.includes(scenario.id)}
                    compareFull={active.length >= 2 && !active.includes(scenario.id)}
                    onCompare={(checked) => toggleCompare(scenario.id, checked)}
                    onLoad={() => onLoad(scenario.inputs, scenario.name)}
                    announce={announce}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
        {a && b ? <Comparison a={a} b={b} /> : scenarios.length >= 2 ? <p className="mut">Choose two scenarios to see them side by side.</p> : null}
      </div>
    </Panel>
  );
}

function ScenarioRow({
  scenario,
  checked,
  compareFull,
  onCompare,
  onLoad,
  announce,
}: {
  scenario: Scenario;
  checked: boolean;
  compareFull: boolean;
  onCompare: (checked: boolean) => void;
  onLoad: () => void;
  announce: (message: string) => void;
}) {
  const result = estimateFromInputs(scenario.inputs);
  const [mode, setMode] = useState<"view" | "rename" | "delete">("view");
  const [name, setName] = useState(scenario.name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLParagraphElement>(null);
  const renameBtn = useRef<HTMLButtonElement>(null);
  const deleteBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mode === "rename") inputRef.current?.focus();
    if (mode === "delete") confirmRef.current?.focus();
  }, [mode]);

  function leave(to: "rename" | "delete") {
    setMode("view");
    setError(null);
    window.setTimeout(() => (to === "rename" ? renameBtn : deleteBtn).current?.focus(), 0);
  }

  function saveName() {
    const out = renameScenarioNow(scenario.id, name);
    if (!out.ok) {
      setError(out.error);
      announce(`Not renamed. ${out.error}`);
      inputRef.current?.focus();
      return;
    }
    announce(`Scenario renamed to ${out.scenario.name}.`);
    leave("rename");
  }

  return (
    <>
      <div className="gr-row-between">
        <h3>{scenario.name}</h3>
        <Tag tone="accent">{result.total.toLocaleString("en-GB")} Ore</Tag>
      </div>
      <p className="mut">
        {result.hours} hours at {result.multiplier}x
        {scenario.inputs.signal !== "none" ? `, ${scenario.inputs.signal === "great" ? "Great" : "Good"} Signal` : ""}
        {scenario.inputs.era ? ", Era bonus" : ""}. Saved {formatStamp(scenario.createdAt)}.
      </p>
      <label className="check">
        <input type="checkbox" checked={checked} disabled={compareFull} onChange={(event) => onCompare(event.target.checked)} />
        <span>
          Compare<span className="sr-only"> {scenario.name}</span>
        </span>
      </label>

      {mode === "rename" ? (
        <form
          className="gr-stack"
          onSubmit={(event) => {
            event.preventDefault();
            saveName();
          }}
        >
          <Field label="New name" error={error}>
            <input ref={inputRef} type="text" value={name} maxLength={MAX_NAME} aria-invalid={Boolean(error)} onChange={(event) => setName(event.target.value)} />
          </Field>
          <div className="gr-row">
            <button type="submit" className="btn btn-sm">
              Save name
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => leave("rename")}>
              Cancel
            </button>
          </div>
        </form>
      ) : mode === "delete" ? (
        <div className="gr-confirm" role="group" aria-labelledby={`gr-del-${scenario.id}`}>
          <p id={`gr-del-${scenario.id}`} ref={confirmRef} tabIndex={-1} className="gr-focus-target">
            <strong>Delete {scenario.name}?</strong> This cannot be undone.
          </p>
          <div className="gr-row">
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                deleteScenarioNow(scenario.id);
                announce(`Scenario ${scenario.name} deleted.`);
                window.setTimeout(() => document.getElementById("gr-scn-top")?.focus(), 0);
              }}
            >
              Yes, delete
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => leave("delete")}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div className="gr-row">
          <button type="button" className="btn btn-sm" onClick={onLoad}>
            Load<span className="sr-only"> {scenario.name}</span>
          </button>
          <button
            ref={renameBtn}
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              setName(scenario.name);
              setMode("rename");
            }}
          >
            Rename<span className="sr-only"> {scenario.name}</span>
          </button>
          <button ref={deleteBtn} type="button" className="btn btn-quiet btn-sm" onClick={() => setMode("delete")}>
            Delete<span className="sr-only"> {scenario.name}</span>
          </button>
        </div>
      )}
    </>
  );
}

function Comparison({ a, b }: { a: Scenario; b: Scenario }) {
  const comparison = compareScenarios(a, b);
  const winner = comparison.higher === "a" ? a : comparison.higher === "b" ? b : null;
  return (
    <section className="gr-stack" aria-label="Comparison">
      <h3 className="gr-h4">Comparison</h3>
      <p role="status" aria-live="polite">
        {winner ? `${winner.name} has the higher estimate.` : "Both scenarios have the same estimate."}
      </p>
      <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="tbl">
          <caption className="sr-only">
            {a.name} compared with {b.name}
          </caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col" className="num">
                {a.name}
              </th>
              <th scope="col" className="num">
                {b.name}
              </th>
              <th scope="col" className="num">
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="num">{row.a.toLocaleString("en-GB")}</td>
                <td className="num">{row.b.toLocaleString("en-GB")}</td>
                <td className="num">
                  {row.delta > 0 ? "+" : row.delta < 0 ? "−" : ""}
                  {Math.abs(row.delta).toLocaleString("en-GB")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mut">Difference is {b.name} minus {a.name}.</p>
    </section>
  );
}
