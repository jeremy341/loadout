// Real hours from synced Hackatime days. Pure helpers first (no database), then database reads (server only).
// Days are UTC "YYYY-MM-DD" strings. Pending vs approved hours are not here: they stay derived from journals and review.
//
// API (pure):
//   sumByDay(rows: {day, seconds}[]) -> {day, seconds}[]                 sorted by day
//   sumByTrack(rows: {name, seconds}[], trackByName: Map<string, string|null>) -> {track, seconds}[]   unmapped and unknown
//                                                                         names go under track null; largest first
//   bucket(rows: {day, seconds}[], granularity: "day" | "week") -> {start, seconds}[]   week starts on Monday (ISO)
// API (database):
//   hoursByDay(personId, from, to)  -> {day, seconds}[]    inclusive window
//   hoursByTrack(personId)          -> {track, seconds}[]  HackatimeProject.projectId -> Project.track
//   totalSeconds(personId)          -> number
//   realHoursOrNull(personId)       -> RealHours | null    null when the person has no Hackatime link
import { db } from "../db";
import { addDays, dayKey } from "./rules";

export type DaySeconds = { day: string; seconds: number };
export type TrackSeconds = { track: string | null; seconds: number };
export type RealHours = {
  totalSeconds: number;
  byTrack: TrackSeconds[];
  lastSyncAt: Date | null;
  lastStatus: string | null;
};

export function sumByDay(rows: DaySeconds[]): DaySeconds[] {
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.day, (totals.get(r.day) ?? 0) + r.seconds);
  return [...totals.entries()].map(([day, seconds]) => ({ day, seconds })).sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

export function sumByTrack(
  rows: { name: string; seconds: number }[],
  trackByName: Map<string, string | null>,
): TrackSeconds[] {
  const totals = new Map<string | null, number>();
  for (const r of rows) {
    const track = trackByName.get(r.name) ?? null;
    totals.set(track, (totals.get(track) ?? 0) + r.seconds);
  }
  return [...totals.entries()].map(([track, seconds]) => ({ track, seconds })).sort((a, b) => b.seconds - a.seconds);
}

// Monday of the ISO week containing `day`.
function weekStart(day: string): string {
  const dow = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(day, -dow);
}

export function bucket(rows: DaySeconds[], granularity: "day" | "week"): { start: string; seconds: number }[] {
  const keyed = rows.map((r) => ({ start: granularity === "week" ? weekStart(r.day) : r.day, seconds: r.seconds }));
  return sumByDay(keyed.map((r) => ({ day: r.start, seconds: r.seconds }))).map((r) => ({ start: r.day, seconds: r.seconds }));
}

const UTC_DAY = (day: string) => new Date(`${day}T00:00:00.000Z`);

export async function hoursByDay(personId: string, from: string, to: string): Promise<DaySeconds[]> {
  const rows = await db().hoursDay.findMany({
    where: { personId, day: { gte: UTC_DAY(from), lte: UTC_DAY(to) } },
    select: { day: true, seconds: true },
  });
  return sumByDay(rows.map((r) => ({ day: dayKey(r.day), seconds: r.seconds })));
}

export async function hoursByTrack(personId: string): Promise<TrackSeconds[]> {
  const [projects, grouped] = await Promise.all([
    db().hackatimeProject.findMany({
      where: { personId },
      select: { name: true, project: { select: { track: true } } },
    }),
    db().hoursDay.groupBy({ by: ["hackatimeName"], where: { personId }, _sum: { seconds: true } }),
  ]);
  const trackByName = new Map(projects.map((p) => [p.name, p.project?.track ?? null]));
  return sumByTrack(
    grouped.map((g) => ({ name: g.hackatimeName, seconds: g._sum.seconds ?? 0 })),
    trackByName,
  );
}

export async function totalSeconds(personId: string): Promise<number> {
  const agg = await db().hoursDay.aggregate({ where: { personId }, _sum: { seconds: true } });
  return agg._sum.seconds ?? 0;
}

export async function realHoursOrNull(personId: string): Promise<RealHours | null> {
  const link = await db().hackatimeLink.findUnique({
    where: { personId },
    select: { lastSyncAt: true, lastStatus: true },
  });
  if (!link) return null;
  const [byTrack, total] = await Promise.all([hoursByTrack(personId), totalSeconds(personId)]);
  return { totalSeconds: total, byTrack, lastSyncAt: link.lastSyncAt, lastStatus: link.lastStatus };
}
