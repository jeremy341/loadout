"use client";

// The one hook other modules (the Overview page) call to show Leaderboards, Seasons and Events progress.
// It reads the same stored preview state as the three pages, so the numbers always match them.

import { SAMPLE_EVENTS, seasonLabel } from "./data";
import { buildBoard } from "./logic/standings";
import { eraProgressPct } from "./logic/era";
import { myRsvp } from "./logic/events";
import { useCommunityModel } from "./model";
import { useCertificates, useEventsState, usePrivacy } from "./state";
import { ME } from "../../../lib/sample/builders";

export interface CommunityBSummary {
  /** For example "S00 // BOOT". */
  seasonName: string;
  /** Whole percent of the current Season elapsed on the Preview calendar. */
  seasonProgressPct: number;
  /** For example "STEAM". Illustrative: the Era sequence is not a launch order. */
  eraName: string;
  /** Whole percent of the Draft Era threshold reached. */
  eraProgressPct: number;
  questsDone: number;
  questsTotal: number;
  /** Current weekly streak, in weeks. */
  streakWeeks: number;
  /** Your rank on the Ore earned board this Season, or null when you are hidden or not ranked yet. */
  leaderboardRank: { overall: number | null; track: number | null };
  /** Events you hold a seat for or wait on. */
  eventsRsvped: number;
  certificates: number;
}

export function useCommunityBSummary(): CommunityBSummary {
  const model = useCommunityModel();
  const { hideFromBoards } = usePrivacy();
  const { state: events } = useEventsState();
  const { items: certs } = useCertificates();

  const overall = buildBoard(model.board, { metric: "ore", scope: "all", period: "season" }, hideFromBoards).you?.rank ?? null;
  const track = buildBoard(model.board, { metric: "ore", scope: ME.track, period: "season" }, hideFromBoards).you?.rank ?? null;

  const slot = model.season.slot;
  const questsDone = model.quests.filter((q) => q.complete).length;

  const eventsRsvped = SAMPLE_EVENTS.filter((event) => {
    const rec = events.rsvps[event.id];
    return rec?.wants && myRsvp(event, events.drops[event.id] ?? 0, true, rec.held).status !== "none";
  }).length;

  return {
    seasonName: seasonLabel(slot),
    seasonProgressPct: model.progress.pct,
    eraName: model.era.current.spec.name,
    eraProgressPct: eraProgressPct(model.era.current),
    questsDone,
    questsTotal: model.quests.length,
    streakWeeks: model.streak.current,
    leaderboardRank: { overall, track },
    eventsRsvped,
    certificates: certs.length,
  };
}
