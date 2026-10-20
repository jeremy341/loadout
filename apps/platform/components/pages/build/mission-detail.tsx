"use client";

import { useState } from "react";
import { Field, Meter, Panel, Status, Tag } from "../../ui/ui";
import { ALL_MISSION_DEFS } from "./content";
import { moveMission, startMission, updateMissionDraft } from "./engine";
import { fmtDateTime, useLiveMessage } from "./parts";
import { isEditable, lockInfo, stepProgress, submissionBlockers, toggleStep, type MissionDef, type MissionProgress, type MissionStatus } from "./logic/missions";
import { isPublicUrl } from "./logic/validate";
import type { Tone } from "./labels";

export type ViewStatus = "locked" | "not_started" | MissionStatus;

export const STATUS_LABEL: Record<ViewStatus, string> = {
  locked: "Locked",
  not_started: "Not started",
  draft: "In progress",
  submitted: "Submitted",
  in_review: "In review",
  approved: "Approved",
  needs_changes: "Needs changes",
};

export function statusTone(status: ViewStatus): Tone {
  switch (status) {
    case "approved":
      return "ok";
    case "needs_changes":
      return "warn";
    case "locked":
      return "plain";
    case "not_started":
      return "plain";
    default:
      return "accent";
  }
}

export function viewStatus(def: MissionDef, progress: MissionProgress | undefined, approvedIds: readonly string[]): ViewStatus {
  if (progress) return progress.status;
  return lockInfo(def, approvedIds).locked ? "locked" : "not_started";
}

export function rewardText(def: MissionDef): { tag: string; text: string } {
  return def.rewardSource === "draft"
    ? { tag: "Draft preview reward", text: `${def.rewardOre} Ore, not final. The plans do not set mission rewards yet.` }
    : { tag: "Example reward", text: `${def.rewardOre} Ore, an example value from Plan 02. It is not final.` };
}

const PIPELINE: { id: MissionStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "in_review", label: "In review" },
  { id: "approved", label: "Approved" },
];

export function MissionDetail({ def, progress, approvedIds, onBack, onOpen }: { def: MissionDef; progress: MissionProgress | undefined; approvedIds: string[]; onBack: () => void; onOpen: (id: string) => void }) {
  const [message, say] = useLiveMessage();
  const [attempted, setAttempted] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const lock = lockInfo(def, approvedIds);
  const status = viewStatus(def, progress, approvedIds);
  const editable = progress ? isEditable(progress.status) : false;
  const steps = stepProgress(def, progress?.checkedStepIds ?? []);
  const reward = rewardText(def);
  const blockers = progress ? submissionBlockers(def, progress, isPublicUrl) : [];
  const title = (id: string) => ALL_MISSION_DEFS.find((d) => d.id === id)?.title ?? id;
  const word = def.kind === "quest" ? "quest" : "mission";

  function start() {
    const error = startMission(def);
    say(error ?? `Started. Tick each step as you finish it.`);
  }

  function submit() {
    setAttempted(true);
    if (blockers.length > 0) {
      say(`Cannot submit yet: ${blockers.length} thing${blockers.length === 1 ? "" : "s"} to fix.`);
      return;
    }
    const error = moveMission(def, "submit");
    say(error ?? `Submitted. A reviewer will look at it.`);
  }

  function step(action: Parameters<typeof moveMission>[1], success: string, note = "") {
    const error = moveMission(def, action, note);
    say(error ?? success);
  }

  const pipelineIndex = progress ? PIPELINE.findIndex((p) => p.id === (progress.status === "needs_changes" ? "in_review" : progress.status)) : -1;

  return (
    <div className="pg-stack">
      <div>
        <button type="button" className="btn btn-quiet btn-sm bd-back" onClick={onBack}>
          Back to the board
        </button>
        <div className="pn-head">
          <h2 className="bd-wrap">{def.title}</h2>
          <Tag tone={statusTone(status)}>{STATUS_LABEL[status]}</Tag>
        </div>
        <div className="bd-meta">
          <Tag>{def.kind === "quest" ? "Seasonal quest" : "Mission"}</Tag>
          <Tag>{def.difficulty}</Tag>
          <Tag>{def.track === "Any" ? "Any track" : def.track}</Tag>
          {def.hardware ? <Tag>Hardware</Tag> : null}
          <span className="bd-sub">About {def.minutes} min</span>
        </div>
      </div>

      <Panel title={`About this ${word}`}>
        <div className="pg-stack">
          <p className="bd-wrap">{def.summary}</p>
          <p>
            <Tag tone="warn">{reward.tag}</Tag> <span className="bd-sub">{reward.text}</span>
          </p>
          {def.prerequisites.length > 0 ? (
            <div>
              <h3>Prerequisites</h3>
              <ul className="row-list">
                {def.prerequisites.map((id) => {
                  const ok = approvedIds.includes(id);
                  return (
                    <li key={id} className="row-item">
                      <span>
                        <Tag tone={ok ? "ok" : "warn"}>{ok ? "Approved" : "Not approved"}</Tag> {title(id)}
                      </span>
                      <button type="button" className="btn btn-sm btn-quiet" onClick={() => onOpen(id)} aria-label={`Open ${title(id)}`}>
                        Open
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {lock.locked ? (
            <p className="bd-sticky-note" role="note">
              <strong>Locked.</strong> Get {lock.missing.map(title).join(" and ")} approved first. Approval needs a reviewer, so in the preview use that {word}&apos;s Preview tools.
            </p>
          ) : null}
        </div>
      </Panel>

      {!progress ? (
        <Panel title="Steps">
          <div className="pg-stack">
            <ol className="bd-rule-list">
              {def.steps.map((s) => (
                <li key={s.id}>
                  <strong>{s.title}.</strong> {s.detail}
                </li>
              ))}
            </ol>
            <div className="bd-actions">
              <button type="button" className="btn" disabled={lock.locked} aria-disabled={lock.locked} onClick={start}>
                Start this {word}
              </button>
              {lock.locked ? <span className="bd-sub">Locked until the prerequisites are approved.</span> : null}
            </div>
          </div>
        </Panel>
      ) : (
        <>
          <Panel title="Steps">
            <div className="pg-stack">
              <div>
                <Meter value={steps.done} max={steps.total} label={`${steps.done} of ${steps.total} steps done`} />
                <p aria-live="polite">
                  {steps.done} of {steps.total} steps done.
                </p>
              </div>
              <ul className="bd-mission-steps" aria-label="Steps">
                {def.steps.map((s) => {
                  const checked = progress.checkedStepIds.includes(s.id);
                  return (
                    <li key={s.id}>
                      <div className="check">
                        <input
                          id={`${def.id}-${s.id}`}
                          type="checkbox"
                          checked={checked}
                          disabled={!editable}
                          onChange={() => updateMissionDraft(def.id, { checkedStepIds: toggleStep(progress.checkedStepIds, s.id) })}
                        />
                        <label htmlFor={`${def.id}-${s.id}`} data-disabled={!editable}>
                          <strong>{s.title}</strong>
                          <span className="bd-sub">{s.detail}</span>
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Panel>

          <Panel title="Submission" actions={<Tag tone={statusTone(status)}>{STATUS_LABEL[status]}</Tag>}>
            <div className="pg-stack">
              <ol className="bd-pipe" aria-label="Submission progress">
                {PIPELINE.map((p, i) => (
                  <li key={p.id} aria-current={i === pipelineIndex && progress.status !== "approved" ? "step" : undefined} data-done={i < pipelineIndex || progress.status === "approved"}>
                    {p.label}
                  </li>
                ))}
                {progress.status === "needs_changes" ? <li aria-current="step">Needs changes</li> : null}
              </ol>
              <p className="bd-sub">What the reviewer looks for: {def.submissionGuide}</p>
              {progress.status === "needs_changes" && progress.reviewNote ? (
                <p className="bd-sticky-note" role="note">
                  <strong>Reviewer note.</strong> {progress.reviewNote}
                </p>
              ) : null}

              {editable ? (
                <form
                  className="pg-stack"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                  }}
                >
                  <Field label="What you did" hint={`${progress.text.length} of 2000 characters.`}>
                    <textarea rows={5} maxLength={2100} value={progress.text} onChange={(e) => updateMissionDraft(def.id, { text: e.target.value })} />
                  </Field>
                  <Field label={def.needsUrl ? "Link to your work" : "Link to your work (optional)"} hint="A public http or https address.">
                    <input type="url" inputMode="url" value={progress.url} onChange={(e) => updateMissionDraft(def.id, { url: e.target.value })} placeholder="https://" autoComplete="off" />
                  </Field>
                  {attempted && blockers.length > 0 ? (
                    <ul className="bd-reasons" role="alert">
                      {blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="bd-actions">
                    <button type="submit" className="btn">
                      {progress.status === "needs_changes" ? "Resubmit for review" : "Submit for review"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="pg-stack">
                  <p className="bd-quote bd-wrap">{progress.text}</p>
                  {progress.url ? (
                    <p className="bd-wrap">
                      <a href={progress.url} target="_blank" rel="noopener noreferrer">
                        {progress.url}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </p>
                  ) : null}
                  {progress.submittedAt ? <p className="bd-sub">Submitted {fmtDateTime(progress.submittedAt)}.</p> : null}
                </div>
              )}
              {progress.status === "approved" ? <p>Approved. {reward.tag}: {def.rewardOre} Ore was added to your Ore ledger once.</p> : null}
              <Status message={message} />
            </div>
          </Panel>

          {progress.status === "submitted" || progress.status === "in_review" ? (
            <details className="bd-tools">
              <summary>Preview tools: simulate the reviewer</summary>
              <div className="bd-tools-body">
                <p className="mut">A reviewer would do this. In the preview you stand in for them, and only this browser changes.</p>
                {progress.status === "submitted" ? (
                  <div className="bd-actions">
                    <button type="button" className="btn btn-sm" onClick={() => step("pickup", "A reviewer picked it up.")}>
                      Reviewer picks it up
                    </button>
                  </div>
                ) : (
                  <div className="pg-stack">
                    <Field label="Note if changes are needed">
                      <input value={changeNote} maxLength={200} onChange={(e) => setChangeNote(e.target.value)} autoComplete="off" />
                    </Field>
                    <div className="bd-actions">
                      <button type="button" className="btn btn-sm" onClick={() => step("approve", "Approved. The draft preview reward was added once.")}>
                        Approve
                      </button>
                      <button type="button" className="btn btn-sm btn-quiet" onClick={() => step("requestChanges", "The reviewer asked for changes.", changeNote || "Please add more detail about what you did and what a reader can verify.")}>
                        Ask for changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </details>
          ) : null}
        </>
      )}
      {!progress ? <Status message={message} /> : null}
    </div>
  );
}
