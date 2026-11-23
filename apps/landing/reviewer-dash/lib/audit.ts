import { headers } from "next/headers";
import type { Prisma } from "@/lib/generated/prisma/client";
import { databaseConfigured, db } from "@/lib/platform/db";
import { clientIp } from "./auditTarget";

// Writes one row to LOADOUT's real AuditEvent table. The copied Pixl desk used a `sql` helper backed by the sample store, so every
// guard-level allow/denied row was silently discarded. Staging must never claim an audit it did not persist.
// Fire-and-forget: a failed insert goes to stderr and never breaks the action or page that triggered it. `meta` must never carry
// tokens, secrets or player PII — callers pass ids and field names, not values.

export type AuditResult = "ok" | "denied" | "error";

export interface AuditEntry {
  action: string;
  result: AuditResult;
  actorType?: "staff" | "service" | "anonymous";
  actorId?: string | null;
  slackId?: string | null;
  target?: string | null;
  meta?: Record<string, unknown>;
}

async function requestInfo(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    return { ip: clientIp((n) => h.get(n)), userAgent: h.get("user-agent")?.slice(0, 400) ?? null };
  } catch {
    // Outside a request scope (e.g. a script); nothing to record.
    return { ip: null, userAgent: null };
  }
}

// Kept pure so the mapping can be tested without a database.
export function toAuditEvent(entry: AuditEntry, info: { ip: string | null; userAgent: string | null }) {
  const actorType = entry.actorType ?? (entry.slackId ? "staff" : "anonymous");
  return {
    actorId: entry.actorId ?? entry.slackId ?? `anonymous:${actorType}`,
    action: `guard.${entry.action.slice(0, 120)}`,
    targetType: "Guard",
    targetId: entry.target?.slice(0, 200) ?? "",
    reason: `result=${entry.result}`,
    after: {
      result: entry.result,
      actorType,
      slackId: entry.slackId ?? null,
      ip: info.ip,
      userAgent: info.userAgent,
      meta: entry.meta ?? {},
    } as Prisma.InputJsonValue,
  };
}

export async function audit(entry: AuditEntry, req?: Request): Promise<void> {
  const info = req
    ? {
        ip: clientIp((n) => req.headers.get(n)),
        userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
      }
    : await requestInfo();
  if (!databaseConfigured()) return;
  const row = toAuditEvent(entry, info);
  void Promise.resolve()
    .then(() => db().auditEvent.create({ data: row }))
    .catch((e) => console.error("[audit] insert failed", row.action, (e as Error).message));
}
