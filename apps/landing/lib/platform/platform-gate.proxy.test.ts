import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import nextConfig from "../../next.config";
import { proxy } from "../../proxy";
import { PLATFORM_GATE_COOKIE, platformGateToken } from "./platform-gate";

const SECRET = "a-shared-admin-password";
const ENV = { LOADOUT_PLATFORM_PASSWORD: SECRET };

function run(url: string, host = "localhost:3011", token?: string) {
  const request = new NextRequest(url, { headers: { host } });
  if (token) request.cookies.set(PLATFORM_GATE_COOKIE, token);
  return proxy(request);
}

// The proxy reads the gate flag from process.env on each call. Restore it so other suites still see a clean environment.
function withGate<T>(fn: () => T): T {
  const original = process.env.LOADOUT_PLATFORM_PASSWORD;
  process.env.LOADOUT_PLATFORM_PASSWORD = SECRET;
  try {
    return fn();
  } finally {
    if (original === undefined) delete process.env.LOADOUT_PLATFORM_PASSWORD;
    else process.env.LOADOUT_PLATFORM_PASSWORD = original;
  }
}

describe("platform gate in the proxy", () => {
  test("with no password configured, every request is unchanged", () => {
    const original = process.env.LOADOUT_PLATFORM_PASSWORD;
    delete process.env.LOADOUT_PLATFORM_PASSWORD;
    try {
      for (const path of ["/dashboard", "/", "/docs/start", "/review-queue"]) {
        const response = run(`http://localhost:3011${path}`);
        expect(response.headers.get("location")).toBeNull();
        expect(response.headers.get("x-middleware-next")).toBe("1");
      }
    } finally {
      if (original !== undefined) process.env.LOADOUT_PLATFORM_PASSWORD = original;
    }
  });

  test("with the gate on, an anonymous page request redirects to sign-in privately", () => {
    withGate(() => {
      const response = run("http://localhost:3011/dashboard/projects/abc");
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/dashboard/sign-in");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("vary")).toContain("Cookie");
    });
  });

  test("with the gate on, a valid unlock cookie passes the gate", () => {
    withGate(() => {
      const response = run("http://localhost:3011/dashboard", "localhost:3011", platformGateToken(ENV));
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("vary")).toContain("Cookie");
      expect(run("http://localhost:3011/dashboard", "localhost:3011", "stale-token").status).toBe(307);
    });
  });

  test("the gate itself, OAuth, static files and public pages pass through", () => {
    withGate(() => {
      for (const path of [
        "/api/auth/platform-gate",
        "/api/auth/hackclub/start",
        "/api/auth/hackclub/callback",
        "/dashboard/sign-in",
        "/_next/static/chunk.js",
        "/favicon.ico",
        "/robots.txt",
        "/sitemap.xml",
        "/",
        "/docs",
        "/docs/start",
      ]) {
        const response = run(`http://localhost:3011${path}`);
        expect(response.headers.get("location")).toBeNull();
      }
    });
  });

  test("the review host is gated, and its sign-in page is reachable without a loop", () => {
    withGate(() => {
      const anonymous = run("http://review.localhost:3011/review/2041", "review.localhost:3011");
      expect(anonymous.status).toBe(307);
      expect(new URL(anonymous.headers.get("location") ?? "").pathname).toBe("/dashboard/sign-in");

      const signIn = run("http://review.localhost:3011/dashboard/sign-in", "review.localhost:3011");
      expect(signIn.headers.get("location")).toBeNull();
      expect(signIn.headers.get("x-robots-tag")).toContain("noindex");
      expect(signIn.headers.get("cache-control")).toBe("private, no-store");

      const unlocked = run("http://review.localhost:3011/", "review.localhost:3011", platformGateToken(ENV));
      const rewrite = unlocked.headers.get("x-middleware-rewrite");
      expect(rewrite ? new URL(rewrite).pathname : null).toBe("/reviewer");
      expect(unlocked.headers.get("x-robots-tag")).toContain("noindex");
      expect(unlocked.headers.get("cache-control")).toBe("private, no-store");

      const sitemap = run("http://review.localhost:3011/sitemap.xml", "review.localhost:3011", platformGateToken(ENV));
      expect(sitemap.status).toBe(404);
      expect(sitemap.headers.get("x-middleware-rewrite") ?? "").toContain("/not-found");
      expect(sitemap.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    });
  });
});

describe("security headers", () => {
  test("the configured response headers are present and framed in tight", async () => {
    const groups = await (nextConfig.headers as () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>)();
    const general = groups.find((group) => group.source === "/:path*");
    expect(general).toBeDefined();
    const headers = Object.fromEntries((general?.headers ?? []).map((header) => [header.key, header.value]));
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toBe("frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
    expect(headers["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
