import { makeRef } from "./refs";
import { reactionsGivenBy, reactionsReceived } from "./reactions";
import type { CommunityComment, Idea, ReactionMap, ShowPost, SocialState } from "./types";

// The numbers other tabs (Overview, Profile, Achievements) read from this group. Counts are of what this
// browser holds; they are never presented as program facts.

export interface CommunityASummary {
  following: number;
  followers: number;
  friends: number;
  pendingRequests: number;
  ideasPosted: number;
  ideaUpvotesReceived: number;
  showAndTellPosts: number;
  likesGiven: number;
  commentsWritten: number;
  recentActivity: { text: string; href: string; at: string }[];
}

export const EMPTY_SUMMARY: CommunityASummary = {
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
};

export interface SummaryInput {
  social: SocialState;
  myIdeas: Idea[];
  myPosts: ShowPost[];
  comments: CommunityComment[];
  reactions: ReactionMap;
  me: string;
  limit?: number;
}

export function computeSummary(input: SummaryInput): CommunityASummary {
  const { social, myIdeas, myPosts, comments, reactions, me } = input;
  const ownIdeas = myIdeas.filter((i) => i.handle === me);
  const ownPosts = myPosts.filter((p) => p.handle === me);
  const ownComments = comments.filter((c) => c.handle === me);

  const recent = [
    ...ownIdeas.map((i) => ({ text: `Posted the idea "${i.title}"`, href: "/ideas", at: i.at })),
    ...ownPosts.map((p) => ({ text: `Shared "${p.title}" in Show & Tell`, href: "/show-and-tell", at: p.at })),
    ...ownComments.map((c) => ({ text: "Wrote a comment", href: hrefForRef(c.ref), at: c.at })),
  ]
    .sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? 1 : -1))
    .slice(0, input.limit ?? 5);

  return {
    following: social.following.length,
    followers: social.followers.length,
    friends: social.friends.length,
    pendingRequests: social.incoming.length,
    ideasPosted: ownIdeas.length,
    ideaUpvotesReceived: reactionsReceived(
      reactions,
      ownIdeas.map((i) => makeRef("idea", i.id)),
      me,
    ),
    showAndTellPosts: ownPosts.length,
    likesGiven: reactionsGivenBy(reactions, me),
    commentsWritten: ownComments.length,
    recentActivity: recent,
  };
}

/** The platform page a reference belongs to. */
export function hrefForRef(ref: string): string {
  if (ref.startsWith("idea:")) return "/ideas";
  if (ref.startsWith("post:")) return "/show-and-tell";
  return "/explore";
}
