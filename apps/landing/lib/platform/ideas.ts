// Pure rules for ideas: posts a builder wants help with, votes, collaboration applications and status. No database; every function
// has a bun test (ideas.test.ts).
//
// API:
//   IDEA_TITLE_MIN = 3, IDEA_TITLE_MAX = 80, IDEA_BODY_MIN = 20, IDEA_BODY_MAX = 1000
//   MAX_OPEN_IDEAS = 5 (open ideas per person), APPLY_MIN = 20, APPLY_MAX = 500
//   IDEA_STATUSES = ["open", "taken", "closed"]; "taken" is only set by accepting an application
//   checkIdeaDraft({ title, body }) -> { ok: true, title, body } | { ok: false, message }
//   checkOpenIdeaLimit(openCount) -> { ok: true } | { ok: false, message }
//   checkVoteValue(raw) -> { ok: true, value: 1 | -1 } | { ok: false, message }
//   canVote({ viewerId, idea }) -> { ok: true } | { ok: false, code: "own-idea" }
//   ideaScore(values) -> number                  the sum of the votes, each clamped to -1 or 1
//   rankIdeas(ideas) -> ideas                    a sorted copy: score high to low, then newest first, then id
//   canApply({ viewerId, idea, alreadyApplied }) -> { ok: true } | { ok: false, code, message }
//       code: "own-idea" | "not-open" | "already-applied". Applications need an open idea.
//   checkApplicationMessage(raw) -> { ok: true, message } | { ok: false, message }
//   canDecide({ actorId, idea, application }) -> { ok: true } | { ok: false, code, message }
//       code: "not-author" | "not-pending" | "not-open"
//   canSetIdeaStatus({ actorId, idea, next, openCount }) -> { ok: true } | { ok: false, code, message }
//       the author may close an open or taken idea, and reopen a closed one while under MAX_OPEN_IDEAS.
//   Text is plain: control characters go, and a body keeps its line breaks.

export const IDEA_TITLE_MIN = 3;
export const IDEA_TITLE_MAX = 80;
export const IDEA_BODY_MIN = 20;
export const IDEA_BODY_MAX = 1000;
export const MAX_OPEN_IDEAS = 5;
export const APPLY_MIN = 20;
export const APPLY_MAX = 500;

export const IDEA_STATUSES = ["open", "taken", "closed"] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export type IdeaCheck = { ok: true; title: string; body: string } | { ok: false; message: string };

function cleanLine(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function cleanBlock(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function checkIdeaDraft(raw: { title?: unknown; body?: unknown }): IdeaCheck {
  const title = cleanLine(raw.title);
  const body = cleanBlock(raw.body);
  if (title.length < IDEA_TITLE_MIN || title.length > IDEA_TITLE_MAX) {
    return { ok: false, message: `Use ${IDEA_TITLE_MIN} to ${IDEA_TITLE_MAX} characters for the title.` };
  }
  if (body.length < IDEA_BODY_MIN || body.length > IDEA_BODY_MAX) {
    return { ok: false, message: `Use ${IDEA_BODY_MIN} to ${IDEA_BODY_MAX} characters for the idea.` };
  }
  return { ok: true, title, body };
}

export function checkOpenIdeaLimit(openCount: number): { ok: true } | { ok: false; message: string } {
  return openCount >= MAX_OPEN_IDEAS
    ? { ok: false, message: `You can have up to ${MAX_OPEN_IDEAS} open ideas. Close one first.` }
    : { ok: true };
}

export function checkVoteValue(raw: unknown): { ok: true; value: 1 | -1 } | { ok: false; message: string } {
  if (raw === 1 || raw === "1" || raw === "up") return { ok: true, value: 1 };
  if (raw === -1 || raw === "-1" || raw === "down") return { ok: true, value: -1 };
  return { ok: false, message: "A vote is up or down." };
}

export function canVote({ viewerId, idea }: { viewerId: string; idea: { authorId: string } }): { ok: true } | { ok: false; code: "own-idea"; message: string } {
  return idea.authorId === viewerId ? { ok: false, code: "own-idea", message: "You cannot vote on your own idea." } : { ok: true };
}

export function ideaScore(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + (value > 0 ? 1 : value < 0 ? -1 : 0), 0);
}

export type RankableIdea = { id: string; score: number; createdAt: Date };

export function rankIdeas<T extends RankableIdea>(ideas: readonly T[]): T[] {
  return [...ideas].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.createdAt.getTime() !== a.createdAt.getTime()) return b.createdAt.getTime() - a.createdAt.getTime();
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export function canApply({
  viewerId,
  idea,
  alreadyApplied,
}: {
  viewerId: string;
  idea: { authorId: string; status: string };
  alreadyApplied: boolean;
}): { ok: true } | { ok: false; code: "own-idea" | "not-open" | "already-applied"; message: string } {
  if (idea.authorId === viewerId) return { ok: false, code: "own-idea", message: "You cannot apply to your own idea." };
  if (idea.status !== "open") return { ok: false, code: "not-open", message: "This idea is not taking applications." };
  if (alreadyApplied) return { ok: false, code: "already-applied", message: "You already applied to this idea." };
  return { ok: true };
}

export function checkApplicationMessage(raw: unknown): { ok: true; message: string } | { ok: false; message: string } {
  const message = cleanBlock(raw);
  if (message.length < APPLY_MIN || message.length > APPLY_MAX) {
    return { ok: false, message: `Use ${APPLY_MIN} to ${APPLY_MAX} characters to say how you would help.` };
  }
  return { ok: true, message };
}

export function canDecide({
  actorId,
  idea,
  application,
}: {
  actorId: string;
  idea: { authorId: string; status: string };
  application: { status: string };
}): { ok: true } | { ok: false; code: "not-author" | "not-pending" | "not-open"; message: string } {
  if (idea.authorId !== actorId) return { ok: false, code: "not-author", message: "Only the author can answer applications." };
  if (application.status !== "pending") return { ok: false, code: "not-pending", message: "This application was already answered." };
  if (idea.status !== "open") return { ok: false, code: "not-open", message: "This idea is not taking applications." };
  return { ok: true };
}

export function canSetIdeaStatus({
  actorId,
  idea,
  next,
  openCount,
}: {
  actorId: string;
  idea: { authorId: string; status: string };
  next: unknown;
  openCount: number;
}): { ok: true } | { ok: false; code: "not-author" | "invalid-target" | "limit" | "same"; message: string } {
  if (idea.authorId !== actorId) return { ok: false, code: "not-author", message: "Only the author can change this idea." };
  if (next !== "open" && next !== "closed") return { ok: false, code: "invalid-target", message: "Choose open or closed." };
  if (next === idea.status) return { ok: false, code: "same", message: "The idea already has that status." };
  if (next === "open") {
    if (idea.status !== "closed") return { ok: false, code: "invalid-target", message: "Only a closed idea can be reopened." };
    const limit = checkOpenIdeaLimit(openCount);
    if (!limit.ok) return { ok: false, code: "limit", message: limit.message };
  }
  return { ok: true };
}
