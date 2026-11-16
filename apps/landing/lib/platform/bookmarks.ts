// Pure rules for "Saved" projects. No database; every function has a bun test (bookmarks.test.ts).
//
// API:
//   MAX_BOOKMARKS = 200
//   canBookmark({ viewer, project }) -> { ok: true } | { ok: false, code, reason }
//       a person may save a project they may see: their own (any state), or one that is approved, not hidden, and whose owner is
//       not banned. code is "not-visible" | "banned-owner".
//   checkBookmarkLimit(count) -> { ok: true } | { ok: false, reason }    count is how many the person already saved
//   toggleOutcome(saved, count) -> "add" | "remove" | "limit"            what a toggle does given the current state
import { normalizeStatus } from "./profile";

export const MAX_BOOKMARKS = 200;

export type BookmarkCode = "not-visible" | "banned-owner";
export type BookmarkResult = { ok: true } | { ok: false; code: BookmarkCode; reason: string };

export type BookmarkInput = {
  viewer: { id: string };
  project: { ownerId: string; status: string; hidden: boolean; ownerBanned?: boolean };
};

export function canBookmark({ viewer, project }: BookmarkInput): BookmarkResult {
  if (project.ownerId === viewer.id) return { ok: true };
  if (project.ownerBanned) return { ok: false, code: "banned-owner", reason: "That project was not found." };
  if (project.hidden || normalizeStatus(project.status) !== "approved") {
    return { ok: false, code: "not-visible", reason: "That project was not found." };
  }
  return { ok: true };
}

export function checkBookmarkLimit(count: number): { ok: true } | { ok: false; reason: string } {
  return count >= MAX_BOOKMARKS
    ? { ok: false, reason: `You can save up to ${MAX_BOOKMARKS} projects. Remove one first.` }
    : { ok: true };
}

export function toggleOutcome(saved: boolean, count: number): "add" | "remove" | "limit" {
  if (saved) return "remove";
  return checkBookmarkLimit(count).ok ? "add" : "limit";
}
