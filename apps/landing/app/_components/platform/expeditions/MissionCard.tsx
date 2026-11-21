import Link from "next/link";
import { nextAction, stepsDone, stepsLabel, type Mission, type MissionStatus, type Progress } from "@/lib/platform/expeditions";
import { trackSlug } from "@/lib/platform/tracks";
import { StepMeter } from "./StepMeter";

const STATE_WORDS: Record<MissionStatus, string> = { "in-progress": "In progress", available: "Ready", locked: "Locked", done: "Done" };

// One expedition in the grid. The name is the one link and it covers the card. The card says what the builder does next
// (the step, the expedition to finish first, or that it is finished), then the steps done with a meter, the level and the
// suggested hours. The draft reward is on the expedition page, not here.
export function MissionCard({ mission, status, progress, equippedOn }: Readonly<{ mission: Mission; status: MissionStatus; progress: Progress; equippedOn?: string }>) {
  const next = nextAction(mission, progress);
  return (
    <article className="ex-card" data-track={trackSlug(mission.track)} data-state={status}>
      <p className="ex-card-top">
        <span className="ex-tag">{mission.track}</span>
        <span className="ex-state">{equippedOn && status !== "done" ? "Equipped" : STATE_WORDS[status]}</span>
      </p>
      <h2 className="ex-card-name">
        <Link className="ex-stretch" href={`/dashboard/shop/expeditions/${mission.id}`}>
          {mission.name}
        </Link>
      </h2>
      <p className="ex-card-line">{mission.summary}</p>
      <p className="ex-card-next">
        {next.kind === "step" ? (
          <>
            <span className="ex-label">{next.started ? `Next, step ${next.number}` : "Start with step 1"}</span>
            {next.title}
          </>
        ) : next.kind === "locked" ? (
          <>
            <span className="ex-label">Finish first</span>
            {next.blockers.map((blocker) => blocker.name).join(" and ")}
          </>
        ) : (
          <>
            <span className="ex-label">Finished</span>
            Every step is done
          </>
        )}
      </p>
      <div className="ex-card-foot">
        <div className="ex-progress">
          <StepMeter done={stepsDone(mission, progress)} total={mission.steps.length} />
          <span className="ex-progress-text">{stepsLabel(mission, progress)}</span>
        </div>
        <p className="ex-card-facts">
          {mission.difficulty}, about <span className="ex-num">{mission.hours}</span> H
          {equippedOn ? <span className="ex-card-on">On {equippedOn}</span> : null}
        </p>
      </div>
    </article>
  );
}
