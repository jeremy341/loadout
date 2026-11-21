"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import type { FormState } from "@/lib/platform/actions";
import { deleteJournalEntry } from "@/lib/platform/journal-actions";
import { PfModal } from "./PfModal";

const idle: FormState = { status: "idle" };

// Delete one entry after a confirm in the one modal. The server checks the owner and that the journal is still open.
export function DeleteJournalEntry({ id, title }: Readonly<{ id: string; title: string }>) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const bodyId = useId();

  function remove() {
    setMessage(null);
    start(async () => {
      const data = new FormData();
      data.set("entryId", id);
      const result = await deleteJournalEntry(idle, data);
      setOpen(false);
      if (result.status === "error") setMessage(result.message);
      else router.refresh();
    });
  }

  return (
    <>
      <button type="button" className="pf-btn pf-btn-danger pf-journal-delete" onClick={() => setOpen(true)} disabled={pending} aria-label={`Delete entry ${title}`}>
        {pending ? "Deleting" : "Delete"}
      </button>
      {message ? <p className="pf-error" role="alert">{message}</p> : null}
      <PfModal open={open} onClose={() => setOpen(false)} title="Delete entry" size="confirm" variant="danger" closeButton={false} initialFocus="button[data-cancel]" describedBy={bodyId} busy={pending}>
        <div className="pf-confirm-form">
          <div className="pf-confirm-body" id={bodyId}>
            <p>{`Delete the entry "${title}"? This cannot be undone.`}</p>
          </div>
          <div className="pf-confirm-actions">
            <button type="button" className="pf-btn" data-cancel onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="button" className="pf-btn pf-btn-danger" onClick={remove} disabled={pending}>{pending ? "Deleting" : "Delete it"}</button>
          </div>
        </div>
      </PfModal>
    </>
  );
}
