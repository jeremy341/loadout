"use client";

import { useActionState, useEffect, useId, useState } from "react";
import type { FormState } from "@/lib/platform/actions";
import { equipExpedition } from "@/lib/platform/expedition-actions";
import { PfModal } from "../PfModal";
import "../expeditions.css";

const idle: FormState = { status: "idle" };

export type EquipProject = { id: string; title: string; reason: string };

function EquipForm({ expeditionId, projects, onDone, onCancel }: Readonly<{ expeditionId: string; projects: readonly EquipProject[]; onDone: () => void; onCancel: () => void }>) {
  const [state, action, pending] = useActionState(equipExpedition, idle);
  const first = projects.find((project) => !project.reason)?.id ?? "";
  const [chosen, setChosen] = useState(first);
  const errorId = useId();

  useEffect(() => {
    if (state.status === "saved") onDone();
    // onDone is read once, when the action finishes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="pf-modal-form" noValidate>
      <input type="hidden" name="expeditionId" value={expeditionId} />
      <fieldset className="ex-choose" aria-describedby={state.status === "error" ? errorId : undefined}>
        <legend className="ex-label">Your projects in this track</legend>
        {projects.map((project) => (
          <label className="ex-choice pf-pick" key={project.id} data-off={project.reason ? "true" : undefined}>
            <input type="radio" name="projectId" value={project.id} checked={chosen === project.id} disabled={Boolean(project.reason)} onChange={() => setChosen(project.id)} />
            <span className="ex-choice-title">{project.title}</span>
            {project.reason ? <span className="ex-choice-why">{project.reason}</span> : null}
          </label>
        ))}
      </fieldset>
      <div aria-live="polite">{state.status === "error" ? <p className="pf-error" id={errorId} role="alert">{state.message}</p> : null}</div>
      <div className="pf-modal-actions">
        <button type="button" className="pf-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="pf-btn pri pf-wide" disabled={pending || !chosen}>
          {pending ? "Equipping" : "Equip"}
        </button>
      </div>
    </form>
  );
}

// The one Equip button on an expedition page. It opens a plain choice of the builder's own projects in the expedition's track;
// a project that cannot take it says why and cannot be chosen.
export function EquipExpedition({ expeditionId, name, projects }: Readonly<{ expeditionId: string; name: string; projects: readonly EquipProject[] }>) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const anyOk = projects.some((project) => !project.reason);
  return (
    <div className="ex-equip">
      <button type="button" className="pf-btn pri" onClick={() => setOpen(true)} disabled={!anyOk} aria-describedby={anyOk ? undefined : "ex-equip-why"}>
        Equip on a project
      </button>
      {anyOk ? null : (
        <p className="ex-closed" id="ex-equip-why">
          {projects[0]?.reason ?? "No project can take it."}
        </p>
      )}
      <p className="pf-saved" role="status">{message}</p>
      <PfModal open={open} onClose={() => setOpen(false)} title={`Equip ${name}`} size="form">
        {open ? (
          <EquipForm
            expeditionId={expeditionId}
            projects={projects}
            onCancel={() => setOpen(false)}
            onDone={() => {
              setOpen(false);
              setMessage("Equipped. Its approved hours now count toward the steps.");
            }}
          />
        ) : null}
      </PfModal>
    </div>
  );
}
