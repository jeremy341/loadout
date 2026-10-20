"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { pushNotification, useNotifications, NOTIFICATIONS_KEY, SEED_NOTIFICATIONS, type NotificationKind, type PreviewNotification } from "../../../lib/notifications";
import { usePreviewState } from "../../../lib/preview-store";
import { EmptyState, PageHeader, Panel, PreviewNote, Status, Tabs, Tag } from "../../ui/ui";
import { navLead } from "./data";
import {
  KINDS,
  filterNotifications,
  kindLabel,
  markAllRead,
  paginate,
  removeOne,
  setRead,
  unreadSentence,
  validateQuietHours,
  visibleByPrefs,
  type KindFilter,
  type NotifyPrefs,
  type StatusFilter,
} from "./logic/inbox";
import { formatDayUtc } from "./logic/text";
import { CheckRow, InlineConfirm, PreviewTools, TextField, useAnnounce } from "./shared";
import { useNotifyPrefs, useUnread } from "./state";

// Notifications: the inbox every tab writes to through pushNotification, plus the settings that decide which
// kinds show up. Everything is saved in this browser. Nothing is emailed or sent to Slack.

export function NotificationsPage() {
  const unread = useUnread();
  const [message, announce] = useAnnounce();
  return (
    <>
      <PageHeader eyebrow="You" title="Notifications" lead={navLead("notifications")} />
      <PreviewNote>Notifications come from the other tabs in this browser. Nothing is emailed or sent to Slack.</PreviewNote>
      <p className="hb-unread" role="status" aria-live="polite">
        {unreadSentence(unread)}
      </p>
      <Status message={message} />
      <Tabs
        label="Notifications sections"
        tabs={[
          { id: "inbox", label: "Inbox", count: unread, panel: <Inbox announce={announce} /> },
          { id: "settings", label: "Settings", panel: <Settings announce={announce} /> },
        ]}
      />
    </>
  );
}

function stamp(iso: string): string {
  return formatDayUtc(iso);
}

function Inbox({ announce }: { announce: (message: string) => void }) {
  const { items } = useNotifications();
  const [, setItems] = usePreviewState<PreviewNotification[]>(NOTIFICATIONS_KEY, SEED_NOTIFICATIONS);
  const { prefs } = useNotifyPrefs();
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);
  const [testKind, setTestKind] = useState<NotificationKind>("system");
  const listRef = useRef<HTMLDivElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<"list" | "clear" | null>(null);

  const filtered = filterNotifications(items, { kind, status }, prefs);
  const paged = paginate(filtered, page);
  const hiddenByPrefs = items.length - visibleByPrefs(items, prefs).length;
  const anyUnread = visibleByPrefs(items, prefs).some((n) => !n.read);

  useEffect(() => {
    if (focusAfter.current === "list") listRef.current?.focus();
    if (focusAfter.current === "clear") clearRef.current?.focus();
    focusAfter.current = null;
  });

  function change<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  function toggleRead(n: PreviewNotification) {
    setItems((prev) => setRead(prev, n.id, !n.read));
    announce(n.read ? "Marked as unread." : "Marked as read.");
    if (!n.read && status === "unread") focusAfter.current = "list";
  }

  function remove(n: PreviewNotification) {
    setItems((prev) => removeOne(prev, n.id));
    announce("Notification deleted.");
    focusAfter.current = "list";
  }

  return (
    <div className="pg-stack">
      <Panel title="Inbox" actions={<span className="mut">{paged.total === 0 ? "None to show" : `${paged.from} to ${paged.to} of ${paged.total}`}</span>}>
        <div className="toolbar">
          <div className="fld">
            <label className="fld-label" htmlFor="hb-n-kind">
              Kind
            </label>
            <select id="hb-n-kind" value={kind} onChange={(event) => change(setKind, event.target.value as KindFilter)}>
              <option value="all">All kinds</option>
              {KINDS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label className="fld-label" htmlFor="hb-n-status">
              Status
            </label>
            <select id="hb-n-status" value={status} onChange={(event) => change(setStatus, event.target.value as StatusFilter)}>
              <option value="all">Read and unread</option>
              <option value="unread">Unread only</option>
            </select>
          </div>
          <div className="pg-actions">
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              disabled={!anyUnread}
              onClick={() => {
                setItems((prev) => markAllRead(prev));
                announce("All notifications marked as read.");
                if (status === "unread") focusAfter.current = "list";
              }}
            >
              Mark all read
            </button>
            <button type="button" ref={clearRef} className="btn btn-danger btn-sm" disabled={items.length === 0} onClick={() => setConfirmClear(true)}>
              Clear all
            </button>
          </div>
        </div>

        {confirmClear ? (
          <InlineConfirm
            message={`Delete all ${items.length} notifications, including any hidden by your settings? This cannot be undone.`}
            confirmLabel="Yes, delete all"
            cancelLabel="Keep them"
            onConfirm={() => {
              setItems([]);
              setConfirmClear(false);
              setPage(1);
              announce("All notifications deleted.");
              focusAfter.current = "list";
            }}
            onCancel={() => {
              setConfirmClear(false);
              focusAfter.current = "clear";
            }}
          />
        ) : null}

        <div ref={listRef} tabIndex={-1} className="hb-focus-target" role="group" aria-label="Notification list">
          {paged.items.length === 0 ? (
            items.length === 0 ? (
              <EmptyState title="Your inbox is empty">Likes, comments, reviews and order updates appear here when something happens.</EmptyState>
            ) : (
              <EmptyState title="Nothing matches these filters">
                {filtered.length === 0 && hiddenByPrefs > 0 && kind === "all" && status === "all"
                  ? "Every notification is a kind you turned off in Settings."
                  : "Try a different kind or status."}
              </EmptyState>
            )
          ) : (
            <ul className="row-list">
              {paged.items.map((n) => (
                <li key={n.id} className="row-item hb-note-row" data-read={n.read}>
                  <div className="hb-note-main">
                    <p className="hb-note-tags">
                      {!n.read ? <Tag tone="accent">Unread</Tag> : null}
                      <Tag>{kindLabel(n.kind)}</Tag>
                      <time className="mut" dateTime={n.at}>
                        {stamp(n.at)}
                      </time>
                    </p>
                    <p className="hb-note-title">{n.title}</p>
                    {n.body ? <p className="mut">{n.body}</p> : null}
                  </div>
                  <div className="pg-actions">
                    {n.href ? (
                      <Link href={n.href} className="btn btn-quiet btn-sm" onClick={() => setItems((prev) => setRead(prev, n.id, true))}>
                        Open<span className="sr-only">: {n.title}</span>
                      </Link>
                    ) : null}
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => toggleRead(n)}>
                      {n.read ? "Mark unread" : "Mark read"}
                      <span className="sr-only">: {n.title}</span>
                    </button>
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => remove(n)}>
                      Delete<span className="sr-only">: {n.title}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {paged.pages > 1 ? (
          <nav className="hb-pager" aria-label="Notification pages">
            <button type="button" className="btn btn-quiet btn-sm" disabled={paged.page <= 1} onClick={() => setPage(paged.page - 1)}>
              Previous page
            </button>
            <span>
              Page {paged.page} of {paged.pages}
            </span>
            <button type="button" className="btn btn-quiet btn-sm" disabled={paged.page >= paged.pages} onClick={() => setPage(paged.page + 1)}>
              Next page
            </button>
          </nav>
        ) : null}
        {hiddenByPrefs > 0 ? (
          <p className="mut hb-help">
            {hiddenByPrefs} {hiddenByPrefs === 1 ? "notification is" : "notifications are"} hidden because you turned that kind off in Settings. They are kept.
          </p>
        ) : null}
      </Panel>

      <PreviewTools hint="Send yourself a notification to see how the inbox, the unread count and your settings behave.">
        <div className="toolbar">
          <div className="fld">
            <label className="fld-label" htmlFor="hb-n-test-kind">
              Kind of test notification
            </label>
            <select id="hb-n-test-kind" value={testKind} onChange={(event) => setTestKind(event.target.value as NotificationKind)}>
              {KINDS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              pushNotification({ kind: testKind, title: `Test notification (${kindLabel(testKind)})`, body: "Sent from Preview tools. It is not a real event.", href: "/notifications" });
              announce("Test notification sent.");
            }}
          >
            Send a test notification
          </button>
        </div>
      </PreviewTools>
    </div>
  );
}

function Settings({ announce }: { announce: (message: string) => void }) {
  const { prefs, update } = useNotifyPrefs();
  const quietError = validateQuietHours(prefs.quiet);

  function setKind(kind: NotificationKind, on: boolean) {
    update((p): NotifyPrefs => ({ ...p, inApp: { ...p.inApp, [kind]: on } }));
    announce(`${kindLabel(kind)} notifications ${on ? "shown" : "hidden"} in the inbox.`);
  }

  return (
    <div className="pg-stack">
      <Panel title="Where you hear about things">
        <p className="mut">
          Choose which kinds of notification show in your inbox. A kind you turn off is hidden and not counted as unread. Notifications already received are kept
          and come back if you turn the kind on again.
        </p>
        <fieldset className="hb-fieldset">
          <legend className="fld-label">In-platform</legend>
          {KINDS.map((k) => (
            <CheckRow key={k.kind} label={k.label} help={k.help} checked={prefs.inApp[k.kind]} onChange={(on) => setKind(k.kind, on)} />
          ))}
        </fieldset>
        <fieldset className="hb-fieldset">
          <legend className="fld-label">Other channels</legend>
          <CheckRow label="Slack (not connected)" help="Slack messages are not built yet. This switch stays off until they are." checked={false} onChange={() => {}} disabled />
        </fieldset>
        <p className="mut hb-help">Email is not part of the preview.</p>
      </Panel>

      <Panel title="Quiet hours" actions={<Tag>Preview only</Tag>}>
        <p className="mut">
          Your quiet hours are saved here, but nothing is silenced yet because there are no push messages to hold back. They will matter once Slack messages exist.
        </p>
        <CheckRow
          label="Use quiet hours"
          checked={prefs.quiet.enabled}
          onChange={(enabled) => {
            update((p) => ({ ...p, quiet: { ...p.quiet, enabled } }));
            announce(enabled ? "Quiet hours turned on." : "Quiet hours turned off.");
          }}
        />
        <div className="form-grid">
          <TextField label="From" type="time" value={prefs.quiet.start} disabled={!prefs.quiet.enabled} onChange={(start) => update((p) => ({ ...p, quiet: { ...p.quiet, start } }))} />
          <TextField
            label="Until"
            type="time"
            value={prefs.quiet.end}
            disabled={!prefs.quiet.enabled}
            error={quietError}
            onChange={(end) => update((p) => ({ ...p, quiet: { ...p.quiet, end } }))}
            hint="Times are in your own time zone."
          />
        </div>
      </Panel>
    </div>
  );
}
