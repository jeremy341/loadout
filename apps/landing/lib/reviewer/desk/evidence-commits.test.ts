import { describe, expect, test } from "bun:test";
import {
  bulkDumps,
  clampPageSize,
  commitGaps,
  countByAuthor,
  EMPTY_COMMIT_HISTORY,
  ERROR_COMMIT_HISTORY,
  pagingFromHeaders,
  parseCommitPage,
  parseGiteaCommits,
  parseGithubCommits,
  planCommitPages,
  planDetailFetches,
  planWaves,
  summariseHistory,
  type HostCommit,
} from "./evidence-commits";
import { commitHistoryFor } from "./evidence-fixtures";

const githubRow = (sha: string, login: string | null, date: string, extra: Record<string, unknown> = {}) => ({
  sha,
  commit: { message: "Add parser\n\nLong body", author: { name: "Some Name", email: "x@y.invalid", date } },
  author: login === null ? null : { login },
  ...extra,
});

describe("GitHub shape", () => {
  test("login wins over the commit name, the first line is the message, and no email is kept", () => {
    const result = parseGithubCommits([githubRow("a".repeat(40), "kestrel42", "2026-10-14T09:00:00Z")]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commits[0]).toMatchObject({ message: "Add parser", author: "kestrel42", authoredAt: "2026-10-14T09:00:00.000Z", additions: null });
    expect(JSON.stringify(result)).not.toContain("invalid");
  });

  test("a commit with no linked account falls back to the commit name", () => {
    const result = parseGithubCommits([githubRow("b".repeat(40), null, "2026-10-14T09:00:00Z")]);
    expect(result.ok && result.commits[0].author).toBe("Some Name");
  });

  test("stats are read when the single-commit response added them", () => {
    const result = parseGithubCommits([githubRow("c".repeat(40), "q", "2026-10-14T09:00:00Z", { stats: { additions: 12, deletions: 3, total: 15 } })]);
    expect(result.ok && [result.commits[0].additions, result.commits[0].deletions]).toEqual([12, 3]);
  });

  test("entries in the wrong shape are counted and left out", () => {
    const result = parseGithubCommits([githubRow("d".repeat(40), "q", "2026-10-14T09:00:00Z"), null, 7, { sha: "zz" }, { sha: "e".repeat(40) }, { sha: "f".repeat(40), commit: { message: "" } }]);
    expect(result.ok && result.commits).toHaveLength(1);
    expect(result.ok && result.skipped).toBe(5);
  });

  test("an unreadable date becomes null and a long message is cut", () => {
    const result = parseGithubCommits([{ sha: "1".repeat(40), commit: { message: "x".repeat(500), author: { name: "n", date: "yesterday-ish" } }, author: { login: "q" } }]);
    expect(result.ok && result.commits[0].authoredAt).toBeNull();
    expect(result.ok && result.commits[0].message.length).toBeLessThanOrEqual(200);
  });

  test("error bodies and non-lists become a reason", () => {
    expect(parseGithubCommits({ message: "Not Found" })).toEqual({ ok: false, reason: "The host has no repository at this address, or it is private." });
    expect(parseGithubCommits({ message: "API rate limit exceeded" }).ok).toBe(false);
    expect(parseGithubCommits({ message: "Git Repository is empty." }).ok).toBe(false);
    expect(parseGithubCommits({ message: "Bad credentials" }).ok).toBe(false);
    expect(parseGithubCommits("<html>").ok).toBe(false);
    expect(parseGithubCommits(null).ok).toBe(false);
    expect(parseGithubCommits({ items: [] }).ok).toBe(false);
  });
});

describe("Gitea, Codeberg and Forgejo shape", () => {
  const row = { sha: "9".repeat(40), created: "2026-10-20T10:00:00Z", commit: { message: "Fix\n", author: { name: "n", date: "2026-10-20T10:00:00+02:00" } }, author: { login: "ploughshare", username: "ploughshare" }, stats: { additions: 5, deletions: 2, total: 7 } };

  test("parses the list and stats, with time zones normalised", () => {
    const result = parseGiteaCommits([row]);
    expect(result.ok && result.commits[0]).toMatchObject({ author: "ploughshare", additions: 5, deletions: 2, authoredAt: "2026-10-20T08:00:00.000Z", message: "Fix" });
  });

  test("a user without a login falls back to the username, then the name", () => {
    const result = parseGiteaCommits([{ ...row, author: { username: "only-username" } }, { ...row, sha: "8".repeat(40), author: null }]);
    expect(result.ok && result.commits.map((c) => c.author)).toEqual(["only-username", "n"]);
  });

  test("the host picks the parser", () => {
    expect(parseCommitPage("codeberg", [row]).ok).toBe(true);
    expect(parseCommitPage("forgejo", [row]).ok).toBe(true);
    expect(parseCommitPage("github", [row]).ok).toBe(true);
    expect(parseCommitPage("forgejo", { message: "Not Found" }).ok).toBe(false);
  });
});

describe("paging and the concurrency cap", () => {
  test("the page size is capped per host", () => {
    expect(clampPageSize("github")).toBe(100);
    expect(clampPageSize("github", 500)).toBe(100);
    expect(clampPageSize("codeberg", 500)).toBe(50);
    expect(clampPageSize("forgejo", 20)).toBe(20);
    expect(clampPageSize("forgejo", 0)).toBe(50);
    expect(clampPageSize("forgejo", 2.5)).toBe(50);
  });

  test("pages cover the total and use each host's names", () => {
    const github = planCommitPages({ host: "github", owner: "o", repo: "r", total: 250 });
    expect(github.map((task) => task.query)).toEqual(["per_page=100&page=1", "per_page=100&page=2", "per_page=100&page=3"]);
    const codeberg = planCommitPages({ host: "codeberg", owner: "o", repo: "r", total: 120 });
    expect(codeberg.map((task) => task.query)).toEqual(["limit=50&page=1", "limit=50&page=2", "limit=50&page=3"]);
    expect(planCommitPages({ host: "forgejo", owner: "o", repo: "r" })).toHaveLength(1);
  });

  test("a huge history stops at ten pages", () => {
    expect(planCommitPages({ host: "forgejo", owner: "o", repo: "r", total: 1_000_000 })).toHaveLength(10);
    expect(planCommitPages({ host: "forgejo", owner: "o", repo: "r", total: 1_000_000, maxPages: 3 })).toHaveLength(3);
    expect(planCommitPages({ host: "forgejo", owner: "o", repo: "r", total: 1_000_000, maxPages: 99 })).toHaveLength(10);
  });

  test("paths are relative and the owner and repository are encoded", () => {
    const [task] = planCommitPages({ host: "github", owner: "a/b", repo: "c d", total: 1 });
    expect(task.path).toBe("/repos/a%2Fb/c%20d/commits");
    expect(task.path.startsWith("/")).toBe(true);
    expect(task.path).not.toContain("://");
  });

  test("detail requests exist only for GitHub and are capped", () => {
    const shas = Array.from({ length: 80 }, (_, index) => String(index).padStart(7, "a"));
    expect(planDetailFetches({ host: "github", owner: "o", repo: "r", shas })).toHaveLength(30);
    expect(planDetailFetches({ host: "github", owner: "o", repo: "r", shas, cap: 5 })).toHaveLength(5);
    expect(planDetailFetches({ host: "github", owner: "o", repo: "r", shas, cap: 500 })).toHaveLength(30);
    expect(planDetailFetches({ host: "codeberg", owner: "o", repo: "r", shas })).toEqual([]);
  });

  test("waves never exceed the cap, keep order and lose nothing", () => {
    const tasks = Array.from({ length: 10 }, (_, index) => index);
    const waves = planWaves(tasks, 4);
    expect(waves.map((wave) => wave.length)).toEqual([4, 4, 2]);
    expect(waves.flat()).toEqual(tasks);
    expect(planWaves(tasks).every((wave) => wave.length <= 4)).toBe(true);
    expect(planWaves(tasks, 0).every((wave) => wave.length === 1)).toBe(true);
    expect(planWaves(tasks, 100).every((wave) => wave.length <= 8)).toBe(true);
    expect(planWaves(tasks, Number.NaN).every((wave) => wave.length <= 4)).toBe(true);
    expect(planWaves([], 4)).toEqual([]);
  });

  test("paging headers are read, and bad ones are ignored", () => {
    const headers: Record<string, string> = {
      link: '<https://host.example/api?page=3&per_page=50>; rel="next", <https://host.example/api?page=9&per_page=50>; rel="last"',
      "x-total-count": "431",
    };
    expect(pagingFromHeaders((name) => headers[name] ?? null)).toEqual({ nextPage: 3, lastPage: 9, total: 431 });
    expect(pagingFromHeaders(() => null)).toEqual({ nextPage: null, lastPage: null, total: null });
    expect(pagingFromHeaders((name) => (name === "x-total-count" ? "lots" : null)).total).toBeNull();
  });
});

const at = (author: string, day: string, extra: Partial<HostCommit> = {}): HostCommit => ({ sha: `${author}${day}`.padEnd(7, "0"), message: "m", author, authoredAt: `2026-10-${day}T10:00:00Z`, additions: 10, deletions: 1, codedMinutes: 60, ...extra });

describe("authors, gaps and bulk dumps", () => {
  test("authors are counted, ordered and given a share", () => {
    const counts = countByAuthor([at("b", "10"), at("a", "11"), at("a", "12"), at("c", "13")]);
    expect(counts).toEqual([
      { author: "a", commits: 2, share: 50 },
      { author: "b", commits: 1, share: 25 },
      { author: "c", commits: 1, share: 25 },
    ]);
    expect(countByAuthor([])).toEqual([]);
  });

  test("gaps are quiet stretches of five days or more, in order", () => {
    const gaps = commitGaps([at("a", "20"), at("a", "10"), at("a", "12"), at("a", "30"), at("a", "15")]);
    expect(gaps.map((gap) => gap.days)).toEqual([5, 10]);
    expect(commitGaps([at("a", "10"), at("a", "14")])).toEqual([]);
    expect(commitGaps([at("a", "10"), at("a", "15")], 6)).toEqual([]);
    expect(commitGaps([at("a", "10", { authoredAt: null })])).toEqual([]);
    expect(commitGaps([])).toEqual([]);
  });

  test("a paste is code with almost no tracked time; a large commit is flagged only without a time record", () => {
    const dumps = bulkDumps([
      at("a", "10", { sha: "paste00", additions: 3140, codedMinutes: 2 }),
      at("a", "11", { sha: "fine000", additions: 300, codedMinutes: 120 }),
      at("a", "12", { sha: "large00", additions: 4000, codedMinutes: null }),
      at("a", "13", { sha: "small00", additions: 150, codedMinutes: null }),
      at("a", "14", { sha: "nostats", additions: null }),
      at("a", "15", { sha: "tracked", additions: 9000, codedMinutes: 600 }),
    ]);
    expect(dumps).toEqual([
      { sha: "paste00", additions: 3140, kind: "paste" },
      { sha: "large00", additions: 4000, kind: "large" },
    ]);
  });
});

describe("a whole history", () => {
  test("the sample GitHub history parses, orders and counts", () => {
    const model = commitHistoryFor("sh-2041");
    expect(model?.state).toBe("success");
    expect(model?.host).toBe("github");
    expect(model?.commits).toHaveLength(6);
    expect(model?.authors[0]).toMatchObject({ author: "kestrel42", commits: 6, share: 100 });
    expect(model?.commits.map((c) => c.authoredAt)).toEqual([...(model?.commits.map((c) => c.authoredAt) ?? [])].sort());
    expect(model?.commits.every((c) => c.codedMinutes !== null)).toBe(true);
    expect(model?.gaps.length).toBeGreaterThan(0);
  });

  test("the Codeberg history is read in the Gitea shape", () => {
    const model = commitHistoryFor("sh-2043");
    expect(model?.host).toBe("codeberg");
    expect(model?.state).toBe("success");
    expect(model?.commits).toHaveLength(5);
  });

  test("the Forgejo history is partial: one page answered and one did not", () => {
    const model = commitHistoryFor("sh-2045");
    expect(model?.host).toBe("forgejo");
    expect(model?.state).toBe("partial");
    expect(model?.pagesAnswered).toBe(1);
    expect(model?.pagesPlanned).toBe(2);
    expect(model?.commits).toHaveLength(3);
    expect(model?.notes.join(" ")).toContain("Page 2 did not answer");
  });

  test("a ship with no host in the sample table has no model", () => {
    expect(commitHistoryFor("sh-2042")).toBeNull();
    expect(commitHistoryFor("sh-0000")).toBeNull();
  });

  test("the sample paste is found in the packet dashboard commits", () => {
    const body = [{ sha: "a".repeat(40), commit: { message: "Add chart components", author: { name: "n", date: "2026-10-22T10:00:00Z" } }, author: { login: "ostler" }, stats: { additions: 3140, deletions: 12 } }];
    const model = summariseHistory({ host: "github", outcomes: [{ page: 1, ok: true, body }], coded: new Map([["aaaaaaa", 2]]) });
    expect(model.dumps).toEqual([{ sha: "a".repeat(40), additions: 3140, kind: "paste" }]);
  });

  test("duplicate commits across pages count once", () => {
    const row = githubRow("a".repeat(40), "q", "2026-10-14T09:00:00Z");
    const model = summariseHistory({ host: "github", outcomes: [{ page: 1, ok: true, body: [row] }, { page: 2, ok: true, body: [row] }] });
    expect(model.commits).toHaveLength(1);
    expect(model.state).toBe("success");
  });

  test("empty, error and unreadable pages never throw", () => {
    expect(EMPTY_COMMIT_HISTORY.state).toBe("empty");
    expect(ERROR_COMMIT_HISTORY.state).toBe("error");
    expect(ERROR_COMMIT_HISTORY.notes[0]).toContain("did not answer");
    const unreadable = summariseHistory({ host: "forgejo", outcomes: [{ page: 1, ok: true, body: "oops" }] });
    expect(unreadable.state).toBe("error");
    const none = summariseHistory({ host: "forgejo", outcomes: [] });
    expect(none.state).toBe("error");
    const skippedOnly = summariseHistory({ host: "github", outcomes: [{ page: 1, ok: true, body: [{ nope: true }] }] });
    expect(skippedOnly.state).toBe("empty");
    expect(skippedOnly.notes.join(" ")).toContain("unexpected shape");
  });
});
