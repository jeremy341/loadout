// The cron endpoint: GET or POST /api/cron/<job> runs the registered job <job> exactly once, through runner.ts, with a
// JobRun row inserted ("running") before it starts and finished ("ok" or "error") after. The Nest host's cron file
// (/etc/cron.d/loadout, written by scripts/deploy-nest.sh) calls it through scripts/run-cron-job.sh with
// `Authorization: Bearer CRON_SECRET`. POST lets a staff member fire a job by hand with the same curl and the same record.
//
// Fail closed: without the right bearer — no CRON_SECRET in the environment, a missing header, the wrong secret —
// nothing runs and the answer is 403 for every job name, known or not, so the endpoint cannot be used to probe which
// jobs exist. The only write a denied request can make is one AuditEvent row, at most one a minute per client address, and even that
// never masks the 403. The row names the job only when it is a registered one; whatever else was asked for is recorded as "unknown",
// so an attacker's path text never reaches the table.
//
// Method choice for the answers: 200 the job finished (ok), 500 it ran and failed (error), 409 a run of the same job
// is still inside its 10 minute lock (locked), 404 no such job, 403 no entry.
import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/platform/audit";
import { clientIp } from "@/lib/platform/client-ip";
import { db } from "@/lib/platform/db";
import { cronBearerOk } from "@/lib/platform/jobs/guard";
import { isJobName } from "@/lib/platform/jobs/registry";
import { runJob } from "@/lib/platform/jobs/runner";
import { createRateLimiter } from "@/lib/platform/rate-limit";

export const dynamic = "force-dynamic";
// The hackatime sync paces itself at one person a second; the cap is the room a long linked list needs.
export const maxDuration = 300;

type Ctx = { params: Promise<{ job: string }> };

// One denied-request audit row per client address per minute, so a flood of anonymous requests cannot fill the audit table.
const denialAudit = createRateLimiter({ limit: 1, windowMs: 60_000 });

async function run(request: Request, job: string): Promise<Response> {
  if (!cronBearerOk(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    // Auditing a refusal is best effort: a database that is down must not turn the 403 into a 500.
    if (denialAudit.check(`cron:${clientIp(request)}`).ok) {
      await recordAudit(db(), {
        actorId: "anonymous",
        action: "cron.denied",
        targetType: "job",
        targetId: isJobName(job) ? job : "unknown",
        reason: "A request to /api/cron answered no or the wrong CRON_SECRET bearer",
      }).catch(() => undefined);
    }
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const result = await runJob(job, "cron");
  switch (result.code) {
    case "unknown-job":
      return NextResponse.json({ ok: false, error: "Unknown job" }, { status: 404 });
    case "locked":
      return NextResponse.json({ ok: false, error: "Still running", retryAt: result.releaseAt.toISOString() }, { status: 409 });
    case "error":
      // The Error name only, never the message: a message can carry database detail.
      return NextResponse.json({ ok: false, error: result.errorName }, { status: 500 });
    case "ok":
      return NextResponse.json({ ok: true, job: result.job, detail: result.detail }, { status: 200 });
  }
}

export async function GET(request: Request, { params }: Ctx): Promise<Response> {
  return run(request, (await params).job);
}

// The body is ignored; POST is the manual curl, and the answer is the same as GET's.
export async function POST(request: Request, { params }: Ctx): Promise<Response> {
  return run(request, (await params).job);
}
