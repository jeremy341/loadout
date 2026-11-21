import { describe, expect, test } from "bun:test";
import {
  APPLY_MAX,
  canApply,
  canDecide,
  canSetIdeaStatus,
  canVote,
  checkApplicationMessage,
  checkIdeaDraft,
  checkOpenIdeaLimit,
  checkVoteValue,
  IDEA_BODY_MAX,
  ideaScore,
  MAX_OPEN_IDEAS,
  rankIdeas,
} from "./ideas";

const body = "I would like a tool that counts the hours on a shared build.";

describe("checkIdeaDraft", () => {
  test("a title of 3 to 80 and a body of 20 to 1000 pass", () => {
    const result = checkIdeaDraft({ title: "  Hour counter  ", body });
    expect(result).toEqual({ ok: true, title: "Hour counter", body });
  });
  test("short titles and bodies are refused", () => {
    expect(checkIdeaDraft({ title: "ab", body }).ok).toBe(false);
    expect(checkIdeaDraft({ title: "Hour counter", body: "too short" }).ok).toBe(false);
  });
  test("long titles and bodies are refused", () => {
    expect(checkIdeaDraft({ title: "a".repeat(81), body }).ok).toBe(false);
    expect(checkIdeaDraft({ title: "Hour counter", body: "b".repeat(IDEA_BODY_MAX + 1) }).ok).toBe(false);
  });
  test("the title stays on one line", () => {
    const result = checkIdeaDraft({ title: "Hour\ncounter", body });
    expect(result.ok && result.title).toBe("Hour counter");
  });
});

describe("open idea limit", () => {
  test("five open ideas is the most", () => {
    expect(checkOpenIdeaLimit(MAX_OPEN_IDEAS - 1).ok).toBe(true);
    expect(checkOpenIdeaLimit(MAX_OPEN_IDEAS).ok).toBe(false);
  });
});

describe("votes", () => {
  test("up and down are accepted, anything else is not", () => {
    expect(checkVoteValue(1)).toEqual({ ok: true, value: 1 });
    expect(checkVoteValue(-1)).toEqual({ ok: true, value: -1 });
    expect(checkVoteValue(0).ok).toBe(false);
    expect(checkVoteValue(5).ok).toBe(false);
  });
  test("no vote on your own idea", () => {
    expect(canVote({ viewerId: "me", idea: { authorId: "me" } }).ok).toBe(false);
    expect(canVote({ viewerId: "me", idea: { authorId: "other" } }).ok).toBe(true);
  });
  test("score sums the votes and clamps each one", () => {
    expect(ideaScore([1, 1, -1, 1])).toBe(2);
    expect(ideaScore([])).toBe(0);
    expect(ideaScore([5, -9])).toBe(0);
  });
});

describe("rankIdeas", () => {
  test("score first, then newest, without changing the input", () => {
    const old = new Date("2026-11-01T00:00:00Z");
    const newer = new Date("2026-11-10T00:00:00Z");
    const input = [
      { id: "a", score: 1, createdAt: newer },
      { id: "b", score: 3, createdAt: old },
      { id: "c", score: 1, createdAt: old },
      { id: "d", score: 1, createdAt: old },
    ];
    expect(rankIdeas(input).map((i) => i.id)).toEqual(["b", "a", "c", "d"]);
    expect(input[0].id).toBe("a");
  });
});

describe("applications", () => {
  const idea = { authorId: "author", status: "open" };
  test("a builder can apply to someone else's open idea once", () => {
    expect(canApply({ viewerId: "me", idea, alreadyApplied: false }).ok).toBe(true);
    const again = canApply({ viewerId: "me", idea, alreadyApplied: true });
    expect(!again.ok && again.code).toBe("already-applied");
  });
  test("no application to your own idea or to a taken one", () => {
    const own = canApply({ viewerId: "author", idea, alreadyApplied: false });
    expect(!own.ok && own.code).toBe("own-idea");
    const taken = canApply({ viewerId: "me", idea: { ...idea, status: "taken" }, alreadyApplied: false });
    expect(!taken.ok && taken.code).toBe("not-open");
  });
  test("the message is 20 to 500 characters", () => {
    expect(checkApplicationMessage("short").ok).toBe(false);
    expect(checkApplicationMessage("x".repeat(APPLY_MAX + 1)).ok).toBe(false);
    expect(checkApplicationMessage("I can draw the sprites and test the builds.").ok).toBe(true);
  });
  test("only the author decides, and only once, and only while the idea is open", () => {
    const pending = { status: "pending" };
    expect(canDecide({ actorId: "author", idea, application: pending }).ok).toBe(true);
    const notAuthor = canDecide({ actorId: "me", idea, application: pending });
    expect(!notAuthor.ok && notAuthor.code).toBe("not-author");
    const answered = canDecide({ actorId: "author", idea, application: { status: "declined" } });
    expect(!answered.ok && answered.code).toBe("not-pending");
    const closed = canDecide({ actorId: "author", idea: { ...idea, status: "closed" }, application: pending });
    expect(!closed.ok && closed.code).toBe("not-open");
  });
});

describe("idea status", () => {
  test("the author can close an open idea and reopen a closed one", () => {
    expect(canSetIdeaStatus({ actorId: "a", idea: { authorId: "a", status: "open" }, next: "closed", openCount: 2 }).ok).toBe(true);
    expect(canSetIdeaStatus({ actorId: "a", idea: { authorId: "a", status: "closed" }, next: "open", openCount: 2 }).ok).toBe(true);
  });
  test("taken is never set by hand, and only the author changes status", () => {
    expect(canSetIdeaStatus({ actorId: "a", idea: { authorId: "a", status: "open" }, next: "taken", openCount: 0 }).ok).toBe(false);
    expect(canSetIdeaStatus({ actorId: "b", idea: { authorId: "a", status: "open" }, next: "closed", openCount: 0 }).ok).toBe(false);
  });
  test("reopening respects the open limit", () => {
    const result = canSetIdeaStatus({ actorId: "a", idea: { authorId: "a", status: "closed" }, next: "open", openCount: MAX_OPEN_IDEAS });
    expect(!result.ok && result.code).toBe("limit");
  });
});
