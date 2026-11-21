// Cron: submit ships that wait on fraud triage to Telescreen (Robert) and record the scores that came back as FraudCheck rows.
// Bearer CRON_SECRET (403 when it is unset); one JobRun row per call. With LOADOUT_TELESCREEN_URL or LOADOUT_TELESCREEN_KEY unset the
// job answers ok with { disabled: true }. See lib/platform/fraud/robert-sync.ts.
import { runFraudJob } from "@/lib/platform/fraud/job";
import { syncRobert } from "@/lib/platform/fraud/robert-sync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runFraudJob("fraud-robert-sync", request, async () => ({ ...(await syncRobert()) }));
}
