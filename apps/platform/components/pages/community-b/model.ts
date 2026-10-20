"use client";

// Derived view of the Seasons state: the Season and Era you are in, your streak, quest progress and your own
// leaderboard row. Every value is computed from stored preview state with the pure functions in ./logic, so a
// page and the Overview summary can never disagree.

import { useMemo } from "react";
import { useOre } from "../../../lib/ore-ledger";
import { ME } from "../../../lib/sample/builders";
import { DRAFT_RULES, ERA_CONFIG, QUEST_DEFS, SEASONS, SEASON_CALENDAR_START_ISO, sampleBoardBuilders } from "./data";
import { parseMs } from "./logic/dates";
import { simulateEras } from "./logic/era";
import { completionKey, questProgress, type QuestContext } from "./logic/quests";
import { computeStreak } from "./logic/streak";
import { yourStats, type BoardBuilder } from "./logic/standings";
import { buildSchedule, currentSeason, seasonProgress, seasonWindow } from "./logic/windows";
import { useContributions, usePreviewClock, useQuestCompletions } from "./state";

export const SEASON_SCHEDULE = buildSchedule(parseMs(SEASON_CALENDAR_START_ISO), SEASONS);
const SAMPLE_BOARD = sampleBoardBuilders();

export function useCommunityModel() {
  const clock = usePreviewClock();
  const { items: contributions } = useContributions();
  const { entries: ledger } = useOre();
  const { done: questsDone } = useQuestCompletions();
  const { nowMs } = clock;

  const season = useMemo(() => currentSeason(SEASON_SCHEDULE, nowMs), [nowMs]);
  const progress = useMemo(() => seasonProgress(season.slot, nowMs), [season, nowMs]);
  const seasonWin = useMemo(() => seasonWindow(season.slot), [season]);

  const streak = useMemo(() => computeStreak(contributions.map((c) => parseMs(c.at)), nowMs), [contributions, nowMs]);
  const streakCurrent = streak.current;

  const era = useMemo(
    () =>
      simulateEras(
        ERA_CONFIG,
        contributions.filter((c) => c.type === "ship").map((c) => ({ atMs: parseMs(c.at), points: c.qty * DRAFT_RULES.eraPointsPerShip })),
        nowMs,
      ),
    [contributions, nowMs],
  );

  const questContext = useMemo<QuestContext>(
    () => ({ contributions, window: seasonWin, streakCurrent }),
    [contributions, seasonWin, streakCurrent],
  );
  const quests = useMemo(
    () =>
      QUEST_DEFS.map((def) => {
        const progress = questProgress(def, questContext);
        // Once a quest is recorded as completed it stays completed, even if a log entry is later removed.
        const completedAt = questsDone[completionKey(season.slot.id, def.id)] ?? null;
        return { def, progress, completedAt, complete: progress.complete || completedAt !== null };
      }),
    [questContext, questsDone, season],
  );

  const stats = useMemo(() => yourStats(contributions, ledger, nowMs, season.slot), [contributions, ledger, nowMs, season]);
  const board = useMemo<BoardBuilder[]>(
    () => [...SAMPLE_BOARD, { handle: ME.handle, name: ME.name, track: ME.track, isYou: true, isPublic: true, stats }],
    [stats],
  );

  return { clock, nowMs, contributions, season, progress, seasonWin, streak, era, quests, questsDone, questContext, board, stats };
}
