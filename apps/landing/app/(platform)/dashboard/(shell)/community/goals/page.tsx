import type { Metadata } from "next";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { GoalBar } from "@/app/_components/platform/community/GoalBar";
import { SampleNote } from "@/app/_components/platform/community/Parts";
import { GOALS } from "@/lib/platform/community";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Goals - LOADOUT" };

// Community goals, after Pixl's vault levels: the whole community's approved work counts toward one shared reward. Plan 11
// fixes none of the targets or rewards, so each is marked provisional. Plain bars with the figures written out.
export default async function GoalsPage() {
  await requireViewer();

  return (
    <>
      <CommunityHead title="Goals">A goal counts the whole community&apos;s approved work. It does not rank anyone.</CommunityHead>
      <SampleNote>Community goals are proposed. Every target, figure and reward below is provisional and invented for this preview.</SampleNote>

      <ol className="cm-goals">
        {GOALS.map((goal) => (
          <li key={goal.id}>
            <div className="cm-goal-head">
              <h2>{goal.title}</h2>
              <span className="cm-tag">Provisional</span>
            </div>
            <p className="cm-goal-text">{goal.text}</p>
            <GoalBar goal={goal} />
            <p className="cm-goal-reward">
              <span className="cm-goal-reward-label">Shared reward</span> {goal.reward}
            </p>
          </li>
        ))}
      </ol>
    </>
  );
}
