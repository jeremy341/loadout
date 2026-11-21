// Cron: pre-check submitted ships that have not been checked since they were last submitted (README and repo read), then run the
// Fraudy human-versus-AI time split for the same ships. Both write FraudCheck rows and nothing else. Bearer CRON_SECRET (403 when it is
// unset); one JobRun row per call. Each half reports { disabled: true } on its own when its env keys are off (LOADOUT_PRECHECK=off,
// LOADOUT_FRAUDY_KEY unset). See lib/platform/fraud/precheck-data.ts and fraudy.ts.
import { runFraudJob } from "@/lib/platform/fraud/job";
import { sweepFraudy } from "@/lib/platform/fraud/fraudy";
import { sweepPrecheck } from "@/lib/platform/fraud/precheck-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runFraudJob("fraud-precheck", request, async () => {
    // One half failing must not hide the other: each is awaited on its own and an error is reported in its slot.
    const [precheck, fraudy] = await Promise.allSettled([sweepPrecheck(), sweepFraudy()]);
    const slot = (r: PromiseSettledResult<unknown>) => (r.status === "fulfilled" ? r.value : { error: r.reason instanceof Error ? r.reason.message.slice(0, 300) : "failed" });
    const result = { precheck: slot(precheck), fraudy: slot(fraudy) };
    if (precheck.status === "rejected" && fraudy.status === "rejected") throw new Error("both fraud sweeps failed");
    return result;
  });
}
