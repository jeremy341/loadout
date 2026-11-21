"use client";

import Tabs from "@/reviewer-dash/app/_ui/Tabs";
import { Badge, EmptyState } from "@/reviewer-dash/app/_ui/ui";

export interface VerdictCounts {
  approved: number;
  firstPass: number;
  changes: number;
  rejected: number;
}

export interface VerdictWindow {
  key: string;
  label: string;
  counts: VerdictCounts;
  /** Distinct reviewers who submitted a review in this window. */
  reviewers: number;
  /** Who they are and how many reviews each submitted, most active first. */
  reviewerList: { name: string; reviews: number }[];
}

// Fixed color per category (never cycled), reused across every time window so
// a bar's color always means the same verdict. Final and first-pass approvals
// get separate colors on purpose: a chart needs them apart at a glance.
const BUCKETS: { key: keyof VerdictCounts; label: string; color: string }[] = [
  { key: "approved", label: "Approved (final)", color: "var(--hc-green)" },
  { key: "firstPass", label: "Approved (first pass)", color: "var(--hc-cyan)" },
  { key: "changes", label: "Changes requested", color: "var(--hc-orange)" },
  { key: "rejected", label: "Rejected", color: "var(--hc-red)" },
];

function Figure({ value, label, title }: { value: string | number; label: string; title?: string }) {
  return (
    <div title={title}>
      <div className="hc-stat-value">{value}</div>
      <div className="hc-caption text-xs">{label}</div>
    </div>
  );
}

function WindowPanel({ w }: { w: VerdictWindow }) {
  const total = BUCKETS.reduce((s, b) => s + w.counts[b.key], 0);
  const max = Math.max(1, ...BUCKETS.map((b) => w.counts[b.key]));
  if (total === 0) {
    return <EmptyState title="No reviews in this window" icon="history" />;
  }
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="hc-panel flex flex-wrap gap-8">
        <Figure
          value={w.reviewers}
          label={`reviewer${w.reviewers === 1 ? "" : "s"}`}
          title="Distinct reviewers who submitted a review in this window"
        />
        <Figure value={total} label={`review${total === 1 ? "" : "s"}`} />
        <Figure
          value={(total / Math.max(1, w.reviewers)).toFixed(1)}
          label="per reviewer"
          title="Reviews divided by reviewers"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {w.reviewerList.map((r, i) => (
          <Badge key={`${r.name}-${i}`} outline>
            {r.name} <span className="hc-muted">{r.reviews}</span>
          </Badge>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {BUCKETS.map((b) => {
          const count = w.counts[b.key];
          return (
            <div key={b.key} className="flex items-center gap-3" title={`${b.label}: ${count}`}>
              <div className="hc-caption w-44 shrink-0 text-right text-sm">{b.label}</div>
              <div className="h-6 flex-1 overflow-hidden rounded-md bg-[var(--sunken)]">
                <div
                  className="h-full rounded-md transition-[width]"
                  style={{ width: `${Math.round((count / max) * 100)}%`, background: b.color }}
                />
              </div>
              <div className="hc-mono w-10 shrink-0 text-sm font-bold" style={{ color: b.color }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewVerdictChart({ windows }: { windows: VerdictWindow[] }) {
  return (
    <Tabs
      variant="segmented"
      tabs={windows.map((w) => ({ key: w.key, label: w.label, content: <WindowPanel w={w} /> }))}
    />
  );
}
