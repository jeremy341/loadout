// Reading the server's AI pre-check results (apps/server/src/precheck/).
// Pure functions only so the queue rule is unit-testable.

// A ship stays out of the review queue while its pre-check runs, but never
// longer than this: a crashed or hung run only delays a project.
export const PRECHECK_HIDE_MS = 5 * 60_000;

export interface PrecheckRow {
  ai_review_status?: string | null;
  ai_review_started_at?: string | null;
}

export function isPrecheckRunning(p: PrecheckRow, now = Date.now()): boolean {
  if (p.ai_review_status !== "pending" || !p.ai_review_started_at) return false;
  const started = new Date(p.ai_review_started_at).getTime();
  return Number.isFinite(started) && now - started < PRECHECK_HIDE_MS;
}

export interface PrecheckView {
  status: "pending" | "clear" | "flagged" | "sent_back" | "error";
  summary: string;
  findings: { id: string; label: string; evidence: string }[];
  notes: string[];
  skipped: string;
}

const STATUSES = new Set(["pending", "clear", "flagged", "sent_back", "error"]);

// null for projects the pre-check never ran on.
export function precheckView(p: PrecheckRow & {
  ai_review_summary?: string | null;
  ai_review_findings?: unknown;
  ai_review_error?: string | null;
}): PrecheckView | null {
  const status = p.ai_review_status ?? "";
  if (!STATUSES.has(status)) return null;
  const raw = (p.ai_review_findings ?? {}) as { findings?: unknown; notes?: unknown };
  const findings = Array.isArray(raw.findings)
    ? raw.findings
        .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
        .map((f) => ({ id: String(f.id ?? ""), label: String(f.label ?? ""), evidence: String(f.evidence ?? "") }))
    : [];
  const notes = Array.isArray(raw.notes) ? raw.notes.map(String).filter(Boolean) : [];
  return {
    status: status as PrecheckView["status"],
    summary: String(p.ai_review_summary ?? ""),
    findings,
    notes,
    skipped: String(p.ai_review_error ?? ""),
  };
}
