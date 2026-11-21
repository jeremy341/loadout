import { describe, expect, test } from "bun:test";
import { selectProfileProjects } from "./profile-data";

const projects = [
  { id: "draft", status: "draft", pinned: false },
  { id: "banned", status: "banned", pinned: true },
  { id: "approved", status: "approved", pinned: true },
];

describe("selectProfileProjects", () => {
  test("the owner keeps a banned project in newest-first order", () => {
    expect(selectProfileProjects(projects, "own").map((p) => p.id)).toEqual(["draft", "banned", "approved"]);
  });

  test("both visitor modes hide banned projects and put pinned ones first", () => {
    for (const mode of ["public", "all"] as const) {
      expect(selectProfileProjects(projects, mode).map((p) => p.id)).toEqual(["approved", "draft"]);
    }
  });
});
