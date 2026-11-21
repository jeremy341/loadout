// hackatime-sync: the scheduled shape of scripts/sync-hackatime.ts. The script's logic lives here now; the route and
// the manual wrapper both call runHackatimeSync, so the schedule and a staff member's "bun run scripts/run-job.ts
// hackatime-sync" behave identically. The sync itself is syncPerson from lib/platform/hackatime/data.ts — the same
// function the manual path uses, never a fork: it rebuilds the 120 day window, records the same per-account failure
// codes and keeps its per-account rate limiting. The pacing is the manual path's too: one person at a time with a
// second between them, a courtesy to the Hackatime API rather than a correctness rule (a crash simply ends the run and
// the next one retries the list).
//
// Server only (uses the database). Counts only: the summary never carries a person id, a Hackatime id or a response body.
import type { JobSummary } from "../registry";
import { listLinkedPersonIds, syncPerson } from "../../hackatime/data";

const PAUSE_MS = 1000;

export async function runHackatimeSync(now: Date): Promise<JobSummary> {
  const ids = await listLinkedPersonIds();
  let synced = 0;
  let flagged = 0;
  const failures: Record<string, number> = {};

  for (let i = 0; i < ids.length; i++) {
    const result = await syncPerson(ids[i], now);
    if (result.ok) {
      synced++;
      flagged += result.flagged;
    } else {
      // Only the fixed code (rate-limited, network, ...): a message could carry Hackatime detail.
      failures[result.code] = (failures[result.code] ?? 0) + 1;
    }
    if (i < ids.length - 1) await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  }

  const failed = Object.values(failures).reduce((sum, n) => sum + n, 0);
  return { linked: ids.length, synced, failed, flagged, failures: failures as Record<string, number> };
}
