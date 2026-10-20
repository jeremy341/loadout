import { DRAFT_RULES } from "./rules";
import type { SocialState } from "./types";

// Follow, friend-request and notification-preference transitions. Draft preview rules (see rules.ts):
//  - following is one-way and instant;
//  - a friendship needs a request and an accept; following each other does not make two builders friends;
//  - blocking removes every relation both ways and stops new ones until the block is lifted.
// Every function returns a new state, or the same object when the transition does not apply.

export const ME_HANDLE = "you";

export type Relation = "friend" | "request-sent" | "request-received" | "none";

export interface RelationView {
  following: boolean;
  followsYou: boolean;
  relation: Relation;
  notify: boolean;
}

export function relationOf(state: SocialState, handle: string): RelationView {
  const relation: Relation = state.friends.includes(handle)
    ? "friend"
    : state.outgoing.includes(handle)
      ? "request-sent"
      : state.incoming.includes(handle)
        ? "request-received"
        : "none";
  return {
    following: state.following.includes(handle),
    followsYou: state.followers.includes(handle),
    relation,
    notify: state.notify[handle] === true,
  };
}

function usable(handle: string, blocked: string[]): boolean {
  return handle !== ME_HANDLE && !blocked.includes(handle);
}

function without(list: string[], handle: string): string[] {
  return list.filter((h) => h !== handle);
}

function withHandle(list: string[], handle: string): string[] {
  return list.includes(handle) ? list : [...list, handle];
}

export function follow(state: SocialState, handle: string, blocked: string[] = []): SocialState {
  if (!usable(handle, blocked) || state.following.includes(handle)) return state;
  return {
    ...state,
    following: withHandle(state.following, handle),
    notify: { ...state.notify, [handle]: DRAFT_RULES.notifyOnFollowDefault },
  };
}

export function unfollow(state: SocialState, handle: string): SocialState {
  if (!state.following.includes(handle)) return state;
  const notify = { ...state.notify };
  delete notify[handle];
  return { ...state, following: without(state.following, handle), notify };
}

export function setNotify(state: SocialState, handle: string, on: boolean): SocialState {
  if (!state.following.includes(handle)) return state;
  if ((state.notify[handle] === true) === on) return state;
  return { ...state, notify: { ...state.notify, [handle]: on } };
}

/** Sends a friend request. If that builder already asked you, the two requests meet and you become friends. */
export function sendFriendRequest(state: SocialState, handle: string, blocked: string[] = []): SocialState {
  if (!usable(handle, blocked) || state.friends.includes(handle) || state.outgoing.includes(handle)) return state;
  if (state.incoming.includes(handle)) return acceptRequest(state, handle);
  return { ...state, outgoing: [...state.outgoing, handle] };
}

export function cancelRequest(state: SocialState, handle: string): SocialState {
  if (!state.outgoing.includes(handle)) return state;
  return { ...state, outgoing: without(state.outgoing, handle) };
}

export function acceptRequest(state: SocialState, handle: string): SocialState {
  if (!state.incoming.includes(handle)) return state;
  return { ...state, incoming: without(state.incoming, handle), friends: withHandle(state.friends, handle) };
}

export function declineRequest(state: SocialState, handle: string): SocialState {
  if (!state.incoming.includes(handle)) return state;
  return { ...state, incoming: without(state.incoming, handle) };
}

/** The other builder accepted a request you sent (preview tool). */
export function requestAccepted(state: SocialState, handle: string): SocialState {
  if (!state.outgoing.includes(handle)) return state;
  return { ...state, outgoing: without(state.outgoing, handle), friends: withHandle(state.friends, handle) };
}

export function unfriend(state: SocialState, handle: string): SocialState {
  if (!state.friends.includes(handle)) return state;
  return { ...state, friends: without(state.friends, handle) };
}

/** Someone started following you (preview tool). Blocked builders cannot. */
export function addFollower(state: SocialState, handle: string, blocked: string[] = []): SocialState {
  if (!usable(handle, blocked) || state.followers.includes(handle)) return state;
  return { ...state, followers: [...state.followers, handle] };
}

/** Removes every relation with a handle. The block list itself lives in the moderation state. */
export function severRelations(state: SocialState, handle: string): SocialState {
  const notify = { ...state.notify };
  delete notify[handle];
  return {
    following: without(state.following, handle),
    followers: without(state.followers, handle),
    friends: without(state.friends, handle),
    incoming: without(state.incoming, handle),
    outgoing: without(state.outgoing, handle),
    notify,
  };
}

/** Whether a simulated post from a followed builder should raise a notification. This is the notify gate. */
export function shouldNotifyPost(state: SocialState, handle: string, blocked: string[] = []): boolean {
  return state.following.includes(handle) && state.notify[handle] === true && !blocked.includes(handle);
}

/** Sample builders, in a fixed order, that are not in `taken` or `blocked`; the first is next. Deterministic: no random choice. */
export function nextCandidate(all: string[], taken: string[], blocked: string[] = []): string | null {
  return all.find((h) => h !== ME_HANDLE && !taken.includes(h) && !blocked.includes(h)) ?? null;
}
