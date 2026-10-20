import type { ComponentType } from "react";
import { EventsPage } from "./events-page";
import { LeaderboardsPage } from "./leaderboards-page";
import { SeasonsPage } from "./seasons-page";

// Slug -> page component for this group. Each component is a client component that renders its own
// <PageHeader>. useCommunityBSummary (./summary) is the hook the Overview page uses for these tabs.
export const communityBPages: Record<string, ComponentType> = {
  leaderboards: LeaderboardsPage,
  seasons: SeasonsPage,
  events: EventsPage,
};
