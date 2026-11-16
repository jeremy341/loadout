"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, Badge, Button, Callout, Card, EmptyState, Icon, Input, Muted, Textarea } from "@/reviewer-dash/app/_ui/ui";

interface Ticket {
  msg_ts: string;
  description: string;
  status: string;
  opened_by_slack_id: string;
  permalink: string | null;
}

interface ThreadMsg {
  ts: string;
  text: string;
  name: string;
  avatar: string | null;
  isBot: boolean;
}

type Status = "open" | "all" | "closed";

function relTime(slackTs: string): string {
  const d = Date.now() - parseFloat(slackTs) * 1000;
  const m = Math.floor(d / 60000);
  const h = Math.floor(m / 60);
  const dy = Math.floor(h / 24);
  if (dy > 0) return `${dy}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return "< 1m";
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Escapes first, then adds a small set of formatting tags (bold, italic, code, @handle), so the HTML is safe.
function fmtSlack(t: string): string {
  return esc(t ?? "")
    .replace(/\*(.+?)\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="hc-code">$1</code>')
    .replace(/&lt;@([A-Z0-9]+)(?:\|[^&]+)?&gt;/g, '<span class="hc-muted font-bold">@$1</span>')
    .replace(/\n/g, "<br>");
}

// Error pages (a proxy 502, a crashed route) aren't JSON. Never let a parse
// error leak into the UI as "Unexpected token <".
async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function errorText(data: Record<string, unknown>, fallback: string): string {
  return typeof data.error === "string" && data.error ? data.error : fallback;
}

const THREAD_POLL_MS = 5000;
const THREAD_POLL_MAX_MS = 5 * 60 * 1000;

const TABS: { key: Status; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "all", label: "All" },
  { key: "closed", label: "Resolved" },
];

export function TicketsClient() {
  const [status, setStatus] = useState<Status>("open");
  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [listError, setListError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMsg[] | null>(null);
  const [threadIssue, setThreadIssue] = useState<"gone" | "error" | null>(null);
  const [draft, setDraft] = useState("");
  const [rowStatus, setRowStatus] = useState<{ msg: string; kind: "ok" | "err" | "" }>({
    msg: "",
    kind: "",
  });
  const [busy, setBusy] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams({ status });
    if (search.trim()) params.set("search", search.trim());
    try {
      const res = await fetch(`/api/tickets?${params}`);
      if (res.status === 401) {
        location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await readJson(res);
      setTickets(Array.isArray(data.tickets) ? (data.tickets as Ticket[]) : []);
      setListError(false);
    } catch {
      setTickets((prev) => prev ?? []);
      setListError(true);
    }
  }, [status, search]);

  useEffect(() => {
    setTickets(null);
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    const id = setInterval(loadTickets, 30000);
    return () => clearInterval(id);
  }, [loadTickets]);

  // Resolves to the HTTP status (0 on a network error) so the poller can tell
  // "gone for good" (4xx) apart from "try again later" (5xx).
  const loadThread = useCallback(async (ts: string, silent = false): Promise<number> => {
    if (!silent) {
      setThread(null);
      setThreadIssue(null);
    }
    try {
      const res = await fetch(`/api/tickets/${ts}/thread`);
      if (res.status === 401) {
        location.href = "/login";
        return res.status;
      }
      if (res.status === 404) {
        setThread([]);
        setThreadIssue("gone");
        return res.status;
      }
      if (!res.ok) {
        // Keep whatever was already on screen during a polling hiccup.
        if (!silent) {
          setThread([]);
          setThreadIssue("error");
        }
        return res.status;
      }
      const data = await readJson(res);
      setThread(Array.isArray(data.messages) ? (data.messages as ThreadMsg[]) : []);
      setThreadIssue(null);
      return res.status;
    } catch {
      if (!silent) {
        setThread([]);
        setThreadIssue("error");
      }
      return 0;
    }
  }, []);

  useEffect(() => {
    if (!expanded) return;
    let delay = THREAD_POLL_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let stopped = false;

    const schedule = () => {
      if (!stopped && !document.hidden) timer = setTimeout(tick, delay);
    };
    const tick = async () => {
      timer = undefined;
      inFlight = true;
      const status = await loadThread(expanded, true);
      inFlight = false;
      if (status >= 400 && status < 500) {
        stopped = true;
        return;
      }
      delay = status >= 200 && status < 300 ? THREAD_POLL_MS : Math.min(delay * 2, THREAD_POLL_MAX_MS);
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(timer);
        timer = undefined;
      } else if (!timer && !inFlight && !stopped) {
        tick();
      }
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [expanded, loadThread]);

  function toggle(ts: string) {
    setRowStatus({ msg: "", kind: "" });
    if (expanded === ts) {
      setExpanded(null);
      setThread(null);
      return;
    }
    setExpanded(ts);
    setDraft("");
    loadThread(ts);
  }

  async function resolve(ts: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ts}/resolve`, { method: "POST" });
      const data = await readJson(res);
      if (res.ok && data.ok) {
        const notice = typeof data.notice === "string" && data.notice ? data.notice : null;
        setRowStatus({ msg: notice ?? (data.alreadyClosed ? "Already resolved" : "Resolved"), kind: "ok" });
        loadTickets();
        loadThread(ts, true);
      } else {
        setRowStatus({ msg: errorText(data, "Couldn't resolve the ticket. Try again in a moment."), kind: "err" });
      }
    } catch {
      setRowStatus({ msg: "Couldn't reach the server. Check your connection and try again.", kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(ts: string) {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ts}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await readJson(res);
      if (res.ok && data.ok) {
        setDraft("");
        setRowStatus({ msg: "Sent", kind: "ok" });
        loadThread(ts, true);
      } else {
        setRowStatus({ msg: errorText(data, "Couldn't send the reply. Try again in a moment."), kind: "err" });
      }
    } catch {
      setRowStatus({ msg: "Couldn't reach the server. Check your connection and try again.", kind: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card padding="flush">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="hc-segmented w-fit" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={status === t.key}
              className="hc-segmented-item px-3"
              onClick={() => setStatus(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Icon
            glyph="search"
            size={20}
            className="hc-muted pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
          />
          <Input
            type="search"
            className="hc-input-search"
            onChange={(e) => {
              const v = e.target.value;
              if (searchTimer.current) clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => setSearch(v), 300);
            }}
            placeholder="Search tickets"
          />
        </div>
      </div>

      {listError && (
        <div className="p-4 pb-0">
          <Callout tone="danger" icon="important">
            Couldn&apos;t load tickets right now. This retries every 30 seconds.
          </Callout>
        </div>
      )}

      {tickets === null ? (
        <EmptyState title="Loading tickets..." icon="message-simple" />
      ) : tickets.length === 0 ? (
        listError ? null : <EmptyState title="No tickets found" icon="checkmark-all" />
      ) : (
        <ul>
          {tickets.map((t, i) => {
            const open = expanded === t.msg_ts;
            return (
              <li key={t.msg_ts} style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}>
                <button
                  type="button"
                  onClick={() => toggle(t.msg_ts)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
                >
                  <Icon glyph={open ? "down-caret" : "right-caret"} size={18} className="hc-muted shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{t.description || "[no text]"}</span>
                    <Muted className="text-xs">Opened by @{t.opened_by_slack_id}</Muted>
                  </span>
                  <Badge tone={t.status === "open" ? "warning" : "success"}>
                    {t.status === "open" ? "Open" : "Resolved"}
                  </Badge>
                  <Muted className="hc-mono w-10 shrink-0 text-right text-xs">{relTime(t.msg_ts)}</Muted>
                </button>

                {open && (
                  <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {t.status === "open" && (
                        <Button
                          variant="success"
                          size="sm"
                          icon="checkmark"
                          onClick={() => resolve(t.msg_ts)}
                          disabled={busy}
                        >
                          Resolve from here
                        </Button>
                      )}
                    </div>

                    <Card sunken padding="compact">
                      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
                        {thread === null ? (
                          <Muted className="text-xs">Loading thread...</Muted>
                        ) : threadIssue === "gone" ? (
                          <Muted className="text-xs">This ticket&apos;s thread was deleted.</Muted>
                        ) : threadIssue === "error" && thread.length === 0 ? (
                          <Muted className="text-xs">
                            Couldn&apos;t load the thread right now.
                          </Muted>
                        ) : thread.length === 0 ? (
                          <Muted className="text-xs">No messages yet.</Muted>
                        ) : (
                          thread.map((m) => (
                            <div key={m.ts} className="flex gap-2">
                              <Avatar src={m.avatar} size={28} />
                              <div className="min-w-0">
                                <div className="text-xs font-bold">
                                  {m.name}
                                  <Muted className="ml-2 font-normal">{relTime(m.ts)}</Muted>
                                </div>
                                <div
                                  className="text-sm break-words"
                                  dangerouslySetInnerHTML={{ __html: fmtSlack(m.text) }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>

                    {t.status === "open" && (
                      <div className="flex flex-col gap-2">
                        <Textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Reply in the thread as you"
                          rows={2}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            icon="send-fill"
                            onClick={() => sendReply(t.msg_ts)}
                            disabled={busy || !draft.trim()}
                          >
                            Send reply
                          </Button>
                        </div>
                      </div>
                    )}

                    {rowStatus.msg && (
                      <Callout tone={rowStatus.kind === "err" ? "danger" : "success"}>{rowStatus.msg}</Callout>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
