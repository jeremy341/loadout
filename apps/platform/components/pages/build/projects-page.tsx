"use client";

import { useState } from "react";
import { uid } from "../../../lib/preview-store";
import { EmptyState, Field, PageHeader, Panel, PreviewNote, Status, Tag } from "../../ui/ui";
import "./build.css";
import { previewNow } from "./clock";
import { Loading, fmtHours, useLiveMessage } from "./parts";
import { ProjectDetail } from "./project-detail";
import { emptyDraft, ProjectForm, type ProjectDraft } from "./project-form";
import { projectStatus } from "./labels";
import { useProjects, useSettleShips, useShips } from "./store";
import { effectiveHours } from "./logic/ship";
import type { Project, TrackName } from "./logic/types";

const TRACK_FILTERS: (TrackName | "all")[] = ["all", "Tools", "Systems", "Compute", "Hardware"];
type StatusFilter = "all" | "draft" | "progress" | "paid" | "stopped";

function matchesStatus(filter: StatusFilter, label: string): boolean {
  if (filter === "all") return true;
  if (filter === "draft") return label === "Draft";
  if (filter === "paid") return label === "Paid";
  if (filter === "stopped") return label === "Rejected" || label === "Changes requested";
  return label !== "Draft" && label !== "Paid" && label !== "Rejected" && label !== "Changes requested";
}

export function ProjectsPage() {
  useSettleShips();
  const [projects, setProjects, hydrated] = useProjects();
  const [ships] = useShips();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<TrackName | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [message, say] = useLiveMessage();

  function create(draft: ProjectDraft) {
    const project: Project = {
      id: uid("project"),
      ...draft,
      createdAt: previewNow(),
      trackerConnected: false,
      trackerHours: 0,
      allocatedHours: 0,
      bom: [],
      versions: [],
    };
    setProjects((prev) => [...prev, project]);
    setCreating(false);
    setSelectedId(project.id);
    say(`Project ${project.name} created.`);
  }

  const header = (
    <>
      <PageHeader
        eyebrow="Build"
        title="Projects"
        lead="Create projects, keep versions, attach evidence and submit ships for review."
        actions={
          selectedId === null && !creating ? (
            <button type="button" className="btn" onClick={() => setCreating(true)}>
              New project
            </button>
          ) : undefined
        }
      />
      <PreviewNote>
        Your projects, evidence and ships are saved only in this browser. Trackers, the team check, peer reviewers and moderators are simulated, and the two sample projects are examples you can edit or delete. Nothing is sent to LOADOUT.
      </PreviewNote>
    </>
  );

  if (!hydrated) {
    return (
      <>
        {header}
        <Loading />
      </>
    );
  }

  if (selectedId !== null) {
    return (
      <>
        {header}
        <ProjectDetail projectId={selectedId} onBack={() => setSelectedId(null)} />
      </>
    );
  }

  const shipsByProject = (id: string) => ships.filter((s) => s.projectId === id);
  const visible = projects.filter((project) => {
    if (track !== "all" && project.track !== track) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!`${project.name} ${project.summary} ${project.collaborators}`.toLowerCase().includes(q)) return false;
    }
    return matchesStatus(statusFilter, projectStatus(shipsByProject(project.id)));
  });

  return (
    <>
      {header}
      <div className="pg-stack">
        {creating ? (
          <Panel title="New project">
            <ProjectForm initial={emptyDraft()} submitLabel="Create project" onSubmit={create} onCancel={() => setCreating(false)} />
          </Panel>
        ) : null}

        <Panel title="Your projects">
          {projects.length > 0 ? (
            <div className="toolbar" role="search">
              <Field label="Search projects">
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, summary or collaborator" autoComplete="off" />
              </Field>
              <Field label="Track">
                <select value={track} onChange={(e) => setTrack(e.target.value as TrackName | "all")}>
                  {TRACK_FILTERS.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All tracks" : t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ship status">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
                  <option value="all">Any status</option>
                  <option value="draft">Not shipped yet</option>
                  <option value="progress">In review</option>
                  <option value="paid">Paid</option>
                  <option value="stopped">Rejected or changes requested</option>
                </select>
              </Field>
            </div>
          ) : null}
          <Status message={message} />
          <p className="bd-sub" aria-live="polite">
            {projects.length === 0 ? "" : `Showing ${visible.length} of ${projects.length} project${projects.length === 1 ? "" : "s"}.`}
          </p>

          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              action={
                <button type="button" className="btn" onClick={() => setCreating(true)}>
                  Create your first project
                </button>
              }
            >
              A project holds your versions, tracker hours, journals and ships.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState
              title="No projects match"
              action={
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => {
                    setQuery("");
                    setTrack("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </button>
              }
            >
              Try a different search or clear the filters.
            </EmptyState>
          ) : (
            <ul className="card-grid">
              {visible.map((project) => {
                const label = projectStatus(shipsByProject(project.id));
                return (
                  <li key={project.id} className="card bd-card">
                    <div className="bd-card-head">
                      <h3 className="bd-wrap">{project.name}</h3>
                      <Tag tone="accent">{label}</Tag>
                    </div>
                    <div className="bd-meta">
                      <Tag>{project.track}</Tag>
                      <Tag>{project.track === "Hardware" ? "Hardware" : "Software"}</Tag>
                      <Tag>{project.visibility === "public" ? "Public" : "Private"}</Tag>
                    </div>
                    <p className="bd-clamp mut">{project.summary}</p>
                    <p className="bd-sub">{fmtHours(effectiveHours(project))} allocated</p>
                    <button type="button" className="btn btn-sm" onClick={() => setSelectedId(project.id)} aria-label={`Open ${project.name}`}>
                      Open
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
