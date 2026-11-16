import { describe, expect, test } from "bun:test";
import { groupRows, repoHost, resultCountText, trackSlugOf } from "./search-view";

describe("repoHost", () => {
  test("host and path only", () => {
    expect(repoHost("https://GitHub.com/acme/tool")).toBe("github.com/acme/tool");
    expect(repoHost("https://github.com/acme/tool.git")).toBe("github.com/acme/tool");
    expect(repoHost("https://github.com/acme/tool/?tab=x#readme")).toBe("github.com/acme/tool");
    expect(repoHost("https://user:pw@gitlab.com:8443/a/b/")).toBe("gitlab.com/a/b");
    expect(repoHost("https://example.com/")).toBe("example.com");
  });
  test("https only", () => {
    for (const bad of ["http://github.com/a/b", "ftp://x.com/a", "javascript:alert(1)", "github.com/a/b", "", "   ", null, undefined]) {
      expect(repoHost(bad as string | null | undefined)).toBeNull();
    }
  });
});

describe("resultCountText", () => {
  test("counts", () => {
    expect(resultCountText(6, "tape")).toBe("6 projects.");
    expect(resultCountText(1, "tape")).toBe("1 project.");
    expect(resultCountText(1, "tape", "tool")).toBe("1 tool.");
  });
  test("none and empty query", () => {
    expect(resultCountText(0, " x ")).toBe('No projects match "x".');
    expect(resultCountText(0, "x", "tool")).toBe('No tools match "x".');
    expect(resultCountText(4, "")).toBe("Saved and most used projects.");
    expect(resultCountText(0, "  ")).toBe("No projects yet.");
    expect(resultCountText(Number.NaN, "a")).toBe('No projects match "a".');
  });
});

const row = (id: string, saved: boolean, usedBy: number) => ({ id, saved, usedBy });

describe("groupRows", () => {
  test("saved first, then most used, no duplicates", () => {
    const groups = groupRows([row("a", false, 2), row("b", true, 9), row("c", false, 7), row("d", false, 0)]);
    expect(groups.map((g) => g.key)).toEqual(["saved", "popular"]);
    expect(groups[0].rows.map((r) => r.id)).toEqual(["b"]);
    expect(groups[1].rows.map((r) => r.id)).toEqual(["c", "a"]);
  });
  test("caps at five and drops empty groups", () => {
    const many = Array.from({ length: 9 }, (_, i) => row(`s${i}`, true, 0));
    const groups = groupRows(many);
    expect(groups).toHaveLength(1);
    expect(groups[0].rows).toHaveLength(5);
    expect(groupRows([])).toEqual([]);
  });
});

test("trackSlugOf", () => {
  expect(trackSlugOf("Tools")).toBe("tools");
  expect(trackSlugOf("hardware")).toBe("hardware");
  expect(trackSlugOf("nope")).toBeUndefined();
  expect(trackSlugOf(null)).toBeUndefined();
});
