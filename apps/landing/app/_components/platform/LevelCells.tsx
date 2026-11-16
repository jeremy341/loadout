"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export type LevelCell = {
  level: number;
  hours: number;
  state: "done" | "next" | "locked";
  milestone: boolean;
  fill: number;
  pendingFill: number;
};

const stateLabel = { done: "reached", next: "next level", locked: "locked" } as const;

// The twenty level cells. Each one is a button, so a keyboard, a finger and a mouse can all ask for its hours: hover or
// focus or a tap shows "LV.9 / 112 H" above it. The row is one tab stop (arrow keys, Home and End move along it) so a
// keyboard user does not tab through twenty cells. The cell's name already carries the hours for a screen reader, so
// the tooltip itself is hidden from it.
export function LevelCells({ cells, start }: Readonly<{ cells: LevelCell[]; start: number }>) {
  const [shown, setShown] = useState<number | null>(null);
  const [stop, setStop] = useState(start);
  const list = useRef<HTMLOListElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const pointer = useRef("mouse");

  // A tap outside the row closes the tooltip; a finger does not blur a button the way a click does.
  useEffect(() => {
    if (shown === null) return;
    const close = (event: PointerEvent) => {
      if (!list.current?.contains(event.target as Node)) setShown(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [shown]);

  function move(to: number) {
    const index = Math.min(cells.length - 1, Math.max(0, to));
    setStop(index);
    setShown(index);
    buttons.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    pointer.current = "key";
    if (event.key === "ArrowRight") move(index + 1);
    else if (event.key === "ArrowLeft") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(cells.length - 1);
    else if (event.key === "Escape") setShown(null);
    else return;
    event.preventDefault();
  }

  return (
    <ol className="pf-strip-cells" ref={list}>
      {cells.map((cell, index) => (
        <li key={cell.level} data-state={cell.state} data-milestone={cell.milestone ? "true" : undefined}>
          <button
            type="button"
            className="pf-strip-cell"
            ref={(node) => {
              buttons.current[index] = node;
            }}
            tabIndex={index === stop ? 0 : -1}
            aria-label={`Level ${cell.level}, ${cell.hours} hours, ${stateLabel[cell.state]}`}
            onPointerDown={(event) => {
              pointer.current = event.pointerType;
            }}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setShown(index);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") setShown((current) => (current === index ? null : current));
            }}
            onFocus={() => {
              setStop(index);
              if (document.activeElement?.matches(":focus-visible")) setShown(index);
            }}
            onBlur={() => setShown((current) => (current === index ? null : current))}
            onClick={() => {
              // A finger has no hover, so a tap toggles the tip; a mouse or a key press just shows it.
              const touch = pointer.current === "touch" || pointer.current === "pen";
              setShown((current) => (touch && current === index ? null : index));
            }}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {cell.state === "next" ? (
              <>
                <span className="pf-strip-fill" style={{ width: `${cell.fill}%` }} aria-hidden="true" />
                {cell.pendingFill > 0 ? (
                  <span className="pf-strip-pending" style={{ left: `${cell.fill}%`, width: `${cell.pendingFill}%` }} aria-hidden="true" />
                ) : null}
              </>
            ) : null}
          </button>
          <span className="pf-strip-num" aria-hidden="true">
            {cell.level}
          </span>
          {shown === index ? (
            <span className="pf-strip-tip" data-edge={index < 2 ? "start" : index > cells.length - 3 ? "end" : undefined} aria-hidden="true">
              LV.{cell.level} / {cell.hours} H
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
