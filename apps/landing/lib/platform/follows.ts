// Pure rules for follows. A builder follows a builder; two follows in both directions are friends. No database; every function
// has a bun test (follows.test.ts).
//
// API:
//   FOLLOW_LIST_MAX = 200                         the most rows a follower or following list returns
//   canFollow({ viewerId, target, blocked }) -> { ok: true } | { ok: false, code, reason }
//       target: { id, handle, banned }. blocked: a Block exists in either direction.
//       code: "self" | "not-found" | "blocked". A banned, handle-less or blocked builder reads as not found, so a block is not revealed.
//   followTitle(handle) -> string                 notification title for the builder being followed (plain text, at most 120)
//   isFriend(followsThem, followedByThem) -> boolean
import { clipText } from "./notifications";

export const FOLLOW_LIST_MAX = 200;

export type FollowCode = "self" | "not-found" | "blocked";
export type FollowResult = { ok: true } | { ok: false; code: FollowCode; reason: string };

export type FollowInput = {
  viewerId: string;
  target: { id: string; handle: string | null; banned: boolean };
  blocked: boolean;
};

export function canFollow({ viewerId, target, blocked }: FollowInput): FollowResult {
  if (target.id === viewerId) return { ok: false, code: "self", reason: "You cannot follow yourself." };
  if (target.banned || target.handle === null) return { ok: false, code: "not-found", reason: "That builder was not found." };
  if (blocked) return { ok: false, code: "blocked", reason: "That builder was not found." };
  return { ok: true };
}

export function followTitle(handle: string | null): string {
  return clipText(`${handle ?? "A builder"} followed you`, 120);
}

export function isFriend(followsThem: boolean, followedByThem: boolean): boolean {
  return followsThem && followedByThem;
}
