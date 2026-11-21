"use client";

import { useState } from "react";
import type { HackatimeReport, HackatimeBreakdown, LapseTimelapse } from "@/reviewer-dash/lib/hackatime";
import { Badge, Button, EmptyState, formatDate, Muted, Stat, StatGrid } from "@/reviewer-dash/app/_ui/ui";

function fmtDate(unix: number | null): string {
  if (!unix) return "-";
  return formatDate(unix * 1000);
}

function fmtSecs(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// One pie per breakdown, colored with Hackatime's own language colors. The
// slices are a conic-gradient; whatever the top 10 don't cover stays sunken.
function Breakdown({ title, items }: { title: string; items: HackatimeBreakdown[] }) {
  const top = items.filter((i) => i.seconds > 0).slice(0, 10);
  if (top.length === 0) return null;
  const color = (i: HackatimeBreakdown) => i.color || "var(--hc-blue)";

  let from = 0;
  const stops = top.map((i) => {
    const to = Math.min(from + i.percent, 100);
    const stop = `${color(i)} ${from}% ${to}%`;
    from = to;
    return stop;
  });
  if (from < 100) stops.push(`var(--sunken) ${from}% 100%`);

  return (
    <div className="flex flex-col gap-2">
      <p className="hc-eyebrow">{title}</p>
      <div className="flex flex-wrap items-center gap-5">
        <div
          role="img"
          aria-label={top.map((i) => `${i.name} ${i.percent}%`).join(", ")}
          className="h-28 w-28 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${stops.join(", ")})` }}
        />
        <div className="flex flex-col gap-1">
          {top.map((i, n) => (
            <span key={n} className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color(i) }} />
              <span>{i.name}</span>
              <Muted className="tabular-nums">
                {i.text} · {i.percent}%
              </Muted>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Plays inline under the chip, so the reviewer stays on the review page.
function LapseChip({ lapse }: { lapse: LapseTimelapse }) {
  const [open, setOpen] = useState(false);

  if (!lapse.playbackUrl) {
    return (
      <span title="Still processing">
        <Badge outline>{lapse.name} (processing…)</Badge>
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col items-start">
      <Button
        type="button"
        variant="outline"
        size="sm"
        icon={open ? "down-caret" : "right-caret"}
        onClick={() => setOpen((o) => !o)}
        title={lapse.name}
      >
        {lapse.name}
        {lapse.duration > 0 && <Muted className="tabular-nums">{fmtSecs(lapse.duration)}</Muted>}
      </Button>
      {open && (
        <video
          src={lapse.playbackUrl}
          poster={lapse.thumbnailUrl ?? undefined}
          controls
          className="mt-1.5 w-48 rounded-md border border-[var(--border)] bg-black"
        />
      )}
    </div>
  );
}

export function HackatimePanel({ report }: { report: HackatimeReport }) {
  const linked = report.projects.filter((p) => p.linked);
  const maxSecs = Math.max(1, ...report.projects.map((p) => p.seconds));
  const linkedSeconds = linked.reduce((s, p) => s + (p.seconds || 0), 0);
  const linkedSessions = linked.reduce((s, p) => s + (p.sessions || 0), 0);

  return (
    <div>
      <div className="border-b border-[var(--border)] p-4">
        <StatGrid>
          <Stat label="Coded on this project" value={fmtSecs(linkedSeconds)} icon="clock" />
          <Stat label="Coding sessions" value={linkedSessions} />
        </StatGrid>
      </div>

      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-4">
        {report.languages.length > 0 ? (
          <Breakdown
            title={report.languagesScoped ? "Languages (this project)" : "Languages (all projects)"}
            items={report.languages}
          />
        ) : (
          <p className="hc-caption text-sm">No language breakdown available for this maker.</p>
        )}
        {report.editors.length > 0 && <Breakdown title="Editors" items={report.editors} />}
        {report.operatingSystems.length > 0 && <Breakdown title="Operating systems" items={report.operatingSystems} />}
        {report.machines.length > 0 && <Breakdown title="Machines" items={report.machines} />}
      </div>

      <p className="hc-eyebrow px-4 pt-4">Projects linked to this submission</p>
      {linked.length === 0 ? (
        <EmptyState title="No linked Hackatime projects" icon="clock" />
      ) : (
        <ul>
          {linked.map((p) => (
            <li key={p.name} className="flex flex-col gap-2 border-b border-[var(--border)] p-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold">{p.name}</span>
                <Badge tone="success">linked</Badge>
                <Badge>{p.text}</Badge>
                <Muted className="ml-auto text-xs tabular-nums">{p.percent}% of all-time</Muted>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--sunken)]">
                <div className="h-full bg-[var(--hc-blue)]" style={{ width: `${(p.seconds / maxSecs) * 100}%` }} />
              </div>
              <div className="hc-caption flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <span>
                  {p.sessions > 0 ? `${p.sessions} coding session${p.sessions === 1 ? "" : "s"}` : "no session data"}
                </span>
                {p.firstActivity && <span>first activity {fmtDate(p.firstActivity)}</span>}
                {p.lastActivity && <span>last activity {fmtDate(p.lastActivity)}</span>}
              </div>
              {p.lapses.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-2">
                  <p className="hc-eyebrow">Lapses to watch ({p.lapses.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {p.lapses.map((l) => (
                      <LapseChip key={l.id} lapse={l} />
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
