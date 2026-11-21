import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "layout.tsx"), "utf8");

describe("reviewer layout", () => {
  test("an anonymous visitor gets the same plain 404 as anyone without a role", () => {
    expect(source).toMatch(/if \(!viewer\) notFound\(\);/);
    expect(source).not.toContain('title="Opening soon"');
  });

  test("the host and staff checks still gate the tree", () => {
    expect(source).toMatch(/isReviewHost\(\(await headers\(\)\)\.get\("host"\)\)/);
    expect(source).toMatch(/if \(!access\) notFound\(\);/);
  });

  test("the shell is resolved before it streams, so a denied page keeps its real status", () => {
    expect(source).not.toContain("<Suspense");
    expect(source).toMatch(/navCountsSafe\(access\)/);
  });

  test("an unknown preview role shows as signed out, not a builder or an owner", () => {
    expect(source).toMatch(/viewAsRoleKey\(chosen\)/);
    expect(source).toContain('key: "signed-out"');
  });
});
