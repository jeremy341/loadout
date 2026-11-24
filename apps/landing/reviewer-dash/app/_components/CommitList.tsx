"use client";

import { useEffect, useRef, useState } from "react";
import type { Commit, CommitDiff, CommitResult } from "@/reviewer-dash/lib/commits";
import { Badge, Button, Callout, EmptyState, formatDate, formatDateTime, Icon, Mono, Muted } from "@/reviewer-dash/app/_ui/ui";

const PER_PAGE = 10;

// The commit list isn't GitHub-only, so error copy names whichever host
// actually answered instead of blaming GitHub for a Codeberg timeout.
function hostLabel(result: CommitResult): string {
  return result.host ?? "The git host";
}

function tokenEnv(result: CommitResult): string {
  if (result.provider === "gitlab") return "GITLAB_TOKEN";
  if (result.provider === "forgejo") return "FORGEJO_TOKEN";
  return "GITHUB_TOKEN";
}

function fmtGap(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

function TrackedBadge({ secs }: { secs?: number }) {
  if (secs === undefined) return null;
  if (secs < 120)
    return (
      <span title="Almost no tracked coding time between this commit and the previous one: code appeared without coding.">
        <Badge tone="danger">~0m coded</Badge>
      </span>
    );
  const h = secs / 3600;
  return (
    <span title="Hackatime coding time between this commit and the previous one">
      <Badge>{h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(secs / 60)}m`} coded</Badge>
    </span>
  );
}

function Notice({ tone, children }: { tone: "danger" | "warning" | "neutral"; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <Callout tone={tone} icon="important">
        {children}
      </Callout>
    </div>
  );
}

// One fetch per commit per page view, shared by the hover preview and the
// inline view. A commit never changes, so there is nothing to invalidate.
const diffRequests = new Map<string, Promise<CommitDiff>>();

function loadDiff(projectId: number, sha: string): Promise<CommitDiff> {
  const key = `${projectId}:${sha}`;
  let request = diffRequests.get(key);
  if (!request) {
    request = fetch(`/api/projects/${projectId}/commits/${sha}`)
      .then(async (res) => (res.ok ? ((await res.json()) as CommitDiff) : { files: [], moreFiles: 0, error: `http_${res.status}` }))
      .catch(() => ({ files: [], moreFiles: 0, error: "fetch_failed" }));
    diffRequests.set(key, request);
    // Let a failed load be retried on the next open.
    void request.then((d) => {
      if (d.error) diffRequests.delete(key);
    });
  }
  return request;
}

const DIFF_ERRORS: Record<string, string> = {
  unsupported: "This git host doesn't expose commit diffs. Open the commit to read it there.",
  rate_limited: "The git host's rate limit was hit. Try again in a bit.",
  not_found: "That commit couldn't be found on the host.",
};

function lineKind(line: string): string | undefined {
  if (line.startsWith("@@")) return "hunk";
  if (line.startsWith("+")) return "add";
  if (line.startsWith("-")) return "del";
  return undefined;
}

// Every file can be opened and closed. Lockfiles and very long diffs start
// closed so they don't bury the files worth reading.
const LONG_DIFF_LINES = 400;
const NOISE_FILE_RX = /(^|\/)(package-lock\.json|bun\.lockb?|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|poetry\.lock|composer\.lock|Gemfile\.lock|go\.sum)$|\.min\.(js|css)$|\.map$/;

function startsCollapsed(file: CommitDiff["files"][number]): boolean {
  if (NOISE_FILE_RX.test(file.path)) return true;
  return (file.patch?.split("\n").length ?? 0) > LONG_DIFF_LINES;
}

function DiffView({ projectId, sha }: { projectId: number; sha: string }) {
  const [diff, setDiff] = useState<CommitDiff | null>(null);

  useEffect(() => {
    let live = true;
    void loadDiff(projectId, sha).then((d) => {
      if (live) setDiff(d);
    });
    return () => {
      live = false;
    };
  }, [projectId, sha]);

  if (!diff) return <p className="hc-caption p-4 text-sm">Loading diff...</p>;
  if (diff.error) return <p className="hc-caption p-4 text-sm">{DIFF_ERRORS[diff.error] ?? "Couldn't load this diff right now."}</p>;
  if (diff.files.length === 0) return <p className="hc-caption p-4 text-sm">This commit changed no files.</p>;

  return (
    <div className="hc-diff">
      {diff.files.map((file) => (
        <details key={file.path} className="hc-diff-file" open={!startsCollapsed(file)}>
          <summary>
            <Mono>{file.path}</Mono>
            {file.status !== "modified" && <Badge>{file.status}</Badge>}
            <span className="hc-mono ml-auto shrink-0 text-xs tabular-nums">
              <span className="text-[var(--hc-green)]">+{file.additions}</span>{" "}
              <span className="text-[var(--hc-red)]">-{file.deletions}</span>
            </span>
          </summary>
          {file.patch ? (
            <pre>
              {file.patch.split("\n").map((line, i) => (
                <span key={i} data-kind={lineKind(line)}>
                  {line || " "}
                  {"\n"}
                </span>
              ))}
            </pre>
          ) : (
            <p className="hc-caption px-3 py-2 text-xs">Binary file, or too large for the host to show inline.</p>
          )}
          {file.truncated && <p className="hc-caption px-3 py-2 text-xs">Diff cut off here. Open the commit for the rest.</p>}
        </details>
      ))}
      {diff.moreFiles > 0 && (
        <p className="hc-caption p-3 text-xs">And {diff.moreFiles} more files. Open the commit to see them all.</p>
      )}
    </div>
  );
}

// A commit row. Hovering the hash previews the diff in a popover; clicking the
// message opens it in a row underneath, where it stays until closed.
function CommitRow({
  commit: c,
  dump,
  gap,
  projectId,
  columns,
  hasStats,
  hasTracking,
}: {
  commit: Commit;
  dump: boolean;
  gap?: number;
  projectId?: number;
  columns: number;
  hasStats: boolean;
  hasTracking: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const timer = useRef<number | null>(null);
  const canDiff = projectId !== undefined;

  function schedule(show: boolean, delay: number) {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPreview(show), delay);
  }

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <>
      <tr>
        <td className="whitespace-nowrap">
          <Muted>
            <Mono>{c.date ? formatDateTime(c.date) : "-"}</Mono>
          </Muted>
          {gap !== undefined && (
            <span className="ml-2 text-xs tabular-nums" title="Wall-clock time since the previous commit">
              <Muted>+{fmtGap(gap)}</Muted>
            </span>
          )}
        </td>
        <td className="relative whitespace-nowrap">
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="hc-link"
            onMouseEnter={canDiff && !open ? () => schedule(true, 350) : undefined}
            onMouseLeave={canDiff ? () => schedule(false, 200) : undefined}
            title={c.sha}
          >
            <Mono>{c.sha.slice(0, 7)}</Mono>
          </a>
          {canDiff && preview && !open && (
            <div
              className="hc-diff-popover"
              onMouseEnter={() => schedule(true, 0)}
              onMouseLeave={() => schedule(false, 200)}
            >
              <DiffView projectId={projectId} sha={c.sha} />
            </div>
          )}
        </td>
        <td className="min-w-[16rem] max-w-[420px]">
          <div className="flex flex-wrap items-center gap-2">
            {canDiff ? (
              <button
                type="button"
                className="hc-commit-toggle min-w-0"
                aria-expanded={open}
                onClick={() => {
                  setPreview(false);
                  setOpen((o) => !o);
                }}
              >
                <Icon glyph={open ? "down-caret" : "right-caret"} size={16} className="hc-muted shrink-0" />
                <span className="min-w-0 break-words">{c.message}</span>
              </button>
            ) : (
              <span className="min-w-0 break-words">{c.message}</span>
            )}
            {c.ai && (
              <span title="Signed by an AI tool (co-author trailer, bot author or generated-with footer). Check the AI-used disclosure.">
                <Badge tone="purple">AI commit</Badge>
              </span>
            )}
          </div>
        </td>
        {hasStats && (
          <td className="whitespace-nowrap">
            {c.additions !== undefined && (
              <span
                className={`hc-mono text-xs tabular-nums ${dump ? "font-bold" : ""}`}
                title={dump ? "Huge amount of code vs almost no tracked coding time: possible paste or AI dump." : "Lines added / removed"}
              >
                <span className="text-[var(--hc-green)]">+{c.additions}</span>{" "}
                <span className="text-[var(--hc-red)]">-{c.deletions ?? 0}</span>
              </span>
            )}
          </td>
        )}
        {hasTracking && (
          <td className="whitespace-nowrap">
            <TrackedBadge secs={c.tracked} />
          </td>
        )}
        <td className="whitespace-nowrap">
          <Mono>{c.author}</Mono>
        </td>
      </tr>
      {canDiff && open && (
        <tr className="hc-diff-row">
          <td colSpan={columns}>
            <DiffView projectId={projectId} sha={c.sha} />
          </td>
        </tr>
      )}
    </>
  );
}

// Pass projectId to let reviewers read each commit's diff in place.
export function CommitList({
  result,
  projectId,
  onCommitsChange,
}: {
  result: CommitResult;
  projectId?: number;
  onCommitsChange?: (result: CommitResult) => void;
}) {
  const [commits, setCommits] = useState(result.commits);
  const [hasMore, setHasMore] = useState(Boolean(result.hasMore));
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState(2);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setCommits(result.commits);
    setHasMore(Boolean(result.hasMore));
    setNextPage(2);
    setPage(0);
    setLoadError(null);
  }, [result]);

  async function handleLoadMore() {
    if (!projectId || loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/commits?page=${nextPage}`);
      if (!res.ok) {
        setLoadError(`Failed to load more commits (HTTP ${res.status})`);
        return;
      }
      const data = (await res.json()) as CommitResult;
      if (data.error) {
        setLoadError(data.error);
        return;
      }
      if (data.commits.length > 0) {
        const updated = [...commits, ...data.commits];
        setCommits(updated);
        setNextPage((p) => p + 1);
        onCommitsChange?.({ ...result, commits: updated, hasMore: Boolean(data.hasMore) });
      }
      setHasMore(Boolean(data.hasMore));
    } catch {
      setLoadError("Network error loading commits");
    } finally {
      setLoadingMore(false);
    }
  }

  // Not a repo url, or a host that answers neither the Forgejo (Gitea/Codeberg)
  // nor the GitLab API. The ship can still be valid; we just can't list commits.
  if (result.error === "unsupported_host" || result.error === "not_github")
    return (
      <EmptyState title="No commit API for this host" icon="github">
        {result.host ? `${result.host} isn't supported. ` : ""}Open the repo link to review it by hand.
      </EmptyState>
    );
  if (result.error === "not_found")
    return (
      <Notice tone="danger">
        <Mono>{result.repo}</Mono>: repo not found or private (404){result.host ? ` on ${result.host}` : ""}.
      </Notice>
    );
  if (result.error === "rate_limited")
    return (
      <Notice tone="warning">
        {hostLabel(result)} API rate limit hit. This is not &ldquo;no commits&rdquo;, the list just couldn&apos;t be
        fetched right now. Wait a bit and reload, or ask an owner to set {tokenEnv(result)} on the dashboard to raise
        the limit.
      </Notice>
    );
  if (result.error === "forbidden")
    return (
      <Notice tone="warning">
        {hostLabel(result)} refused this request. Not a rate limit, and not &ldquo;no commits&rdquo;.
        {result.detail && <span className="hc-caption mt-1 block text-sm">{result.detail}</span>}
      </Notice>
    );
  if (result.error)
    return (
      <EmptyState title="Couldn't load commits" icon="github">
        {result.error}
      </EmptyState>
    );
  if (result.commits.length === 0 && commits.length === 0) return <EmptyState title="No commits" icon="github" />;

  const total = commits.length;
  const pages = Math.ceil(total / PER_PAGE);
  const start = page * PER_PAGE;
  const shown = commits.slice(start, start + PER_PAGE);
  const hasTracking = commits.some((c) => c.tracked !== undefined);
  const hasStats = commits.some((c) => c.additions !== undefined);
  const headers = ["When", "Commit", "Message", ...(hasStats ? ["Lines"] : []), ...(hasTracking ? ["Coded"] : []), "Author"];

  // Wall-clock gap to the previous commit, in date order.
  const gaps = new Map<string, number>();
  const asc = commits.filter((c) => c.date).sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < asc.length; i++) {
    const s = (new Date(asc[i].date).getTime() - new Date(asc[i - 1].date).getTime()) / 1000;
    if (Number.isFinite(s) && s >= 0) gaps.set(asc[i].sha, s);
  }

  return (
    <div>
      <p className="hc-caption border-b border-[var(--border)] px-4 py-3 text-sm">
        <Mono>{result.repo}</Mono> · {total} commits{hasMore ? "+" : ""}
        {asc.length > 0 && (
          <>
            {" "}
            · {formatDate(asc[0].date)} to {formatDate(asc[asc.length - 1].date)}
          </>
        )}
        {hasTracking && (
          <>
            {" "}
            · &ldquo;Coded&rdquo; is Hackatime time since the previous commit. <Badge tone="danger">~0m coded</Badge>{" "}
            means code landed with no tracked coding behind it.
          </>
        )}
      </p>
      <div className="hc-table-wrap">
        <table className="hc-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => {
              const dump =
                c.tracked !== undefined &&
                c.additions !== undefined &&
                c.additions >= 200 &&
                c.additions / (Math.max(c.tracked, 60) / 3600) > 1500;
              return (
                <CommitRow
                  key={c.sha}
                  commit={c}
                  dump={dump}
                  gap={gaps.get(c.sha)}
                  projectId={projectId}
                  columns={headers.length}
                  hasStats={hasStats}
                  hasTracking={hasTracking}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {(pages > 1 || (projectId && hasMore)) && (
        <nav className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3">
          <span className="hc-caption text-sm">
            Page {page + 1} of {Math.max(1, pages)}
          </span>
          <div className="flex items-center gap-2">
            {page > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPage(page - 1)}>
                Previous
              </Button>
            )}
            {page < pages - 1 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPage(page + 1)}>
                Next
              </Button>
            )}
            {projectId && hasMore && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={handleLoadMore}
              >
                {loadingMore ? "Loading..." : "Load 100 more"}
              </Button>
            )}
          </div>
        </nav>
      )}
      {loadError && (
        <div className="px-4 py-2 text-sm text-[var(--hc-red)] border-t border-[var(--border)]">
          {loadError}
        </div>
      )}
    </div>
  );
}
