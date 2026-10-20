"use client";

import { Status, Tabs, Tag } from "../../ui/ui";
import { deleteProject } from "./engine";
import { ConfirmButton, useLiveMessage } from "./parts";
import { ProjectEvidence } from "./project-evidence";
import { draftFromProject, ProjectForm, type ProjectDraft } from "./project-form";
import { ProjectVersions } from "./project-versions";
import { PublicPreview } from "./public-preview";
import { ShipPanel } from "./ship-panel";
import { useJournals, useProjects, useShips } from "./store";
import { effectiveHours } from "./logic/ship";
import { projectStatus } from "./labels";
import type { Project } from "./logic/types";

export function ProjectDetail({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [projects, setProjects] = useProjects();
  const [journals] = useJournals();
  const [ships] = useShips();
  const [message, say] = useLiveMessage();
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="pg-stack">
        <p className="mut">That project no longer exists.</p>
        <button type="button" className="btn btn-quiet" onClick={onBack}>
          Back to projects
        </button>
      </div>
    );
  }

  const current: Project = project;

  function patch(change: Partial<Project>) {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...change } : p)));
  }

  function save(draft: ProjectDraft) {
    const modeChanged = (draft.track === "Hardware") !== (current.track === "Hardware");
    patch({
      ...draft,
      // Hackatime and Lapse are different trackers, so a mode change needs a fresh connection.
      ...(modeChanged ? { trackerConnected: false } : {}),
    });
    say(modeChanged ? "Saved. You changed the mode, so reconnect the tracker on the Evidence tab." : "Project saved.");
  }

  const entries = journals.filter((e) => e.projectId === projectId);
  const projectShips = ships.filter((s) => s.projectId === projectId);

  return (
    <div className="pg-stack">
      <div>
        <button type="button" className="btn btn-quiet btn-sm bd-back" onClick={onBack}>
          Back to all projects
        </button>
        <div className="pn-head">
          <h2 style={{ overflowWrap: "anywhere" }}>{current.name}</h2>
          <div className="bd-meta">
            <Tag>{current.track}</Tag>
            <Tag tone="accent">{projectStatus(projectShips)}</Tag>
            <Tag>{current.visibility === "public" ? "Public" : "Private"}</Tag>
            <span className="bd-sub">{effectiveHours(current)} h allocated</span>
          </div>
        </div>
        <Status message={message} />
      </div>

      <Tabs
        label="Project sections"
        tabs={[
          {
            id: "details",
            label: "Details",
            panel: (
              <div className="pg-stack">
                <ProjectForm key={`${current.id}-${current.track}-${current.license}`} initial={draftFromProject(current)} submitLabel="Save project" onSubmit={save} />
                <div className="pn">
                  <h3>Delete this project</h3>
                  <p className="mut" style={{ margin: "8px 0 12px" }}>
                    Deleting removes the project, its {entries.length} journal {entries.length === 1 ? "entry" : "entries"} and its ships from this browser. Ore already credited stays in your ledger.
                  </p>
                  <ConfirmButton
                    label="Delete project"
                    question={`Delete ${current.name} and everything attached to it?`}
                    confirmLabel="Yes, delete project"
                    onConfirm={() => {
                      deleteProject(projectId);
                      onBack();
                    }}
                  />
                </div>
              </div>
            ),
          },
          { id: "evidence", label: "Evidence", panel: <ProjectEvidence project={current} onChange={patch} /> },
          { id: "versions", label: "Versions", count: current.versions.length, panel: <ProjectVersions project={current} onChange={patch} /> },
          { id: "ship", label: "Ship", panel: <ShipPanel project={current} /> },
          { id: "public", label: "Public page", panel: <PublicPreview project={current} entries={entries} /> },
        ]}
      />
    </div>
  );
}
