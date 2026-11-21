// Slack bot: finish a job. DELETE /jobs/<id> marks it done (also how a cancel works). Answers { ok: true }, or 404 for no such job.
import { botError, botGuard, botInvalid, botJson, checkRouteId } from "@/lib/platform/bot/auth";
import { finishJob } from "@/lib/platform/bot/jobs-data";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Ctx) {
  const { id: rid, denied } = await botGuard(request, "job");
  if (denied) return denied;
  const routeId = checkRouteId((await params).id, "id");
  if (!routeId.ok) return botInvalid(rid, routeId.message);
  if (!(await finishJob(routeId.value))) return botError(rid, 404, "not_found");
  return botJson(rid, { ok: true });
}
