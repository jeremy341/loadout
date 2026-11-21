import { describe, expect, test } from "bun:test";
import { join, sep } from "path";
import { classifyRoute, routePathFromFile } from "../public-routes";

// The read-only rule, enforced on the files: every route under app/api/v1 exports GET and nothing that writes.
const V1_DIR = join(import.meta.dir, "..", "..", "..", "app", "api", "v1");
const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
const ALLOWED = new Set(["GET", "HEAD", "OPTIONS"]);

async function v1Files(): Promise<{ file: string; text: string }[]> {
  const out: { file: string; text: string }[] = [];
  for await (const file of new Bun.Glob("**/route.ts").scan({ cwd: V1_DIR })) {
    out.push({ file: file.split(sep).join("/"), text: await Bun.file(join(V1_DIR, file)).text() });
  }
  return out.sort((a, b) => (a.file < b.file ? -1 : 1));
}

// Every name the file exports: `export const X`, `export function X`, `export async function X`, `export { A, B }`.
function exportedNames(text: string): string[] {
  const names: string[] = [];
  for (const m of text.matchAll(/export\s+(?:async\s+)?(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) names.push(m[1]);
  for (const m of text.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name) names.push(name);
    }
  }
  return names;
}

describe("app/api/v1 is read only", () => {
  test("there are v1 routes to check", async () => {
    expect((await v1Files()).length).toBeGreaterThanOrEqual(18);
  });

  test("no route file exports a write method", async () => {
    const offenders: string[] = [];
    for (const { file, text } of await v1Files()) {
      for (const name of exportedNames(text)) {
        if (WRITE_METHODS.includes(name)) offenders.push(`${file}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  test("a route exports only GET, HEAD or OPTIONS", async () => {
    for (const { file, text } of await v1Files()) {
      for (const name of exportedNames(text)) {
        if (/^[A-Z]+$/.test(name)) expect({ file, name, ok: ALLOWED.has(name) }).toEqual({ file, name, ok: true });
      }
    }
  });

  test("every route exports GET", async () => {
    for (const { file, text } of await v1Files()) {
      expect({ file, hasGet: exportedNames(text).includes("GET") }).toEqual({ file, hasGet: true });
    }
  });

  test("no write method is named in a route file at all", async () => {
    for (const { file, text } of await v1Files()) {
      for (const method of WRITE_METHODS) {
        expect({ file, method, present: new RegExp(`export[^\\n]*\\b${method}\\b`).test(text) }).toEqual({ file, method, present: false });
      }
    }
  });

  test("every v1 path is classified as an API key route or as public documentation", async () => {
    for (const { file } of await v1Files()) {
      const path = routePathFromFile(`v1/${file}`);
      const access = classifyRoute("GET", path);
      expect({ path, access }).toEqual({ path, access: access === "public" ? "public" : "api-key" });
      expect(["public", "api-key"]).toContain(access);
    }
  });

  test("a write to any v1 path is never allowed by the access rules", async () => {
    for (const { file } of await v1Files()) {
      const path = routePathFromFile(`v1/${file}`);
      for (const method of WRITE_METHODS) {
        expect(classifyRoute(method, path)).toBe("session");
      }
    }
  });
});
