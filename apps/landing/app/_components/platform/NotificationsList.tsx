"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { loadMoreNotifications, markAllReadAction, markReadAction, type NotificationItem } from "@/app/(platform)/dashboard/(shell)/notifications/actions";
import { EmptyState } from "./EmptyState";
import "./notifications.css";

const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

// The list: unread rows carry a small square, each row links to where it happened. Marking one read happens as you follow it.
export function NotificationsList({ initialItems, initialCursor }: Readonly<{ initialItems: NotificationItem[]; initialCursor: string | null }>) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const unread = items.filter((item) => !item.read).length;

  function markAll() {
    if (busy.current) return;
    busy.current = true;
    const before = items;
    setItems(items.map((item) => ({ ...item, read: true })));
    startTransition(async () => {
      const result = await markAllReadAction().catch(() => ({ ok: false as const, message: "Could not mark them read. Try again." }));
      if (!result.ok) {
        setItems(before);
        setMessage(result.message);
      } else {
        setMessage("All marked read.");
        window.dispatchEvent(new Event("pf-unread-changed"));
      }
      busy.current = false;
    });
  }

  function more() {
    if (!cursor || busy.current) return;
    busy.current = true;
    const from = cursor;
    startTransition(async () => {
      try {
        const next = await loadMoreNotifications(from);
        setItems((current) => [...current, ...next.items.filter((row) => !current.some((have) => have.id === row.id))]);
        setCursor(next.nextCursor);
        setMessage("");
      } catch {
        setMessage("Could not load more. Try again.");
      } finally {
        busy.current = false;
      }
    });
  }

  function opened(id: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    void markReadAction(id).then(() => window.dispatchEvent(new Event("pf-unread-changed")), () => {});
  }

  if (items.length === 0) {
    return <EmptyState title="Nothing yet">Kudos, follows, invites and ship results show up here.</EmptyState>;
  }

  return (
    <section className="pf-nt-sec" aria-labelledby="pf-nt-all">
      <div className="pf-nt-bar">
        <h2 id="pf-nt-all" className="pf-nt-h">All</h2>
        <button type="button" className="pf-tl" onClick={markAll} disabled={unread === 0 || pending}>
          Mark all read
        </button>
      </div>
      <ul className="pf-nt-list">
        {items.map((item) => {
          const inner = (
            <>
              <span className="pf-nt-dot" data-unread={item.read ? "false" : "true"} aria-hidden="true" />
              <span className="pf-nt-main">
                <span className="pf-nt-title">
                  {item.read ? null : <span className="pf-sr">Unread: </span>}
                  {item.title}
                </span>
                {item.body ? <span className="pf-nt-body">{item.body}</span> : null}
              </span>
              <time className="pf-nt-when" dateTime={item.createdAt}>{WHEN.format(new Date(item.createdAt))}</time>
            </>
          );
          return (
            <li key={item.id} className="pf-nt-row" data-unread={item.read ? "false" : "true"}>
              {item.href ? (
                <Link href={item.href} className="pf-nt-link" onClick={() => opened(item.id)}>{inner}</Link>
              ) : (
                <div className="pf-nt-link">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="pf-nt-status" role="status">{message}</p>
      {cursor ? (
        <p className="pf-nt-more">
          <button type="button" className="pf-tl" onClick={more} disabled={pending}>{pending ? "Loading" : "Load more"}</button>
        </p>
      ) : null}
    </section>
  );
}
