"use client";

import { useMemo } from "react";
import { useBuildClock } from "./clock";
import { reviewsDoneCount } from "./engine";
import { computeBuildSummary, type BuildSummary } from "./logic/summary";
import { useJournals, useMissionProgress, useProjects, useReviewsState, useSettleShips, useShips } from "./store";

export type { BuildSummary };

/**
 * What the Build tabs know, for the Overview, Profile and Achievements pages. It reads the same saved preview state as
 * the Projects, Journals, Reviews and Missions tabs, so the numbers always agree. Before the browser has loaded the
 * saved state it returns the sample seed, exactly like the tabs do.
 */
export function useBuildSummary(): BuildSummary {
  // Ships move on their own once their time gates pass, so settle them wherever the summary is shown.
  useSettleShips();
  const [projects] = useProjects();
  const [journals] = useJournals();
  const [ships] = useShips();
  const [reviews] = useReviewsState();
  const [missions] = useMissionProgress();
  const clock = useBuildClock();
  const reviewsDone = reviewsDoneCount(reviews);
  const now = clock.ready ? clock.now : 0;
  return useMemo(
    () => computeBuildSummary({ projects, journals, ships, reviewsDone, missions, now }),
    [projects, journals, ships, reviewsDone, missions, now],
  );
}
