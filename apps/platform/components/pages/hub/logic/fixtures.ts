import type { BuildSummary } from "../../build/logic/summary";
import type { CommunityASummary } from "../../community-a/logic/summary-calc";
import type { CommunityBSummary } from "../../community-b/summary";
import type { GearSummary } from "../../gear/summary";

// Test fixtures: complete, empty group summaries with a few overrides. Used only by the tests.

export function makeBuild(over: Partial<BuildSummary> = {}): BuildSummary {
  return {
    projects: [],
    approvedShips: 0,
    journalEntries: 0,
    hoursLogged: 0,
    journalsDue: 0,
    reviewsDone: 0,
    reviewsOwed: 8,
    missionsDone: 0,
    missionsTotal: 6,
    nextActions: [],
    ...over,
  };
}

export function makeCommunityA(over: Partial<CommunityASummary> = {}): CommunityASummary {
  return {
    following: 0,
    followers: 0,
    friends: 0,
    pendingRequests: 0,
    ideasPosted: 0,
    ideaUpvotesReceived: 0,
    showAndTellPosts: 0,
    likesGiven: 0,
    commentsWritten: 0,
    recentActivity: [],
    ...over,
  };
}

export function makeSeasons(over: Partial<CommunityBSummary> = {}): CommunityBSummary {
  return {
    seasonName: "S00 // BOOT",
    seasonProgressPct: 40,
    eraName: "STEAM",
    eraProgressPct: 10,
    questsDone: 0,
    questsTotal: 4,
    streakWeeks: 0,
    leaderboardRank: { overall: null, track: null },
    eventsRsvped: 0,
    certificates: 0,
    ...over,
  };
}

export function makeGear(over: Partial<GearSummary> = {}): GearSummary {
  return {
    oreBalance: 120,
    oreEarned: 120,
    oreSpent: 0,
    wishlistCount: 0,
    wishlistAffordable: 0,
    ordersTotal: 0,
    ordersOpen: 0,
    collectiblesOwned: 0,
    collectiblesTotal: 10,
    referralsTotal: 0,
    referralsQualified: 0,
    recentLedger: [],
    ...over,
  };
}
