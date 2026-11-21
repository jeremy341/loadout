"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { mediaUrl } from "@/lib/platform/media-url";
import { UploadsPlaceholder } from "./UploadsPlaceholder";
import "./journal-writer.css";

// The project cover control on the owner's page. Off (LOADOUT_UPLOADS not "true"): the old not connected box, with the reason.
// On: one image, shown in the 16:9 frame it is cropped to, with Upload or Replace and Remove. When the project is locked
// (submitted, in review, approved) the controls are hidden, because the server refuses cover changes then too.
export function CoverUpload({ projectId, title, enabled, cover, locked = false }: Readonly<{ projectId: string; title: string; enabled: boolean; cover: { id: string; width: number; height: number } | null; locked?: boolean }>) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const messageId = useId();
  // A 409 from the server means the project locked after this page loaded; the controls go away until the page is refreshed.
  const [lockedNow, setLockedNow] = useState(false);
  const frozen = locked || lockedNow;

  if (!enabled) {
    return <UploadsPlaceholder reason="Cover upload is off on this site for now, because file storage is not turned on. Your cover will go here once it is." button="Upload a cover" />;
  }

  async function send(file: File) {
    setBusy(true);
    setMessage(null);
    const data = new FormData();
    data.set("file", file);
    data.set("projectId", projectId);
    data.set("kind", "cover");
    try {
      const res = await fetch("/api/journal-media", { method: "POST", body: data });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 409) setLockedNow(true);
      if (!res.ok) setMessage(json.error ?? "The upload failed. Try again.");
      else router.refresh();
    } catch {
      setMessage("The upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!cover) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/journal-media/${cover.id}`, { method: "DELETE" });
      if (res.status === 409) setLockedNow(true);
      if (!res.ok) setMessage(res.status === 409 ? "This project is submitted, so its cover can't change." : "The cover could not be removed. Try again.");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pf-cover-up" data-testid="cover-upload">
      <div className="pf-cover-frame" aria-hidden={cover ? undefined : true}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(cover.id)} alt={`Cover of ${title}, cropped to 16 by 9`} width={cover.width} height={cover.height} />
        ) : (
          <span>16:9 cover</span>
        )}
      </div>
      {frozen ? null : (
      <div className="pf-cover-actions">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="pf-sr" tabIndex={-1} aria-label="Cover image file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void send(file); }} />
        <button type="button" className="pf-btn" disabled={busy} onClick={() => input.current?.click()} aria-describedby={message ? messageId : undefined}>
          {busy ? "Uploading" : cover ? "Replace cover" : "Upload a cover"}
        </button>
        {cover ? (
          <button type="button" className="pf-btn pf-btn-danger" disabled={busy} onClick={remove}>
            Remove cover
          </button>
        ) : null}
      </div>
      )}
      {frozen ? (
        <p className="pf-hint">The cover can&apos;t change while the project is submitted, in review or approved.</p>
      ) : (
        <p className="pf-hint">One JPEG, PNG or WebP image, up to 10 MB. It is cropped to 16:9. Location data is removed.</p>
      )}
      {message ? <p className="pf-error" id={messageId} role="alert">{message}</p> : null}
    </div>
  );
}
