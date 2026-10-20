"use client";

import { useSyncExternalStore } from "react";
import { pushNotification } from "@/lib/notifications";
import { getPreview, setPreview, uid, usePreviewState } from "@/lib/preview-store";
import { ME, SAMPLE_BUILDERS, builderByHandle } from "@/lib/sample/builders";
import {
  EMPTY_ACTIVITY,
  EMPTY_COMMENTS,
  EMPTY_IDEAS,
  EMPTY_POSTS,
  INITIAL_IDEA_STATUS,
  INITIAL_MODERATION,
  INITIAL_REACTIONS,
  INITIAL_SOCIAL,
  KEYS,
  SAMPLE_COMMENTS,
  SAMPLE_IDEAS,
  SAMPLE_POSTS,
} from "./data";
import { DRAFT_RULES } from "./logic/rules";
import { addReaction, dropReactions, toggleReaction } from "./logic/reactions";
import { DAY_MS, HOUR_MS, checkRate, describeWait } from "./logic/limits";
import { blockHandle, fileReport, hideRef, unblockHandle, unhideAll, unhideRef } from "./logic/moderation";
import { makeRef } from "./logic/refs";
import * as soc from "./logic/social";
import { deleteOwn, dropCommentsOf, editIdea, editPost, refsRemovedWith, setOwnStatus } from "./logic/content";
import { validateComment, validateIdea, validatePost, type IdeaDraft, type PostDraft } from "./logic/validate";
import type { ActivityEvent, CommunityComment, Idea, IdeaStatus, ModerationState, ReactionMap, ShowPost, SocialState } from "./logic/types";

// The one place that reads and writes this group's localStorage keys. Pages call these hooks; the pure rules
// live in ./logic and are covered by tests. Handlers (not render) create timestamps and ids.

export const ME_HANDLE = ME.handle;

export function nameOf(handle: string): string {
  return builderByHandle(handle)?.name ?? handle;
}

export const SAMPLE_HANDLES = SAMPLE_BUILDERS.map((b) => b.handle);

function nowIso(): string {
  return new Date().toISOString();
}

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

// ---- Location hash (Explore project detail) ----

const hashListeners = new Set<() => void>();

function subscribeHash(listener: () => void) {
  hashListeners.add(listener);
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

/** The current location hash; "" on the server and on the first client render, so hydration matches. */
export function useLocationHash(): string {
  return useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
}

export function setLocationHash(hash: string, mode: "push" | "replace" = "push") {
  const url = window.location.pathname + window.location.search + hash;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  for (const listener of hashListeners) listener();
}

// ---- Moderation ----

export function useModeration() {
  const [state, set] = usePreviewState<ModerationState>(KEYS.moderation, INITIAL_MODERATION);
  return {
    state,
    blocked: state.blocked,
    hide: (ref: string) => set((prev) => hideRef(prev, ref)),
    unhide: (ref: string) => set((prev) => unhideRef(prev, ref)),
    unhideAll: (kind?: string) => set((prev) => unhideAll(prev, kind)),
    report(input: { ref: string; label: string; reason: string; note: string; hide: boolean; blockHandle?: string }): ActionResult {
      const current = getPreview<ModerationState>(KEYS.moderation, INITIAL_MODERATION);
      const filed = fileReport(current, { ...input, id: uid("r"), at: nowIso() });
      if (!filed.ok) return { ok: false, message: filed.error };
      let next = filed.state;
      if (input.blockHandle) next = blockHandle(next, input.blockHandle);
      set(next);
      if (input.blockHandle) {
        // Blocking also removes follows, friendship and pending requests (Draft preview rule).
        setPreview(KEYS.social, soc.severRelations(getPreview<SocialState>(KEYS.social, INITIAL_SOCIAL), input.blockHandle));
      }
      return {
        ok: true,
        message: `Report saved in this browser${input.hide ? " and the item is hidden for you" : ""}${input.blockHandle ? `. ${nameOf(input.blockHandle)} is blocked` : ""}.`,
      };
    },
  };
}

// ---- Social graph ----

export function useSocial() {
  const [social, setSocial] = usePreviewState<SocialState>(KEYS.social, INITIAL_SOCIAL);
  const [moderation, setModeration] = usePreviewState<ModerationState>(KEYS.moderation, INITIAL_MODERATION);
  const blockedNow = () => getPreview<ModerationState>(KEYS.moderation, INITIAL_MODERATION).blocked;

  return {
    social,
    blocked: moderation.blocked,
    follow(handle: string): ActionResult {
      const before = getPreview<SocialState>(KEYS.social, INITIAL_SOCIAL);
      const after = soc.follow(before, handle, blockedNow());
      if (after === before) return { ok: false, message: `You cannot follow ${nameOf(handle)} right now.` };
      setSocial(after);
      return { ok: true, message: `You now follow ${nameOf(handle)}.` };
    },
    unfollow(handle: string): ActionResult {
      setSocial((prev) => soc.unfollow(prev, handle));
      return { ok: true, message: `You unfollowed ${nameOf(handle)}.` };
    },
    setNotify(handle: string, on: boolean): ActionResult {
      setSocial((prev) => soc.setNotify(prev, handle, on));
      return { ok: true, message: `Post notifications for ${nameOf(handle)} are ${on ? "on" : "off"}.` };
    },
    sendRequest(handle: string): ActionResult {
      const before = getPreview<SocialState>(KEYS.social, INITIAL_SOCIAL);
      const after = soc.sendFriendRequest(before, handle, blockedNow());
      if (after === before) return { ok: false, message: `You cannot send a request to ${nameOf(handle)} right now.` };
      setSocial(after);
      return after.friends.includes(handle)
        ? { ok: true, message: `You and ${nameOf(handle)} are now friends.` }
        : { ok: true, message: `Friend request sent to ${nameOf(handle)}. It stays pending until they accept.` };
    },
    cancelRequest(handle: string): ActionResult {
      setSocial((prev) => soc.cancelRequest(prev, handle));
      return { ok: true, message: `Request to ${nameOf(handle)} cancelled.` };
    },
    accept(handle: string): ActionResult {
      setSocial((prev) => soc.acceptRequest(prev, handle));
      return { ok: true, message: `You and ${nameOf(handle)} are now friends.` };
    },
    decline(handle: string): ActionResult {
      setSocial((prev) => soc.declineRequest(prev, handle));
      return { ok: true, message: `Request from ${nameOf(handle)} declined.` };
    },
    unfriend(handle: string): ActionResult {
      setSocial((prev) => soc.unfriend(prev, handle));
      return { ok: true, message: `${nameOf(handle)} is no longer on your friends list.` };
    },
    block(handle: string): ActionResult {
      setModeration((prev) => blockHandle(prev, handle));
      setSocial((prev) => soc.severRelations(prev, handle));
      return { ok: true, message: `${nameOf(handle)} is blocked. Their content is hidden and your follows and requests with them are removed.` };
    },
    unblock(handle: string): ActionResult {
      setModeration((prev) => unblockHandle(prev, handle));
      return { ok: true, message: `${nameOf(handle)} is unblocked. Follows and friendships are not restored.` };
    },
    /** Preview tool: someone starts following you. */
    simulateFollower(): ActionResult {
      const state = getPreview<SocialState>(KEYS.social, INITIAL_SOCIAL);
      const handle = soc.nextCandidate(SAMPLE_HANDLES, state.followers, blockedNow());
      if (!handle) return { ok: false, message: "Every sample builder already follows you." };
      setSocial((prev) => soc.addFollower(prev, handle, blockedNow()));
      pushNotification({ kind: "social", title: `${nameOf(handle)} started following you`, body: "Sample event from the Friends preview tools.", href: "/friends" });
      return { ok: true, message: `${nameOf(handle)} now follows you. A notification was added.` };
    },
    /** Preview tool: a builder you sent a request to accepts it. */
    simulateAcceptance(handle?: string): ActionResult {
      const state = getPreview<SocialState>(KEYS.social, INITIAL_SOCIAL);
      const target = handle ?? state.outgoing[0];
      if (!target || !state.outgoing.includes(target)) return { ok: false, message: "You have no pending friend requests to answer." };
      setSocial((prev) => soc.requestAccepted(prev, target));
      pushNotification({ kind: "social", title: `${nameOf(target)} accepted your friend request`, body: "Sample event from the Friends preview tools.", href: "/friends" });
      return { ok: true, message: `${nameOf(target)} accepted your request. A notification was added.` };
    },
  };
}

// ---- Activity ----

export function useActivity() {
  const [created, setCreated] = usePreviewState<ActivityEvent[]>(KEYS.activity, EMPTY_ACTIVITY);
  return {
    created,
    /** Preview tool: a followed builder posts. The notification is raised only when notify is on for them. */
    simulatePost(handle: string): ActionResult {
      const social = getPreview<SocialState>(KEYS.social, INITIAL_SOCIAL);
      const blocked = getPreview<ModerationState>(KEYS.moderation, INITIAL_MODERATION).blocked;
      if (!social.following.includes(handle) || blocked.includes(handle)) {
        return { ok: false, message: `You do not follow ${nameOf(handle)}, so nothing was posted to your list.` };
      }
      const at = nowIso();
      const event: ActivityEvent = { id: uid("ev"), handle, kind: "showcase", text: "shared a new post in Show & Tell (simulated)", at, href: "/show-and-tell" };
      setCreated((prev) => [event, ...prev].slice(0, 30));
      if (soc.shouldNotifyPost(social, handle, blocked)) {
        pushNotification({ kind: "social", title: `${nameOf(handle)} shared a new post`, body: "Simulated post from the Friends preview tools.", href: "/show-and-tell" });
        return { ok: true, message: `${nameOf(handle)} posted. Notifications are on for them, so a notification was added.` };
      }
      return { ok: true, message: `${nameOf(handle)} posted. Notifications are off for them, so no notification was added. The post is in your activity list.` };
    },
  };
}

// ---- Reactions (likes and upvotes) ----

export function useReactions() {
  const [map, setMap] = usePreviewState<ReactionMap>(KEYS.reactions, INITIAL_REACTIONS);
  return {
    map,
    toggle: (ref: string) => setMap((prev) => toggleReaction(prev, ref, ME_HANDLE)),
    add: (ref: string, handle: string) => setMap((prev) => addReaction(prev, ref, handle)),
    drop: (refs: string[]) => setMap((prev) => dropReactions(prev, refs)),
  };
}

// ---- Comments ----

export function useComments() {
  const [mine, setMine] = usePreviewState<CommunityComment[]>(KEYS.comments, EMPTY_COMMENTS);
  return {
    all: [...SAMPLE_COMMENTS, ...mine],
    mine,
    add(ref: string, body: string): ActionResult & { error?: string } {
      const checked = validateComment(body);
      if (!checked.ok) return { ok: false, message: checked.errors.body ?? "Write a comment first.", error: checked.errors.body };
      const stored = getPreview<CommunityComment[]>(KEYS.comments, EMPTY_COMMENTS);
      const rate = checkRate(
        stored.filter((c) => c.handle === ME_HANDLE).map((c) => c.at),
        Date.now(),
        { max: DRAFT_RULES.rate.commentsPerHour, windowMs: HOUR_MS },
      );
      if (!rate.allowed) {
        const message = `Draft preview limit: ${DRAFT_RULES.rate.commentsPerHour} comments per hour. Try again in ${describeWait(rate.retryInMinutes)}.`;
        return { ok: false, message, error: message };
      }
      setMine((prev) => [...prev, { id: uid("c"), ref, handle: ME_HANDLE, body: checked.value, at: nowIso() }]);
      return { ok: true, message: "Comment posted." };
    },
    remove(id: string): ActionResult {
      setMine((prev) => deleteOwn(prev, id, ME_HANDLE));
      return { ok: true, message: "Comment deleted." };
    },
    /** Preview tool: a sample builder replies to one of your items and you get a notification. */
    simulateReply(ref: string, itemTitle: string, href: string): ActionResult {
      const stored = getPreview<CommunityComment[]>(KEYS.comments, EMPTY_COMMENTS);
      const blocked = getPreview<ModerationState>(KEYS.moderation, INITIAL_MODERATION).blocked;
      const taken = stored.filter((c) => c.ref === ref).map((c) => c.handle);
      const handle = soc.nextCandidate(SAMPLE_HANDLES, taken, blocked);
      if (!handle) return { ok: false, message: "Every sample builder has already replied." };
      setMine((prev) => [...prev, { id: uid("c"), ref, handle, body: "Nice work. Sample reply from the preview tools.", at: nowIso() }]);
      pushNotification({ kind: "social", title: `${nameOf(handle)} commented on "${itemTitle}"`, body: "Sample reply from the preview tools.", href });
      return { ok: true, message: `${nameOf(handle)} replied. A notification was added.` };
    },
  };
}

// ---- Ideas ----

export function useIdeas() {
  const [mine, setMine] = usePreviewState<Idea[]>(KEYS.ideas, EMPTY_IDEAS);
  const [overrides, setOverrides] = usePreviewState<Record<string, IdeaStatus>>(KEYS.ideaStatus, INITIAL_IDEA_STATUS);
  const seeded = SAMPLE_IDEAS.map((i) => (overrides[i.id] ? { ...i, status: overrides[i.id] } : i));
  return {
    mine,
    all: [...mine, ...seeded],
    add(draft: IdeaDraft): { ok: true; message: string; id: string } | { ok: false; message: string; errors: Partial<Record<"title" | "body" | "track", string>> } {
      const checked = validateIdea(draft);
      if (!checked.ok) return { ok: false, message: "Fix the marked fields and try again.", errors: checked.errors };
      const stored = getPreview<Idea[]>(KEYS.ideas, EMPTY_IDEAS);
      const rate = checkRate(
        stored.map((i) => i.at),
        Date.now(),
        { max: DRAFT_RULES.rate.ideasPerDay, windowMs: DAY_MS },
      );
      if (!rate.allowed) {
        return {
          ok: false,
          message: `Draft preview limit: ${DRAFT_RULES.rate.ideasPerDay} new ideas per day. Try again in ${describeWait(rate.retryInMinutes)}.`,
          errors: {},
        };
      }
      const idea: Idea = { id: uid("i"), ...checked.value, status: "Open", handle: ME_HANDLE, at: nowIso(), baseVotes: 0 };
      setMine((prev) => [idea, ...prev]);
      return { ok: true, message: "Idea posted.", id: idea.id };
    },
    edit(id: string, draft: IdeaDraft) {
      const checked = validateIdea(draft);
      if (!checked.ok) return { ok: false as const, message: "Fix the marked fields and try again.", errors: checked.errors };
      setMine((prev) => editIdea(prev, id, checked.value, nowIso(), ME_HANDLE));
      return { ok: true as const, message: "Idea updated." };
    },
    setStatus(id: string, status: "Open" | "Withdrawn"): ActionResult {
      setMine((prev) => setOwnStatus(prev, id, status, ME_HANDLE));
      return { ok: true, message: status === "Withdrawn" ? "Idea withdrawn. It stays on the board marked Withdrawn." : "Idea reopened." };
    },
    remove(id: string): ActionResult {
      setMine((prev) => deleteOwn(prev, id, ME_HANDLE));
      purgeItem("idea", id);
      return { ok: true, message: "Idea deleted." };
    },
    /** Preview tool: a sample idea you upvoted moves from Open to Planned and you get a notification. */
    simulateStatusChange(upvotedOpen: Idea | undefined): ActionResult {
      if (!upvotedOpen) return { ok: false, message: "Upvote an Open sample idea first, then try again." };
      setOverrides((prev) => ({ ...prev, [upvotedOpen.id]: "Planned" }));
      pushNotification({
        kind: "social",
        title: `"${upvotedOpen.title}" is now Planned`,
        body: "Sample status change from the Ideas preview tools. Not a program decision.",
        href: "/ideas",
      });
      return { ok: true, message: `"${upvotedOpen.title}" was marked Planned (sample). A notification was added.` };
    },
    resetStatus(): void {
      setOverrides({});
    },
    hasOverrides: Object.keys(overrides).length > 0,
  };
}

// ---- Show & Tell ----

export function usePosts() {
  const [mine, setMine] = usePreviewState<ShowPost[]>(KEYS.posts, EMPTY_POSTS);
  return {
    mine,
    all: [...mine, ...SAMPLE_POSTS],
    add(draft: PostDraft): { ok: true; message: string; id: string } | { ok: false; message: string; errors: Partial<Record<"title" | "built" | "link" | "track" | "learned", string>> } {
      const checked = validatePost(draft);
      if (!checked.ok) return { ok: false, message: "Fix the marked fields and try again.", errors: checked.errors };
      const stored = getPreview<ShowPost[]>(KEYS.posts, EMPTY_POSTS);
      const rate = checkRate(
        stored.map((p) => p.at),
        Date.now(),
        { max: DRAFT_RULES.rate.postsPerDay, windowMs: DAY_MS },
      );
      if (!rate.allowed) {
        return {
          ok: false,
          message: `Draft preview limit: ${DRAFT_RULES.rate.postsPerDay} posts per day. Try again in ${describeWait(rate.retryInMinutes)}.`,
          errors: {},
        };
      }
      const post: ShowPost = { id: uid("s"), ...checked.value, handle: ME_HANDLE, at: nowIso(), baseLikes: 0 };
      setMine((prev) => [post, ...prev]);
      return { ok: true, message: "Posted to Show & Tell.", id: post.id };
    },
    edit(id: string, draft: PostDraft) {
      const checked = validatePost(draft);
      if (!checked.ok) return { ok: false as const, message: "Fix the marked fields and try again.", errors: checked.errors };
      setMine((prev) => editPost(prev, id, checked.value, nowIso(), ME_HANDLE));
      return { ok: true as const, message: "Post updated." };
    },
    remove(id: string): ActionResult {
      setMine((prev) => deleteOwn(prev, id, ME_HANDLE));
      purgeItem("post", id);
      return { ok: true, message: "Post deleted." };
    },
  };
}

/** Removes the comments and reactions that belonged to a deleted item. */
function purgeItem(kind: "idea" | "post", id: string) {
  const itemRef = makeRef(kind, id);
  const comments = getPreview<CommunityComment[]>(KEYS.comments, EMPTY_COMMENTS);
  const refs = refsRemovedWith(kind, id, comments);
  setPreview(KEYS.comments, dropCommentsOf(comments, itemRef));
  setPreview(KEYS.reactions, dropReactions(getPreview<ReactionMap>(KEYS.reactions, INITIAL_REACTIONS), refs));
}
