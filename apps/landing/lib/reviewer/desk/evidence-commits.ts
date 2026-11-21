import { isCodeDump } from "@/lib/platform/review";

// Commit history across hosts, as pure functions. Nothing here fetches: a caller (or a fixture) hands over the parsed JSON of a
// response and gets back plain data. The shapes follow the public list-commits responses of GitHub and of Gitea, which Codeberg
// and every self-hosted Forgejo also speak. Rewritten for LOADOUT; the structure follows Pixl's lib/commits.ts and concurrency.ts.

export type CommitHost = "github" | "codeberg" | "forgejo";
export const COMMIT_HOST_LABELS: Record<CommitHost, string> = { github: "GitHub", codeberg: "Codeberg", forgejo: "Forgejo (self-hosted)" };

export type HostCommit = {
  sha: string;
  message: string;
  // A login when the host knows the account, else the name on the commit. Emails are never kept.
  author: string;
  // ISO 8601, or null when the host sent no usable date.
  authoredAt: string | null;
  additions: number | null;
  deletions: number | null;
  // Tracked coding time since the previous commit, joined in from the time record when there is one.
  codedMinutes: number | null;
};

export type ParseResult = { ok: true; commits: HostCommit[]; skipped: number } | { ok: false; reason: string };

const MAX_MESSAGE = 200;
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value : null);
const count = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null);

function isoDate(value: unknown): string | null {
  const text = str(value);
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function firstLine(message: string): string {
  const line = message.split(/\r?\n/, 1)[0].trim();
  return line.length > MAX_MESSAGE ? `${line.slice(0, MAX_MESSAGE - 3)}...` : line;
}

function errorReason(body: unknown): string | null {
  if (isObject(body) && typeof body.message === "string") {
    const text = body.message.toLowerCase();
    if (text.includes("rate limit")) return "The host is limiting requests. Try again later.";
    if (text.includes("not found")) return "The host has no repository at this address, or it is private.";
    if (text.includes("empty")) return "The repository is empty.";
    return "The host refused the request.";
  }
  return null;
}

type RawParts = { sha: unknown; commit: unknown; author: unknown; stats: unknown };

function normalise(raw: RawParts): HostCommit | null {
  const sha = str(raw.sha);
  if (!sha || !/^[0-9a-f]{7,64}$/i.test(sha)) return null;
  if (!isObject(raw.commit)) return null;
  const message = str(raw.commit.message);
  if (!message) return null;
  const inner = isObject(raw.commit.author) ? raw.commit.author : null;
  const login = isObject(raw.author) ? (str(raw.author.login) ?? str(raw.author.username)) : null;
  const name = inner ? str(inner.name) : null;
  const stats = isObject(raw.stats) ? raw.stats : null;
  return {
    sha: sha.toLowerCase(),
    message: firstLine(message),
    author: login ?? name ?? "unknown",
    authoredAt: isoDate(inner?.date),
    additions: stats ? count(stats.additions) : null,
    deletions: stats ? count(stats.deletions) : null,
    codedMinutes: null,
  };
}

function parseList(body: unknown): ParseResult {
  const reason = errorReason(body);
  if (reason) return { ok: false, reason };
  if (!Array.isArray(body)) return { ok: false, reason: "The host answered in a shape that was not a commit list." };
  const commits: HostCommit[] = [];
  let skipped = 0;
  for (const item of body) {
    const parsed = isObject(item) ? normalise({ sha: item.sha, commit: item.commit, author: item.author, stats: item.stats }) : null;
    if (parsed) commits.push(parsed);
    else skipped += 1;
  }
  return { ok: true, commits, skipped };
}

// GitHub: GET /repos/{owner}/{repo}/commits. The list has no line counts; the single-commit response adds `stats`, and this
// reads it when it is there.
export function parseGithubCommits(body: unknown): ParseResult {
  return parseList(body);
}

// Gitea, Codeberg and Forgejo: GET /repos/{owner}/{repo}/commits. Newer versions add `stats` when asked.
export function parseGiteaCommits(body: unknown): ParseResult {
  return parseList(body);
}

export function parseCommitPage(host: CommitHost, body: unknown): ParseResult {
  return host === "github" ? parseGithubCommits(body) : parseGiteaCommits(body);
}

// ---- Paging and the concurrency cap, as planning ----

export const HOST_PAGE_SIZE: Record<CommitHost, number> = { github: 100, codeberg: 50, forgejo: 50 };
export const MAX_COMMIT_PAGES = 10;
export const MAX_DETAIL_FETCHES = 30;
export const DEFAULT_CONCURRENCY = 4;
export const MAX_CONCURRENCY = 8;

export type FetchTask = { kind: "list" | "detail"; host: CommitHost; path: string; query: string };

export function clampPageSize(host: CommitHost, requested?: number): number {
  const cap = HOST_PAGE_SIZE[host];
  if (requested === undefined || !Number.isInteger(requested) || requested < 1) return cap;
  return Math.min(requested, cap);
}

// The relative requests needed to read `total` commits. Paths are relative on purpose: the caller adds the checked host.
export function planCommitPages(input: { host: CommitHost; owner: string; repo: string; total?: number; perPage?: number; maxPages?: number }): FetchTask[] {
  const perPage = clampPageSize(input.host, input.perPage);
  const maxPages = Math.max(1, Math.min(input.maxPages ?? MAX_COMMIT_PAGES, MAX_COMMIT_PAGES));
  const wanted = input.total === undefined ? 1 : Math.max(1, Math.ceil(input.total / perPage));
  const pages = Math.min(wanted, maxPages);
  const limitKey = input.host === "github" ? "per_page" : "limit";
  const path = `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/commits`;
  return Array.from({ length: pages }, (_, index) => ({ kind: "list", host: input.host, path, query: `${limitKey}=${perPage}&page=${index + 1}` }));
}

// GitHub's list leaves out line counts, so each commit needs one more request. Capped, newest first, so a long history is
// sampled rather than hammered.
export function planDetailFetches(input: { host: CommitHost; owner: string; repo: string; shas: readonly string[]; cap?: number }): FetchTask[] {
  if (input.host !== "github") return [];
  const cap = Math.max(0, Math.min(input.cap ?? MAX_DETAIL_FETCHES, MAX_DETAIL_FETCHES));
  const base = `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/commits`;
  return input.shas.slice(0, cap).map((sha) => ({ kind: "detail", host: input.host, path: `${base}/${encodeURIComponent(sha)}`, query: "" }));
}

// Waves of at most `cap` tasks. A caller runs one wave, waits for it, then runs the next. The cap is clamped to 1..8.
export function planWaves<T>(tasks: readonly T[], cap: number = DEFAULT_CONCURRENCY): T[][] {
  const size = Number.isInteger(cap) ? Math.max(1, Math.min(cap, MAX_CONCURRENCY)) : DEFAULT_CONCURRENCY;
  const waves: T[][] = [];
  for (let index = 0; index < tasks.length; index += size) waves.push(tasks.slice(index, index + size));
  return waves;
}

export type Paging = { nextPage: number | null; lastPage: number | null; total: number | null };

// Reads the Link and X-Total-Count headers of a list response. `get` returns a header value or null.
export function pagingFromHeaders(get: (name: string) => string | null): Paging {
  const link = get("link") ?? "";
  const pageOf = (rel: string): number | null => {
    for (const part of link.split(",")) {
      if (!new RegExp(`rel="?${rel}"?`).test(part)) continue;
      const match = /[?&]page=(\d{1,6})/.exec(part);
      if (match) return Number(match[1]);
    }
    return null;
  };
  const totalText = get("x-total-count");
  const total = totalText !== null && /^\d{1,9}$/.test(totalText.trim()) ? Number(totalText) : null;
  return { nextPage: pageOf("next"), lastPage: pageOf("last"), total };
}

// ---- Summaries ----

export type AuthorCount = { author: string; commits: number; share: number };

export function countByAuthor(commits: readonly Pick<HostCommit, "author">[]): AuthorCount[] {
  const tally = new Map<string, number>();
  for (const commit of commits) tally.set(commit.author, (tally.get(commit.author) ?? 0) + 1);
  return [...tally.entries()]
    .map(([author, n]) => ({ author, commits: n, share: commits.length === 0 ? 0 : Math.round((n / commits.length) * 100) }))
    .sort((a, b) => b.commits - a.commits || a.author.localeCompare(b.author));
}

export const GAP_DAYS = 5;
export type CommitGap = { from: string; to: string; days: number };

// Stretches with no commit for at least `minDays` whole days, in date order. Commits without a date are left out.
export function commitGaps(commits: readonly Pick<HostCommit, "authoredAt">[], minDays: number = GAP_DAYS): CommitGap[] {
  const times = commits
    .map((commit) => (commit.authoredAt ? Date.parse(commit.authoredAt) : NaN))
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => a - b);
  const gaps: CommitGap[] = [];
  for (let index = 1; index < times.length; index += 1) {
    const days = Math.floor((times[index] - times[index - 1]) / 86_400_000);
    if (days >= minDays) gaps.push({ from: new Date(times[index - 1]).toISOString(), to: new Date(times[index]).toISOString(), days });
  }
  return gaps;
}

export const LARGE_COMMIT_LINES = 3000;
export type BulkDump = { sha: string; additions: number; kind: "paste" | "large" };

// A "paste" is the existing rule (lots of code, almost no tracked time). With no time record to compare against, a very large
// commit is still worth a question and is called "large".
export function bulkDumps(commits: readonly HostCommit[]): BulkDump[] {
  const out: BulkDump[] = [];
  for (const commit of commits) {
    if (commit.additions === null) continue;
    if (isCodeDump({ additions: commit.additions, codedMinutes: commit.codedMinutes })) out.push({ sha: commit.sha, additions: commit.additions, kind: "paste" });
    else if (commit.codedMinutes === null && commit.additions >= LARGE_COMMIT_LINES) out.push({ sha: commit.sha, additions: commit.additions, kind: "large" });
  }
  return out;
}

// ---- A whole history from page outcomes ----

export type PageOutcome = { page: number; ok: true; body: unknown } | { page: number; ok: false; reason: string };
export type HistoryState = "success" | "partial" | "empty" | "error";

export type CommitHistoryModel = {
  host: CommitHost;
  state: HistoryState;
  commits: HostCommit[];
  pagesPlanned: number;
  pagesAnswered: number;
  skipped: number;
  // One quiet line per problem, in words. Empty on success.
  notes: string[];
  authors: AuthorCount[];
  gaps: CommitGap[];
  dumps: BulkDump[];
};

export function summariseHistory(input: { host: CommitHost; outcomes: readonly PageOutcome[]; pagesPlanned?: number; coded?: ReadonlyMap<string, number | null> }): CommitHistoryModel {
  const seen = new Map<string, HostCommit>();
  const notes: string[] = [];
  let answered = 0;
  let skipped = 0;
  let pageProblems = 0;
  for (const outcome of input.outcomes) {
    if (!outcome.ok) {
      notes.push(`Page ${outcome.page} did not answer: ${outcome.reason}`);
      pageProblems += 1;
      continue;
    }
    const parsed = parseCommitPage(input.host, outcome.body);
    if (!parsed.ok) {
      notes.push(`Page ${outcome.page} could not be read: ${parsed.reason}`);
      pageProblems += 1;
      continue;
    }
    answered += 1;
    skipped += parsed.skipped;
    for (const commit of parsed.commits) if (!seen.has(commit.sha)) seen.set(commit.sha, commit);
  }
  const commits = [...seen.values()]
    .map((commit) => ({ ...commit, codedMinutes: input.coded?.get(commit.sha.slice(0, 7)) ?? commit.codedMinutes }))
    .sort((a, b) => (a.authoredAt ?? "").localeCompare(b.authoredAt ?? ""));
  const planned = Math.max(input.pagesPlanned ?? input.outcomes.length, input.outcomes.length);
  if (skipped > 0) notes.push(`${skipped} ${skipped === 1 ? "entry" : "entries"} in an unexpected shape ${skipped === 1 ? "was" : "were"} left out.`);
  let state: HistoryState;
  if (answered === 0) state = "error";
  else if (answered < planned || pageProblems > 0) state = "partial";
  else state = commits.length === 0 ? "empty" : "success";
  return { host: input.host, state, commits, pagesPlanned: planned, pagesAnswered: answered, skipped, notes, authors: countByAuthor(commits), gaps: commitGaps(commits), dumps: bulkDumps(commits) };
}

export const EMPTY_COMMIT_HISTORY: CommitHistoryModel = summariseHistory({ host: "github", outcomes: [{ page: 1, ok: true, body: [] }] });
export const ERROR_COMMIT_HISTORY: CommitHistoryModel = summariseHistory({ host: "github", outcomes: [{ page: 1, ok: false, reason: "The host did not answer in time." }] });
