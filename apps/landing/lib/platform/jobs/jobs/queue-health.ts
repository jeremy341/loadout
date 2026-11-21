// queue-health: the operational pulse. Counts the ships the review queue owes attention to and the outbox rows the
// bot has stopped draining, and writes the numbers into the JobRun detail. It reads only — nothing is fixed here, and
// it does not message anyone (posting the numbers to Slack is a later job's move). Its point is the trend line the
// hourly rows give: an overdueFirstPass that keeps climbing says the desk is underwater.
//
// What it counts, and why those numbers:
//   firstPass / inReview — the first-pass queue (submitted = nobody has taken it, in-review = claimed for a first
//   look). Only queued work matters here; second-pass ships wait on a final reviewer (counted separately, with the
//   ban proposals among them) and a ship on hold is deliberately parked (heldAt), not owed attention.
//   overdueFirstPass — a queue ship past QUEUE_OVERDUE_HOURS with nobody on it. This is the alarm figure. Ships
//   locked to their reviewer inside the 72 hour assignment window (review-rules assignmentWindow) are not overdue:
//   somebody is on it, and the desk says a re-ship waits up to its window.
//   outboxFailed / outboxStuck — failed is final. Stuck is a pending row whose next attempt was due more than
//   OUTBOX_STUCK_MINUTES ago, i.e. past the whole 1/5/30 backoff schedule (lib/platform/bot/outbox.ts): the bot has
//   not polled in half an hour, so nothing queued is being sent.
//
// Server only (reads the database). Counts only: never an id, a handle or a message body.
import type { JobSummary } from "../registry";
import { db } from "../../db";
import { assignmentWindow } from "../../review-rules";

export const QUEUE_OVERDUE_HOURS = 48;
export const QUEUE_OVERDUE_MS = QUEUE_OVERDUE_HOURS * 3_600_000;
export const OUTBOX_STUCK_MINUTES = 30;
export const OUTBOX_STUCK_MS = OUTBOX_STUCK_MINUTES * 60_000;

// The first-pass statuses (lib/platform/ship.ts): submitted, nobody has claimed it yet, and in-review, claimed for a
// first look. Everything else is out of the queue.
const FIRST_PASS = ["submitted", "in-review"] as const;

const DAY_MS = 86_400_000;

// Pure: is a first-pass ship overdue? Aged past the threshold and not locked to a reviewer inside the assignment
// window — the same locked read the desk's assignmentView makes (lib/platform/review-data.ts), so the alarm and the
// desk never disagree about whose ship it is. Every input comes from the fetch below; `now` is passed in.
export function firstPassOverdue(
  ship: { submittedAt: Date | null; reshippedAt: Date | null; assignedTo: string | null },
  now: Date,
): boolean {
  if (!ship.submittedAt || now.getTime() - ship.submittedAt.getTime() < QUEUE_OVERDUE_MS) return false;
  if (!ship.assignedTo) return true;
  // The reviewer who asked for changes keeps a re-ship for its 72 hour window (assignmentWindow reads a missing
  // re-ship time as a kept assignment, matching the desk); queued again only after it closes.
  return assignmentWindow({ reshippedAt: ship.reshippedAt, now }).backToQueue;
}

export async function runQueueHealth(now: Date): Promise<JobSummary> {
  const stuckBefore = new Date(now.getTime() - OUTBOX_STUCK_MS);
  const [firstPass, inReview, secondPass, banProposals, outboxFailed, outboxStuck, queueRows, oldest] = await Promise.all([
    db().project.count({ where: { status: "submitted" } }),
    db().project.count({ where: { status: "in-review" } }),
    db().project.count({ where: { status: "second-pass" } }),
    db().project.count({ where: { status: "second-pass", proposedBanBy: { not: null } } }),
    db().botOutbox.count({ where: { status: "failed" } }),
    db().botOutbox.count({ where: { status: "pending", nextAttemptAt: { lt: stuckBefore } } }),
    // The whole first-pass queue without holds, so the overdue count can be decided by the same pure rule everywhere.
    db().project.findMany({
      where: { status: { in: [...FIRST_PASS] }, heldAt: null },
      select: { submittedAt: true, reshippedAt: true, assignedTo: true },
    }),
    db().project.findFirst({
      where: { status: { in: [...FIRST_PASS] }, submittedAt: { not: null } },
      orderBy: { submittedAt: "asc" },
      select: { submittedAt: true },
    }),
  ]);

  // Full days only: "3 days waiting", never "2.8", and never negative when a clock moves.
  const oldestFirstPassDays = oldest?.submittedAt
    ? Math.max(0, Math.floor((now.getTime() - oldest.submittedAt.getTime()) / DAY_MS))
    : 0;

  return {
    firstPass,
    inReview,
    secondPass,
    banProposals,
    overdueFirstPass: queueRows.filter((ship) => firstPassOverdue(ship, now)).length,
    oldestFirstPassDays,
    outboxFailed,
    outboxStuck,
  };
}
