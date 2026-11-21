// Fetches the README for the README gate (Pixl precheck/readmeLength.ts and precheck/rules.ts, adopted). Only GitHub
// addresses are read, as Pixl does: other hosts vary and following arbitrary URLs risks SSRF. The text it returns feeds
// checkReadme in readme.ts. Returns null only for a transient failure (the gate then waits and never blocks). Returns "" when
// the repo has no README or when the source cannot be read for a permanent reason, so the gate fails closed instead of leaving
// a non-blocking "waiting" item that would let a project ship with no README check at all.

const SEGMENT = /^[A-Za-z0-9._-]+$/;
const TIMEOUT_MS = 5000;

export type GithubRepo = { owner: string; repo: string };

// Failures that can clear on their own: the caller may retry later, so the README item keeps waiting. Denied or malformed
// requests (401, 403, 4xx other than timeout/rate limit) are permanent and must fail closed.
function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function parseGithubRepo(url: string | null | undefined): GithubRepo | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!SEGMENT.test(owner) || !SEGMENT.test(repo)) return null;
  return { owner, repo };
}

const README_CACHE_MS = 10 * 60 * 1000;
const README_CACHE_MAX = 500;
const readmeCache = new Map<string, { text: string; expires: number }>();

// Successful answers (a README, or "" for none) are kept for ten minutes, so a reload or a test run does not spend the
// unauthenticated GitHub allowance (60 calls an hour) again. Transient failures (null) are never cached. Only the default
// fetch is cached; injected fetchers always run.
export async function fetchGithubReadme(
  repoUrl: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const repo = parseGithubRepo(repoUrl);
  // A source that is not a recognizable GitHub repo has no README we can check. Fail closed rather than wait forever.
  if (!repo) return "";
  const cacheable = fetchImpl === fetch;
  const key = `${repo.owner}/${repo.repo}`.toLowerCase();
  if (cacheable) {
    const hit = readmeCache.get(key);
    if (hit && hit.expires > Date.now()) return hit.text;
  }
  const text = await readFromGithub(repo, fetchImpl);
  if (cacheable && text !== null) {
    if (readmeCache.size >= README_CACHE_MAX) {
      const oldest = readmeCache.keys().next().value;
      if (oldest !== undefined) readmeCache.delete(oldest);
    }
    readmeCache.set(key, { text, expires: Date.now() + README_CACHE_MS });
  }
  return text;
}

async function readFromGithub(repo: GithubRepo, fetchImpl: typeof fetch): Promise<string | null> {
  try {
    // The readme endpoint returns the default branch's README in raw form, whatever its file name.
    const response = await fetchImpl(`https://api.github.com/repos/${repo.owner}/${repo.repo}/readme`, {
      headers: {
        Accept: "application/vnd.github.raw",
        "User-Agent": "loadout-readme-check",
        // LOADOUT_GITHUB_TOKEN raises the limit from 60 calls an hour. It only ever goes to api.github.com.
        ...(process.env.LOADOUT_GITHUB_TOKEN?.trim() ? { Authorization: `Bearer ${process.env.LOADOUT_GITHUB_TOKEN.trim()}` } : {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "error",
    });
    if (response.status === 404) return "";
    // GitHub answers 403 with an exhausted rate limit; that is temporary, not a missing README.
    const rateLimited = response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0";
    if (!response.ok) return isTransientStatus(response.status) || rateLimited ? null : "";
    return await response.text();
  } catch {
    // Network errors and timeouts are transient: keep waiting.
    return null;
  }
}
