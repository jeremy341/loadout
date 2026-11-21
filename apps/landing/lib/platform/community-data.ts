// Community reads and writes. Server only (uses the database). The pure rules and the still-fixture parts live in
// community.ts; this file only picks rows. The fronts it serves:
//   - Goals (CommunityGoal): open goals first, closed ones after. The current figure and the target are staff-written; nothing
//     counts up on its own, so a goal reads exactly as it was written (the reviewer site or the seed script writes it).
//   - News (News): the staff-authored programme notes, newest first, with the author's handle when they have one.
//   - Events (Event) with the live RSVP count (EventRsvp): a stopped event is not listed, because a stop closes it for
//     builders immediately (the reviewer site's Stop says so).
//   - The leaderboard: the same nightly snapshot totals that serve /api/v1/leaderboards/hours (lib/platform/api-v1/
//     queries-data.ts), filtered to people who turned stats on. The math is theirs; this file never recomputes hours.
import { Prisma } from "../generated/prisma/client";
import { latestSnapshot, visibleStatsPeople } from "./api-v1/queries-data";
import { db } from "./db";
import { isRsvpOpen, visibleSnapshotRows, type CommunityGoalView, type LeaderRow, type LeaderboardRange } from "./community";
import { createRateLimiter } from "./rate-limit";
import { LEADERBOARD_SIZE } from "./stats";

// ---- Goals ----

export type GoalRow = CommunityGoalView;

// Every goal, the open ones first (oldest first, newest ones after them), then the closed ones by the time they closed.
// A closed goal stays on the page with its closed date, because a shared goal that was met is part of the story.
export async function listGoals(): Promise<GoalRow[]> {
  const rows = await db().communityGoal.findMany({ orderBy: [{ closedAt: "asc" }, { createdAt: "asc" }] });
  const open = rows.filter((row) => row.closedAt === null);
  const closed = rows.filter((row) => row.closedAt !== null).sort((a, b) => (a.closedAt as Date).getTime() - (b.closedAt as Date).getTime());
  return [...open, ...closed].map((row) => ({
    id: row.id,
    key: row.key,
    title: row.title,
    body: row.body,
    current: row.current,
    target: row.target,
    endsAt: row.endsAt,
    closedAt: row.closedAt,
  }));
}

// The Overview strip: the open goals, in the same order as the Goals page.
export async function openGoals(): Promise<GoalRow[]> {
  return (await listGoals()).filter((goal) => goal.closedAt === null);
}

// ---- News ----

export type NewsRow = { id: string; title: string; body: string; authorHandle: string | null; publishedAt: Date; authorId: string };

// The programme notes, newest first. News keeps the author's Person id but no relation column, so the authors are read
// separately; a banned author's handle is left out, the same way a banned builder's handle is never shown elsewhere.
export async function listNews(limit = 50): Promise<NewsRow[]> {
  const rows = await db().news.findMany({
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit,
    select: { id: true, title: true, body: true, publishedAt: true, authorId: true },
  });
  const authors = await db().person.findMany({
    where: { id: { in: [...new Set(rows.map((row) => row.authorId))] } },
    select: { id: true, handle: true, bannedAt: true },
  });
  const handleOf = new Map(authors.filter((person) => person.bannedAt === null).map((person) => [person.id, person.handle]));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt: row.publishedAt,
    authorId: row.authorId,
    authorHandle: handleOf.get(row.authorId) ?? null,
  }));
}

// ---- Events and RSVPs ----

export type EventRow = {
  id: string;
  title: string;
  body: string;
  kind: string;
  startsAt: Date;
  endsAt: Date | null;
  rsvpCount: number;
  viewerGoing: boolean;
};

// The events builders may act on: not stopped, soonest first. The RSVP count is the live count of EventRsvp rows (banned
// builders' rows are left out of the count, and the page shows the whole number only, never who is going).
export async function listEvents(viewerId: string): Promise<EventRow[]> {
  const rows = await db().event.findMany({ where: { stoppedAt: null }, orderBy: { startsAt: "asc" } });
  const [counts, mine] = await Promise.all([
    db().eventRsvp.groupBy({ by: ["eventId"], where: { eventId: { in: rows.map((row) => row.id) }, person: { bannedAt: null } }, _count: { _all: true } }),
    db().eventRsvp.findMany({ where: { personId: viewerId, eventId: { in: rows.map((row) => row.id) } }, select: { eventId: true } }),
  ]);
  const countOf = new Map(counts.map((row) => [row.eventId, row._count._all]));
  const going = new Set(mine.map((row) => row.eventId));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    kind: row.kind,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    rsvpCount: countOf.get(row.id) ?? 0,
    viewerGoing: going.has(row.id),
  }));
}

export type RsvpResult = { ok: true; going: boolean } | { ok: false; message: string };

const rsvpLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
const SLOW_DOWN: RsvpResult = { ok: false, message: "Slow down a little and try again." };
const NOT_FOUND: RsvpResult = { ok: false, message: "That event is not taking RSVPs." };

// One builder's RSVP in or out. One row per person and event (the unique pair), so a second press flips the first. The event
// must have started and not yet ended, and must not have been stopped; the write answers clearly when the window closed
// while the page was open. A double press racing the first press is the state asked for, so the clash is fine.
export async function toggleRsvp(viewerId: string, eventId: string): Promise<RsvpResult> {
  if (!rsvpLimiter.check(`rsvp:${viewerId}`).ok) return SLOW_DOWN;
  const event = await db().event.findUnique({
    where: { id: eventId },
    select: { startsAt: true, endsAt: true, stoppedAt: true },
  });
  if (!event || event.stoppedAt) return NOT_FOUND;
  if (!isRsvpOpen({ startsAt: event.startsAt, endsAt: event.endsAt, stoppedAt: event.stoppedAt })) {
    return { ok: false, message: "RSVPs for that event have closed." };
  }

  const existing = await db().eventRsvp.findUnique({ where: { eventId_personId: { eventId, personId: viewerId } }, select: { id: true } });
  if (existing) {
    await db().eventRsvp.deleteMany({ where: { eventId, personId: viewerId } });
    return { ok: true, going: false };
  }
  try {
    await db().eventRsvp.create({ data: { eventId, personId: viewerId } });
  } catch (e) {
    // A second press racing the first: the row exists, which is the state asked for.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: true, going: true };
    throw e;
  }
  return { ok: true, going: true };
}

// ---- Leaderboard ----

export type LeaderboardView = { range: LeaderboardRange; asOf: string | null; rows: LeaderRow[] };

// The leaderboard, from the nightly snapshot that /api/v1/leaderboards/hours serves. Only people who turned statsVisible on
// and still have a handle are listed, checked on every read, so turning stats off takes effect at once even though the
// snapshot is written nightly. Equal hours share a rank (rankRows); the hours themselves are the snapshot's.
export async function leaderboard(range: LeaderboardRange): Promise<LeaderboardView> {
  const row = await latestSnapshot(`leaderboard-${range}`);
  const stored = (row?.data as { rows?: { personId: string; hours: number }[] } | undefined)?.rows ?? [];
  const visible = await visibleStatsPeople(stored.map((entry) => entry.personId));
  const rows = visibleSnapshotRows(stored, visible, LEADERBOARD_SIZE);
  return { range, asOf: row ? row.day.toISOString().slice(0, 10) : null, rows };
}
