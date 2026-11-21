// Double-dip check, the part that reads the database and the Hack Club archive and writes a FraudCheck row. The matching rule itself
// is in double-dip.ts (pure). Ported from Pixl's apps/server/src/ysws/archive.ts (loadArchive: a 10 minute cache, a 60 second pause
// after a failure, a 25 second timeout) at upstream 1468ba6942b13add1ac50e1319541a033ee1df38.
//
// Called once per ship from submitShip (lib/platform/ship-actions.ts), after the submit has already succeeded and off the request
// path. It never throws and never changes the project: the result is one FraudCheck row of kind "double-dip".
//
//   runDoubleDipCheck(projectId, deps?)   -> { status } | { skipped: reason }
import type { PrismaClient } from "../../generated/prisma/client";
import { db } from "../db";
import { archiveUrl, type Env } from "./config";
import { recordCheck, type CheckStore } from "./checks";
import { buildDoubleDip, doubleDipSummary, findInArchive, findInLoadout, indexArchive, normalizeProjectUrl, type ArchiveRow, type OtherShip, type PriorEntry, type TeamMember } from "./double-dip";

const CACHE_MS = 10 * 60_000;
const RETRY_MS = 60_000;
const FETCH_TIMEOUT_MS = 25_000;

type Loaded = { at: number; index: Map<string, ArchiveRow[]> };
let cache: Loaded | null = null;
let failedAt = 0;

export function clearArchiveCache(): void {
  cache = null;
  failedAt = 0;
}

export type ArchiveDeps = { env?: Env; fetch?: typeof fetch; now?: () => number };

// null: the archive is not configured, or could not be read right now (the caller records which). A stale copy is served in
// preference to nothing, as Pixl does: a hiccup at the archive must not blind the check for the next ship.
export async function loadArchive(deps: ArchiveDeps = {}): Promise<{ index: Map<string, ArchiveRow[]> | null; configured: boolean }> {
  const url = archiveUrl(deps.env ?? process.env);
  if (!url) return { index: null, configured: false };
  const now = (deps.now ?? Date.now)();
  if (cache && now - cache.at < CACHE_MS) return { index: cache.index, configured: true };
  if (failedAt && now - failedAt < RETRY_MS) return { index: cache?.index ?? null, configured: true };
  try {
    const response = await (deps.fetch ?? fetch)(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "error", cache: "no-store" });
    if (!response.ok) throw new Error(`status ${response.status}`);
    cache = { at: now, index: indexArchive(await response.json()) };
    failedAt = 0;
  } catch {
    // The reason is not logged with the address: the URL is operator config, but a response body can be anything.
    failedAt = now;
  }
  return { index: cache?.index ?? null, configured: true };
}

type Store = Pick<PrismaClient, "fraudCheck" | "project" | "journalEntry">;

export type DoubleDipDeps = ArchiveDeps & { client?: Store };

export type DoubleDipOutcome = { ok: true; status: "cleared" | "flagged" } | { ok: false; skipped: string };

export async function runDoubleDipCheck(projectId: string, deps: DoubleDipDeps = {}): Promise<DoubleDipOutcome> {
  try {
    const client: Store = deps.client ?? db();
    const project = await client.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        repoUrl: true,
        demoUrl: true,
        owner: { select: { id: true, displayName: true, slackId: true } },
        collaborators: { where: { status: "accepted" }, select: { person: { select: { id: true, displayName: true, slackId: true } } } },
      },
    });
    if (!project) return { ok: false, skipped: "project not found" };
    const repoUrl = (project.repoUrl ?? "").trim();
    const demoUrl = (project.demoUrl ?? "").trim();
    if (!normalizeProjectUrl(repoUrl) && !normalizeProjectUrl(demoUrl)) return { ok: false, skipped: "no links to compare" };

    // Candidates: other projects whose stored link contains this link's normalized form. The database compare is a loose
    // "contains" (links are stored as typed: http or https, www, a trailing slash, .git), so double-dip.ts makes the exact call.
    const stems = [repoUrl, demoUrl].map(normalizeProjectUrl).filter((s) => s !== "");
    const others = await client.project.findMany({
      where: {
        id: { not: project.id },
        OR: stems.flatMap((stem) => [{ repoUrl: { contains: stem, mode: "insensitive" as const } }, { demoUrl: { contains: stem, mode: "insensitive" as const } }]),
      },
      select: { id: true, title: true, status: true, repoUrl: true, demoUrl: true, approvedMinutes: true, statusChangedAt: true, owner: { select: { slackId: true } } },
      take: 200,
    });
    const ships: OtherShip[] = others.map((o) => ({
      id: o.id,
      title: o.title,
      status: o.status,
      repoUrl: o.repoUrl,
      demoUrl: o.demoUrl,
      approvedMinutes: o.approvedMinutes,
      approvedAt: o.statusChangedAt,
      ownerSlackId: o.owner.slackId,
    }));

    const matches: PriorEntry[] = findInLoadout({ id: project.id, repoUrl, demoUrl }, ships);
    const skipped: string[] = [];
    const archive = await loadArchive(deps);
    if (archive.index) matches.push(...findInArchive(archive.index, repoUrl, demoUrl));
    else if (archive.configured) skipped.push("YSWS archive unavailable");

    // Each person's own claimed time is their journal hours on this project (Hackatime is not linked to the desk yet).
    const journals = await client.journalEntry.groupBy({ by: ["authorId"], where: { projectId: project.id }, _sum: { hours: true } });
    const hoursBy = new Map(journals.map((j) => [j.authorId, j._sum.hours ?? 0]));
    const team = (person: { id: string; displayName: string; slackId: string | null }): TeamMember => ({
      slackId: person.slackId ?? "",
      label: person.displayName,
      claimedHours: Math.round((hoursBy.get(person.id) ?? 0) * 10) / 10,
    });
    const result = buildDoubleDip({
      project: { name: project.title },
      matches,
      trackedSeconds: (hoursBy.get(project.owner.id) ?? 0) * 3600,
      collaborators: project.collaborators.map((c) => team(c.person)),
      ownerLabel: project.owner.displayName,
      ownerSlackId: project.owner.slackId,
    });

    const status = result.flagDetail ? "flagged" : "cleared";
    const written = await recordCheck(
      {
        projectId: project.id,
        kind: "double-dip",
        status,
        summary: doubleDipSummary(result, matches, skipped),
        detail: {
          systemNote: result.systemNote,
          matches: matches.slice(0, 20).map((m) => ({ url: m.url, program: m.program, hours: m.hours, approvedAt: m.approvedAt, title: m.title ?? null })),
          skipped,
        },
      },
      client as CheckStore,
    );
    return written.ok ? { ok: true, status } : { ok: false, skipped: written.reason };
  } catch {
    // A failed evidence write must never reach the builder's submit. The next ship asks again.
    return { ok: false, skipped: "check failed" };
  }
}
