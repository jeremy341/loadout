"use client";

import { useState } from "react";
import { EmptyState, Field, Meter, PageHeader, Panel, PreviewNote, Tabs, Tag } from "../../ui/ui";
import "./build.css";
import { MISSIONS, QUESTS } from "./content";
import { Loading } from "./parts";
import { MissionDetail, STATUS_LABEL, rewardText, statusTone, viewStatus, type ViewStatus } from "./mission-detail";
import { useMissionProgress } from "./store";
import { approvedIdsOf, stepProgress, type MissionDef } from "./logic/missions";

type StatusFilter = "all" | "open" | "active" | "approved" | "locked";

function matchesFilter(filter: StatusFilter, status: ViewStatus): boolean {
  switch (filter) {
    case "all":
      return true;
    case "open":
      return status === "not_started";
    case "active":
      return status === "draft" || status === "submitted" || status === "in_review" || status === "needs_changes";
    case "approved":
      return status === "approved";
    case "locked":
      return status === "locked";
  }
}

function Board({ defs, kind }: { defs: MissionDef[]; kind: "mission" | "quest" }) {
  const [progress] = useMissionProgress();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const approvedIds = approvedIdsOf(progress);
  const noun = kind === "quest" ? "quests" : "missions";

  const selected = selectedId ? [...MISSIONS, ...QUESTS].find((d) => d.id === selectedId) : undefined;
  if (selected) {
    return (
      <MissionDetail
        key={selected.id}
        def={selected}
        progress={progress.find((p) => p.missionId === selected.id)}
        approvedIds={approvedIds}
        onBack={() => setSelectedId(null)}
        onOpen={setSelectedId}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const visible = defs.filter((def) => {
    const status = viewStatus(def, progress.find((p) => p.missionId === def.id), approvedIds);
    if (!matchesFilter(filter, status)) return false;
    return q ? `${def.title} ${def.summary} ${def.track}`.toLowerCase().includes(q) : true;
  });
  const approvedHere = defs.filter((d) => approvedIds.includes(d.id)).length;

  return (
    <div className="pg-stack">
      {kind === "quest" ? (
        <p className="bd-sticky-note" role="note">
          Seasonal quests are short optional challenges during a Season. The titles and Ore amounts below are the examples in Plan 02, not final values, and the plans have not set Season dates yet.
        </p>
      ) : (
        <p className="bd-sticky-note" role="note">
          Missions are guided paths with steps, prerequisites and a reviewed submission. This catalogue is sample content, and rewards are draft preview values until the plans set them.
        </p>
      )}
      <div className="toolbar" role="search">
        <Field label={`Search ${noun}`}>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Show">
          <select value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)}>
            <option value="all">Everything</option>
            <option value="open">Ready to start</option>
            <option value="active">In progress or in review</option>
            <option value="approved">Approved</option>
            <option value="locked">Locked</option>
          </select>
        </Field>
      </div>
      <p className="bd-sub" aria-live="polite">
        {approvedHere} of {defs.length} {noun} approved. Showing {visible.length}.
      </p>

      {visible.length === 0 ? (
        <EmptyState title={`No ${noun} match`}>Try a different search or show everything.</EmptyState>
      ) : (
        <ul className="card-grid">
          {visible.map((def) => {
            const entry = progress.find((p) => p.missionId === def.id);
            const status = viewStatus(def, entry, approvedIds);
            const steps = stepProgress(def, entry?.checkedStepIds ?? []);
            const reward = rewardText(def);
            return (
              <li key={def.id} className="card bd-card">
                <div className="bd-card-head">
                  <h3 className="bd-wrap">{def.title}</h3>
                  <Tag tone={statusTone(status)}>{STATUS_LABEL[status]}</Tag>
                </div>
                <div className="bd-meta">
                  <Tag>{def.difficulty}</Tag>
                  <Tag>{def.track === "Any" ? "Any track" : def.track}</Tag>
                  {def.hardware ? <Tag>Hardware</Tag> : null}
                </div>
                <p className="bd-clamp mut">{def.summary}</p>
                {entry ? (
                  <div>
                    <Meter value={steps.done} max={steps.total} label={`${steps.done} of ${steps.total} steps done`} />
                    <p className="bd-sub">
                      {steps.done} of {steps.total} steps
                    </p>
                  </div>
                ) : (
                  <p className="bd-sub">
                    {def.steps.length} steps, about {def.minutes} min
                  </p>
                )}
                <p className="bd-sub">
                  {reward.tag}: {def.rewardOre} Ore
                </p>
                <button type="button" className="btn btn-sm" onClick={() => setSelectedId(def.id)} aria-label={`${status === "locked" ? "View" : "Open"} ${def.title}`}>
                  {status === "locked" ? "View" : "Open"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function MissionsPage() {
  const [progress, , hydrated] = useMissionProgress();
  const header = (
    <>
      <PageHeader eyebrow="Build" title="Missions" lead="Guided missions with steps, prerequisites and review, plus seasonal quests." />
      <PreviewNote>
        The missions are sample content and the reviewer is simulated. Your steps, submissions and progress are saved only in this browser, and every reward is a draft preview value.
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
  const approved = new Set(approvedIdsOf(progress));
  return (
    <>
      {header}
      <div className="pg-stack">
        <Panel title="Your progress">
          <p>
            {MISSIONS.filter((m) => approved.has(m.id)).length} of {MISSIONS.length} missions and {QUESTS.filter((m) => approved.has(m.id)).length} of {QUESTS.length} quests approved.
          </p>
        </Panel>
        <Tabs
          label="Mission sections"
          tabs={[
            { id: "missions", label: "Missions", count: MISSIONS.length, panel: <Board defs={MISSIONS} kind="mission" /> },
            { id: "quests", label: "Seasonal quests", count: QUESTS.length, panel: <Board defs={QUESTS} kind="quest" /> },
          ]}
        />
      </div>
    </>
  );
}
