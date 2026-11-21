"use client";

import { useEffect, useRef, useState } from "react";
import { ActionButton, Button, Card } from "@/reviewer-dash/app/_ui/ui";
import { GUIDELINE_PAGES } from "@/reviewer-dash/lib/guidelinesContent";
import { MIN_SECONDS_PER_PAGE } from "@/reviewer-dash/lib/guidelines";
import { acknowledgeGuidelines, skipGuidelines } from "@/reviewer-dash/app/actions";

// Average silent-reading speed, used to size each page's timer to its actual
// length instead of charging every page the same MIN_SECONDS_PER_PAGE.
const WORDS_PER_SECOND = 200 / 60;
// Never fully instant, even for a tiny page: there has to be *some* pause.
const MIN_READ_SECONDS = 6;

// First-time reviewer gate: step through every guideline page in order, spend
// a page-sized minimum on each (scaled by word count, capped at
// MIN_SECONDS_PER_PAGE; a page auto-marks "read" once its timer elapses), then
// confirm on the final page. The confirm calls acknowledgeGuidelines, which
// records the ack and drops the reviewer into the queue.
export function GuidelinesGate() {
  const pages = GUIDELINE_PAGES;
  const [i, setI] = useState(0);
  const [read, setRead] = useState<boolean[]>(() => pages.map(() => false));
  const [openedAt, setOpenedAt] = useState<(number | null)[]>(() =>
    pages.map((_, j) => (j === 0 ? Date.now() : null)),
  );
  const [pageSeconds, setPageSeconds] = useState<(number | null)[]>(() => pages.map(() => null));
  const [now, setNow] = useState(() => Date.now());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Start a page's timer the first time it's shown, and size it from the
  // page's own rendered text (already on screen by the time this effect runs).
  useEffect(() => {
    setOpenedAt((prev) => (prev[i] == null ? prev.map((v, j) => (j === i ? Date.now() : v)) : prev));
    setPageSeconds((prev) => {
      if (prev[i] != null) return prev;
      const words = (contentRef.current?.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
      const estimated = Math.ceil(words / WORDS_PER_SECOND);
      const secs = Math.min(MIN_SECONDS_PER_PAGE, Math.max(MIN_READ_SECONDS, estimated));
      return prev.map((v, j) => (j === i ? secs : v));
    });
  }, [i]);

  const at = openedAt[i];
  const duration = pageSeconds[i] ?? MIN_SECONDS_PER_PAGE;
  const remaining = at == null ? duration : Math.max(0, duration - Math.floor((now - at) / 1000));

  // Once the current page's minimum time elapses, mark it read.
  useEffect(() => {
    if (remaining === 0 && !read[i]) {
      setRead((r) => r.map((v, j) => (j === i ? true : v)));
    }
  }, [remaining, i, read]);

  const isLast = i === pages.length - 1;
  const allRead = read.every(Boolean);
  const readCount = read.filter(Boolean).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 py-4">
      <div className="flex flex-col gap-2">
        <h2 className="hc-title">Before you review</h2>
        <p className="hc-caption text-sm">
          Reviewing decides whether a builder&apos;s hours count. Everyone reads the LOADOUT review guidelines
          once before joining the queue. Step through every page, spending at least a few seconds
          on each (shorter pages take less time, up to {MIN_SECONDS_PER_PAGE}s for the longest). This only
          happens the first time, and again if the guidelines change.
        </p>
        <p className="hc-caption text-xs">
          This is a draft summary for convenience. The program plan owns the rules.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--sunken)]">
          <div
            className="h-full bg-[var(--primary)] transition-all"
            style={{ width: `${(readCount / pages.length) * 100}%` }}
          />
        </div>
        <span className="hc-caption hc-mono text-xs whitespace-nowrap">
          {readCount} / {pages.length} read
        </span>
      </div>

      <Card>
        <div className="hc-eyebrow mb-1">
          Page {i + 1} of {pages.length}
        </div>
        <h3 className="hc-heading mb-3 text-lg">{pages[i].title}</h3>
        <div ref={contentRef} className="max-h-[55vh] overflow-y-auto pr-1">
          {pages[i].body}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            icon="view-back"
            disabled={i === 0}
            onClick={() => setI((v) => Math.max(0, v - 1))}
          >
            Back
          </Button>
          <form action={skipGuidelines}>
            <span title="Skips the read-through. You will be asked again next time.">
              <ActionButton variant="ghost" pendingLabel="Skipping...">
                Skip for now
              </ActionButton>
            </span>
          </form>
        </div>

        {!isLast ? (
          <Button
            type="button"
            disabled={remaining > 0}
            onClick={() => setI((v) => Math.min(pages.length - 1, v + 1))}
          >
            {remaining > 0 ? `Keep reading... ${remaining}s` : "Next"}
          </Button>
        ) : (
          <form action={acknowledgeGuidelines}>
            <ActionButton disabled={!allRead || remaining > 0} pendingLabel="Saving...">
              {remaining > 0
                ? `Keep reading... ${remaining}s`
                : allRead
                  ? "I've read all the guidelines, enter review"
                  : "Read every page to continue"}
            </ActionButton>
          </form>
        )}
      </div>
    </div>
  );
}
