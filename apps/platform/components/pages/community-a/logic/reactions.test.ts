import { describe, expect, test } from "bun:test";
import { addReaction, dropReactions, hasReacted, reactionCount, reactionsGivenBy, reactionsReceived, toggleReaction } from "./reactions";

describe("reactions", () => {
  test("a toggle adds and a second toggle removes; count follows", () => {
    const on = toggleReaction({}, "project:p1", "you");
    expect(hasReacted(on, "project:p1", "you")).toBe(true);
    expect(reactionCount(10, on, "project:p1")).toBe(11);
    const off = toggleReaction(on, "project:p1", "you");
    expect(hasReacted(off, "project:p1", "you")).toBe(false);
    expect(reactionCount(10, off, "project:p1")).toBe(10);
    expect(off).toEqual({});
  });
  test("one reaction per handle per item, however many times it is applied", () => {
    let map = addReaction({}, "idea:i1", "you");
    map = addReaction(map, "idea:i1", "you");
    expect(map["idea:i1"]).toEqual(["you"]);
  });
  test("does not mutate its input", () => {
    const start = { "idea:i1": ["ada-cuts"] };
    const next = toggleReaction(start, "idea:i1", "you");
    expect(start).toEqual({ "idea:i1": ["ada-cuts"] });
    expect(next["idea:i1"]).toEqual(["ada-cuts", "you"]);
  });
  test("counts given and received", () => {
    const map = { "idea:a": ["you", "bit-ferry"], "idea:b": ["you"], "post:c": ["bit-ferry"] };
    expect(reactionsGivenBy(map, "you")).toBe(2);
    expect(reactionsReceived(map, ["idea:a", "idea:b"], "you")).toBe(1);
  });
  test("dropReactions removes entries for deleted items", () => {
    expect(dropReactions({ "idea:a": ["you"], "idea:b": ["you"] }, ["idea:a"])).toEqual({ "idea:b": ["you"] });
  });
});
