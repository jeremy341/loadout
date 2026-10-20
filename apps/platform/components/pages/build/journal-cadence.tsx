"use client";

import Link from "next/link";
import { useState } from "react";
import { Meter, Panel, Status, Tag } from "../../ui/ui";
import { useBuildClock } from "./clock";
import { logTrackerHours } from "./engine";
import { fmtDateTime, fmtHours, useLiveMessage } from "./parts";
import { cadence, journalGate, latestEntryAt } from "./logic/cadence";
import { RULES } from "./logic/constants";
import { effectiveHours } from "./logic/ship";
import type { JournalEntry, Project } from "./logic/types";

/** The 8-hour rule for one project, the 24-hour payout gate, and the preview controls that move time. */
export function CadencePanel({ project, entries, onWrite }: { project: Project; entries: JournalEntry[]; onWrite: () => void }) {
  const clock = useBuildClock();
  const [message, say] = useLiveMessage();
  const [hoursText, setHoursText] = useState("4");
  const logged = effectiveHours(project);
  const state = cadence(logged, entries);
  const latest = latestEntryAt(entries);
  const gate = journalGate(latest, clock.now);
  const tracker = project.track === "Hardware" ? "Lapse" : "Hackatime";

  function log(hours: number) {
    const error = logTrackerHours(project.id, hours);
    say(error ?? `Logged ${fmtHours(hours)} of preview tracker time.`);
  }

  return (
    <Panel
      title={`Cadence: ${project.name}`}
      actions={
        <>
          <Tag tone={state.due ? "bad" : "ok"}>{state.due ? "Entry due" : "On track"}</Tag>
          <button type="button" className="btn btn-sm" onClick={onWrite}>
            Write an entry
          </button>
        </>
      }
    >
      <div className="pg-stack">
        <dl className="bd-kv">
          <div>
            <dt>Hours logged</dt>
            <dd>{fmtHours(logged)}</dd>
          </div>
          <div>
            <dt>Covered by entries</dt>
            <dd>{fmtHours(Math.round((logged - state.uncovered) * 100) / 100)}</dd>
          </div>
          <div>
            <dt>Not covered yet</dt>
            <dd>{fmtHours(state.uncovered)}</dd>
          </div>
        </dl>

        <div>
          <p className="bd-sub">The {RULES.journalEveryHours}-hour rule: one entry for every {RULES.journalEveryHours} hours of development.</p>
          <Meter value={state.uncovered} max={RULES.journalEveryHours} label={`${fmtHours(state.uncovered)} of ${RULES.journalEveryHours} hours before the next entry is due`} />
          <p aria-live="polite">
            {state.due
              ? `${fmtHours(state.uncovered)} are not covered. Write an entry now.`
              : logged === 0
                ? project.trackerConnected
                  ? "No hours logged yet."
                  : `Connect ${tracker} on the project's Evidence tab to log hours.`
                : `${fmtHours(state.hoursUntilDue)} of work left before the next entry is due.`}
          </p>
        </div>

        <div>
          <p className="bd-sub">24-hour payout gate</p>
          <p>
            {!clock.ready
              ? "..."
              : !gate.hasEntry
                ? "No entry yet. A ship's award cannot lock until 24 hours after your latest entry, so this project needs one."
                : gate.met
                  ? `Your latest entry (${fmtDateTime(latest as number)}) is ${gate.hoursSince} h old. The 24-hour gate is met.`
                  : `Your latest entry (${fmtDateTime(latest as number)}) is ${gate.hoursSince} h old. ${gate.hoursLeft} h to go before a ship's award can lock.`}
          </p>
        </div>

        <fieldset className="bd-fieldset bd-tools" style={{ padding: 12 }}>
          <legend>Preview controls</legend>
          <p className="bd-sub" style={{ marginBottom: 10 }}>
            These stand in for real tracker time and a real clock. They change only this browser.
          </p>
          <div className="bd-actions">
            <label className="fld" style={{ maxWidth: 220 }}>
              <span className="fld-label">Preview: log tracker hours</span>
              <input type="number" inputMode="decimal" min={0.5} max={100} step={0.5} value={hoursText} onChange={(e) => setHoursText(e.target.value)} />
            </label>
            <button type="button" className="btn btn-sm" onClick={() => log(Number(hoursText))} style={{ alignSelf: "end" }}>
              Log hours
            </button>
            <button type="button" className="btn btn-sm btn-quiet" onClick={() => { clock.advance(24); say("Moved preview time forward 24 hours."); }} style={{ alignSelf: "end" }}>
              Skip 24 hours
            </button>
          </div>
          {!project.trackerConnected ? (
            <p className="bd-sub" style={{ marginTop: 8 }}>
              {tracker} is not connected. <Link href="/projects">Connect it on the project</Link> first.
            </p>
          ) : null}
        </fieldset>
        <Status message={message} />
      </div>
    </Panel>
  );
}

export function CadenceTable({ projects, entriesFor, onPick }: { projects: Project[]; entriesFor: (id: string) => JournalEntry[]; onPick: (id: string) => void }) {
  const clock = useBuildClock();
  return (
    <Panel title="Cadence across your projects">
      <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="tbl">
          <caption className="sr-only">Journal cadence for each project</caption>
          <thead>
            <tr>
              <th scope="col">Project</th>
              <th scope="col" className="num">Logged</th>
              <th scope="col" className="num">Not covered</th>
              <th scope="col">8-hour rule</th>
              <th scope="col">24-hour gate</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const entries = entriesFor(project.id);
              const logged = effectiveHours(project);
              const state = cadence(logged, entries);
              const gate = journalGate(latestEntryAt(entries), clock.now);
              return (
                <tr key={project.id}>
                  <th scope="row" className="bd-wrap">
                    <button type="button" className="link-btn" onClick={() => onPick(project.id)}>
                      {project.name}
                    </button>
                  </th>
                  <td className="num">{fmtHours(logged)}</td>
                  <td className="num">{fmtHours(state.uncovered)}</td>
                  <td>
                    <Tag tone={state.due ? "bad" : "ok"}>{state.due ? "Entry due" : "On track"}</Tag>
                  </td>
                  <td>{!clock.ready ? "..." : !gate.hasEntry ? "No entry" : gate.met ? "Met" : `${gate.hoursLeft} h to go`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
