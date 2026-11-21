// Pixl reads a repository's commit list and README from GitHub, Codeberg, Gitea or GitLab over the network. LOADOUT sends no
// request: the commits and README come from the sample ship that owns the repository address (lib/platform/review.ts).
// Addresses in the samples are on .example hosts and nothing here resolves them. The types are Pixl's, from lib/commits.ts.
import { REVIEW_SHIPS, type ReviewShip } from "@/lib/platform/review";

export type GitProvider = "github" | "forgejo" | "gitlab";

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  tracked?: number;
  additions?: number;
  deletions?: number;
  ai?: boolean;
}

export interface CommitResult {
  repo: string | null;
  commits: Commit[];
  error: string | null;
  /** The host's own message, when it refused for a reason worth reading verbatim. */
  detail?: string;
  provider?: GitProvider;
  host?: string;
  /** Whether the host indicates additional commits exist past this page. */
  hasMore?: boolean;
}

export interface RepoRef {
  provider: GitProvider | null;
  host: string;
  path: string;
}

export function parseRepoRef(url: string | null | undefined): RepoRef | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
    if (!path) return null;
    return { provider: null, host: parsed.host.toLowerCase(), path };
  } catch {
    return null;
  }
}

const normal = (value: string | null | undefined): string =>
  (value ?? "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\.git$/, "").replace(/\/+$/, "");

function shipForRepo(repoUrl: string | null): ReviewShip | null {
  const key = normal(repoUrl);
  if (!key) return null;
  return REVIEW_SHIPS.find((ship) => normal(ship.source) === key) ?? null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function dateFor(day: string, index: number): string {
  const match = /^(\d{1,2}) ([A-Za-z]{3})/.exec(day);
  const month = match ? Math.max(0, MONTHS.indexOf(match[2].toLowerCase())) : 0;
  const date = match ? Number(match[1]) : 1;
  const now = Date.now();
  const year = new Date(now).getUTCFullYear();
  let at = Date.UTC(year, month, date, 9 + (index % 9), 12);
  if (at > now) at = Date.UTC(year - 1, month, date, 9 + (index % 9), 12);
  return new Date(at).toISOString();
}

// A sample sha is short; the rest is filled with hex digits drawn from it, so the full address looks like one.
function fullSha(short: string): string {
  let out = short;
  let seed = 0;
  for (const ch of short) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  while (out.length < 40) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    out += (seed >>> 28).toString(16);
  }
  return out;
}

export const DEFAULT_COMMIT_LIMIT = 100;

export async function fetchCommits(
  repoUrl: string | null,
  limit = DEFAULT_COMMIT_LIMIT,
  pageOrDeps?: number | object,
  deps?: object,
): Promise<CommitResult> {
  void limit;
  void pageOrDeps;
  void deps;
  const ship = shipForRepo(repoUrl);
  const ref = parseRepoRef(repoUrl);
  if (!ship || !ref) return { repo: ref?.path ?? null, commits: [], error: "unsupported", host: ref?.host };
  const commits = ship.commits.map(
    (commit, index): Commit => ({
      sha: fullSha(commit.sha),
      message: commit.message,
      author: commit.author,
      date: dateFor(commit.day, index),
      url: `https://${ref.host}/${ref.path}/commit/${commit.sha}`,
      // Pixl keeps tracked time in seconds. A commit with no record to compare with stays unknown.
      tracked: commit.codedMinutes === null ? undefined : commit.codedMinutes * 60,
      additions: commit.additions,
      deletions: commit.deletions,
      ai: commit.ai,
    }),
  );
  return { repo: ref.path, commits, error: null, provider: "forgejo", host: ref.host, hasMore: false };
}

// The sample commits already carry their line counts.
export async function attachCommitStats(result: CommitResult, cap = 20): Promise<void> {
  void result;
  void cap;
}

export interface DiffFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string | null;
  truncated?: boolean;
}

export interface CommitDiff {
  files: DiffFile[];
  moreFiles: number;
  error: string | null;
}

export async function fetchCommitDiff(repoUrl: string | null, sha: string, deps?: object): Promise<CommitDiff> {
  void repoUrl;
  void sha;
  void deps;
  return { files: [], moreFiles: 0, error: "unsupported" };
}

export interface RepoReadme {
  kind: "html" | "markdown" | null;
  content: string;
  baseHref: string | null;
  error: string | null;
}

export async function fetchReadme(repoUrl: string | null, deps?: object): Promise<RepoReadme> {
  void deps;
  const ship = shipForRepo(repoUrl);
  if (!ship?.readme) return { kind: null, content: "", baseHref: null, error: "unsupported" };
  const body = [`# ${ship.readme.title}`, ...ship.readme.sections.map((section) => `## ${section.heading}\n\n${section.text}`)].join("\n\n");
  return { kind: "markdown", content: body, baseHref: null, error: null };
}
