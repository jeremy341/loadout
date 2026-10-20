"use client";

import { useMemo } from "react";
import { usePreviewState } from "@/lib/preview-store";
import { ME } from "@/lib/sample/builders";
import { EMPTY_COMMENTS, EMPTY_IDEAS, EMPTY_POSTS, INITIAL_REACTIONS, INITIAL_SOCIAL, KEYS } from "./data";
import { computeSummary, type CommunityASummary } from "./logic/summary-calc";
import type { CommunityComment, Idea, ReactionMap, ShowPost, SocialState } from "./logic/types";

// What the Overview, Profile and Achievements tabs read from the Explore / Ideas / Show & Tell / Friends group.
// Every number is a count of what this browser holds (sample followers included); none is a program fact.

export type { CommunityASummary };

export function useCommunityASummary(): CommunityASummary {
  const [social] = usePreviewState<SocialState>(KEYS.social, INITIAL_SOCIAL);
  const [myIdeas] = usePreviewState<Idea[]>(KEYS.ideas, EMPTY_IDEAS);
  const [myPosts] = usePreviewState<ShowPost[]>(KEYS.posts, EMPTY_POSTS);
  const [comments] = usePreviewState<CommunityComment[]>(KEYS.comments, EMPTY_COMMENTS);
  const [reactions] = usePreviewState<ReactionMap>(KEYS.reactions, INITIAL_REACTIONS);
  return useMemo(
    () => computeSummary({ social, myIdeas, myPosts, comments, reactions, me: ME.handle }),
    [social, myIdeas, myPosts, comments, reactions],
  );
}
