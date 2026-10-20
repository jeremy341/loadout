"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { EmptyState, Field, Panel, Status, Tag } from "../../ui/ui";
import { useBuildClock } from "./clock";
import { dispatchShip, reviewsDoneCount, submitShip } from "./engine";
import { SHIP_STATE_LABEL, shipTone } from "./labels";
import { fmtDateTime, fmtHours, useLiveMessage } from "./parts";
import { ShipTools } from "./ship-tools";
import { useJournals, useReviewsState, useShips } from "./store";
import { journalGate, latestEntryAt } from "./logic/cadence";
import { DRAFT_NOTE, RULES } from "./logic/constants";
import { countableReviews } from "./logic/scoring";
import {
  AI_USE_OPTIONS,
  flagWindowOpen,
  isActiveShip,
  pendingFlags,
  shipChecklist,
  stepperModel,
  stepperSummary,
  type StepView,
} from "./logic/ship";
import type { Project, Ship } from "./logic/types";

export function ShipStepper({ ship, latestJournalAt, now }: { ship: Ship | null; latestJournalAt: number | null; now: number }) {
  const model = stepperModel(ship, { now, latestJournalAt });
  return (
    <div className="pg-stack">
      <ol className="bd-steps" aria-label="Ship progress">
        {model.map((step) => (
          <StepItem key={step.label} step={step} />
        ))}
      </ol>
      <p className="bd-sub" aria-live="polite">
        {stepperSummary(model)}
      </p>
    </div>
  );
}

const STATUS_WORD: Record<StepView["status"], string> = { done: "Done", current: "Current", todo: "Upcoming", blocked: "Stopped" };

function StepItem({ step }: { step: StepView }) {
  return (
    <li className="bd-step" data-status={step.status} aria-current={step.status === "current" ? "step" : undefined}>
      <span className="bd-step-top">{step.label}</span>
      <span className="bd-step-state">{STATUS_WORD[step.status]}</span>
      {step.detail ? <span className="bd-step-detail">{step.detail}</span> : null}
    </li>
  );
}

/** The Ship tab: checklist and submit, or the live pipeline for the project's active ship. */
export function ShipPanel({ project }: { project: Project }) {
  const clock = useBuildClock();
  const [ships] = useShips();
  const [journals] = useJournals();
  const projectShips = ships.filter((s) => s.projectId === project.id);
  const active = projectShips.find(isActiveShip) ?? null;
  const finished = projectShips.filter((s) => !isActiveShip(s));
  const entries = journals.filter((e) => e.projectId === project.id);
  const latest = latestEntryAt(entries);

  return (
    <div className="pg-stack">
      <Panel title="Ship progress">
        {clock.ready ? <ShipStepper ship={active ?? finished[finished.length - 1] ?? null} latestJournalAt={latest} now={clock.now} /> : <p className="mut">Loading...</p>}
      </Panel>
      {active ? (
        <ActiveShip ship={active} project={project} />
      ) : (
        <SubmitShip project={project} entries={entries} priorShips={projectShips} />
      )}
      {active ? <ShipTools ship={active} /> : null}
      <ShipHistory ships={finished} />
    </div>
  );
}

function SubmitShip({ project, entries, priorShips }: { project: Project; entries: { hours: number }[]; priorShips: Ship[] }) {
  const [aiUse, setAiUse] = useState<string[]>([]);
  const [pickedVersion, setVersion] = useState("");
  // Fall back to the newest version when nothing valid is picked (for example after a version was added or deleted).
  const version = project.versions.some((v) => v.label === pickedVersion) ? pickedVersion : (project.versions[project.versions.length - 1]?.label ?? pickedVersion);
  const [changes, setChanges] = useState("");
  const [message, say] = useLiveMessage();
  const reasonsId = useId();
  const checklist = shipChecklist({ project, entries, priorShips, aiUse });
  const failing = checklist.items.filter((item) => !item.pass);

  function toggleAi(option: string, checked: boolean) {
    setAiUse((prev) => {
      if (!checked) return prev.filter((o) => o !== option);
      if (option === "No AI") return ["No AI"];
      return [...prev.filter((o) => o !== "No AI"), option];
    });
  }

  function submit() {
    if (!checklist.canSubmit) {
      say(`Cannot submit yet: ${failing.length} check${failing.length === 1 ? "" : "s"} still failing.`);
      return;
    }
    const result = submitShip({ projectId: project.id, version, changes, aiUse });
    say(result.ok ? "Ship submitted. It is now waiting for the team check." : result.errors.join(" "));
  }

  return (
    <Panel title="Ship checklist" actions={<Tag tone={checklist.canSubmit ? "ok" : "warn"}>{checklist.canSubmit ? "Ready to submit" : `${failing.length} to fix`}</Tag>}>
      <div className="pg-stack">
        <p className="mut">
          A ship is the official submission of a project version. It goes through a team fit and validity check, then {RULES.reviewsPerShip} countable peer reviews. Each check below updates as you change the project.
        </p>
        <ul className="bd-checks" aria-label="Ship checklist">
          {checklist.items.map((item) => (
            <li key={item.id} data-pass={item.pass}>
              <Tag tone={item.pass ? "ok" : "bad"}>{item.pass ? "Pass" : "Fix"}</Tag>
              <span className="bd-check-label">{item.label}</span>
              <span className="bd-check-detail">{item.detail}</span>
            </li>
          ))}
        </ul>

        <div className="form-grid">
          <Field label="Version to ship" hint={project.versions.length === 0 ? "Add a version in the Versions tab, or leave this blank to ship as Initial." : "Pick from your version history."}>
            {project.versions.length > 0 ? (
              <select value={version} onChange={(e) => setVersion(e.target.value)}>
                {project.versions.map((v) => (
                  <option key={v.id} value={v.label}>
                    {v.label}
                  </option>
                ))}
              </select>
            ) : (
              <input value={version} maxLength={24} onChange={(e) => setVersion(e.target.value)} placeholder="Initial" autoComplete="off" />
            )}
          </Field>
          <div className="wide">
            <Field label="What changed in this version (optional)">
              <textarea value={changes} rows={2} maxLength={600} onChange={(e) => setChanges(e.target.value)} />
            </Field>
          </div>
        </div>

        <fieldset className="bd-fieldset">
          <legend>How did you use AI?</legend>
          <div className="bd-ai-grid">
            {AI_USE_OPTIONS.map((option) => (
              <label key={option} className="check">
                <input type="checkbox" checked={aiUse.includes(option)} onChange={(e) => toggleAi(option, e.target.checked)} />
                {option}
              </label>
            ))}
          </div>
          <p className="bd-sub">Every ship declares its AI use. Choose No AI if you used none.</p>
        </fieldset>

        <dl className="bd-kv">
          <div>
            <dt>Hours this ship claims</dt>
            <dd>{fmtHours(checklist.newHours)}</dd>
          </div>
          <div>
            <dt>Tracker</dt>
            <dd>{project.track === "Hardware" ? "Lapse" : "Hackatime"}</dd>
          </div>
        </dl>

        <div className="pg-stack">
          <button type="button" className="btn" aria-disabled={!checklist.canSubmit} aria-describedby={checklist.canSubmit ? undefined : reasonsId} onClick={submit}>
            Submit ship
          </button>
          {!checklist.canSubmit ? (
            <div id={reasonsId}>
              <p className="bd-sub">Submit stays off until every check passes:</p>
              <ul className="bd-reasons">
                {failing.map((item) => (
                  <li key={item.id}>{item.detail}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <Status message={message} />
        </div>
      </div>
    </Panel>
  );
}

function GateRow({ name, tone, state, detail }: { name: string; tone: "ok" | "warn" | "bad" | "plain"; state: string; detail: string }) {
  return (
    <tr>
      <th scope="row">{name}</th>
      <td>
        <Tag tone={tone}>{state}</Tag>
      </td>
      <td>{detail}</td>
    </tr>
  );
}

function ActiveShip({ ship, project }: { ship: Ship; project: Project }) {
  const clock = useBuildClock();
  const [journals] = useJournals();
  const [reviews] = useReviewsState();
  const [message, say] = useLiveMessage();
  const latest = latestEntryAt(journals.filter((e) => e.projectId === ship.projectId));
  const gate = journalGate(latest, clock.now);
  const countable = countableReviews(ship.reviews).length;
  const done = reviewsDoneCount(reviews);
  const pending = pendingFlags(ship).length;
  const windowOpen = clock.ready && flagWindowOpen(ship, clock.now);
  const windowLeft = ship.snapshot ? Math.max(0, Math.round(((ship.snapshot.windowEndsAt - clock.now) / 3_600_000) * 10) / 10) : null;
  const afterTeam = ship.state === "peer_review" || ship.state === "flag_window";

  function resubmit() {
    const checklist = shipChecklist({ project, entries: journals.filter((e) => e.projectId === project.id), priorShips: [], aiUse: ship.aiUse });
    const blocked = checklist.items.filter((item) => item.id !== "hours" && !item.pass);
    if (blocked.length > 0) {
      say(`Fix this first: ${blocked.map((b) => b.detail).join(" ")}`);
      return;
    }
    const error = dispatchShip(ship.id, { type: "resubmit" });
    say(error ?? "Resubmitted. It is waiting for the team check again.");
  }

  return (
    <Panel title={`Ship ${ship.version}`} actions={<Tag tone={shipTone(ship.state)}>{SHIP_STATE_LABEL[ship.state]}</Tag>}>
      <div className="pg-stack">
        <dl className="bd-kv">
          <div>
            <dt>Submitted</dt>
            <dd>{fmtDateTime(ship.submittedAt)}</dd>
          </div>
          <div>
            <dt>Hours submitted</dt>
            <dd>{fmtHours(ship.submittedHours)}</dd>
          </div>
          <div>
            <dt>Hours approved</dt>
            <dd>{ship.approvedHours === null ? "Not yet" : fmtHours(ship.approvedHours)}</dd>
          </div>
        </dl>

        {ship.state === "changes_requested" ? (
          <div className="bd-sticky-note">
            <p>
              <strong>The team asked for changes.</strong> {ship.teamNote}
            </p>
            <div className="bd-actions" style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-sm" onClick={resubmit}>
                Resubmit ship
              </button>
            </div>
          </div>
        ) : null}

        <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="tbl">
            <caption className="sr-only">Gates this ship has to pass before it is paid</caption>
            <thead>
              <tr>
                <th scope="col">Gate</th>
                <th scope="col">Status</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              <GateRow
                name="Team fit and validity check"
                tone={afterTeam ? "ok" : ship.state === "rejected" ? "bad" : "warn"}
                state={afterTeam ? "Passed" : ship.state === "rejected" ? "Rejected" : ship.state === "changes_requested" ? "Changes requested" : "Waiting"}
                detail={afterTeam ? `${ship.approvedHours} h approved.` : ship.state === "rejected" ? "No payout for a rejected ship." : "The team checks fit, evidence and claimed hours."}
              />
              <GateRow
                name={`${RULES.reviewsPerShip} countable peer reviews`}
                tone={countable >= RULES.reviewsPerShip ? "ok" : "warn"}
                state={`${Math.min(countable, RULES.reviewsPerShip)} of ${RULES.reviewsPerShip}`}
                detail="Peers are assigned one at a time until there are enough. The team never fills missing reviews."
              />
              <GateRow
                name={`${RULES.journalAgeHours} hours since your latest journal entry`}
                tone={gate.met ? "ok" : "warn"}
                state={!clock.ready ? "..." : gate.met ? "Met" : gate.hasEntry ? `${gate.hoursLeft} h to go` : "No entry yet"}
                detail={
                  gate.hasEntry
                    ? `Latest entry ${gate.hoursSince} h ago. The award cannot lock until both this and ${RULES.reviewsPerShip} reviews are in.`
                    : "Write a journal entry for this project. The award cannot lock without one."
                }
              />
              <GateRow
                name={`${RULES.flagWindowHours}-hour flag window`}
                tone={!ship.snapshot ? "plain" : windowOpen ? "warn" : "ok"}
                state={!ship.snapshot ? "Not started" : windowOpen ? `Open, ${windowLeft} h left` : "Closed"}
                detail={ship.snapshot ? `Locked ${fmtDateTime(ship.snapshot.lockedAt)}; window ends ${fmtDateTime(ship.snapshot.windowEndsAt)}.` : "Starts when the award snapshot locks. A separate clock from the journal gate."}
              />
              <GateRow
                name="No pending flags"
                tone={pending === 0 ? "ok" : "warn"}
                state={pending === 0 ? "Clear" : `${pending} pending`}
                detail="A pending flag holds payout until a moderator decides."
              />
              <GateRow
                name={`${RULES.reviewsOwed} reviews of other ships`}
                tone={done >= RULES.reviewsOwed ? "ok" : "warn"}
                state={`${Math.min(done, RULES.reviewsOwed)} of ${RULES.reviewsOwed}`}
                detail={
                  done >= RULES.reviewsOwed ? "Your review duty is done." : `Review ${RULES.reviewsOwed - done} more on the Reviews tab. This is owed before your own payout.`
                }
              />
            </tbody>
          </table>
        </div>
        <p className="bd-sub">
          Read the scores and reasons on <Link href="/reviews">Reviews, My ship feedback</Link>.
        </p>
        <Status message={message} />
        {ship.snapshot ? (
          <p className="bd-sub">
            {DRAFT_NOTE} Locked snapshot {ship.snapshot.id}: mean of medians {ship.snapshot.overall.toFixed(2)}, percentile {ship.snapshot.overallPercentile}, multiplier {ship.snapshot.multiplier}x{ship.snapshot.great ? " (Great Signal ceiling)" : ""}.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

function ShipHistory({ ships }: { ships: Ship[] }) {
  if (ships.length === 0) return null;
  return (
    <Panel title="Earlier ships">
      <ul className="row-list">
        {ships.map((ship) => (
          <li key={ship.id} className="row-item">
            <div>
              <strong>{ship.version}</strong> <Tag tone={shipTone(ship.state)}>{SHIP_STATE_LABEL[ship.state]}</Tag>
              <p className="bd-sub">
                {fmtDateTime(ship.submittedAt)}, {fmtHours(ship.approvedHours ?? ship.submittedHours)}
                {ship.payout
                  ? `. ${ship.payout.net} Ore credited${ship.payout.penalty ? ` after a ${ship.payout.penalty} Ore deduction` : ""} (${ship.payout.gross} Ore before deduction; ${ship.snapshot?.multiplier ?? "?"}x, draft preview rule).`
                  : ship.teamNote
                    ? `. Team note: ${ship.teamNote}`
                    : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function NoShipsEmpty() {
  return <EmptyState title="No ships yet">Open a project and submit a ship from its Ship tab.</EmptyState>;
}
