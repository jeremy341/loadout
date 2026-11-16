"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { blockBuilder } from "@/lib/platform/profile-actions";
import { handleLabel } from "@/lib/platform/toolbelt-ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { UseChip } from "./ToolbeltSection";
import "./toolbelt.css";

export type ToolbeltUserView = {
  id: string;
  userId: string;
  userHandle: string | null;
  status: string;
  note: string;
  blocked: boolean;
  project: { id: string; title: string; public: boolean };
};

// The maker's view of who equipped an approved project (design spec 3.16). Block is person to person and quiet: the blocked builder
// is never told. After a block the row's status reads Blocked and focus goes to it, because the Block button is gone.
export function ToolbeltUsers({ rows, total }: Readonly<{ rows: ToolbeltUserView[]; total: number }>) {
  const root = useRef<HTMLElement>(null);
  const [blocking, setBlocking] = useState<ToolbeltUserView | null>(null);
  const [message, setMessage] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  useEffect(() => {
    if (!focusKey) return;
    const target = root.current?.querySelector<HTMLElement>(`[data-focus="${focusKey}"]`);
    if (target) {
      target.focus();
      setFocusKey(null);
    }
  }, [focusKey, rows]);

  const close = useCallback(() => setBlocking(null), []);
  const done = useCallback(() => {
    if (!blocking) return;
    setMessage(`Blocked ${handleLabel(blocking.userHandle)}.`);
    setFocusKey(`user-${blocking.id}`);
    setBlocking(null);
  }, [blocking]);

  const name = handleLabel(blocking?.userHandle);

  return (
    <section className="pf-box pf-belt" aria-labelledby="toolbelt-users-heading" ref={root}>
      <h2 id="toolbelt-users-heading">Toolbelt users</h2>
      {rows.length === 0 ? (
        <p className="pf-muted">No one has equipped this project yet. Builders can equip it from their own project pages once it is approved.</p>
      ) : (
        <ul className="pf-belt-users">
          {rows.map((row) => (
            <li className="pf-belt-user" key={row.id}>
              <div className="pf-belt-user-main">
                <span className="pf-belt-user-head">
                  {row.userHandle ? <Link href={`/dashboard/builders/${row.userHandle}`}>{row.userHandle}</Link> : <span>a builder</span>}
                  {row.blocked ? (
                    <span className="pf-belt-chip" data-status="blocked" tabIndex={-1} data-focus={`user-${row.id}`}>Blocked</span>
                  ) : (
                    <UseChip status={row.status} />
                  )}
                </span>
                <p className="pf-belt-note-text">{row.note}</p>
                <span className="pf-hint">
                  In{" "}
                  {row.project.public ? <Link href={`/dashboard/explore/${row.project.id}`}>{row.project.title}</Link> : row.project.title}
                </span>
              </div>
              {row.blocked ? null : (
                <button type="button" className="pf-btn pf-btn-danger" aria-label={`Block ${handleLabel(row.userHandle)}`} onClick={() => setBlocking(row)}>
                  Block
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {total > rows.length ? <p className="pf-hint">and {total - rows.length} more</p> : null}
      <p className="pf-belt-status pf-saved" role="status">{message}</p>
      <ConfirmDialog
        open={blocking !== null}
        onClose={close}
        onDone={done}
        title={`Block ${name}?`}
        body={<p>They cannot equip any of your tools again. Their pending uses of your tools are declined. Confirmed uses stay. They are not told.</p>}
        confirmLabel="Block builder"
        action={blockBuilder}
        fields={{ blockedId: blocking?.userId ?? "" }}
      />
    </section>
  );
}
