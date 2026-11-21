// The /api/v1/docs page: one self-contained HTML document built from OPENAPI_DOCUMENT. No external scripts, styles or fonts, and
// no JavaScript at all, so the page works offline and under a strict content policy. Every value is escaped.
//
// API:
//   renderDocsHtml() -> string
//   escapeHtml(text) -> string
import { API_SCOPES } from "../api-keys";
import { API_LIMITS, OPENAPI_DOCUMENT } from "./openapi";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type OperationLike = {
  summary?: string;
  description?: string;
  "x-required-scope"?: string;
  parameters?: { name: string; in: string; required?: boolean; description?: string }[];
  responses?: Record<string, unknown>;
  security?: unknown[];
};

function endpointRows(): string {
  const rows: string[] = [];
  for (const [path, item] of Object.entries(OPENAPI_DOCUMENT.paths)) {
    const op = (item as { get?: OperationLike }).get;
    if (!op) continue;
    const scope = op["x-required-scope"] ?? "none";
    const params = (op.parameters ?? [])
      .map((p) => `<li><code>${escapeHtml(p.name)}</code> (${escapeHtml(p.in)}${p.required ? ", required" : ""}): ${escapeHtml(p.description ?? "")}</li>`)
      .join("");
    const anonymous = (op.security ?? []).some((s) => typeof s === "object" && s !== null && Object.keys(s).length === 0);
    rows.push(`<section class="endpoint" id="${escapeHtml(path.replace(/[^a-z0-9]+/gi, "-"))}">
  <h3><span class="verb">GET</span> <code>${escapeHtml(path)}</code></h3>
  <p>${escapeHtml(op.summary ?? "")}. ${escapeHtml(op.description ?? "")}</p>
  <p class="meta">Scope: <code>${escapeHtml(scope)}</code>${anonymous ? " &middot; no key needed" : ""}</p>
  ${params ? `<ul class="params">${params}</ul>` : ""}
</section>`);
  }
  return rows.join("\n");
}

export function renderDocsHtml(): string {
  const scopes = API_SCOPES.map((s) => `<li><code>${escapeHtml(s)}</code></li>`).join("");
  const title = escapeHtml(OPENAPI_DOCUMENT.info.title);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} reference</title>
<style>
  :root { --ink: #1d1d1f; --muted: #5b5b63; --line: #e2e2e7; --paper: #ffffff; --code: #f4f4f7; --accent: #0b6e4f; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --ink: #ededf0; --muted: #a4a4ad; --line: #34343b; --paper: #161618; --code: #22222a; --accent: #5fd0a7; }
  }
  :root[data-theme="dark"] { --ink: #ededf0; --muted: #a4a4ad; --line: #34343b; --paper: #161618; --code: #22222a; --accent: #5fd0a7; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 26px; margin: 0 0 8px; }
  h2 { font-size: 19px; margin: 36px 0 10px; border-bottom: 1px solid var(--line); padding-bottom: 6px; }
  h3 { font-size: 16px; margin: 0 0 6px; word-break: break-all; }
  p, li { color: var(--ink); }
  .lead, .meta { color: var(--muted); }
  code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; }
  code { background: var(--code); padding: 1px 5px; border-radius: 4px; }
  pre { background: var(--code); padding: 12px; border-radius: 6px; overflow-x: auto; white-space: pre; }
  .endpoint { border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; margin: 12px 0; }
  .verb { color: var(--accent); font-weight: 600; margin-right: 4px; }
  .params { margin: 6px 0 0; padding-left: 18px; color: var(--muted); }
  table { border-collapse: collapse; width: 100%; }
  td, th { text-align: left; border-bottom: 1px solid var(--line); padding: 6px 4px; vertical-align: top; }
</style>
</head>
<body>
<main>
  <h1>${title}</h1>
  <p class="lead">${escapeHtml(OPENAPI_DOCUMENT.info.summary)}. Version ${escapeHtml(OPENAPI_DOCUMENT.info.version)}.
  The machine readable document is at <a href="/api/v1/openapi.yaml"><code>/api/v1/openapi.yaml</code></a>.</p>

  <h2>Read only</h2>
  <p>Every route is <code>GET</code>. The API never accepts a write, and it never shows another person's email, birthday, age,
  Slack or Hack Club Auth ids, address, ban details, review notes or Ore balance.</p>

  <h2>Authentication</h2>
  <p>Make a key in Settings. A key is shown once. Send it as a bearer token:</p>
  <pre>Authorization: Bearer ldk_...</pre>
  <p>A revoked or expired key answers <code>401</code>. A banned account, or one that asked for deletion, answers <code>403</code>
  for every key.</p>

  <h2>Scopes</h2>
  <p>Each key has the scopes you chose. A route that needs a scope the key lacks answers <code>403</code>.</p>
  <ul>${scopes}</ul>

  <h2>Limits</h2>
  <table>
    <tr><th>Who</th><th>Limit</th></tr>
    <tr><td>Each key</td><td>${API_LIMITS.keyPerMinute} requests a minute and ${API_LIMITS.keyPerDay} a day</td></tr>
    <tr><td>Each address with no valid key</td><td>${API_LIMITS.ipPerMinute} requests a minute</td></tr>
    <tr><td>The export</td><td>${API_LIMITS.exportPerDay} a day per person</td></tr>
  </table>
  <p>Every response has <code>X-Request-Id</code> and <code>X-RateLimit-Limit</code>, <code>-Remaining</code> and <code>-Reset</code>.
  A <code>429</code> also has <code>Retry-After</code>, in seconds.</p>

  <h2>Pages and errors</h2>
  <p>Lists are newest first. <code>limit</code> is ${API_LIMITS.defaultLimit} by default and at most ${API_LIMITS.maxLimit}.
  Take <code>nextCursor</code> from a page and send it as <code>cursor</code> for the next one; <code>nextCursor</code> is null on the last page.</p>
  <p>An error is <code>{ "error": { "code": "...", "message": "..." } }</code>. Quote the <code>X-Request-Id</code> when you ask for help.</p>

  <h2>Example</h2>
  <pre>curl -H "Authorization: Bearer ldk_your_key_here" \\
  "https://YOUR-SITE/api/v1/me/hours?from=2026-11-01&amp;to=2026-11-18&amp;bucket=week"</pre>

  <h2>Endpoints</h2>
  ${endpointRows()}
</main>
</body>
</html>
`;
}
