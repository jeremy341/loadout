// Reads for the Explore feed. Server only (uses the database). One page of cards for the page and for GET /platform-explore:
// the same visibility rules as searchProjects (every stage, drafts included; owner not banned), the stage carried on each card, with the kudos counts, the journal counts and
// the viewer's own flags read in batches for the whole page (never one query per card).
//   journalSummaries(ids) -> Record<id, { entries, lastAt: ISO | null }>   banned authors' entries are not counted
//   loadFeedPage(viewerId, { q, track, saved }, offset) -> { cards, total, next: cursor | null }
import { db } from "./db";
import { kudosCounts, kudosGivenIds, searchProjects } from "./discover-data";
import { FEED_PAGE_SIZE, nextCursor, type FeedCard } from "./explore-feed";
import { normalizeStatus } from "./profile";
import type { Track } from "./progress";

export async function journalSummaries(ids: readonly string[]): Promise<Record<string, { entries: number; lastAt: string | null }>> {
  const out: Record<string, { entries: number; lastAt: string | null }> = Object.fromEntries(ids.map((id) => [id, { entries: 0, lastAt: null }]));
  if (ids.length === 0) return out;
  const groups = await db().journalEntry.groupBy({
    by: ["projectId"],
    where: { projectId: { in: [...ids] }, author: { bannedAt: null } },
    _count: { _all: true },
    _max: { createdAt: true },
  });
  for (const g of groups) out[g.projectId] = { entries: g._count._all, lastAt: g._max.createdAt ? g._max.createdAt.toISOString() : null };
  return out;
}

export async function loadFeedPage(
  viewerId: string,
  filter: { q: string; track: Track | null; saved: boolean },
  offset: number,
): Promise<{ cards: FeedCard[]; total: number; next: string | null }> {
  const { rows, total } = await searchProjects(viewerId, {
    q: filter.q,
    track: filter.track,
    savedOnly: filter.saved,
    openSourceFirst: true,
    limit: FEED_PAGE_SIZE,
    offset,
  });
  const ids = rows.map((row) => row.id);
  const [kudos, given, journal, mine] = await Promise.all([
    kudosCounts(ids),
    kudosGivenIds(viewerId, ids),
    journalSummaries(ids),
    ids.length ? db().project.findMany({ where: { id: { in: ids }, ownerId: viewerId }, select: { id: true } }) : Promise.resolve([]),
  ]);
  const own = new Set(mine.map((p) => p.id));
  const cards = rows.map<FeedCard>((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    track: row.track,
    ownerHandle: row.ownerHandle,
    openSource: row.hasRepo,
    status: normalizeStatus(row.status),
    usedBy: row.usedBy,
    saved: row.saved,
    kudos: kudos[row.id] ?? 0,
    kudosGiven: given[row.id] ?? false,
    own: own.has(row.id),
    entries: journal[row.id]?.entries ?? 0,
    lastAt: journal[row.id]?.lastAt ?? null,
  }));
  return { cards, total, next: nextCursor(offset, cards.length, total) };
}
