"use client";

import { useEffect } from "react";
import { usePreviewState } from "../../../lib/preview-store";
import { useBuildClock } from "./clock";
import {
  KEYS,
  SEED_JOURNALS,
  SEED_MISSION_PROGRESS,
  SEED_PENALTY,
  SEED_PROJECTS,
  SEED_REVIEWS,
  SEED_SHIPS,
} from "./data";
import { settleShips } from "./engine";
import type { MissionProgress } from "./logic/missions";
import type { FlagPenaltyState, JournalEntry, Project, ReviewsState, Ship } from "./logic/types";

// Typed hooks over the preview store. Each returns [value, set, hydrated] like usePreviewState.

export const useProjects = () => usePreviewState<Project[]>(KEYS.projects, SEED_PROJECTS);
export const useJournals = () => usePreviewState<JournalEntry[]>(KEYS.journals, SEED_JOURNALS);
export const useShips = () => usePreviewState<Ship[]>(KEYS.ships, SEED_SHIPS);
export const useReviewsState = () => usePreviewState<ReviewsState>(KEYS.reviews, SEED_REVIEWS);
export const useMissionProgress = () => usePreviewState<MissionProgress[]>(KEYS.missions, SEED_MISSION_PROGRESS);
export const usePenalty = () => usePreviewState<FlagPenaltyState>(KEYS.penalty, SEED_PENALTY);

/**
 * Runs the automatic ship transitions (award lock, payout) whenever time, journals, reviews or ships change.
 * Mount it once on each Build page. It writes only when something actually changed.
 */
export function useSettleShips() {
  const clock = useBuildClock();
  const [ships] = useShips();
  const [journals] = useJournals();
  const [reviews] = useReviewsState();
  useEffect(() => {
    settleShips();
  }, [clock.now, ships, journals, reviews]);
}
