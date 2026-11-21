// rate-limit-cleanup: the scheduled sweep of the shared RateLimitHit table. Every /api/v1 request (and every service-key
// rejection) writes a fixed-window row, so without this job the table grows forever. cleanupExpired drops windows that ended
// more than a day ago; the summary carries only the number of rows removed.
//
// Server only (writes the database). No id, key or IP in the summary.
import type { JobSummary } from "../registry";
import { cleanupExpired } from "../../rate-limit-db";

export async function runRateLimitCleanup(now: Date): Promise<JobSummary> {
  const deleted = await cleanupExpired(now.getTime());
  return { deleted };
}
