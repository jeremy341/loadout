// The wrapper every /api/cron/fraud-* route is built with: the CRON_SECRET bearer guard and the JobRun record. The generic cron
// runner and lib/platform/jobs belong to another stream; this file follows the same convention without importing from it, so the
// fraud routes work whether or not that runner has landed.
//
//   authorizeCron(authorization, env?)   -> { ok: true } | { ok: false, status: 401 | 403 }
//   runFraudJob(job, request, work, deps?) -> Response
//
// Guard: CRON_SECRET unset answers 403 before anything else (fail closed: a deployment that forgot the secret must not run the job
// for everyone). A missing or wrong bearer is 401. The compare is constant-time on equal-length digests.
// JobRun: one row per call. status running -> ok | error, detail = the job's summary JSON, finishedAt set. A throw ends the row as
// "error" with the message; it never stays "running". A job that is switched off by its env keys answers ok with
// detail { disabled: true }: an unset feature is not a failure and must not page anyone.
import { createHash, timingSafeEqual } from "crypto";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { databaseConfigured, db } from "../db";
import type { Env } from "./config";

export type CronAuth = { ok: true } | { ok: false; status: 401 | 403 };

const digest = (value: string): Buffer => createHash("sha256").update(value).digest();

export function authorizeCron(authorization: string | null, env: Env = process.env): CronAuth {
  const secret = (env.CRON_SECRET ?? "").trim();
  if (!secret) return { ok: false, status: 403 };
  const match = /^Bearer\s+(.+)$/i.exec((authorization ?? "").trim());
  if (!match) return { ok: false, status: 401 };
  return timingSafeEqual(digest(match[1].trim()), digest(secret)) ? { ok: true } : { ok: false, status: 401 };
}

export type JobDeps = { env?: Env; client?: Pick<PrismaClient, "jobRun">; now?: () => Date };

const json = (body: unknown, status = 200): Response => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function runFraudJob(job: string, request: Request, work: () => Promise<Record<string, unknown>>, deps: JobDeps = {}): Promise<Response> {
  const auth = authorizeCron(request.headers.get("authorization"), deps.env);
  if (!auth.ok) return json({ ok: false, error: auth.status === 403 ? "forbidden" : "unauthorized" }, auth.status);
  if (!deps.client && !databaseConfigured()) return json({ ok: false, error: "database not configured" }, 503);

  const client = deps.client ?? db();
  const now = deps.now ?? (() => new Date());
  const run = await client.jobRun.create({ data: { job, trigger: "cron", status: "running", startedAt: now() } });
  try {
    const detail = await work();
    await client.jobRun.update({ where: { id: run.id }, data: { status: "ok", detail: detail as Prisma.InputJsonValue, finishedAt: now() } });
    return json({ ok: true, job, detail });
  } catch (e) {
    // The message only: a stack or a response body could carry a credential. The row is how an operator finds out.
    const message = e instanceof Error ? e.message.slice(0, 300) : "failed";
    await client.jobRun.update({ where: { id: run.id }, data: { status: "error", detail: { error: message }, finishedAt: now() } }).catch(() => {});
    return json({ ok: false, job, error: message }, 500);
  }
}
