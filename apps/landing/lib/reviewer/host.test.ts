import { describe, expect, test } from "bun:test";
import { isReviewerRoute, isReviewHost, movedTo, PROXY_MATCHER, publicPath, reviewerRoute } from "./host";

describe("isReviewHost", () => {
  test("matches review.<anything>, with or without a port", () => {
    for (const host of ["review.localhost:3011", "review.localhost", "review.example.com", "review.loadout.dino.icu", "REVIEW.Example.com:8443"]) {
      expect(isReviewHost(host)).toBe(true);
    }
  });

  test("does not match other hosts", () => {
    for (const host of ["localhost:3011", "localhost", "www.example.com", "reviewer.example.com", "review", "review.", "notreview.example.com", "example.com", "loadout.dino.icu", "x.review.example.com", "", null, undefined]) {
      expect(isReviewHost(host)).toBe(false);
    }
  });
});

describe("reviewerRoute", () => {
  test("maps the root to the Overview and keeps the rest", () => {
    expect(reviewerRoute("/")).toBe("/reviewer");
    expect(reviewerRoute("/review")).toBe("/reviewer/review");
    expect(reviewerRoute("/review/sh-2041")).toBe("/reviewer/review/sh-2041");
    expect(reviewerRoute("/reviewers")).toBe("/reviewer/reviewers");
    expect(reviewerRoute("/review/second-pass")).toBe("/reviewer/review/second-pass");
  });
});

describe("isReviewerRoute", () => {
  test("is true for /reviewer and below, false for lookalikes", () => {
    expect(isReviewerRoute("/reviewer")).toBe(true);
    expect(isReviewerRoute("/reviewer/ship/x")).toBe(true);
    expect(isReviewerRoute("/reviewers")).toBe(false);
    expect(isReviewerRoute("/reviewer-notes")).toBe(false);
    expect(isReviewerRoute("/dashboard/reviewer")).toBe(false);
  });
});

describe("publicPath", () => {
  test("accepts the browser path or the internal one", () => {
    expect(publicPath("/reviewer")).toBe("/");
    expect(publicPath("/")).toBe("/");
    expect(publicPath("/reviewer/review/x")).toBe("/review/x");
    expect(publicPath("/review/x")).toBe("/review/x");
    expect(publicPath("/reviewers")).toBe("/reviewers");
  });
});

describe("movedTo", () => {
  test("old addresses go to Pixl's paths", () => {
    expect(movedTo("/hardware")).toBe("/review/hardware");
    expect(movedTo("/second-pass")).toBe("/review/second-pass");
    expect(movedTo("/spot-check")).toBe("/review/spot-check");
    expect(movedTo("/reviewed")).toBe("/review/reviewed");
    expect(movedTo("/stats")).toBe("/review/stats");
    expect(movedTo("/log")).toBe("/review/log");
    expect(movedTo("/guidelines")).toBe("/review/guidelines");
    expect(movedTo("/proposed-bans")).toBe("/review/proposed-bans");
    expect(movedTo("/goals")).toBe("/community-goals");
    expect(movedTo("/show-and-tell")).toBe("/show-n-tell");
    expect(movedTo("/ship/sh-2041")).toBe("/review/2041");
    expect(movedTo("/review/sh-2043")).toBe("/review/2043");
    expect(movedTo("/ship/abc")).toBe("/review/abc");
    expect(movedTo("/stats/")).toBe("/review/stats");
  });

  test("current addresses, lookalikes and the root do not move", () => {
    for (const path of ["/", "/review", "/review/stats", "/review/2041", "/reviews", "/statsx", "/logs", "/players", "/ship", "/ship/a/b", "/community-goals", "/constructor", "/toString"]) {
      expect(movedTo(path)).toBeNull();
    }
  });
});

describe("matcher", () => {
  const pattern = new RegExp(`^${PROXY_MATCHER}$`);
  test("runs on pages", () => {
    for (const path of ["/", "/review/sh-2041", "/reviewers/orrery", "/reviewer", "/reviewer/ship/x", "/dashboard", "/docs/start"]) {
      expect(pattern.test(path)).toBe(true);
    }
  });
  test("skips internals, the API, files and /loadout assets", () => {
    for (const path of ["/_next/static/chunks/a.js", "/_next/image", "/api/health", "/favicon.ico", "/fonts/PixelifySans.ttf", "/loadout/sprites/ore.png", "/loadout/shop/a-1234.webp", "/robots.txt"]) {
      expect(pattern.test(path)).toBe(false);
    }
  });
});
