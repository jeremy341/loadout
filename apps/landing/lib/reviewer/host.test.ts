import { describe, expect, test } from "bun:test";
import { isPrivatePagePath, isReviewerRoute, isReviewHost, movedTo, PROXY_MATCHER, publicPath, reviewerRoute } from "./host";

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

describe("isReviewHost with LOADOUT_REVIEW_HOST", () => {
  const env = { LOADOUT_REVIEW_HOST: "review.example.com" };

  test("only the named host matches, with or without a port, in any case", () => {
    expect(isReviewHost("review.example.com", env)).toBe(true);
    expect(isReviewHost("REVIEW.Example.com:8443", env)).toBe(true);
  });

  test("a forged review.<anything> host no longer matches", () => {
    for (const host of ["review.evil.com", "review.localhost:3011", "review.example.com.evil.com", "example.com", "", null, undefined]) {
      expect(isReviewHost(host, env)).toBe(false);
    }
  });

  test("takes a comma separated list, and a port-specific entry", () => {
    const list = { LOADOUT_REVIEW_HOST: "review.example.com, review.localhost:3011" };
    expect(isReviewHost("review.localhost:3011", list)).toBe(true);
    expect(isReviewHost("review.localhost:3012", list)).toBe(false);
    expect(isReviewHost("review.example.com", list)).toBe(true);
  });

  test("blank or unset keeps the review.<domain> rule outside production", () => {
    expect(isReviewHost("review.localhost:3011", { LOADOUT_REVIEW_HOST: "  " })).toBe(true);
    expect(isReviewHost("review.localhost:3011", {})).toBe(true);
    expect(isReviewHost("review.localhost:3011", { NODE_ENV: "development" })).toBe(true);
    expect(isReviewHost("review.localhost:3011", { NODE_ENV: "test" })).toBe(true);
  });
});

describe("isReviewHost fails closed in production", () => {
  const prod = { NODE_ENV: "production" };

  test("an unconfigured production host matches nothing, not even review.<domain>", () => {
    for (const host of ["review.localhost:3011", "review.example.com", "review.loadout.dino.icu", "REVIEW.Example.com:8443", "review", "localhost:3011", "www.example.com", "", null, undefined]) {
      expect(isReviewHost(host, prod)).toBe(false);
      expect(isReviewHost(host, { ...prod, LOADOUT_REVIEW_HOST: "  ,  " })).toBe(false);
    }
  });

  test("an explicitly configured host still matches, with or without a port", () => {
    const env = { ...prod, LOADOUT_REVIEW_HOST: "review.example.com, review.staging.example.com" };
    expect(isReviewHost("review.example.com", env)).toBe(true);
    expect(isReviewHost("REVIEW.Example.com:8443", env)).toBe(true);
    expect(isReviewHost("review.staging.example.com", env)).toBe(true);
    expect(isReviewHost("review.evil.com", env)).toBe(false);
    expect(isReviewHost("review.localhost:3011", env)).toBe(false);
  });
});

describe("isPrivatePagePath", () => {
  test("covers the dashboard, the docs and the review queue, and nothing that merely starts with them", () => {
    for (const path of ["/dashboard", "/dashboard/projects/abc", "/docs", "/docs/review", "/review-queue", "/Dashboard/x"]) {
      expect(isPrivatePagePath(path)).toBe(true);
    }
    for (const path of ["/", "/dashboards", "/docsify", "/review-queues", "/accessibility", "/robots.txt"]) {
      expect(isPrivatePagePath(path)).toBe(false);
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
    expect(movedTo("/spot-check")).toBe("/review/second-pass");
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
