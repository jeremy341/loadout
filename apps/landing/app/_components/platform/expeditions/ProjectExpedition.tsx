"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useState } from "react";
import type { FormState } from "@/lib/platform/actions";
import { equipExpedition, loadExpeditionPanel, unequipExpedition, type ExpeditionPanel, type PanelOption } from "@/lib/platform/expedition-actions";
import "../expeditions.css";
import { StepMeter } from "./StepMeter";

const idle: FormState = { status: "idle" };

function OptionRow({ projectId, option, onDone }: Readonly<{ projectId: string; option: PanelOption; onDone: () => void }>) {
  const [state, action, pending] = useActionState(equipExpedition, idle);
  useEffect(() => {
    if (state.status === "saved") onDone();
    // onDone is read once, when the action finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <li className="ex-opt" data-off={option.ok ? undefined : "true"}>
      <div className="ex-opt-main">
        <Link href={`/dashboard/shop/expeditions/${option.id}`} className="ex-opt-name">{option.name}</Link>
        <p className="ex-opt-line">{option.ok ? option.summary : option.reason}</p>
        <p className="ex-opt-facts">{option.steps} steps, {option.hours} approved H</p>
        {state.status === "error" ? <p className="pf-error" role="alert">{state.message}</p> : null}
      </div>
      <form action={action}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="expeditionId" value={option.id} />
        <button type="submit" className="pf-btn" disabled={!option.ok || pending} aria-label={`Equip ${option.name}`}>
          {pending ? "Equipping" : "Equip"}
        </button>
      </form>
    </li>
  );
}

function Remove({ projectId, expeditionId, name, onDone }: Readonly<{ projectId: string; expeditionId: string; name: string; onDone: () => void }>) {
  const [state, action, pending] = useActionState(unequipExpedition, idle);
  useEffect(() => {
    if (state.status === "saved") onDone();
    // onDone is read once, when the action finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="expeditionId" value={expeditionId} />
      <button type="submit" className="pf-btn" disabled={pending} aria-label={`Take ${name} off this project`}>
        {pending ? "Removing" : "Take off"}
      </button>
      {state.status === "error" ? <p className="pf-error" role="alert">{state.message}</p> : null}
    </form>
  );
}

// "Expedition" on the project's Toolbelt tab: the expedition equipped on this project with its steps, or the expeditions in
// the project's track that could be equipped. The state comes from a server action, so the project page itself is unchanged.
export function ProjectExpedition({ projectId }: Readonly<{ projectId: string }>) {
  const [panel, setPanel] = useState<ExpeditionPanel | undefined>(undefined);
  const load = useCallback(() => {
    void loadExpeditionPanel(projectId).then(setPanel);
  }, [projectId]);
  useEffect(() => {
    load();
  }, [load]);

  const current = panel?.current[0];
  return (
    <section className="pf-box ex-project" aria-labelledby="project-expedition-heading" id="expedition">
      <div className="pf-box-head">
        <h2 id="project-expedition-heading">Expedition</h2>
        <span className="pf-hint">{current ? "1 of 1 equipped" : "0 of 1 equipped"}</span>
      </div>
      {panel === undefined ? (
        <p className="pf-hint" role="status">Loading expeditions.</p>
      ) : panel === null ? (
        <p className="pf-hint">This project was not found.</p>
      ) : (
        <>
          {current ? (
            <div className="ex-opt">
              <div className="ex-opt-main">
                <Link href={`/dashboard/shop/expeditions/${current.expeditionId}`} className="ex-opt-name">{current.name}</Link>
                <div className="ex-progress">
                  <StepMeter done={current.stepsDone} total={current.steps} />
                  <span className="ex-progress-text">{current.stepsDone} of {current.steps} steps</span>
                </div>
                <p className="ex-opt-facts">{current.hours} of {current.needed} approved H counted{current.finished ? ". Finished" : ""}</p>
              </div>
              {current.finished ? <p className="ex-opt-facts">Stays on the project</p> : <Remove projectId={projectId} expeditionId={current.expeditionId} name={current.name} onDone={load} />}
            </div>
          ) : null}
          {current && !current.finished ? (
            <p className="pf-hint">A project carries one expedition at a time. Take this one off to equip another.</p>
          ) : panel.track === null ? (
            <p className="pf-hint">Pick a track for this project to see the expeditions it can take.</p>
          ) : panel.options.length === 0 ? (
            <p className="pf-hint">There are no {panel.track} expeditions.</p>
          ) : (
            <>
              <p className="pf-hint">{panel.track} expeditions. Approved hours on this project count toward the steps.</p>
              <ul className="ex-opts" aria-label={`${panel.track} expeditions`}>
                {panel.options.map((option) => (
                  <OptionRow key={option.id} projectId={projectId} option={option} onDone={load} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
