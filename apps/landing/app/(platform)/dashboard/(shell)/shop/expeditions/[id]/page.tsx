import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/_components/platform/expeditions.css";
import { EquipExpedition, type EquipProject } from "@/app/_components/platform/expeditions/EquipExpedition";
import { CheckGlyph } from "@/app/_components/platform/expeditions/Flow";
import { StepMeter } from "@/app/_components/platform/expeditions/StepMeter";
import { db } from "@/lib/platform/db";
import { viewerExpeditions } from "@/lib/platform/expedition-data";
import {
  approvedHoursFromMinutes,
  canEquipExpedition,
  hoursToFinish,
  isDone,
  MISSION_STATUS_CHIPS,
  missionById,
  missionStatus,
  rewardLine,
  stepState,
  stepsDone,
  stepsLabel,
  unmetPrerequisites,
} from "@/lib/platform/expeditions";
import { requireViewer } from "@/lib/platform/session";
import { trackSlug } from "@/lib/platform/tracks";

export const metadata: Metadata = { title: "Expedition - LOADOUT" };

// One expedition, as one column: what it is, the steps in order, what it pays, what it needs first and what to send in, with a
// single Equip button. Expeditions are LOADOUT's version of Pixl's Trials (plans/proposals/trials-as-expeditions.md): the
// approved hours of the project that has it equipped count toward the steps. An unknown id is a plain 404.
export default async function ExpeditionPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;
  const mission = missionById(id);
  if (!mission) notFound();

  const { progress, equipped } = await viewerExpeditions(viewer.id);
  const status = missionStatus(mission, progress);
  const done = isDone(mission, progress);
  const unmet = unmetPrerequisites(mission, progress);
  const on = equipped.find((row) => row.active && row.expeditionId === mission.id);
  const track = trackSlug(mission.track);
  const onHours = on ? approvedHoursFromMinutes(on.approvedMinutes) : 0;

  const owned = await db().project.findMany({ where: { ownerId: viewer.id, track: mission.track }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, ownerId: true, track: true } });
  const projects: EquipProject[] = owned.map((project) => {
    const verdict = canEquipExpedition({
      viewerId: viewer.id,
      project,
      mission,
      progress,
      onProject: equipped.filter((row) => row.active && row.projectId === project.id).map((row) => row.expeditionId),
      elsewhere: equipped.filter((row) => row.active && row.projectId !== project.id).map((row) => row.expeditionId),
    });
    return { id: project.id, title: project.title, reason: verdict.ok ? "" : verdict.reason };
  });

  return (
    <>
      <div className="pf-crumbs">
        <Link className="pf-back" href="/dashboard/shop/expeditions">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to Expeditions
        </Link>
      </div>

      <header className="pf-project-head ex-head" data-track={track}>
        <div className="pf-project-head-main">
          <p className="ex-head-top">
            <span className="ex-tag">{mission.track}</span>
            <span className="ex-status">{on && !done ? "Equipped" : MISSION_STATUS_CHIPS[status]}</span>
          </p>
          <h1>{mission.name}</h1>
          <p className="pf-project-lead">{mission.summary}</p>
          <p className="ex-facts">
            {mission.difficulty}, <span className="ex-num">{mission.hours}</span> approved H, <span className="ex-num">{mission.steps.length}</span> steps
          </p>
          <div className="ex-equip-line">
            {done ? (
              <p>Finished{on ? <> on <Link href={`/dashboard/projects/${on.projectId}`}>{on.projectTitle}</Link></> : null}. It can&apos;t be equipped again.</p>
            ) : on ? (
              <p>
                Equipped on <Link href={`/dashboard/projects/${on.projectId}?tab=toolbelt`}>{on.projectTitle}</Link>. <span className="ex-num">{onHours}</span> of{" "}
                <span className="ex-num">{mission.hours}</span> approved H counted, {hoursToFinish(mission, onHours)} to go.
              </p>
            ) : unmet.length > 0 ? (
              <p>
                Finish{" "}
                {unmet.map((required, index) => {
                  const other = missionById(required);
                  return (
                    <span key={required}>
                      {index > 0 ? " and " : ""}
                      {other ? <Link href={`/dashboard/shop/expeditions/${other.id}`}>{other.name}</Link> : required}
                    </span>
                  );
                })}{" "}
                first.
              </p>
            ) : owned.length === 0 ? (
              <p>
                You have no {mission.track} project yet. <Link href="/dashboard/projects/new">Start one</Link> to equip this.
              </p>
            ) : (
              <EquipExpedition expeditionId={mission.id} name={mission.name} projects={projects} />
            )}
          </div>
        </div>
      </header>

      <section className="pf-box ex-steps-box" aria-labelledby="steps-heading">
        <div className="pf-box-head">
          <h2 id="steps-heading">Steps</h2>
          <span className="ex-progress">
            <StepMeter done={stepsDone(mission, progress)} total={mission.steps.length} />
            <span className="ex-progress-text">{stepsLabel(mission, progress)}</span>
          </span>
        </div>
        <ol className="ex-steps">
          {mission.steps.map((step, index) => {
            const state = stepState(mission, progress, index);
            return (
              <li className="ex-step" data-state={state} aria-current={state === "current" ? "step" : undefined} key={step.title}>
                <span className="ex-node" aria-hidden="true">
                  {state === "done" ? <CheckGlyph /> : index + 1}
                </span>
                <p className="ex-step-title">
                  {step.title}
                  {state === "done" ? <span className="pf-sr">, done</span> : null}
                  {state === "current" ? <span className="ex-step-flag">Next</span> : null}
                </p>
                <p className="ex-step-detail">{step.detail}</p>
              </li>
            );
          })}
        </ol>
        <dl className="ex-terms">
          <div>
            <dt>Reward</dt>
            <dd>
              {rewardLine(mission.reward)}. <span className="ex-mut">A draft until the owner confirms it.</span>
            </dd>
          </div>
          <div>
            <dt>Needs first</dt>
            <dd>
              {mission.prerequisites.length === 0
                ? "Nothing. You can start at any time."
                : mission.prerequisites.map((required, index) => {
                    const other = missionById(required);
                    return (
                      <span key={required}>
                        {index > 0 ? ", " : ""}
                        {other ? <Link href={`/dashboard/shop/expeditions/${other.id}`}>{other.name}</Link> : required}
                        {other && isDone(other, progress) ? <span className="ex-mut"> (done)</span> : null}
                      </span>
                    );
                  })}
            </dd>
          </div>
          <div>
            <dt>Send in</dt>
            <dd>
              <ul className="ex-plain">
                {mission.submission.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <span className="ex-mut">Submitting opens with the Expeditions release.</span>
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
