"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { reviewQueueHref } from "@/lib/platform/nav";

type QueueKind = "software" | "hardware";
type Row = { id: number; name: string; owner_name: string | null; project_type: string | null; wait_start: string; shipped_at: string };
type Queue = { waiting: Row[]; final_checks: Row[] };
type Snapshot = {
  generated_at: string;
  reviewed_24h: { approved: number; needs_changes: number };
  queues: Record<QueueKind, Queue>;
};

function matches(row: Row, search: string) {
  if (/^#\d+$/.test(search)) return String(row.id) === search.slice(1);
  const term = search.toLowerCase().replace(/^@/, "");
  return String(row.id) === term || row.name.toLowerCase().includes(term) || row.owner_name?.toLowerCase().includes(term);
}

function waitTime(start: string, now: string) {
  const hours = Math.max(0, Math.floor((Date.parse(now) - Date.parse(start)) / 3_600_000));
  if (hours === 0) return "Under 1 hour";
  if (hours < 24) return `${hours}h`;
  const rest = hours % 24;
  return rest ? `${Math.floor(hours / 24)}d ${rest}h` : `${Math.floor(hours / 24)}d`;
}

function QueueRows({ rows, now, empty }: { rows: { row: Row; position?: number }[]; now: string; empty: string }) {
  if (!rows.length) return <p className="pf-rq-empty">{empty}</p>;
  return (
    <ol className="pf-rq-rows">
      {rows.map(({ row, position }) => (
        <li key={row.id}>
          {position ? <span className="pf-rq-position" aria-label={`Position ${position}`}>#{position}</span> : null}
          <div>
            <strong>{row.name}</strong>
            <small>#{row.id}{row.owner_name ? ` · @${row.owner_name}` : ""}{row.project_type ? ` · ${row.project_type}` : ""}</small>
          </div>
          <div className="pf-rq-wait">
            <strong>{waitTime(row.wait_start, now)}</strong>
            <small>Shipped {new Date(row.shipped_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ReviewQueue({ initialSearch, initialQueue, visitor = false }: { initialSearch: string; initialQueue: QueueKind; visitor?: boolean }) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [kind, setKind] = useState(initialQueue);
  const [copyStatus, setCopyStatus] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const baseline = useRef(new Map<string, number | null>());
  const [movement, setMovement] = useState<{ key: string; text: string }>();
  const term = search.trim();
  const queue = snapshot?.queues[kind];
  const waiting = queue?.waiting.map((row, index) => ({ row, position: index + 1 })).filter(({ row }) => matches(row, term)) ?? [];
  const final = queue?.final_checks.filter((row) => matches(row, term)) ?? [];
  const other = kind === "software" ? "hardware" : "software";
  const otherQueue = snapshot?.queues[other];
  const inOther = otherQueue && [...otherQueue.waiting, ...otherQueue.final_checks].some((row) => matches(row, term));
  const result = term && waiting.length === 1 ? waiting[0] : undefined;
  const generatedAt = snapshot?.generated_at;
  const resultId = result?.row.id;
  const position = result?.position;
  const resultKey = resultId === undefined ? "" : `${kind}:${resultId}`;
  const shareId = resultId ?? (term && !waiting.length && final.length === 1 ? final[0].id : undefined);

  useEffect(() => {
    const controller = new AbortController();
    let refreshing = false;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const response = await fetch("/api/review/queue", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Queue unavailable");
        const next: Snapshot = await response.json();
        if (controller.signal.aborted) return;
        setSnapshot(next);
        setOffline(false);
      } catch {
        if (!controller.signal.aborted) setOffline(true);
      } finally {
        refreshing = false;
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 120_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))) return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    if (!resultKey || position === undefined || !generatedAt) return;
    const storageKey = "loadout-review-queue-positions";
    try {
      const now = Date.parse(generatedAt);
      const history = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<string, { position: number; at: number }>;
      for (const [key, item] of Object.entries(history)) {
        if (now - item.at > 30 * 86_400_000) delete history[key];
      }
      if (!baseline.current.has(resultKey)) baseline.current.set(resultKey, history[resultKey]?.position ?? null);
      history[resultKey] = { position, at: now };
      localStorage.setItem(storageKey, JSON.stringify(history));
      const previous = baseline.current.get(resultKey);
      if (previous == null) return;
      const change = previous - position;
      const spots = Math.abs(change) === 1 ? "spot" : "spots";
      const text = change === 0 ? "Same position as last visit." : `${change > 0 ? "Up" : "Down"} ${Math.abs(change)} ${spots} since your last visit.`;
      setMovement({ key: resultKey, text });
    } catch {
      // Queue lookup still works when local storage is unavailable.
    }
  }, [resultKey, position, generatedAt]);

  async function copyLink(id: number) {
    try {
      await navigator.clipboard.writeText(new URL(reviewQueueHref(id, kind === "hardware"), location.origin).href);
      setCopyStatus("Link copied.");
    } catch {
      setCopyStatus("Could not copy the link.");
    }
  }

  const software = snapshot?.queues.software.waiting.length ?? 0;
  const hardware = snapshot?.queues.hardware.waiting.length ?? 0;
  const checked = snapshot ? snapshot.queues.software.final_checks.length + snapshot.queues.hardware.final_checks.length : 0;
  const total = software + hardware + checked;
  const status = offline ? (snapshot ? "Refresh unavailable. Showing the last loaded positions." : "The queue is unavailable. Refresh to try again.") : snapshot ? "Live · refreshes every 2 minutes" : "Loading queue…";

  return (
    <article className="pf-rq">
      <header className="pf-rq-head">
        <h1>Review Queue</h1>
        <p role="status">{status}</p>
      </header>
      <section className="pf-rq-find" aria-labelledby="review-search">
        <h2 id="review-search"><label htmlFor="review-queue-search">Find your project</label></h2>
        <input className="pf-explore-input" id="review-queue-search" ref={input} type="search" value={search} aria-describedby="review-search-hint"
          placeholder="Search projects" onChange={(event) => { setSearch(event.target.value); setCopyStatus(""); }}
          onKeyDown={(event) => { if (event.key === "Escape") { setSearch(""); setCopyStatus(""); } }} />
        <p className="pf-rq-hint" id="review-search-hint">Search by project name, builder handle or #ID. Press / to jump here.</p>
        {term && snapshot ? (
          <div className="pf-rq-result">
            <div aria-live="polite">
              {result && queue ? <>
                <strong>#{result.position} of {queue.waiting.length} in the {kind} queue</strong>
                <p>{waitTime(result.row.wait_start, snapshot.generated_at)} waiting · {result.position - 1} ahead</p>
                {movement?.key === resultKey ? <p>{movement.text}</p> : null}
                <progress aria-label="Position in queue" value={result.position} max={queue.waiting.length} />
              </> : waiting.length > 1 ? <strong>{waiting.length} projects match</strong>
                : final.length ? <strong>Passed first review · awaiting final checks</strong>
                  : <strong>{inOther ? `Found in the ${other} queue` : "No matching project in the queue"}</strong>}
            </div>
            {shareId !== undefined ? <button type="button" className="pf-btn" onClick={() => void copyLink(shareId)}>Copy link</button> : null}
            {inOther && !waiting.length && !final.length ? <button type="button" className="pf-btn" onClick={() => { setKind(other); setCopyStatus(""); }}>Show {other} queue</button> : null}
            <span className="pf-sr" role="status">{copyStatus}</span>
          </div>
        ) : null}
      </section>
      <section className="pf-rq-pipeline" aria-labelledby="review-pipeline">
        <h2 id="review-pipeline">Review pipeline</h2>
        <p className="pf-rq-total"><strong>{snapshot ? software + hardware : "–"}</strong> waiting for first review</p>
        {total > 0 ? <div className="pf-rq-meter" aria-hidden="true">{[software, hardware, checked].map((count, index) => count > 0 ? <span key={index} data-segment={index} style={{ flexGrow: count }} /> : null)}</div> : null}
        {snapshot ? <p className="pf-rq-summary">{software} software · {hardware} hardware · {checked} in final checks</p> : null}
        {snapshot ? <p className="pf-rq-summary">Last 24h · {snapshot.reviewed_24h.approved} approved · {snapshot.reviewed_24h.needs_changes} returned for changes</p> : null}
      </section>
      {snapshot ? <>
        <section className="pf-rq-section" aria-labelledby="review-waiting">
          <div className="pf-rq-section-head">
            <h2 id="review-waiting">Waiting for review</h2>
            <div className="pf-rq-switch" role="group" aria-label="Review queue">
              {(["software", "hardware"] as const).map((option) => (
                <button className={`pf-btn ${option === kind ? "pri" : ""}`} key={option} type="button" aria-pressed={option === kind}
                  onClick={() => { setKind(option); setCopyStatus(""); }}>
                  {option === "software" ? "Software" : "Hardware"} · {snapshot.queues[option].waiting.length}
                </button>
              ))}
            </div>
          </div>
          <QueueRows rows={waiting} now={snapshot.generated_at} empty={term ? "No matching projects waiting." : "No projects waiting."} />
        </section>
        <section className="pf-rq-section" aria-labelledby="review-final">
          <h2 id="review-final">Passed first review</h2>
          <QueueRows rows={final.map((row) => ({ row }))} now={snapshot.generated_at} empty={term ? "No matching projects in final checks." : "No projects in final checks."} />
        </section>
      </> : null}
      {visitor ? (
        <nav className="pf-rq-next" aria-label="Next steps">
          <Link href="/docs/review">How review works</Link>
          <Link href="/docs">Browse the Docs</Link>
          <Link href="/">Back to LOADOUT</Link>
        </nav>
      ) : null}
      <footer className="pf-rq-foot">Based on ReviewQ by <a href="https://github.com/Eraxty/ReviewQ">Eraxty</a>.</footer>
    </article>
  );
}
