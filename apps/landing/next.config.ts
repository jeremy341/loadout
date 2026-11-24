import type { NextConfig } from "next";

// Headers every response carries. The directives here close framing, <base> hijacks and plugin embeds. The one iframe in the app
// is the reviewer README panel: a sandboxed srcDoc frame with no HTTP response of its own, so frame-ancestors 'none' does not
// affect it (reviewer-dash/app/_components/ReadmePanel.tsx).
//
// Production also restricts scripts to this origin. The app loads no third-party script and never calls eval, so only same-origin
// files and Next's inline bootstrap scripts can run; an injected <script src="https://evil"> is refused. 'unsafe-inline' stays for
// Next's bootstrap until a per-request nonce is wired through proxy.ts (that makes every page dynamic, so it is a separate change).
// Development keeps no script-src, because Next's dev server needs eval for hot reload.
const BASE_CONTENT_SECURITY_POLICY = "frame-ancestors 'none'; base-uri 'self'; object-src 'none'";
const CONTENT_SECURITY_POLICY =
  process.env.NODE_ENV === "production"
    ? `script-src 'self' 'unsafe-inline'; ${BASE_CONTENT_SECURITY_POLICY}`
    : BASE_CONTENT_SECURITY_POLICY;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Only over HTTPS in production: sending it from http://localhost would pin the browser to https for that host.
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];

// The review site has no sitemap. It shares this app, and proxy's matcher skips dotted paths such as /sitemap.xml, so the
// review host's sitemap is blocked here instead. With LOADOUT_REVIEW_HOST set, only those exact hosts match; otherwise any
// "review." host matches in development, mirroring lib/reviewer/host.ts.
const reviewHosts = (process.env.LOADOUT_REVIEW_HOST ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter((host) => host.length > 0);
const reviewHostPattern = reviewHosts.length
  ? `^(${reviewHosts.map((host) => host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?::\\d+)?$`
  : "^review\\.";

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Signed-in pages and the member API answer differently per cookie. They must never be stored by a shared cache.
      ...["/dashboard/:path*", "/api/v1/me/:path*", "/review/:path*"].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      })),
    ];
  },
  async redirects() {
    return [{ source: "/review-queue/index.html", destination: "/review-queue", permanent: true }];
  },
  async rewrites() {
    return {
      beforeFiles: [{ source: "/sitemap.xml", has: [{ type: "host", value: reviewHostPattern }], destination: "/not-found" }],
    };
  },
};

export default nextConfig;
