import { describe, expect, test } from "bun:test";
import type { Logger, QaRow, SiteClient } from "../../types";
import { createDocsAnswerer, SYSTEM_PROMPT } from "./answer";

const silent: Logger = { debug() {}, info() {}, warn() {}, error() {} };
const BASE = "https://site.example.test";
const DAY = 24 * 60 * 60 * 1000;

const PAGE = `<html><head><title>Ore</title></head><body><p>Ore is earned by approved hours. Ten Ore is a set price.</p></body></html>`;

// A fake network: the sitemap lists one docs page and one plans page, the plans page must never be requested.
function network(opts: { modelReply?: string; modelFails?: boolean; sitemap?: boolean } = {}) {
  const requested: string[] = [];
  const modelBodies: unknown[] = [];
  const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    requested.push(url);
    if (url === `${BASE}/docs/sitemap.xml`) {
      if (opts.sitemap === false) return new Response("nope", { status: 404 });
      return new Response(
        `<urlset><url><loc>${BASE}/docs/ore</loc></url><url><loc>${BASE}/docs/plans/x</loc></url></urlset>`,
        { status: 200 },
      );
    }
    if (url === `${BASE}/sitemap.xml`) return new Response("", { status: 404 });
    if (url === `${BASE}/docs/ore`) return new Response(PAGE, { status: 200, headers: { "content-type": "text/html" } });
    if (url === "https://api.anthropic.com/v1/messages") {
      modelBodies.push({ headers: init?.headers, body: JSON.parse(String(init?.body)) });
      if (opts.modelFails) return new Response("boom", { status: 500 });
      const text = opts.modelReply ?? "Ore comes from approved hours.";
      return new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: 200 });
    }
    return new Response("missing", { status: 404 });
  }) as unknown as typeof fetch;
  return { fakeFetch, requested, modelBodies };
}

function store(initial: QaRow[] = []) {
  const rows = new Map(initial.map((r) => [r.question, r]));
  const site = {
    qaGet: async (q: string) => rows.get(q) ?? null,
    qaPut: async (row: { question: string; answer: string; links: string[] }) => {
      rows.set(row.question, { ...row, hits: 0, confirmedAt: new Date(now).toISOString() });
    },
  } as Pick<SiteClient, "qaGet" | "qaPut">;
  return { site, rows };
}

let now = Date.parse("2026-11-18T00:00:00.000Z");

describe("createDocsAnswerer", () => {
  test("without a key it returns the best passage with its link", async () => {
    const net = network();
    const { site, rows } = store();
    const answer = createDocsAnswerer({ siteBaseUrl: BASE, anthropicApiKey: "", site, fetch: net.fakeFetch, now: () => now, log: silent });
    const result = await answer("How is ore earned?");
    expect(result?.links).toEqual([`${BASE}/docs/ore`]);
    expect(result?.text).toContain("Ore is earned by approved hours");
    expect(rows.get("how is ore earned")?.links).toEqual([`${BASE}/docs/ore`]);
    expect(net.requested.some((u) => u.includes("plans"))).toBe(false);
  });

  test("with a key it asks the model with the spec model and a grounded system prompt", async () => {
    const net = network({ modelReply: "Approved hours earn Ore." });
    const { site } = store();
    const answer = createDocsAnswerer({ siteBaseUrl: BASE, anthropicApiKey: "test-key", site, fetch: net.fakeFetch, now: () => now, log: silent });
    const result = await answer("how is ore earned");
    expect(result?.text).toBe("Approved hours earn Ore.");
    const call = net.modelBodies[0] as { headers: Record<string, string>; body: { model: string; max_tokens: number; system: string; messages: { content: string }[] } };
    expect(call.headers["x-api-key"]).toBe("test-key");
    expect(call.body.model).toBe("claude-haiku-5-5");
    expect(call.body.max_tokens).toBe(500);
    expect(call.body.system).toBe(SYSTEM_PROMPT);
    expect(call.body.messages[0]?.content).toContain("Ore is earned by approved hours");
  });

  test("NOT_COVERED from the model means no answer", async () => {
    const net = network({ modelReply: "NOT_COVERED" });
    const { site } = store();
    const answer = createDocsAnswerer({ siteBaseUrl: BASE, anthropicApiKey: "test-key", site, fetch: net.fakeFetch, now: () => now, log: silent });
    expect(await answer("how is ore earned")).toBeNull();
  });

  test("a model failure falls back to the passage", async () => {
    const net = network({ modelFails: true });
    const { site } = store();
    const answer = createDocsAnswerer({ siteBaseUrl: BASE, anthropicApiKey: "test-key", site, fetch: net.fakeFetch, now: () => now, log: silent });
    expect((await answer("how is ore earned"))?.links).toEqual([`${BASE}/docs/ore`]);
  });

  test("a question the docs do not cover returns null", async () => {
    const net = network();
    const { site } = store();
    const answer = createDocsAnswerer({ siteBaseUrl: BASE, anthropicApiKey: "", site, fetch: net.fakeFetch, now: () => now, log: silent });
    expect(await answer("will there be a bus to the moon")).toBeNull();
  });

  test("a fresh cached answer is returned without touching the corpus", async () => {
    const net = network();
    const { site } = store([
      { question: "how is ore earned", answer: "Cached.", links: [`${BASE}/docs/ore`], hits: 3, confirmedAt: new Date(now - DAY).toISOString() },
    ]);
    const answer = createDocsAnswerer({ siteBaseUrl: BASE, anthropicApiKey: "", site, fetch: net.fakeFetch, now: () => now, log: silent });
    expect((await answer("How is ore earned?"))?.text).toBe("Cached.");
    expect(net.requested.length).toBe(0);
  });

  test("a cached answer older than 30 days is re-checked against the docs", async () => {
    const net = network();
    const { site, rows } = store([
      { question: "how is ore earned", answer: "Old.", links: [], hits: 3, confirmedAt: new Date(now - 40 * DAY).toISOString() },
    ]);
    const answer = createDocsAnswerer({ siteBaseUrl: BASE, anthropicApiKey: "", site, fetch: net.fakeFetch, now: () => now, log: silent });
    const result = await answer("how is ore earned");
    expect(result?.text).toContain("Ore is earned");
    expect(rows.get("how is ore earned")?.answer).toContain("Ore is earned");
    expect(net.requested.length).toBeGreaterThan(0);
  });

  test("a missing sitemap is an empty corpus and no answer", async () => {
    const net = network({ sitemap: false });
    const { site } = store();
    const answer = createDocsAnswerer({ siteBaseUrl: BASE, anthropicApiKey: "", site, fetch: net.fakeFetch, now: () => now, log: silent });
    expect(await answer("how is ore earned")).toBeNull();
  });
});
