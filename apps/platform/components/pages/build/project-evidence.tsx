"use client";

import { Field, Meter, Panel, Status, Tag } from "../../ui/ui";
import { checkJournalDue } from "./engine";
import { NumberField, fmtHours, useLiveMessage } from "./parts";
import { bomLineTotal, bomRowErrors, bomTotals } from "./logic/validate";
import { roundHours } from "./logic/cadence";
import type { BomRow, Project } from "./logic/types";
import { uid } from "../../../lib/preview-store";

/** The Evidence tab: the simulated tracker, hours allocation and (for Hardware) the bill of materials. */
export function ProjectEvidence({ project, onChange }: { project: Project; onChange: (patch: Partial<Project>) => void }) {
  const [message, say] = useLiveMessage();
  const hardware = project.track === "Hardware";
  const tracker = hardware ? "Lapse" : "Hackatime";
  const unallocated = roundHours(Math.max(0, project.trackerHours - project.allocatedHours));

  function toggleTracker() {
    const next = !project.trackerConnected;
    onChange({ trackerConnected: next });
    say(next ? `${tracker} connected (preview).` : `${tracker} disconnected. Hours stop counting until you reconnect.`);
  }

  function setTrackerHours(hours: number) {
    const trackerHours = roundHours(hours);
    onChange({ trackerHours, allocatedHours: Math.min(project.allocatedHours, trackerHours) });
    say(`Tracker now reports ${fmtHours(trackerHours)}.`);
    checkJournalDue(project.id);
  }

  function setAllocated(hours: number) {
    const allocatedHours = roundHours(Math.min(hours, project.trackerHours));
    onChange({ allocatedHours });
    say(`${fmtHours(allocatedHours)} allocated to this project.`);
    checkJournalDue(project.id);
  }

  return (
    <div className="pg-stack">
      <Panel title={`${tracker} tracking`} actions={<Tag tone={project.trackerConnected ? "ok" : "warn"}>{project.trackerConnected ? "Connected (preview)" : "Not connected"}</Tag>}>
        <div className="pg-stack">
          <p className="mut">
            {hardware ? "Hardware projects need Lapse. " : "Software projects need Hackatime. "}
            This is a <strong>simulated</strong> connection for the preview. It does not talk to {tracker}; the hours below are numbers you type in.
          </p>
          {hardware ? <p className="bd-sticky-note">Lapse recordings are visible to reviewers only. They are never shown on the public project page.</p> : null}
          <div className="bd-actions">
            <button type="button" className="btn btn-sm" onClick={toggleTracker}>
              {project.trackerConnected ? `Disconnect ${tracker}` : `Connect ${tracker} (preview)`}
            </button>
          </div>

          {project.trackerConnected ? (
            <>
              <div className="form-grid">
                <Field label="Hours the tracker reports (preview input)" hint="Stands in for the hours your tracker would report for the linked project.">
                  <NumberField value={project.trackerHours} min={0} max={2000} step={0.5} onCommit={setTrackerHours} />
                </Field>
                <Field label="Hours allocated to this project" hint={`At most the hours the tracker reports. ${fmtHours(unallocated)} not allocated.`}>
                  <NumberField value={project.allocatedHours} min={0} max={project.trackerHours} step={0.5} onCommit={setAllocated} />
                </Field>
              </div>
              <div>
                <p className="bd-sub">Allocated of reported hours</p>
                <Meter value={project.allocatedHours} max={Math.max(project.trackerHours, 0.01)} label={`${fmtHours(project.allocatedHours)} allocated of ${fmtHours(project.trackerHours)} reported`} />
                <p className="bd-sub">
                  {fmtHours(project.allocatedHours)} of {fmtHours(project.trackerHours)}. Only allocated hours count toward journals and ships. Time before LOADOUT started and time spent only reading do not count.
                </p>
              </div>
            </>
          ) : (
            <p className="mut">Connect {tracker} to report and allocate hours. A ship needs a linked tracker and more than 0 allocated hours.</p>
          )}
        </div>
      </Panel>

      {hardware ? <BomEditor project={project} onChange={onChange} say={say} /> : (
        <Panel title="Bill of materials">
          <p className="mut">Not needed for a software project. Hardware ships require a bill of materials with quantities and sources.</p>
        </Panel>
      )}
      <Status message={message} />
    </div>
  );
}

function BomEditor({ project, onChange, say }: { project: Project; onChange: (patch: Partial<Project>) => void; say: (m: string) => void }) {
  const rows = project.bom;
  const totals = bomTotals(rows);
  const problems = rows.map((row, index) => ({ index, row, errors: bomRowErrors(row) })).filter((p) => p.errors.length > 0);

  function update(id: string, patch: Partial<BomRow>) {
    onChange({ bom: rows.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  }

  function add() {
    onChange({ bom: [...rows, { id: uid("bom"), part: "", qty: 1, unitCost: 0, link: "" }] });
    say(`Row ${rows.length + 1} added.`);
  }

  function remove(id: string, index: number) {
    onChange({ bom: rows.filter((row) => row.id !== id) });
    say(`Row ${index + 1} removed.`);
  }

  return (
    <Panel title="Bill of materials" actions={<Tag tone={problems.length === 0 && rows.length > 0 ? "ok" : "warn"}>{rows.length === 0 ? "Empty" : problems.length === 0 ? "Complete" : `${problems.length} to fix`}</Tag>}>
      <div className="pg-stack">
        <p className="mut">Hardware ships need a bill of materials with quantities and sources. Use one currency for every cost. The list is shown on the public page.</p>
        {rows.length === 0 ? (
          <p className="bd-sub">No parts yet.</p>
        ) : (
          <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="tbl">
              <caption className="sr-only">Bill of materials, one row per part</caption>
              <thead>
                <tr>
                  <th scope="col">Part</th>
                  <th scope="col" className="num">Qty</th>
                  <th scope="col" className="num">Unit cost</th>
                  <th scope="col">Source or link</th>
                  <th scope="col" className="num">Line total</th>
                  <th scope="col">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="bd-tbl-input">
                      <input aria-label={`Part name, row ${index + 1}`} value={row.part} maxLength={120} onChange={(e) => update(row.id, { part: e.target.value })} autoComplete="off" />
                    </td>
                    <td className="num bd-num-cell">
                      <NumberField label={`Quantity, row ${index + 1}`} value={row.qty} min={1} step={1} max={100000} onCommit={(v) => update(row.id, { qty: Math.round(v) })} />
                    </td>
                    <td className="num bd-num-cell">
                      <NumberField label={`Unit cost, row ${index + 1}`} value={row.unitCost} min={0} step={0.01} max={1000000} onCommit={(v) => update(row.id, { unitCost: v })} />
                    </td>
                    <td className="bd-tbl-input">
                      <input aria-label={`Source or link, row ${index + 1}`} value={row.link} maxLength={300} onChange={(e) => update(row.id, { link: e.target.value })} autoComplete="off" />
                    </td>
                    <td className="num">{bomLineTotal(row).toFixed(2)}</td>
                    <td>
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => remove(row.id, index)} aria-label={`Remove row ${index + 1}${row.part ? `, ${row.part}` : ""}`}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total</th>
                  <td className="num">{totals.quantity}</td>
                  <td />
                  <td />
                  <td className="num">{totals.total.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div className="bd-actions">
          <button type="button" className="btn btn-sm" onClick={add}>
            Add a part
          </button>
        </div>
        {problems.length > 0 ? (
          <ul className="bd-reasons" aria-label="Rows that need attention">
            {problems.map((p) => (
              <li key={p.row.id}>
                Row {p.index + 1}: {p.errors.join("; ")}.
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Panel>
  );
}
