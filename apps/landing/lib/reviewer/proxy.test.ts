import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { config, proxy } from "../../proxy";
import { PROXY_MATCHER } from "./host";

function run(url: string, host: string) {
  const response = proxy(new NextRequest(url, { headers: { host } }));
  const rewrite = response.headers.get("x-middleware-rewrite");
  return { rewrite: rewrite ? new URL(rewrite) : null, response };
}

describe("proxy", () => {
  test("the matcher in proxy.ts is the tested pattern", () => {
    expect(config.matcher).toEqual([PROXY_MATCHER]);
  });

  test("rewrites the review host into /reviewer and keeps the query", () => {
    const queue = run("http://review.localhost:3011/", "review.localhost:3011");
    expect(queue.rewrite?.pathname).toBe("/reviewer");
    const ship = run("http://review.localhost:3011/review/2041?x=1", "review.localhost:3011");
    expect(ship.rewrite?.pathname).toBe("/reviewer/review/2041");
    expect(ship.rewrite?.search).toBe("?x=1");
    const overviewQuery = run("http://review.example.com/?range=60", "review.example.com");
    expect(overviewQuery.rewrite?.pathname).toBe("/reviewer");
    expect(overviewQuery.rewrite?.search).toBe("?range=60");
    expect(queue.response.headers.get("x-robots-tag")).toContain("noindex");
  });

  test("an old reviewer address is redirected to its new path and keeps the query", () => {
    const stats = run("http://review.localhost:3011/stats?x=1", "review.localhost:3011");
    expect(stats.response.status).toBe(308);
    expect(new URL(stats.response.headers.get("location") ?? "").pathname).toBe("/review/stats");
    expect(new URL(stats.response.headers.get("location") ?? "").search).toBe("?x=1");
    expect(stats.rewrite).toBeNull();
    const ship = run("http://review.localhost:3011/ship/sh-2041", "review.localhost:3011");
    expect(new URL(ship.response.headers.get("location") ?? "").pathname).toBe("/review/2041");
    // Only on the review host: another host answers its own pages, and the internal tree stays closed.
    expect(run("http://localhost:3011/stats", "localhost:3011").response.status).toBe(200);
  });

  test("a participant path on the review host lands in the reviewer tree, where it does not exist", () => {
    expect(run("http://review.localhost:3011/dashboard", "review.localhost:3011").rewrite?.pathname).toBe("/reviewer/dashboard");
    expect(run("http://review.localhost:3011/reviewer/users", "review.localhost:3011").rewrite?.pathname).toBe("/reviewer/reviewer/users");
  });

  test("other hosts cannot reach /reviewer", () => {
    for (const [url, host] of [
      ["http://localhost:3011/reviewer", "localhost:3011"],
      ["http://localhost:3011/reviewer/review/2041", "localhost:3011"],
      ["http://www.example.com/reviewer/users", "www.example.com"],
      ["http://reviewer.example.com/reviewer", "reviewer.example.com"],
    ]) {
      expect(run(url, host).rewrite?.pathname).toBe("/not-found");
    }
  });

  test("other hosts are otherwise untouched", () => {
    for (const [url, host] of [
      ["http://localhost:3011/dashboard", "localhost:3011"],
      ["http://localhost:3011/", "localhost:3011"],
      ["http://localhost:3011/reviewers", "localhost:3011"],
    ]) {
      const { rewrite, response } = run(url, host);
      expect(rewrite).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    }
  });

  test("pages that depend on who is signed in are private, no-store and vary on the cookie", () => {
    for (const path of ["/dashboard", "/dashboard/projects/abc", "/docs", "/docs/review", "/review-queue"]) {
      const { response } = run(`http://localhost:3011${path}`, "localhost:3011");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("vary")).toContain("Cookie");
    }
  });

  test("public pages keep their own caching", () => {
    for (const path of ["/", "/accessibility", "/dashboards"]) {
      const { response } = run(`http://localhost:3011${path}`, "localhost:3011");
      expect(response.headers.get("cache-control")).toBeNull();
      expect(response.headers.get("vary")).toBeNull();
    }
  });

  test("every review host answer is private, noindex and never cached", () => {
    const rewritten = run("http://review.localhost:3011/review/2041", "review.localhost:3011").response;
    expect(rewritten.headers.get("cache-control")).toBe("private, no-store");
    expect(rewritten.headers.get("vary")).toContain("Cookie");
    expect(rewritten.headers.get("x-robots-tag")).toContain("noindex");
    const redirected = run("http://review.localhost:3011/stats", "review.localhost:3011").response;
    expect(redirected.status).toBe(308);
    expect(redirected.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
});
