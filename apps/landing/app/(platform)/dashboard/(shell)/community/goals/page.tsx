import type { Metadata } from "next";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { GoalBar } from "@/app/_components/platform/community/GoalBar";
import { listGoals } from "@/lib/platform/community-data";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Goals - LOADOUT" };

// The date a goal's end is written as, with no invented time: the day in UTC, month and year spelt in words.
function goalDate(date: Date): string {
  return `${date.getUTCDate()} ${date.toLocaleString("en-GB", { month: "long", timeZone: "UTC" })} ${date.getUTCFullYear()}`;
}

// Community goals: the whole community's work counted toward one shared reward. The rows are configured by the team
// (CommunityGoal): the current figure and the target are written by staff, so the numbers always read as they were
// written, and nothing counts up on its own. A goal that has closed keeps its place with the closing date.
export default async function GoalsPage() {
  await requireViewer();
  const goals = await listGoals();

  return (
    <>
      <CommunityHead title="Goals">A goal counts the whole community&apos;s approved work. It does not rank anyone.</CommunityHead>

      {goals.length === 0 ? (
        <p className="pf-empty-line">No community goal is set yet. The team writes one here when the community has something to work toward together.</p>
      ) : (
        <ol className="cm-goals">
          {goals.map((goal) => {
            const closed = goal.closedAt !== null;
            return (
              <li key={goal.id} data-closed={closed ? "true" : undefined}>
                <div className="cm-goal-head">
                  <h2>{goal.title}</h2>
                  {closed ? (
                    <span className="cm-mini-kind">Met {goalDate(goal.closedAt as Date)}</span>
                  ) : goal.endsAt ? (
                    <span className="cm-mini-kind">Ends {goalDate(goal.endsAt)}</span>
                  ) : null}
                </div>
                <p className="cm-goal-text">{goal.body}</p>
                <GoalBar goal={goal} />
                {closed ? <p className="pf-empty-line">This goal is closed. Its figures stand as they were met.</p> : null}
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
