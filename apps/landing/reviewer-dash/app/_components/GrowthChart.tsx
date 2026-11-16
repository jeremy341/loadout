"use client";

import { useReducedMotion } from "motion/react";
import { AreaChart, Area } from "@/reviewer-dash/components/charts/area-chart";
import { BarChart } from "@/reviewer-dash/components/charts/bar-chart";
import { Bar } from "@/reviewer-dash/components/charts/bar";
import { BarXAxis } from "@/reviewer-dash/components/charts/bar-x-axis";
import { Grid } from "@/reviewer-dash/components/charts/grid";
import { XAxis } from "@/reviewer-dash/components/charts/x-axis";
import { YAxis } from "@/reviewer-dash/components/charts/y-axis";
import { ChartTooltip } from "@/reviewer-dash/components/charts/tooltip/chart-tooltip";
import type { GrowthPoint } from "@/reviewer-dash/lib/db";
import { chartUtcDate, dateLabel } from "@/reviewer-dash/lib/bklitDates";
import { Details, Muted, Table } from "@/reviewer-dash/app/_ui/ui";
import { BKLIT_THEME } from "./bklitTheme";

const SERIES_COLOR: Record<"players" | "projects" | "violations", string> = {
  players: "var(--hc-cyan)",
  projects: "var(--hc-green)",
  violations: "var(--hc-red)",
};

const fmt = (n: number) => n.toLocaleString("en-US");
export { dateLabel, sparseTicks } from "@/reviewer-dash/lib/bklitDates";

export function GrowthChart({
  title, series, points, kind,
}: {
  title: string;
  series: "players" | "projects" | "violations";
  points: GrowthPoint[];
  kind: "cumulative" | "daily";
}) {
  const reduced = useReducedMotion();
  const rows = points.map((p) => ({
    date: p.date,
    value: kind === "cumulative" ? p.total : p.added,
  }));
  const color = SERIES_COLOR[series];
  const labels = rows.map((p) => dateLabel(p.date));
  const tooltipRows = (point: Record<string, unknown>) => [
    { label: title, value: fmt(Number(point.value) || 0), color },
  ];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="hc-heading text-base">{title}</h3>
        <Muted className="text-xs">{kind === "cumulative" ? "Total over time" : "Per day"}</Muted>
      </div>
      <div className="h-[200px] w-full" style={BKLIT_THEME} aria-hidden="true">
        {rows.length === 0 ? (
          <div className="hc-muted flex h-full items-center justify-center text-sm">No activity yet</div>
        ) : kind === "cumulative" ? (
          <AreaChart
            data={rows.map((p) => ({ ...p, date: chartUtcDate(p.date) }))}
            xDataKey="date"
            aspectRatio="auto"
            className="h-full"
            animationDuration={reduced ? 0 : 650}
            margin={{ top: 14, right: 16, bottom: 32, left: 48 }}
          >
            <Grid horizontal numTicksRows={4} />
            <Area dataKey="value" stroke={color} fill={color} fillOpacity={0.25} animate={!reduced} />
            <XAxis numTicks={3} labels={labels} />
            <YAxis numTicks={4} formatValue={fmt} />
            <ChartTooltip dateLabels={labels} rows={tooltipRows} />
          </AreaChart>
        ) : (
          <BarChart
            data={rows.map((p) => ({ name: dateLabel(p.date), value: p.value }))}
            xDataKey="name"
            aspectRatio="auto"
            className="h-full"
            animationDuration={reduced ? 0 : 650}
            margin={{ top: 14, right: 16, bottom: 32, left: 48 }}
          >
            <Grid horizontal numTicksRows={4} />
            <Bar dataKey="value" fill={color} animate={!reduced} />
            <BarXAxis maxLabels={3} />
            <YAxis numTicks={4} formatValue={fmt} />
            <ChartTooltip rows={tooltipRows} />
          </BarChart>
        )}
      </div>
      <div className="mt-2">
        <Details summary="Data table">
          <div className="max-h-48 overflow-y-auto">
            <Table headers={["Date", kind === "cumulative" ? "Total" : "Count"]}>
              {[...rows].reverse().map((p) => (
                <tr key={p.date}><td>{dateLabel(p.date)}</td><td className="tabular-nums">{fmt(p.value)}</td></tr>
              ))}
            </Table>
          </div>
        </Details>
      </div>
    </div>
  );
}
