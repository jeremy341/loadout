"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/reviewer-dash/app/_ui/ui";
import { Spinner } from "@/reviewer-dash/app/_components/Loading";

type State = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; doc: string };

const ERRORS: Record<string, string> = {
  not_found: "This repo has no README (or the repo is private).",
  rate_limited: "The git host's rate limit was hit. Try again in a bit.",
  unsupported: "Can't read a README from this repo link.",
};

// The page's theme, read off the shell so the frame matches dark, light and
// the accent color. A sandboxed frame can't see the parent's CSS variables.
function themeVars(): Record<string, string> {
  const shell = document.querySelector(".admin-shell");
  const css = shell ? getComputedStyle(shell) : null;
  const v = (name: string, fallback: string) => css?.getPropertyValue(name).trim() || fallback;
  return {
    text: v("--text", "#f4f4f6"),
    muted: v("--muted", "#8492a6"),
    surface: v("--surface", "#17171d"),
    sunken: v("--sunken", "#121217"),
    border: v("--border", "#26262d"),
    accent: v("--accent", "#5bc0de"),
  };
}

// The README is someone else's HTML, so it only ever renders inside a
// sandboxed iframe: no scripts, no same-origin access, and a CSP that allows
// nothing but images and inline styles. Links open in a new tab.
function frameDoc(html: string, baseHref: string | null): string {
  const t = themeVars();
  const base = baseHref ? `<base href="${baseHref.replace(/"/g, "&quot;")}" target="_blank">` : `<base target="_blank">`;
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; media-src https:">
${base}
<style>
  :root { color-scheme: dark light; }
  body { margin: 0; padding: 20px 24px 32px; background: ${t.surface}; color: ${t.text};
    font: 15px/1.65 "Phantom Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; overflow-wrap: anywhere; }
  article > :first-child, body > :first-child { margin-top: 0; }
  h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 24px 0 12px; font-weight: 700; }
  h1 { font-size: 1.8em; } h2 { font-size: 1.4em; } h3 { font-size: 1.15em; }
  h1, h2 { padding-bottom: 8px; border-bottom: 1px solid ${t.border}; }
  p, ul, ol, blockquote, pre, table, details { margin: 0 0 14px; }
  a { color: ${t.accent}; text-underline-offset: 2px; }
  a.anchor, .octicon-link { display: none; }
  img, video { max-width: 100%; height: auto; border-radius: 6px; }
  ul, ol { padding-left: 26px; } li + li { margin-top: 4px; }
  li.task-list-item { list-style: none; margin-left: -22px; }
  code, pre, kbd, samp { font-family: ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace; font-size: 0.88em; }
  code { background: ${t.sunken}; border: 1px solid ${t.border}; border-radius: 4px; padding: 1px 5px; }
  pre { background: ${t.sunken}; border: 1px solid ${t.border}; border-radius: 8px; padding: 12px 14px; overflow-x: auto; line-height: 1.5; }
  pre code { background: none; border: 0; padding: 0; font-size: 1em; }
  blockquote { border-left: 3px solid ${t.border}; padding: 2px 14px; color: ${t.muted}; }
  table { border-collapse: collapse; display: block; overflow-x: auto; max-width: 100%; }
  th, td { border: 1px solid ${t.border}; padding: 6px 12px; text-align: left; }
  th { background: ${t.sunken}; }
  hr { border: 0; border-top: 1px solid ${t.border}; margin: 24px 0; }
  kbd { background: ${t.sunken}; border: 1px solid ${t.border}; border-radius: 4px; padding: 1px 5px; }
  .markdown-alert { border-left: 3px solid ${t.accent}; padding: 6px 14px; margin-bottom: 14px; }
  .markdown-alert-title { font-weight: 700; display: flex; align-items: center; gap: 6px; }
  svg.octicon { fill: currentColor; }
</style></head><body>${html}</body></html>`;
}

// Loaded the first time the README tab is opened, then kept.
export function ReadmePanel({ projectId, active }: { projectId: number; active: boolean }) {
  const [opened, setOpened] = useState(false);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (active) setOpened(true);
  }, [active]);

  useEffect(() => {
    if (!opened) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/readme`, { signal: ctrl.signal });
        const body = (await res.json()) as { html?: string; baseHref?: string | null; error?: string };
        if (!res.ok || body.error || !body.html) {
          setState({ status: "error", error: body.error ?? `http_${res.status}` });
          return;
        }
        setState({ status: "ready", doc: frameDoc(body.html, body.baseHref ?? null) });
      } catch (e) {
        if ((e as Error).name !== "AbortError") setState({ status: "error", error: "fetch_failed" });
      }
    })();
    return () => ctrl.abort();
  }, [opened, projectId]);

  if (!opened) return null;
  if (state.status === "loading") return <Spinner label="Loading README..." />;
  if (state.status === "error")
    return (
      <EmptyState title="No README to show" icon="docs">
        {ERRORS[state.error] ?? "Couldn't load the README right now."}
      </EmptyState>
    );
  return (
    <iframe
      title="Repository README"
      className="block h-[75vh] w-full border-0"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      srcDoc={state.doc}
    />
  );
}
