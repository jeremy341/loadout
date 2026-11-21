"use client";

// The last-resort page: it replaces the whole root layout when the layout itself fails to render, so error.tsx (which sits
// inside the layout) cannot catch it. It owns its <html> and <body>, and depends on nothing the layout provides (no
// accessibility provider, no fonts, no stylesheet, no client router), because any of those may be what broke. The look is the
// cave-in page's, drawn with inline styles in its locked colours (design system, "Error pages"): near-black #0e1112, ink
// #E9EBE7, muted #A7AEAB and the dark accent #5E9EF4. They are literals because no theme token is available here.
const page = {
  margin: 0,
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "24px",
  background: "#0e1112",
  color: "#E9EBE7",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

const button = {
  display: "inline-block",
  padding: "12px 20px",
  border: "2px solid #E9EBE7",
  background: "transparent",
  color: "#E9EBE7",
  font: "inherit",
  letterSpacing: "0.06em",
  textDecoration: "none",
  cursor: "pointer",
} as const;

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>LOADOUT: Cave-in (500)</title>
        <meta name="robots" content="noindex" />
      </head>
      <body style={page}>
        <main style={{ maxWidth: 560 }}>
          <p style={{ margin: 0, letterSpacing: "0.14em", color: "#5E9EF4" }}>EINSTURZ · CAVE-IN</p>
          <h1 style={{ margin: "16px 0", fontSize: "clamp(2.25rem, 8vw, 4rem)", lineHeight: 1.05 }}>Something caved in.</h1>
          <p style={{ margin: "0 0 28px", lineHeight: 1.6, color: "#A7AEAB" }}>
            That one is on us. Try again, or head back up to the surface.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" style={{ ...button, background: "#E9EBE7", color: "#0e1112" }} onClick={reset}>
              TRY AGAIN ↻
            </button>
            {/* A plain link on purpose: a full page load, because the client router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={button}>
              BACK TO THE SURFACE ↑
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
