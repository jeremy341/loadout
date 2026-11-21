import type { NextConfig } from "next";

// Headers every response carries. There is deliberately no script-src or style-src: a strict one would break Next's dev HMR and
// the inline scripts it emits, and needs a nonce setup of its own. The directives here cost nothing and close framing, <base>
// hijacks and plugin embeds. The one iframe in the app is the reviewer README panel: a sandboxed srcDoc frame with no HTTP
// response of its own, so frame-ancestors 'none' does not affect it and no same-origin embed needs 'self' here
// (reviewer-dash/app/_components/ReadmePanel.tsx).
const CONTENT_SECURITY_POLICY = "frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

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
