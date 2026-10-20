import type { ComponentType } from "react";
import { ExplorePage } from "./explore-page";
import { FriendsPage } from "./friends-page";
import { IdeasPage } from "./ideas-page";
import { ShowAndTellPage } from "./show-and-tell-page";

// Slug -> page component for Explore, Ideas, Show & Tell and Friends. Each is a client component that renders
// its own <PageHeader>. Overview, Profile and Achievements read counts from ./summary (useCommunityASummary).
export const communityAPages: Record<string, ComponentType> = {
  explore: ExplorePage,
  ideas: IdeasPage,
  "show-and-tell": ShowAndTellPage,
  friends: FriendsPage,
};
