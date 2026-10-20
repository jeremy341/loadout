import { describe, expect, test } from "bun:test";
import { dayKey, formatDay, groupByDay, visibleActivity } from "./activity";
import { canChangeStatus, commentsFor, deleteOwn, dropCommentsOf, editIdea, refsRemovedWith, setOwnStatus } from "./content";
import { checkRate, DAY_MS, describeWait, HOUR_MS } from "./limits";
import { makeRef, parseRef } from "./refs";
import { computeSummary } from "./summary-calc";
import type { ActivityEvent, CommunityComment, Idea, ShowPost, SocialState } from "./types";

const ev = (id: string, handle: string, at: string): ActivityEvent => ({ id, handle, kind: "project", text: id, at, href: "/explore" });

describe("refs", () => {
  test("round-trips and rejects junk", () => {
    expect(makeRef("idea", "i1")).toBe("idea:i1");
    expect(parseRef("post:s-1")).toEqual({ kind: "post", id: "s-1" });
    expect(parseRef("bogus:1")).toBeNull();
    expect(parseRef("idea:")).toBeNull();
    expect(parseRef("nocolon")).toBeNull();
  });
});

describe("rate limits", () => {
  const now = Date.parse("2026-10-20T12:00:00.000Z");
  const limit = { max: 2, windowMs: HOUR_MS };
  test("allows under the limit", () => {
    expect(checkRate(["2026-10-20T11:30:00.000Z"], now, limit)).toEqual({ allowed: true, retryInMinutes: 0 });
  });
  test("blocks at the limit and says how long to wait", () => {
    const result = checkRate(["2026-10-20T11:10:00.000Z", "2026-10-20T11:50:00.000Z"], now, limit);
    expect(result.allowed).toBe(false);
    expect(result.retryInMinutes).toBe(10);
  });
  test("ignores items outside the window and in the future", () => {
    expect(checkRate(["2026-10-20T09:00:00.000Z", "2026-10-20T10:00:00.000Z", "2026-10-21T10:00:00.000Z"], now, limit).allowed).toBe(true);
  });
  test("daily window and wait text", () => {
    expect(checkRate(["2026-10-19T13:00:00.000Z"], now, { max: 1, windowMs: DAY_MS }).retryInMinutes).toBe(60);
    expect(describeWait(1)).toBe("1 minute");
    expect(describeWait(45)).toBe("45 minutes");
    expect(describeWait(61)).toBe("2 hours");
  });
});

describe("activity", () => {
  const social: SocialState = { following: ["ada-cuts", "bit-ferry"], followers: [], friends: [], incoming: [], outgoing: [], notify: {} };
  const events = [
    ev("1", "ada-cuts", "2026-10-18T10:00:00.000Z"),
    ev("2", "bit-ferry", "2026-10-19T09:00:00.000Z"),
    ev("3", "coil-kit", "2026-10-19T12:00:00.000Z"),
    ev("4", "ada-cuts", "2026-10-19T15:00:00.000Z"),
  ];
  test("only followed, unblocked builders, newest first, cut to the limit", () => {
    const all = visibleActivity(events, social, { reports: [], hidden: [], blocked: [] }, 10);
    expect(all.map((e) => e.id)).toEqual(["4", "2", "1"]);
    expect(visibleActivity(events, social, { reports: [], hidden: [], blocked: ["bit-ferry"] }, 10).map((e) => e.id)).toEqual(["4", "1"]);
    expect(visibleActivity(events, social, { reports: [], hidden: [], blocked: [] }, 2)).toHaveLength(2);
  });
  test("groups by UTC day without reordering", () => {
    const groups = groupByDay([events[3], events[1], events[0]]);
    expect(groups.map((g) => [g.day, g.events.length])).toEqual([
      ["2026-10-19", 2],
      ["2026-10-18", 1],
    ]);
    expect(dayKey("2026-10-19T23:59:59.000Z")).toBe("2026-10-19");
    expect(formatDay("2026-10-19T23:59:59.000Z")).toBe("19 Oct 2026");
  });
});

const idea = (id: string, over: Partial<Idea> = {}): Idea => ({
  id,
  title: id,
  body: "b",
  track: "Tools",
  status: "Open",
  handle: "you",
  at: "2026-10-20T10:00:00.000Z",
  baseVotes: 0,
  ...over,
});

describe("content rules", () => {
  test("only the author can withdraw an Open idea, and reopen a Withdrawn one", () => {
    const list = [idea("a"), idea("b", { handle: "ada-cuts" }), idea("c", { status: "Planned" })];
    const withdrawn = setOwnStatus(list, "a", "Withdrawn", "you");
    expect(withdrawn[0].status).toBe("Withdrawn");
    expect(setOwnStatus(withdrawn, "a", "Open", "you")[0].status).toBe("Open");
    expect(setOwnStatus(list, "b", "Withdrawn", "you")[1].status).toBe("Open");
    expect(setOwnStatus(list, "c", "Withdrawn", "you")[2].status).toBe("Planned");
    expect(canChangeStatus(list[2], "you")).toBe(false);
  });
  test("a participant can never set Planned or Done", () => {
    const list = [idea("a")];
    expect(setOwnStatus(list, "a", "Planned", "you")).toBe(list);
    expect(setOwnStatus(list, "a", "Done", "you")).toBe(list);
  });
  test("edit only your own, non-withdrawn idea", () => {
    const list = [idea("a"), idea("b", { handle: "ada-cuts" }), idea("c", { status: "Withdrawn" })];
    const changes = { title: "New", body: "New body", track: "Systems" as const };
    const next = editIdea(list, "a", changes, "2026-10-21T00:00:00.000Z", "you");
    expect(next[0]).toMatchObject({ title: "New", editedAt: "2026-10-21T00:00:00.000Z" });
    expect(editIdea(list, "b", changes, "x", "you")[1].title).toBe("b");
    expect(editIdea(list, "c", changes, "x", "you")[2].title).toBe("c");
  });
  test("deleteOwn removes only your own item", () => {
    const list = [idea("a"), idea("b", { handle: "ada-cuts" })];
    expect(deleteOwn(list, "a", "you").map((i) => i.id)).toEqual(["b"]);
    expect(deleteOwn(list, "b", "you").map((i) => i.id)).toEqual(["a", "b"]);
  });
  test("comments are listed oldest first per item and removed with their item", () => {
    const comments: CommunityComment[] = [
      { id: "c2", ref: "idea:a", handle: "you", body: "2", at: "2026-10-20T11:00:00.000Z" },
      { id: "c1", ref: "idea:a", handle: "ada-cuts", body: "1", at: "2026-10-20T10:00:00.000Z" },
      { id: "c3", ref: "idea:b", handle: "you", body: "3", at: "2026-10-20T10:00:00.000Z" },
    ];
    expect(commentsFor(comments, "idea:a").map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(dropCommentsOf(comments, "idea:a").map((c) => c.id)).toEqual(["c3"]);
    expect(refsRemovedWith("idea", "a", comments)).toEqual(["idea:a", "comment:c2", "comment:c1"]);
  });
});

describe("summary", () => {
  const social: SocialState = { following: ["a", "b", "c"], followers: ["a", "b"], friends: ["a"], incoming: ["x", "y"], outgoing: [], notify: {} };
  const posts: ShowPost[] = [{ id: "s1", title: "Thing", built: "x", link: "https://example.org", track: "Tools", handle: "you", at: "2026-10-20T09:00:00.000Z", baseLikes: 0 }];
  const comments: CommunityComment[] = [{ id: "c1", ref: "idea:i1", handle: "you", body: "hi", at: "2026-10-20T10:30:00.000Z" }];
  test("counts what this browser holds", () => {
    const summary = computeSummary({
      social,
      myIdeas: [idea("i1"), idea("i2", { handle: "ada-cuts" })],
      myPosts: posts,
      comments,
      reactions: { "idea:i1": ["you", "ada-cuts", "bit-ferry"], "post:s1": ["you"] },
      me: "you",
    });
    expect(summary).toMatchObject({
      following: 3,
      followers: 2,
      friends: 1,
      pendingRequests: 2,
      ideasPosted: 1,
      ideaUpvotesReceived: 2,
      showAndTellPosts: 1,
      likesGiven: 2,
      commentsWritten: 1,
    });
    expect(summary.recentActivity.map((a) => a.href)).toEqual(["/ideas", "/ideas", "/show-and-tell"]);
  });
});
