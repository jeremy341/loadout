import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "@/app/_components/platform/expeditions.css";
import { CheckGlyph } from "@/app/_components/platform/expeditions/Flow";
import { StepMeter } from "@/app/_components/platform/expeditions/StepMeter";
import { isDone, MISSION_STATUS_CHIPS, missionById, missionStatus, rewardLine, SAMPLE_PROGRESS, stepState, stepsDone, stepsLabel, unmetPrerequisites } from "@/lib/platform/expeditions";
import { requireViewer } from "@/lib/platform/session";
import { trackSlug } from "@/lib/platform/tracks";

export const metadata: Metadata = { title: "Expedition - LOADOUT" };

const SUBMIT_SENTENCE = "Missions open with the Expeditions release. Nothing here is saved.";

// One expedition: the curated steps in order, what it needs first, what to send in and the draft reward. Submitting is shown
// but off. An unknown id is a plain 404.
export default async function ExpeditionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireViewer();
  const { id } = await params;
  const mission = missionById(id);
  if (!mission) notFound();

  const status = missionStatus(mission, SAMPLE_PROGRESS);
  const blockers = unmetPrerequisites(mission, SAMPLE_PROGRESS);
  const total = mission.steps.length;

  return (
    <>
      <div className="pf-crumbs">
        <Link className="pf-back" href="/dashboard/expeditions">
          <svg viewBox="0 0 12 12" width="16" height="16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
            <path d="M1 5h10v2H1zM3 3h2v2H3zM3 7h2v2H3z" />
          </svg>
          Back to Expeditions
        </Link>
      </div>

      <div className="pf-project-head" data-track={trackSlug(mission.track)}>
        <div className="pf-project-head-main">
          <span className="ex-status">{MISSION_STATUS_CHIPS[status]}</span>
          <h1>{mission.name}</h1>
          <p className="pf-project-lead">{mission.summary}</p>
          <dl className="pf-meta-box">
            <div>
              <dt>Track</dt>
              <dd className="ex-tag">{mission.track}</dd>
            </div>
            <div>
              <dt>Level</dt>
              <dd>{mission.difficulty}</dd>
            </div>
            <div>
              <dt>Steps</dt>
              <dd className="ex-num">{stepsDone(mission, SAMPLE_PROGRESS)} of {total}</dd>
            </div>
            <div>
              <dt>Suggested time</dt>
              <dd className="ex-num">About {mission.hours} H</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="ex-detail" data-track={trackSlug(mission.track)}>
        <div>
          <section className="pf-box" aria-labelledby="steps-heading">
            <h2 id="steps-heading">Steps</h2>
            <div className="ex-progress ex-steps-meter">
              <StepMeter done={stepsDone(mission, SAMPLE_PROGRESS)} total={total} />
              <span className="ex-progress-text">{stepsLabel(mission, SAMPLE_PROGRESS)}</span>
            </div>
            {blockers.length > 0 ? (
              <p className="ex-lock" role="note">
                Locked until you finish {blockers.map((blocker) => missionById(blocker)?.name ?? blocker).join(" and ")}. The steps below show what comes after.
              </p>
            ) : null}
            <ol className="ex-steps">
              {mission.steps.map((step, index) => {
                const state = stepState(mission, SAMPLE_PROGRESS, index);
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
          </section>
        </div>

        <div>
          <section className="pf-box" aria-labelledby="prereq-heading">
            <h2 id="prereq-heading">Prerequisites</h2>
            {mission.prerequisites.length === 0 ? (
              <p className="pf-box-note">None. You can start this expedition at any time.</p>
            ) : (
              <ul className="ex-plain">
                {mission.prerequisites.map((required) => {
                  const other = missionById(required);
                  const finished = other ? isDone(other, SAMPLE_PROGRESS) : false;
                  return (
                    <li key={required}>
                      {other ? <Link href={`/dashboard/expeditions/${other.id}`}>{other.name}</Link> : required}
                      <span className="ex-label">{finished ? "Done" : "Not done yet"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="pf-box" aria-labelledby="reward-heading">
            <h2 id="reward-heading">Reward</h2>
            <p className="pf-box-note">{rewardLine(mission.reward)}</p>
            <p className="ex-closed">A draft. The reward is not set until the owner confirms it, and it is paid only after the submission is approved.</p>
          </section>

          <section className="pf-box ex-submit" aria-labelledby="submit-heading">
            <h2 id="submit-heading">Submission</h2>
            <ul className="ex-plain">
              {mission.submission.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button type="button" className="pf-btn" disabled aria-describedby="submit-note">
              Submit for review
            </button>
            <p className="ex-closed" id="submit-note">
              {SUBMIT_SENTENCE}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
