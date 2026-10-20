// Leaderboard standings. Policy: plans/02-economy-and-rewards.md section 24 (Leaderboards: Season Ore,
// Lifetime Ore, Hours, Track boards, Review Contribution) and section 22 ("Competitive season rankings reset";
// lifetime Track XP, Ore and project history persist). The plans do not fix a scoring window or a list of
// boards beyond that, so the metric/scope/period combinations below are Draft preview rules (data.ts DRAFT_RULES).
//
// Privacy: only builders flagged public are listed. YOU can opt out and are then removed from the ranking
// (everyone else's rank is computed without you), while you still see your own value privately.

import type { TrackName } from "../../../../lib/sample/builders";
import { rankByValue, type Ranked } from "./ranking";
import { countAction, sumJournalHours, type Contribution } from "./quests";
import { seasonWindow, weekWindow, type Period, type SeasonSlot } from "./windows";
import { parseMs } from "./dates";

export type Metric = "level" | "ore" | "reviews" | "hours";
export type Scope = "all" | TrackName;

export const TRACKS: readonly TrackName[] = ["Tools", "Systems", "Compute", "Hardware"];
export const MAX_LEVEL = 15;

export interface PeriodTriple {
  week: number;
  season: number;
  all: number;
}

export interface BuilderStats {
  levels: Record<TrackName, number>;
  ore: PeriodTriple;
  reviews: PeriodTriple;
  hours: PeriodTriple;
}

export interface BoardBuilder {
  handle: string;
  name: string;
  /** Home track. */
  track: TrackName;
  isYou: boolean;
  /** Builder has chosen to appear on public boards. */
  isPublic: boolean;
  stats: BuilderStats;
}

export interface BoardQuery {
  metric: Metric;
  scope: Scope;
  period: Period;
}

/** Track level is lifetime and never resets, so the period does not apply to it. */
export function periodApplies(metric: Metric): boolean {
  return metric !== "level";
}

/** The value a builder holds on a board. Track level in "all" scope is their highest track level. */
export function boardValue(builder: BoardBuilder, query: BoardQuery): number {
  const { metric, scope, period } = query;
  if (metric === "level") {
    if (scope === "all") return Math.max(...TRACKS.map((t) => builder.stats.levels[t]));
    return builder.stats.levels[scope];
  }
  const triple = builder.stats[metric];
  return triple[period];
}

/** Ore, Reviews and Hours boards with a track scope list builders whose home track matches. */
export function inScope(builder: BoardBuilder, query: BoardQuery): boolean {
  if (query.metric === "level") return true;
  return query.scope === "all" || builder.track === query.scope;
}

export interface Board {
  rows: Ranked<BoardBuilder>[];
  you: Ranked<BoardBuilder> | null;
  /** Your value on this board even when you are hidden or unranked. */
  youValue: number;
  /** Sample builders left off because they keep their standing private. */
  privateCount: number;
}

/**
 * Builds one board. Rules: only public builders, only people in scope, only a value above zero (a zero is "no
 * activity in this window", not a rank), YOU removed when `hideYou`.
 */
export function buildBoard(builders: readonly BoardBuilder[], query: BoardQuery, hideYou: boolean): Board {
  const scoped = builders.filter((b) => inScope(b, query));
  const privateCount = scoped.filter((b) => !b.isYou && !b.isPublic && boardValue(b, query) > 0).length;
  const eligible = scoped.filter((b) => b.isPublic && !(b.isYou && hideYou) && boardValue(b, query) > 0);
  const rows = rankByValue(eligible, (b) => boardValue(b, query));
  const you = rows.find((r) => r.row.isYou) ?? null;
  const me = builders.find((b) => b.isYou);
  return { rows, you, youValue: me ? boardValue(me, query) : 0, privateCount };
}

export interface LedgerLike {
  amount: number;
  at: string;
}

/** Highest level a builder can hold from `shipCount` approved ships. Draft rule: one level per approved ship, capped at 15. */
export function levelFromShips(shipCount: number): number {
  return Math.min(MAX_LEVEL, Math.max(0, Math.floor(shipCount)));
}

/**
 * YOUR numbers, derived from your own stored preview state:
 *  - Ore earned: positive Ore ledger entries (the Ore ledger stamps real clock time, so windows only count
 *    entries on or after the window start).
 *  - Reviews and Journal hours: your contribution log, stamped in Preview time.
 *  - Track level: Draft rule, see levelFromShips.
 */
export function yourStats(
  contributions: readonly Contribution[],
  ledger: readonly LedgerLike[],
  nowMs: number,
  season: SeasonSlot,
): BuilderStats {
  const week = weekWindow(nowMs);
  const seasonWin = seasonWindow(season);

  const earned = (from: number | null) =>
    ledger.reduce((sum, e) => (e.amount > 0 && (from === null || parseMs(e.at) >= from) ? sum + e.amount : sum), 0);

  const levels = { Tools: 0, Systems: 0, Compute: 0, Hardware: 0 } as Record<TrackName, number>;
  for (const track of TRACKS) {
    const ships = contributions.filter((c) => c.type === "ship" && c.track === track).reduce((s, c) => s + c.qty, 0);
    levels[track] = levelFromShips(ships);
  }

  return {
    levels,
    ore: { week: earned(week.start), season: earned(seasonWin.start), all: earned(null) },
    reviews: {
      week: countAction(contributions, "review", week),
      season: countAction(contributions, "review", seasonWin),
      all: countAction(contributions, "review", null),
    },
    hours: {
      week: sumJournalHours(contributions, week),
      season: sumJournalHours(contributions, seasonWin),
      all: sumJournalHours(contributions, null),
    },
  };
}
