import { makeRef } from "./refs";
import type { CommunityComment, Idea, IdeaStatus, ShowPost } from "./types";

// Create, edit and delete rules for the content a participant owns. Seeds are never changed: the stored lists
// hold only what was made in this browser, and the pages show stored items first and seeds after them.

export function isOwn(item: { handle: string }, me: string): boolean {
  return item.handle === me;
}

// ---- Ideas ----

/**
 * Only the author changes the status of their idea, and only between Open and Withdrawn. Planned and Done are
 * shown on sample ideas only; a participant cannot set them (Draft preview rule).
 */
export function canChangeStatus(idea: Idea, me: string): boolean {
  return idea.handle === me && (idea.status === "Open" || idea.status === "Withdrawn");
}

export function setOwnStatus(ideas: Idea[], id: string, status: IdeaStatus, me: string): Idea[] {
  if (status !== "Withdrawn" && status !== "Open") return ideas;
  return ideas.map((idea) => (idea.id === id && canChangeStatus(idea, me) && idea.status !== status ? { ...idea, status } : idea));
}

export function editIdea(ideas: Idea[], id: string, changes: Pick<Idea, "title" | "body" | "track">, at: string, me: string): Idea[] {
  return ideas.map((idea) => (idea.id === id && idea.handle === me && idea.status !== "Withdrawn" ? { ...idea, ...changes, editedAt: at } : idea));
}

export function deleteOwn<T extends { id: string; handle: string }>(items: T[], id: string, me: string): T[] {
  return items.filter((item) => !(item.id === id && item.handle === me));
}

// ---- Show & Tell ----

export function editPost(
  posts: ShowPost[],
  id: string,
  changes: Pick<ShowPost, "title" | "built" | "link" | "track" | "learned">,
  at: string,
  me: string,
): ShowPost[] {
  return posts.map((post) => (post.id === id && post.handle === me ? { ...post, ...changes, editedAt: at } : post));
}

// ---- Comments ----

export function commentsFor(comments: CommunityComment[], ref: string): CommunityComment[] {
  return comments.filter((c) => c.ref === ref).sort((a, b) => (a.at === b.at ? (a.id < b.id ? -1 : 1) : a.at < b.at ? -1 : 1));
}

/** Deleting your own item also removes its comments and, via the returned refs, its reactions and reports of it. */
export function refsRemovedWith(kind: "idea" | "post" | "project", id: string, comments: CommunityComment[]): string[] {
  const own = makeRef(kind, id);
  return [own, ...comments.filter((c) => c.ref === own).map((c) => makeRef("comment", c.id))];
}

export function dropCommentsOf(comments: CommunityComment[], ref: string): CommunityComment[] {
  return comments.filter((c) => c.ref !== ref);
}
