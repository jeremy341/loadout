"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { dateLabel, describeDay, formatHours, intensityFor, moveCell, WEEKDAY_LABELS, type HeatCell } from "@/lib/platform/activity";

type Tip = { date: string; hours: number; x: number; y: number };

// The grid itself (Stasis's: 12 px squares, 2 px gaps, five levels): month labels above, Mon, Wed and Fri at the left, one square per day. The grid scrolls sideways inside its card
// on a phone (starting at today's end), the page never does. Roving focus: one square is the tab stop, the arrow keys move by day
// and week, and every square names its date and hours. The tooltip shows on hover and on focus. Nothing animates.
export function HeatmapGrid({ weeks, labels }: Readonly<{ weeks: HeatCell[][]; labels: (string | null)[] }>) {
  const lastWeek = weeks.length - 1;
  const lastDay = weeks[lastWeek].reduce((found, cell, day) => (cell.future ? found : day), 0);
  const [focus, setFocus] = useState({ week: lastWeek, day: lastDay });
  const [tip, setTip] = useState<Tip | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const cells = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, []);

  const show = (node: HTMLElement, cell: HeatCell) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    const rect = node.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2 - box.left, 80), Math.max(80, box.width - 80));
    setTip({ date: dateLabel(cell.key), hours: cell.hours, x, y: rect.top - box.top });
  };

  const onKeyDown = (event: KeyboardEvent, week: number, day: number) => {
    const next = moveCell(weeks, { week, day }, event.key);
    if (next.week === week && next.day === day) return;
    event.preventDefault();
    setFocus(next);
    cells.current[`${next.week}:${next.day}`]?.focus();
  };

  return (
    <div className="pf-hm-frame" ref={frame}>
      <div className="pf-hm-scroll" ref={scroller}>
        <div className="pf-hm-grid" role="group" aria-label="Logged hours by day, self-reported. Use the arrow keys to move between days.">
          <div className="pf-hm-col pf-hm-days" aria-hidden="true">
            <span className="pf-hm-month" />
            {WEEKDAY_LABELS.map((name, row) => (
              <span className="pf-hm-day" key={row}>
                {name}
              </span>
            ))}
          </div>
          {weeks.map((week, w) => (
            <div className="pf-hm-col" key={week[0].key} style={{ ["--w" as string]: w }}>
              <span className="pf-hm-month" aria-hidden="true">
                {labels[w]}
              </span>
              {week.map((cell, d) => {
                if (cell.future) return <span className="pf-hm-cell" data-future="true" key={cell.key} aria-hidden="true" />;
                const text = describeDay(cell);
                return (
                  <button
                    type="button"
                    className="pf-hm-cell"
                    data-level={intensityFor(cell.hours)}
                    key={cell.key}
                    ref={(node) => {
                      cells.current[`${w}:${d}`] = node;
                    }}
                    tabIndex={focus.week === w && focus.day === d ? 0 : -1}
                    aria-label={text}
                    onFocus={(event) => {
                      setFocus({ week: w, day: d });
                      show(event.currentTarget, cell);
                    }}
                    onBlur={() => setTip(null)}
                    onMouseEnter={(event) => show(event.currentTarget, cell)}
                    onMouseLeave={() => setTip(null)}
                    onKeyDown={(event) => onKeyDown(event, w, d)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {tip ? (
        <div className="pf-hm-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
          <span className="pf-hm-tip-date">{tip.date}</span>
          {tip.hours > 0 ? (
            <span>
              <strong>{formatHours(tip.hours)}</strong> logged
            </span>
          ) : (
            <span className="pf-hm-tip-none">No activity</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
