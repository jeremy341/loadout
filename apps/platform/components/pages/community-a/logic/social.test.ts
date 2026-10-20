import { describe, expect, test } from "bun:test";
import {
  acceptRequest,
  addFollower,
  cancelRequest,
  declineRequest,
  follow,
  nextCandidate,
  relationOf,
  requestAccepted,
  sendFriendRequest,
  setNotify,
  severRelations,
  shouldNotifyPost,
  unfollow,
  unfriend,
} from "./social";
import type { SocialState } from "./types";

const empty: SocialState = { following: [], followers: [], friends: [], incoming: [], outgoing: [], notify: {} };

describe("follow and unfollow", () => {
  test("follow is idempotent and notify starts off", () => {
    const once = follow(empty, "ada-cuts");
    expect(once.following).toEqual(["ada-cuts"]);
    expect(once.notify["ada-cuts"]).toBe(false);
    expect(follow(once, "ada-cuts")).toBe(once);
  });
  test("unfollow clears the notify preference and is idempotent", () => {
    const state = setNotify(follow(empty, "ada-cuts"), "ada-cuts", true);
    const gone = unfollow(state, "ada-cuts");
    expect(gone.following).toEqual([]);
    expect(gone.notify).toEqual({});
    expect(unfollow(gone, "ada-cuts")).toBe(gone);
  });
  test("cannot follow yourself or a blocked builder", () => {
    expect(follow(empty, "you")).toBe(empty);
    expect(follow(empty, "ada-cuts", ["ada-cuts"])).toBe(empty);
  });
  test("notify only applies to followed builders", () => {
    expect(setNotify(empty, "ada-cuts", true)).toBe(empty);
  });
});

describe("friend requests", () => {
  test("mutual follow does not make friends", () => {
    const state = addFollower(follow(empty, "ada-cuts"), "ada-cuts");
    expect(relationOf(state, "ada-cuts")).toMatchObject({ following: true, followsYou: true, relation: "none" });
  });
  test("send then cancel", () => {
    const sent = sendFriendRequest(empty, "bit-ferry");
    expect(relationOf(sent, "bit-ferry").relation).toBe("request-sent");
    expect(sendFriendRequest(sent, "bit-ferry")).toBe(sent);
    expect(relationOf(cancelRequest(sent, "bit-ferry"), "bit-ferry").relation).toBe("none");
  });
  test("accept moves an incoming request to friends; decline removes it", () => {
    const state = { ...empty, incoming: ["dee-gpu", "eli-lathe"] };
    const accepted = acceptRequest(state, "dee-gpu");
    expect(accepted.friends).toEqual(["dee-gpu"]);
    expect(accepted.incoming).toEqual(["eli-lathe"]);
    const declined = declineRequest(accepted, "eli-lathe");
    expect(declined.incoming).toEqual([]);
    expect(declined.friends).toEqual(["dee-gpu"]);
    expect(acceptRequest(declined, "eli-lathe")).toBe(declined);
  });
  test("asking someone who already asked you makes you friends", () => {
    const state = sendFriendRequest({ ...empty, incoming: ["dee-gpu"] }, "dee-gpu");
    expect(state.friends).toEqual(["dee-gpu"]);
    expect(state.incoming).toEqual([]);
    expect(state.outgoing).toEqual([]);
  });
  test("the other builder accepting your request", () => {
    const state = requestAccepted(sendFriendRequest(empty, "bit-ferry"), "bit-ferry");
    expect(state.friends).toEqual(["bit-ferry"]);
    expect(state.outgoing).toEqual([]);
    expect(requestAccepted(empty, "bit-ferry")).toBe(empty);
  });
  test("unfriend, and no requests to friends, yourself or blocked builders", () => {
    const friends = { ...empty, friends: ["fern-ops"] };
    expect(sendFriendRequest(friends, "fern-ops")).toBe(friends);
    expect(unfriend(friends, "fern-ops").friends).toEqual([]);
    expect(sendFriendRequest(empty, "you")).toBe(empty);
    expect(sendFriendRequest(empty, "bit-ferry", ["bit-ferry"])).toBe(empty);
  });
});

describe("blocking", () => {
  test("severRelations removes every relation and preference", () => {
    const state: SocialState = {
      following: ["ada-cuts", "bit-ferry"],
      followers: ["ada-cuts"],
      friends: ["ada-cuts"],
      incoming: ["ada-cuts"],
      outgoing: ["ada-cuts"],
      notify: { "ada-cuts": true, "bit-ferry": false },
    };
    const next = severRelations(state, "ada-cuts");
    expect(next).toEqual({ following: ["bit-ferry"], followers: [], friends: [], incoming: [], outgoing: [], notify: { "bit-ferry": false } });
  });
  test("a blocked builder cannot become a follower", () => {
    expect(addFollower(empty, "ada-cuts", ["ada-cuts"])).toBe(empty);
  });
});

describe("notification gate", () => {
  test("only followed builders with notify on raise a notification", () => {
    const base = follow(empty, "ada-cuts");
    expect(shouldNotifyPost(base, "ada-cuts")).toBe(false);
    const on = setNotify(base, "ada-cuts", true);
    expect(shouldNotifyPost(on, "ada-cuts")).toBe(true);
    expect(shouldNotifyPost(on, "bit-ferry")).toBe(false);
    expect(shouldNotifyPost(on, "ada-cuts", ["ada-cuts"])).toBe(false);
    expect(shouldNotifyPost(unfollow(on, "ada-cuts"), "ada-cuts")).toBe(false);
  });
});

describe("nextCandidate", () => {
  test("picks the first handle not taken or blocked, deterministically", () => {
    const all = ["ada-cuts", "bit-ferry", "coil-kit"];
    expect(nextCandidate(all, ["ada-cuts"])).toBe("bit-ferry");
    expect(nextCandidate(all, ["ada-cuts"], ["bit-ferry"])).toBe("coil-kit");
    expect(nextCandidate(all, all)).toBeNull();
  });
});
