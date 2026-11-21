import { headers } from "next/headers";
import { sql } from "./pgCompat";
import { clientIp } from "./auditTarget";

// Writes one row to the shared audit_log table (migration 0214_audit_log.sql).
// Fire-and-forget: a failed insert goes to stderr and never breaks the page or
// action that triggered it. `meta` must never carry tokens, secrets or player
// PII - callers pass ids and field names, not values.

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

export async function audit(entry: AuditEntry, req?: Request): Promise<void> {
  const info = req
    ? {
        ip: clientIp((n) => req.headers.get(n)),
        userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
      }
    : await requestInfo();
  const actorType = entry.actorType ?? (entry.slackId ? "staff" : "anonymous");
  const row = {
    app: "internal-dashboard",
    actor_type: actorType,
    actor_id: entry.actorId ?? entry.slackId ?? null,
    slack_id: entry.slackId ?? null,
    action: entry.action.slice(0, 120),
    target: entry.target?.slice(0, 200) ?? null,
    result: entry.result,
    ip: info.ip,
    user_agent: info.userAgent,
    meta: JSON.stringify(entry.meta ?? {}),
  };
  void Promise.resolve()
    .then(
      () => sql`
        insert into audit_log (app, actor_type, actor_id, slack_id, action, target, result, ip, user_agent, meta)
        values (${row.app}, ${row.actor_type}, ${row.actor_id}, ${row.slack_id}, ${row.action},
                ${row.target}, ${row.result}, ${row.ip}, ${row.user_agent}, ${row.meta}::jsonb)
      `,
    )
    .catch((e) => console.error("[audit] insert failed", row.action, (e as Error).message));
}
