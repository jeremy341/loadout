import { config } from "@/reviewer-dash/app/_generated/config";

// Centralized guard for rendering a database-controlled URL (repo_url,
// demo_url, ...) as a real <a href>/<img src>/etc. React's JSX escaping only
// protects HTML TEXT content - a plain `<a href={value}>` is NOT sanitized
// against dangerous URL SCHEMES (javascript:, vbscript:, file:, data:, ...)
// the way `dangerouslySetInnerHTML` would need to be. The server now rejects
// those at save time for repo_url/demo_url (see
// apps/server/src/routes/projectUrlSafety.ts), but this is the
// defense-in-depth backstop on the render side - for rows saved before that
// validation existed, or any other database-controlled URL field a reviewer
// page ends up linking.
//
// Returns true only for an absolute http(s) link ("http://" or "https://" written out, with a host) or a same-app path that starts
// with exactly one slash. Never for javascript:/vbscript:/file:/data:/any other scheme, protocol-relative "//host", a backslash
// ("\host", "/\host": browsers read it as a slash), "http:host" without the slashes, or a value with a control character or a
// space: the URL parser silently drops tabs and newlines and would let those through.
const CONTROL_OR_SPACE = /[\u0000-\u0020\u007f-\u009f\\]/;
const APP_BASE = "https://app.invalid";

export function isSafeUrl(url: string | null | undefined): url is string {
  const s = String(url ?? "").trim();
  if (!s || s.length > 2000 || CONTROL_OR_SPACE.test(s)) return false;
  const absolute = /^https?:\/\/[^/?#]/i.test(s);
  const appPath = s.startsWith("/") && !s.startsWith("//");
  if (!absolute && !appPath) return false;
  try {
    const u = new URL(s, APP_BASE);
    if (appPath) return u.origin === APP_BASE;
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname !== "";
  } catch {
    return false;
  }
}

// Guard for server-action "go back" targets (returnTo/back/backTo hidden form
// fields in apps/dashboard/app/actions.ts). Those values are fully
// caller-controlled - redirect() follows absolute URLs, so passing one
// through unchecked is an open redirect. Only a same-app path is ever a
// legitimate value here; anything else (absolute URL, protocol-relative
// "//evil", backslashes, CR/LF) falls back instead of redirecting outward.
export function safeRedirectPath(raw: unknown, fallback: string): string {
  const s = String(raw ?? "").trim();
  if (!s.startsWith("/") || s.startsWith("//")) return fallback;
  if (/[\\]/.test(s)) return fallback;
  if (/[\r\n\u2028\u2029]/.test(s)) return fallback;
  try {
    const u = new URL(s, "https://pixl.invalid");
    // A scheme/host smuggled in any form resolves off the base origin.
    if (u.origin !== "https://pixl.invalid") return fallback;
    const path = u.pathname + u.search + u.hash;
    // A same-origin input can still normalize to a protocol-relative address: /..//evil.com keeps the base origin here but
    // becomes Location: //evil.com in the browser. Check the result, not just the input.
    if (path.startsWith("//")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

// Shop thumbnails: Hack Club CDN (mirrors apps/server imageUrls.ts) and the Pixl site only.
const IMAGE_HOSTS: readonly string[] = [
  "cdn.hackclub.com",
  "hc-cdn.hel1.your-objectstorage.com",
  "assets.hackclub.com",
  new URL(config.urls.site).hostname,
];

export function isSafeImageUrl(url: string | null | undefined): url is string {
  const s = String(url ?? "").trim();
  if (!s || s.length > 500 || /["'<>\s\\]/.test(s)) return false;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return false;
    return IMAGE_HOSTS.includes(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

// A participant's own uploaded picture, served by this app (app/api/journal-media/[id]). The id is a cuid.
const MEDIA_PATH = /^\/api\/journal-media\/[A-Za-z0-9_-]{8,40}$/;

export function isJournalMediaPath(url: string | null | undefined): url is string {
  return MEDIA_PATH.test(String(url ?? "").trim());
}

// Where an <img src> may point on the reviewer site: the shop/CDN allowlist or the participant media path. Anything else is shown
// as a link or as nothing. Pair it with referrerPolicy="no-referrer" so the picture's host never sees which page is being reviewed.
export function isAllowedImageSrc(url: string | null | undefined): url is string {
  return isSafeImageUrl(url) || isJournalMediaPath(url);
}

// HTML-attribute escaping for a value written into a string of markup (a srcDoc, a <base href>).
export function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

// A README's <base href> is upstream-controlled: only an absolute https address (no credentials, control
// characters or spaces) is allowed, and all five HTML-attribute metacharacters are escaped before insertion.
export function safeBaseHref(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || /[\u0000-\u0020\u007f]/.test(value)) return null;
    return escapeAttr(parsed.href);
  } catch {
    return null;
  }
}
