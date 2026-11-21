import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(import.meta.dir, "page.tsx"), "utf8");

describe("fulfiller detail page", () => {
  test("a malformed percent escape in the id 404s instead of throwing a 500", () => {
    expect(source).toMatch(/try\s*\{[^}]*decodeURIComponent\(id\)[^}]*\}\s*catch\s*\{[^}]*notFound\(\);[^}]*\}/);
  });
});
