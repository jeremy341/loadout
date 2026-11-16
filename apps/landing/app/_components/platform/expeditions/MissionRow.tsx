import Link from "next/link";
import { missionById, rewardLine, stepsDone, stepsLabel, unmetPrerequisites, type Mission, type MissionStatus, type Progress } from "@/lib/platform/expeditions";
import { trackSlug } from "@/lib/platform/tracks";
import { StepMeter } from "./StepMeter";

// One expedition in the board: its track, name and one line, the steps done, and the draft reward. A locked one says which
// expedition opens it. The name is the one link and covers the row.
export function MissionRow({ mission, status, progress }: Readonly<{ mission: Mission; status: MissionStatus; progress: Progress }>) {
  const blockers = status === "locked" ? unmetPrerequisites(mission, progress).map((id) => missionById(id)?.name ?? id) : [];
  return (
    <li className="ex-row ex-mission" data-track={trackSlug(mission.track)}>
      <span className="ex-tag">{mission.track}</span>
      <div className="ex-main">
        <h3 className="ex-name">
          <Link className="ex-stretch" href={`/dashboard/expeditions/${mission.id}`}>
            {mission.name}
          </Link>
        </h3>
        <p className="ex-summary">{mission.summary}</p>
        {blockers.length > 0 ? <p className="ex-lock">Locked until you finish {blockers.join(" and ")}.</p> : null}
      </div>
      <div className="ex-progress">
        <StepMeter done={stepsDone(mission, progress)} total={mission.steps.length} />
        <span className="ex-progress-text">{stepsLabel(mission, progress)}</span>
      </div>
      <p className="ex-reward">
        <span className="ex-label">Draft reward</span>
        <span>{rewardLine(mission.reward)}</span>
      </p>
    </li>
  );
}
