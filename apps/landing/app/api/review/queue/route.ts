import { clientIp, UNKNOWN_IP } from "@/lib/platform/client-ip";
import { db } from "@/lib/platform/db";
import { checkLimit, rateLimitHeaders } from "@/lib/platform/rate-limit-db";
import { waitStart } from "@/lib/platform/review-rules";

export const dynamic = "force-dynamic";

// Public by design (the Review Queue page and anyone looking up a place in line), so it shows as little as the page needs:
// first-review rows only, with the project title and the builder handle, and times rounded down to the hour. Rows in final
// checks (second pass) are not listed; only their count is. Each address may ask 60 times a minute. When no proxy is trusted every
// caller shares the "unknown" address (lib/platform/client-ip.ts), so that one bucket is sized for the whole audience.
const QUEUE_PER_MINUTE = { limit: 60, windowMs: 60_000 } as const;
const SHARED_PER_MINUTE = { limit: 1200, windowMs: 60_000 } as const;
const HOUR_MS = 3_600_000;

// Rounds a time down to the hour, so the exact moment a person shipped is not published.
function toHour(at: Date): string {
  return new Date(Math.floor(at.getTime() / HOUR_MS) * HOUR_MS).toISOString();
}

type Waiting = { at: number; row: QueueRow };

// Placed by the exact wait start (kept only here), published rounded down to the hour. final_checks stays an empty list so a reader
// that still expects the key keeps working; final_checks_count carries the number.
function publicQueue(queue: { waiting: Waiting[]; final_checks_count: number }) {
  const waiting = [...queue.waiting].sort((a, b) => a.at - b.at || a.row.id - b.row.id).map((entry) => entry.row);
  return { waiting, final_checks: [] as QueueRow[], final_checks_count: queue.final_checks_count };
}

type QueueRow = {
  id: number;
  name: string;
  owner_name: string | null;
  project_type: string | null;
  shipped_at: string;
  wait_start: string;
};

export async function GET(request: Request) {
  const ip = clientIp(request);
  const limit = await checkLimit({ key: `review-queue:${ip}:minute`, ...(ip === UNKNOWN_IP ? SHARED_PER_MINUTE : QUEUE_PER_MINUTE) });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...rateLimitHeaders(limit), "Cache-Control": "no-store" } },
    );
  }
  const now = new Date();
  const database = db();
  const [projects, verdicts] = await Promise.all([
    database.project.findMany({
      where: {
        status: { in: ["submitted", "in-review", "second-pass"] },
        submittedAt: { not: null },
        bannedAt: null,
        owner: { bannedAt: null, handle: { not: null } },
      },
      select: {
        seq: true,
        title: true,
        track: true,
        status: true,
        submittedAt: true,
        firstShippedAt: true,
        isUpdate: true,
        owner: { select: { handle: true } },
      },
    }),
    database.auditEvent.findMany({
      where: {
        action: "review.verdict",
        createdAt: { gte: new Date(now.getTime() - 86_400_000) },
      },
      select: { after: true },
    }),
  ]);

  const queues = {
    software: { waiting: [] as Waiting[], final_checks_count: 0 },
    hardware: { waiting: [] as Waiting[], final_checks_count: 0 },
  };
  for (const project of projects) {
    if (!project.submittedAt) continue;
    const startedAt = waitStart({
      firstShippedAt: project.firstShippedAt,
      updateShippedAt: project.submittedAt,
      isUpdate: project.isUpdate,
    }) ?? project.submittedAt;
    const queue = project.track?.toLowerCase() === "hardware" ? queues.hardware : queues.software;
    if (project.status === "second-pass") {
      // Not listed: who is in final checks is not public. The count stays, for the pipeline summary.
      queue.final_checks_count++;
      continue;
    }
    queue.waiting.push({
      at: startedAt.getTime(),
      row: {
        id: project.seq,
        name: project.title,
        owner_name: project.owner.handle,
        project_type: project.track,
        shipped_at: toHour(project.submittedAt),
        wait_start: toHour(startedAt),
      },
    });
  }

  const reviewed_24h = { approved: 0, needs_changes: 0 };
  for (const { after } of verdicts) {
    if (!after || typeof after !== "object" || Array.isArray(after)) continue;
    const verdict = after.verdict;
    if (verdict === "approved" || verdict === "needs_changes") reviewed_24h[verdict]++;
  }

  return Response.json({
    generated_at: now.toISOString(),
    reviewed_24h,
    queues: {
      software: publicQueue(queues.software),
      hardware: publicQueue(queues.hardware),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
