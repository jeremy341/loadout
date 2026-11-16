"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { saveReviewPanelWidth } from "@/reviewer-dash/app/actions";
import { DEFAULT_STAFF_SETTINGS, clampReviewPanelWidth } from "@/reviewer-dash/lib/staffSettings";

// The review page's two columns with a draggable divider. Dragging it left
// widens the verdict panel and narrows the project side. The width is saved
// to the reviewer's account when they let go; double-click resets it.
export function ReviewSplit({ initialWidth, children }: { initialWidth: number; children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initialWidth);
  const [dragging, setDragging] = useState(false);
  const latest = useRef(initialWidth);

  function apply(next: number) {
    const max = container.current ? container.current.clientWidth * 0.65 : undefined;
    latest.current = clampReviewPanelWidth(max ? Math.min(next, max) : next);
    setWidth(latest.current);
  }

  function save() {
    // Best effort: a failed save only means the width resets on reload.
    void saveReviewPanelWidth(latest.current).catch(() => {});
  }

  return (
    <div
      ref={container}
      className="hc-review-split"
      data-dragging={dragging ? true : undefined}
      style={{ "--review-right": `${width}px` } as CSSProperties}
    >
      {children}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize the review panel"
        title="Drag to resize. Double-click to reset."
        tabIndex={0}
        className="hc-review-handle"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (!dragging || !container.current) return;
          apply(container.current.getBoundingClientRect().right - e.clientX - 12);
        }}
        onPointerUp={() => {
          if (!dragging) return;
          setDragging(false);
          save();
        }}
        onDoubleClick={() => {
          apply(DEFAULT_STAFF_SETTINGS.reviewPanelWidth);
          save();
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          apply(latest.current + (e.key === "ArrowLeft" ? 24 : -24));
          save();
        }}
      >
        <span />
      </div>
    </div>
  );
}
