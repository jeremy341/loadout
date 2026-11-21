// The daily StatSnapshot job. Server only (uses the database). The rules are in stats.ts; this file reads the counts and upserts
// one row per day and kind. Run it once a day from scripts/snapshot-stats.ts. It is safe to run twice on the same day: the
// rows are replaced, not added.
//
// API:
//   computeSnapshots(now) -> { day, rows: { kind, data }[] }       reads only; no writes
//   refreshStats(now?) -> { day, counts: Record<SnapshotKind, number> }   computes and upserts; counts are numbers only
import type { Prisma } from "../generated/prisma/client";
import { db } from "./db";
import { TRACKS } from "./progress";
import {
  ACTIVE_BUILDER_DAYS,
  buildOverview,
  buildTracks,
  countDistinct,
  LEADERBOARD_STORED,
  rankLeaderboard,
  snapshotDay,
  type SnapshotKind,
  WEEK_DAYS,
  windowStartDay,
} from "./stats";

export type SnapshotRow = { kind: SnapshotKind; data: Prisma.InputJsonValue };

const MS_KEY = "\u0000";

function midnight(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export async function computeSnapshots(now: Date): Promise<{ day: string; rows: SnapshotRow[] }> {
  const day = snapshotDay(now);
  const activeFrom = midnight(windowStartDay(day, ACTIVE_BUILDER_DAYS));
  const weekFrom = midnight(windowStartDay(day, WEEK_DAYS));

  const [totalBuilders, journalAuthors, hourPeople, hoursTotal, shipped, perName, hackatimeProjects, visible] = await Promise.all([
    db().person.count({ where: { handle: { not: null }, bannedAt: null } }),
    db().journalEntry.findMany({ where: { createdAt: { gte: activeFrom } }, distinct: ["authorId"], select: { authorId: true } }),
    db().hoursDay.findMany({ where: { day: { gte: activeFrom }, seconds: { gt: 0 } }, distinct: ["personId"], select: { personId: true } }),
    db().hoursDay.aggregate({ _sum: { seconds: true } }),
    db().project.count({ where: { firstShippedAt: { not: null } } }),
    db().hoursDay.groupBy({ by: ["personId", "hackatimeName"], _sum: { seconds: true } }),
    db().hackatimeProject.findMany({ select: { personId: true, name: true, project: { select: { track: true } } } }),
    db().person.findMany({ where: { statsVisible: true, bannedAt: null, handle: { not: null } }, select: { id: true, handle: true } }),
  ]);

  const active = countDistinct([...journalAuthors.map((r) => r.authorId), ...hourPeople.map((r) => r.personId)]);
  const rows: SnapshotRow[] = [
    {
      kind: "overview",
      data: buildOverview({
        totalBuilders,
        activeBuilders: active,
        hoursLogged: hoursTotal._sum.seconds ?? 0,
        projectsShipped: shipped,
      }) as Prisma.InputJsonValue,
    },
  ];

  // Tracks: hours come from Hackatime projects mapped to a LOADOUT project on a track. Unmapped hours are not counted here.
  const trackOf = new Map<string, string>();
  for (const project of hackatimeProjects) {
    const track = project.project?.track;
    if (track) trackOf.set(`${project.personId}${MS_KEY}${project.name}`, track);
  }
  const byTrack = new Map<string, { seconds: number; people: string[] }>(TRACKS.map((t) => [t, { seconds: 0, people: [] }]));
  for (const row of perName) {
    const track = trackOf.get(`${row.personId}${MS_KEY}${row.hackatimeName}`);
    const seconds = row._sum.seconds ?? 0;
    if (!track || seconds <= 0) continue;
    const bucket = byTrack.get(track);
    if (!bucket) continue;
    bucket.seconds += seconds;
    bucket.people.push(row.personId);
  }
  const trackRows = TRACKS.map((track) => {
    const bucket = byTrack.get(track) ?? { seconds: 0, people: [] };
    return { track, seconds: bucket.seconds, builders: countDistinct(bucket.people) };
  });
  rows.push({ kind: "tracks", data: buildTracks(trackRows) as unknown as Prisma.InputJsonValue });

  // Leaderboards: only people who turned statsVisible on. The stored list is longer than the served one (see stats.ts).
  const visibleMap = new Map(visible.map((p) => [p.id, p.handle ?? ""]));
  const visibleIds = [...visibleMap.keys()];
  const [week, all] = await Promise.all([
    visibleIds.length
      ? db().hoursDay.groupBy({ by: ["personId"], where: { personId: { in: visibleIds }, day: { gte: weekFrom } }, _sum: { seconds: true } })
      : Promise.resolve([]),
    visibleIds.length
      ? db().hoursDay.groupBy({ by: ["personId"], where: { personId: { in: visibleIds } }, _sum: { seconds: true } })
      : Promise.resolve([]),
  ]);
  for (const [kind, groups] of [
    ["leaderboard-week", week],
    ["leaderboard-all", all],
  ] as const) {
    const ranked = rankLeaderboard(
      groups.map((g) => ({ personId: g.personId, seconds: g._sum.seconds ?? 0 })),
      visibleMap,
      LEADERBOARD_STORED,
    );
    rows.push({ kind, data: { rows: ranked.map((r) => ({ personId: r.personId, handle: r.handle, hours: r.hours })) } });
  }

  return { day, rows };
}

export async function refreshStats(now: Date = new Date()): Promise<{ day: string; counts: Record<SnapshotKind, number> }> {
  const { day, rows } = await computeSnapshots(now);
  const dayDate = midnight(day);
  await db().$transaction(
    rows.map((row) =>
      db().statSnapshot.upsert({
        where: { day_kind: { day: dayDate, kind: row.kind } },
        create: { day: dayDate, kind: row.kind, data: row.data },
        update: { data: row.data },
      }),
    ),
  );
  const counts = { overview: 0, tracks: 0, "leaderboard-week": 0, "leaderboard-all": 0 } as Record<SnapshotKind, number>;
  for (const row of rows) {
    const data = row.data as { rows?: unknown[] };
    counts[row.kind] = Array.isArray(data.rows) ? data.rows.length : 1;
  }
  return { day, counts };
}

