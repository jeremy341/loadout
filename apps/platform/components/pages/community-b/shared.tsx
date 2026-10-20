"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel, Status, Tag } from "../../ui/ui";
import { formatDayUtc } from "./logic/dates";
import { resetCommunityB, usePreviewClock } from "./state";
import "./community-b.css";

/** A polite message for the page's live region. Repeating the same text still re-announces. */
export function useAnnounce(): [string, (text: string) => void] {
  const [message, setMessage] = useState("");
  const flip = useRef(false);
  const announce = useCallback((text: string) => {
    flip.current = !flip.current;
    setMessage(flip.current ? text : `${text} `);
  }, []);
  return [message, announce];
}

export function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

/** Confirm/cancel pair for a destructive action. Focus moves to the safe button when it appears. */
export function InlineConfirm({
  message,
  confirmLabel,
  cancelLabel = "Keep it",
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const keep = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    keep.current?.focus();
  }, []);
  return (
    <div className="cb-confirm" role="group" aria-label="Confirm">
      <p>{message}</p>
      <div className="pg-actions">
        <button type="button" className="btn btn-danger btn-sm" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" ref={keep} className="btn btn-quiet btn-sm" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * Preview tools: the controls that stand in for time passing and for starting over. A live platform has no
 * such controls, so they are labelled and kept in their own panel.
 */
export function PreviewToolsPanel() {
  const { nowMs, advanceDays, resetClock } = usePreviewClock();
  const [message, onMessage] = useAnnounce();
  const [confirming, setConfirming] = useState(false);

  return (
    <Panel title="Preview tools" actions={<Tag>Preview only</Tag>} className="cb-tools">
      <p className="mut">
        Rules that depend on time (weekly boards, streaks, Eras, events starting) follow the Preview date below, not your real clock. Move it
        to test them. These controls are not part of the platform.
      </p>
      <p className="cb-clock">
        <span className="mut">Preview date:</span> <strong>{formatDayUtc(nowMs)}</strong> <span className="mut">(UTC)</span>
      </p>
      <div className="pg-actions">
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => { advanceDays(1); onMessage("Preview date moved forward one day."); }}>
          +1 day
        </button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => { advanceDays(7); onMessage("Preview date moved forward one week."); }}>
          +1 week
        </button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => { resetClock(); onMessage("Preview date set back to its starting date."); }}>
          Reset date
        </button>
      </div>
      <Status message={message} />
      <div className="cb-tools-reset">
        {confirming ? (
          <InlineConfirm
            message="This clears your contribution log, quest completions, RSVPs, certificates, privacy choice and the Preview date for Leaderboards, Seasons and Events. Your Ore ledger is not touched."
            confirmLabel="Yes, reset this data"
            cancelLabel="Keep my data"
            onConfirm={() => {
              resetCommunityB();
              setConfirming(false);
              onMessage("Leaderboards, Seasons and Events data was reset.");
            }}
            onCancel={() => setConfirming(false)}
          />
        ) : (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirming(true)}>
            Reset Leaderboards, Seasons and Events data
          </button>
        )}
      </div>
    </Panel>
  );
}
