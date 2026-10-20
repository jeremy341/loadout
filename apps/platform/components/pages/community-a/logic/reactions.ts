import type { ReactionMap } from "./types";

// Likes and upvotes. A reaction is a handle in the list for an item reference. A handle can be in a list once,
// so toggling is idempotent in the sense that two toggles restore the original state, and "once per item"
// holds by construction.

export function hasReacted(map: ReactionMap, ref: string, handle: string): boolean {
  return (map[ref] ?? []).includes(handle);
}

/** Flips a handle's reaction on an item. Returns a new map; the input is not changed. */
export function toggleReaction(map: ReactionMap, ref: string, handle: string): ReactionMap {
  const current = map[ref] ?? [];
  if (current.includes(handle)) {
    const rest = current.filter((h) => h !== handle);
    const next: ReactionMap = { ...map };
    if (rest.length === 0) delete next[ref];
    else next[ref] = rest;
    return next;
  }
  return { ...map, [ref]: [...current, handle] };
}

/** Adds a reaction only if it is not there yet. Used by the simulated reactions. */
export function addReaction(map: ReactionMap, ref: string, handle: string): ReactionMap {
  return hasReacted(map, ref, handle) ? map : toggleReaction(map, ref, handle);
}

/** Sample base count plus the reactions kept in this browser. */
export function reactionCount(base: number, map: ReactionMap, ref: string): number {
  return base + (map[ref] ?? []).length;
}

/** How many items a handle has reacted to. */
export function reactionsGivenBy(map: ReactionMap, handle: string): number {
  let count = 0;
  for (const list of Object.values(map)) if (list.includes(handle)) count += 1;
  return count;
}

/** Reactions on the given item references from anyone except `handle` (your own upvote on your own idea does not count). */
export function reactionsReceived(map: ReactionMap, refs: string[], handle: string): number {
  let count = 0;
  for (const ref of refs) count += (map[ref] ?? []).filter((h) => h !== handle).length;
  return count;
}

/** Drops the reactions of removed items so deleted content does not leave entries behind. */
export function dropReactions(map: ReactionMap, refs: string[]): ReactionMap {
  const next: ReactionMap = { ...map };
  for (const ref of refs) delete next[ref];
  return next;
}
