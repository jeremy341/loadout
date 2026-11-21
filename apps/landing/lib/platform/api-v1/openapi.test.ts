import { describe, expect, test } from "bun:test";
import { join, sep } from "path";
import { parse } from "yaml";
import { routePathFromFile } from "../public-routes";
import { escapeHtml, renderDocsHtml } from "./docs-html";
import { OPENAPI_DOCUMENT, OPENAPI_YAML } from "./openapi";

const V1_DIR = join(import.meta.dir, "..", "..", "..", "app", "api", "v1");

async function v1RouteFiles(): Promise<string[]> {
  const found: string[] = [];
  for await (const file of new Bun.Glob("**/route.ts").scan({ cwd: V1_DIR })) found.push(file.split(sep).join("/"));
  return found.sort();
}

// "/api/v1/projects/:id" -> "/api/v1/projects/{id}", the OpenAPI spelling.
const toOpenApiPath = (path: string) => path.replace(/:(\w+)/g, "{$1}");

type Operation = { security?: unknown[]; responses?: Record<string, unknown>; "x-required-scope"?: string };

function operations(): { path: string; method: string; op: Operation }[] {
  const out: { path: string; method: string; op: Operation }[] = [];
  for (const [path, item] of Object.entries(OPENAPI_DOCUMENT.paths)) {
    for (const [method, op] of Object.entries(item as Record<string, Operation>)) out.push({ path, method, op });
  }
  return out;
}

describe("OpenAPI document", () => {
  test("is OpenAPI 3.1 and the YAML is the same document", () => {
    expect(OPENAPI_DOCUMENT.openapi).toBe("3.1.0");
    expect(parse(OPENAPI_YAML)).toEqual(JSON.parse(JSON.stringify(OPENAPI_DOCUMENT)));
  });

  test("lists every route file under app/api/v1, and nothing that is not a route", async () => {
    const fromFiles = (await v1RouteFiles()).map((file) => toOpenApiPath(routePathFromFile(`v1/${file}`))).sort();
    const documented = Object.keys(OPENAPI_DOCUMENT.paths).sort();
    expect(documented).toEqual(fromFiles);
  });

  test("every operation names its security and documents a 429", () => {
    const all = operations();
    expect(all.length).toBeGreaterThan(0);
    for (const { path, op } of all) {
      expect(Array.isArray(op.security)).toBe(true);
      expect(op.security?.length).toBeGreaterThan(0);
      expect(Object.keys(op.responses ?? {})).toContain("429");
      expect(path.startsWith("/api/v1/")).toBe(true);
    }
  });

  test("every operation is GET: the document has no write method", () => {
    for (const { method } of operations()) expect(method).toBe("get");
  });

  test("an authenticated operation needs a scope, and a key is named as bearer", () => {
    for (const { path, op } of operations()) {
      const anonymous = (op.security ?? []).some((s) => typeof s === "object" && s !== null && Object.keys(s).length === 0);
      if (anonymous) {
        expect(["/api/v1/docs", "/api/v1/openapi.yaml"]).toContain(path);
        expect(op["x-required-scope"]).toBeUndefined();
      } else {
        expect(op.security).toEqual([{ bearerAuth: [] }]);
        expect(op["x-required-scope"]).toBeDefined();
      }
    }
  });

  test("the scope in each route file is the one the document states", async () => {
    const documented = new Map(operations().map(({ path, op }) => [path, op["x-required-scope"]]));
    for (const file of await v1RouteFiles()) {
      const text = await Bun.file(join(V1_DIR, file)).text();
      const used = /apiRoute\(\{[^}]*\bscope:\s*"(\w+)"/.exec(text)?.[1];
      const path = toOpenApiPath(routePathFromFile(`v1/${file}`));
      expect({ path, scope: documented.get(path) }).toEqual({ path, scope: used });
    }
  });

  test("track levels need the profile scope, not hours", () => {
    expect(OPENAPI_DOCUMENT.paths["/api/v1/me/tracks"].get["x-required-scope"]).toBe("profile");
    expect(OPENAPI_DOCUMENT.paths["/api/v1/me/hours"].get["x-required-scope"]).toBe("hours");
  });

  test("the bearer scheme is declared", () => {
    expect(OPENAPI_DOCUMENT.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
  });
});

describe("reference page", () => {
  const html = renderDocsHtml();

  test("is one self-contained document with no script and no external file", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html).not.toMatch(/<link[^>]+href="https?:/i);
    expect(html).not.toMatch(/src="https?:/i);
  });

  test("names every endpoint, the scopes, the limits and a curl example", () => {
    for (const path of Object.keys(OPENAPI_DOCUMENT.paths)) expect(html).toContain(escapeHtml(path));
    expect(html).toContain("Authorization: Bearer");
    expect(html).toContain("curl");
    expect(html).toContain("<code>stats</code>");
    expect(html).toContain("60 requests a minute");
  });

  test("never shows a write verb as an endpoint", () => {
    expect(html).not.toMatch(/<span class="verb">(POST|PUT|PATCH|DELETE)</);
  });

  test("escapes values", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});
