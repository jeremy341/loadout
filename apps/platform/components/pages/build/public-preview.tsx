"use client";

import { Panel, Tag } from "../../ui/ui";
import { fmtDateTime } from "./parts";
import { isPublicUrl, licenseLabel, publicProjectFields, toParagraphs, bomLineTotal, bomTotals } from "./logic/validate";
import type { JournalEntry, Project } from "./logic/types";

/** What another builder sees on this project's public page: public fields only, and never Lapse. */
export function PublicPreview({ project, entries }: { project: Project; entries: JournalEntry[] }) {
  const fields = publicProjectFields(project);
  const publicEntries = entries.filter((entry) => entry.isPublic).sort((a, b) => b.at - a.at);
  const hiddenCount = entries.length - publicEntries.length;
  const hardware = project.track === "Hardware";
  const totals = bomTotals(fields.bom);

  return (
    <div className="pg-stack">
      <p className="bd-sticky-note" role="note">
        This is a preview of the public page, drawn from the same saved data. {project.visibility === "private" ? "The project is set to private, so other builders cannot see it at all." : "It is public, so other builders can see everything below."}
      </p>

      <Panel as="article" title={fields.name}>
        <div className="pg-stack">
          <div className="bd-meta">
            <Tag>{fields.track}</Tag>
            <Tag>{hardware ? "Hardware" : "Software"}</Tag>
            {fields.researchMode ? <Tag>Research Mode</Tag> : null}
            <Tag tone={project.visibility === "public" ? "ok" : "warn"}>{project.visibility === "public" ? "Public" : "Private"}</Tag>
          </div>
          <p className="bd-wrap">{fields.summary}</p>
          {fields.capability ? (
            <div>
              <h3>Capability</h3>
              <p className="bd-wrap">{fields.capability}</p>
            </div>
          ) : null}
          <dl className="bd-kv">
            <div>
              <dt>Licence</dt>
              <dd>{fields.license ? licenseLabel(fields.license) : "Not set"}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>
                {isPublicUrl(fields.repoUrl) ? (
                  <a href={fields.repoUrl} target="_blank" rel="noopener noreferrer">
                    Open the repository<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  "No public link yet"
                )}
              </dd>
            </div>
            <div>
              <dt>Team</dt>
              <dd>{fields.collaborators || "Just you"}</dd>
            </div>
          </dl>
        </div>
      </Panel>

      {fields.versions.length > 0 ? (
        <Panel title="Versions">
          <ul className="row-list">
            {[...fields.versions]
              .sort((a, b) => b.at - a.at)
              .map((version) => (
                <li key={version.id} className="row-item">
                  <div>
                    <strong>{version.label}</strong> <span className="bd-sub">{fmtDateTime(version.at)}</span>
                    {version.notes ? <p className="bd-wrap">{version.notes}</p> : null}
                  </div>
                </li>
              ))}
          </ul>
        </Panel>
      ) : null}

      {hardware ? (
        <Panel title="Bill of materials">
          {fields.bom.length === 0 ? (
            <p className="mut">No parts listed yet.</p>
          ) : (
            <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
              <table className="tbl">
                <caption className="sr-only">Bill of materials</caption>
                <thead>
                  <tr>
                    <th scope="col">Part</th>
                    <th scope="col" className="num">Qty</th>
                    <th scope="col" className="num">Unit cost</th>
                    <th scope="col">Source</th>
                    <th scope="col" className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.bom.map((row) => (
                    <tr key={row.id}>
                      <td className="bd-wrap">{row.part}</td>
                      <td className="num">{row.qty}</td>
                      <td className="num">{row.unitCost.toFixed(2)}</td>
                      <td className="bd-wrap">{row.link}</td>
                      <td className="num">{bomLineTotal(row).toFixed(2)}</td>
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
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      <Panel title="Journal">
        {publicEntries.length === 0 ? (
          <p className="mut">No public journal entries yet.</p>
        ) : (
          <ul className="bd-feed">
            {publicEntries.map((entry) => (
              <li key={entry.id} className="bd-entry">
                <h3>{entry.title}</h3>
                <p className="bd-sub">
                  {fmtDateTime(entry.at)}, {entry.hours} h covered
                </p>
                <div className="bd-prose">
                  {toParagraphs(entry.body).map((lines, i) => (
                    <p key={i}>
                      {lines.map((line, j) => (
                        <span key={j}>
                          {j > 0 ? <br /> : null}
                          {line}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {hiddenCount > 0 ? <p className="bd-sub">{hiddenCount} private {hiddenCount === 1 ? "entry is" : "entries are"} not shown.</p> : null}
      </Panel>

      <Panel title="Never shown on the public page">
        <ul className="bd-reasons">
          {hardware ? <li>Lapse recordings. Only reviewers can see them.</li> : null}
          <li>Private journal entries.</li>
          <li>Peer review scores, written reasons and reviewer identities.</li>
          <li>Tracker details and hours allocation.</li>
        </ul>
      </Panel>
    </div>
  );
}
