// session-cleanup: the scheduled sweep of Session rows whose expiry has passed. readViewer() already refuses an expired session,
// so deleting it changes no access decision; it just stops the table growing for ever. The summary is a count only — no token
// hashes, person ids or email addresses leave the job.
//
// Server only (uses the database and deletes Session rows).
import type { JobSummary } from "../registry";
import { purgeExpiredSessions } from "../../session";

export async function runSessionCleanup(now: Date): Promise<JobSummary> {
  const removed = await purgeExpiredSessions(now);
  return { removed };
}
