// Slack bot: reminders, countdowns and polls that must run later. GET answers { jobs: JobRow[] } (every pending job, so the bot can
// reload them at startup). POST { kind: "reminder" | "countdown" | "poll", ownerSlackId, runAt (ISO, 1 second to 24 hours ahead),
// payload? } answers 201 { job }, or 409 when the owner already has the most pending of that kind.
import { botError, botGuard, botInvalid, botJson, checkFields, checkSlackId, readJson } from "@/lib/platform/bot/auth";
import { createJob, listPendingJobs } from "@/lib/platform/bot/jobs-data";
import { checkPayload, checkRunAt, isJobKind } from "@/lib/platform/bot/jobs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { id: rid, denied } = await botGuard(request, "jobs");
  if (denied) return denied;
  return botJson(rid, { jobs: await listPendingJobs() });
}

export async function POST(request: Request) {
  const { id: rid, denied } = await botGuard(request, "jobs");
  if (denied) return denied;
  const body = await readJson(request);
  if (!body.ok) return botInvalid(rid, body.message);
  const fields = checkFields(body.value, ["kind", "ownerSlackId", "runAt", "payload"]);
  if (!fields.ok) return botInvalid(rid, fields.message);
  const v = fields.value;
  if (!isJobKind(v.kind)) return botInvalid(rid, "kind must be reminder, countdown or poll");
  const owner = checkSlackId(v.ownerSlackId, "ownerSlackId");
  if (!owner.ok) return botInvalid(rid, owner.message);
  const runAt = checkRunAt(v.runAt, new Date());
  if (!runAt.ok) return botInvalid(rid, runAt.message);
  const payload = checkPayload(v.payload);
  if (!payload.ok) return botInvalid(rid, payload.message);

  const result = await createJob({ kind: v.kind, ownerSlackId: owner.value, runAt: runAt.value, payload: payload.value });
  if (!result.ok) return botError(rid, 409, "limit", "too many pending of this kind for this owner");
  return botJson(rid, { job: result.job }, 201);
}
