"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { uid } from "../../../lib/preview-store";
import { EmptyState, Field, PageHeader, Panel, PreviewNote, Status, Tag } from "../../ui/ui";
import "./build.css";
import { previewNow } from "./clock";
import { checkJournalDue } from "./engine";
import { JournalForm, type JournalDraft } from "./journal-form";
import { CadencePanel, CadenceTable } from "./journal-cadence";
import { ConfirmButton, Loading, download, fmtDateTime, useLiveMessage } from "./parts";
import { useJournals, useProjects, useSettleShips } from "./store";
import { entryToPlainText, slugify, toParagraphs } from "./logic/validate";
import type { JournalEntry } from "./logic/types";

type Visibility = "all" | "public" | "private";

export function JournalsPage() {
  useSettleShips();
  const [projects, , projectsHydrated] = useProjects();
  const [entries, setEntries, hydrated] = useJournals();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [formMode, setFormMode] = useState<{ editing: JournalEntry | null; projectId: string } | null>(null);
  const [message, say] = useLiveMessage();

  const header = (
    <>
      <PageHeader
        eyebrow="Build"
        title="Journals"
        lead="Write the journal entries that go with your build time. Each project needs one at least every eight hours of development."
      />
      <PreviewNote>
        Entries are saved only in this browser. Tracker hours and the clock are simulated with the preview controls, and nothing is sent to LOADOUT.
      </PreviewNote>
    </>
  );

  const allTags = useMemo(() => [...new Set(entries.flatMap((e) => e.tags))].sort(), [entries]);

  if (!hydrated || !projectsHydrated) {
    return (
      <>
        {header}
        <Loading />
      </>
    );
  }

  if (projects.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="Create a project first"
          action={
            <Link href="/projects" className="btn">
              Go to Projects
            </Link>
          }
        >
          Journal entries belong to a project, so there is nothing to write about yet.
        </EmptyState>
      </>
    );
  }

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "Deleted project";
  const entriesFor = (id: string) => entries.filter((e) => e.projectId === id);
  const selected = projectFilter === "all" ? null : (projects.find((p) => p.id === projectFilter) ?? null);

  const q = query.trim().toLowerCase();
  const visible = entries
    .filter((e) => (selected ? e.projectId === selected.id : true))
    .filter((e) => (tagFilter === "all" ? true : e.tags.includes(tagFilter)))
    .filter((e) => (visibility === "all" ? true : visibility === "public" ? e.isPublic : !e.isPublic))
    .filter((e) => (q ? `${e.title} ${e.body} ${e.tags.join(" ")}`.toLowerCase().includes(q) : true))
    .sort((a, b) => b.at - a.at);

  function openForm(editing: JournalEntry | null, projectId?: string) {
    const fallback = projects.find((p) => p.id === (projectId ?? (selected ? selected.id : ""))) ?? projects[0];
    setFormMode({ editing, projectId: editing?.projectId ?? fallback.id });
  }

  function save(draft: JournalDraft) {
    if (formMode?.editing) {
      const id = formMode.editing.id;
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...draft, editedAt: previewNow() } : e)));
      say(`Entry "${draft.title}" saved.`);
    } else {
      setEntries((prev) => [...prev, { id: uid("journal"), ...draft, at: previewNow() }]);
      say(`Entry "${draft.title}" saved. Your 24-hour payout gate counts from now.`);
    }
    checkJournalDue(draft.projectId);
    setFormMode(null);
  }

  function remove(entry: JournalEntry) {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    say(`Entry "${entry.title}" deleted.`);
  }

  return (
    <>
      {header}
      <div className="pg-stack">
        <Panel title="Choose a project">
          <div className="toolbar">
            <Field label="Project">
              <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                <option value="all">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            {!selected ? (
              <button type="button" className="btn" onClick={() => openForm(null)}>
                Write an entry
              </button>
            ) : null}
          </div>
        </Panel>

        {selected ? (
          <CadencePanel project={selected} entries={entriesFor(selected.id)} onWrite={() => openForm(null, selected.id)} />
        ) : (
          <CadenceTable projects={projects} entriesFor={entriesFor} onPick={setProjectFilter} />
        )}

        {formMode ? (
          <Panel title={formMode.editing ? "Edit entry" : "New entry"}>
            <JournalForm
              key={`${formMode.editing?.id ?? "new"}-${formMode.projectId}`}
              projects={projects}
              entries={entries}
              editing={formMode.editing}
              defaultProjectId={formMode.projectId}
              onSave={save}
              onCancel={() => setFormMode(null)}
            />
          </Panel>
        ) : null}

        <Panel title="Journal feed">
          <div className="toolbar" role="search">
            <Field label="Search entries">
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, text or tag" autoComplete="off" />
            </Field>
            <Field label="Tag">
              <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                <option value="all">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Visibility">
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
                <option value="all">Public and private</option>
                <option value="public">Public only</option>
                <option value="private">Private only</option>
              </select>
            </Field>
          </div>
          <Status message={message} />
          <p className="bd-sub" aria-live="polite">
            Showing {visible.length} of {entries.length} {entries.length === 1 ? "entry" : "entries"}.
          </p>
          {entries.length === 0 ? (
            <EmptyState
              title="No entries yet"
              action={
                <button type="button" className="btn" onClick={() => openForm(null)}>
                  Write your first entry
                </button>
              }
            >
              An entry says what your tracked hours produced, specifically enough that another builder could verify it.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState title="No entries match">Try a different search, or clear the tag and visibility filters.</EmptyState>
          ) : (
            <ul className="bd-feed">
              {visible.map((entry) => (
                <li key={entry.id}>
                  <article className="bd-entry" aria-labelledby={`${entry.id}-t`}>
                    <h3 id={`${entry.id}-t`}>{entry.title}</h3>
                    <div className="bd-meta">
                      <Tag>{projectName(entry.projectId)}</Tag>
                      <Tag tone={entry.isPublic ? "ok" : "warn"}>{entry.isPublic ? "Public" : "Private"}</Tag>
                      {entry.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                    <p className="bd-sub">
                      {fmtDateTime(entry.at)}. {entry.hours} h covered.{entry.editedAt ? ` Edited ${fmtDateTime(entry.editedAt)}.` : ""}
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
                    <div className="bd-actions">
                      <button type="button" className="btn btn-sm btn-quiet" onClick={() => openForm(entry)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-quiet"
                        onClick={() => {
                          setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, isPublic: !e.isPublic } : e)));
                          say(`"${entry.title}" is now ${entry.isPublic ? "private" : "public"}.`);
                        }}
                      >
                        {entry.isPublic ? "Make private" : "Make public"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-quiet"
                        onClick={() => {
                          download(`${slugify(projectName(entry.projectId))}-${slugify(entry.title)}.txt`, entryToPlainText(entry, projectName(entry.projectId)));
                          say(`Exported "${entry.title}" as a text file.`);
                        }}
                      >
                        Export as text
                      </button>
                      <ConfirmButton label="Delete" question={`Delete "${entry.title}"?`} onConfirm={() => remove(entry)} />
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
