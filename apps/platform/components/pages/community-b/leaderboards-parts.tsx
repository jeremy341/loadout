"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState, Field, Panel, Tag } from "../../ui/ui";
import { DRAFT_RULES, METRICS, type MetricInfo } from "./data";
import { COLUMNS, PERIODS, ariaSortValue, type SortState } from "./logic/leaderboard-text";
import type { Page, Ranked, SortKey } from "./logic/ranking";
import { TRACKS, type BoardBuilder, type Metric, type Scope } from "./logic/standings";
import type { Period } from "./logic/windows";
import { fmt } from "./shared";

type Row = Ranked<BoardBuilder>;

function BuilderCell({ row }: { row: BoardBuilder }) {
  return (
    <>
      <strong>{row.name}</strong> <span className="mut">@{row.handle}</span>
      {row.isYou ? (
        <>
          {" "}
          <Tag tone="accent">You</Tag>
        </>
      ) : null}
    </>
  );
}

function RankedRows({ rows, unit }: { rows: Row[]; unit: string }) {
  return (
    <>
      {rows.map((entry) => (
        <tr key={entry.row.handle} className={entry.row.isYou ? "cb-you" : undefined}>
          <th scope="row" className="num">
            {entry.rank}
          </th>
          <td>
            <BuilderCell row={entry.row} />
          </td>
          <td>{entry.row.track}</td>
          <td className="num">
            {fmt(entry.value)} <span className="sr-only">{unit}</span>
          </td>
        </tr>
      ))}
    </>
  );
}

// ---- Filters -------------------------------------------------------------------------------------------

export interface BoardChoice {
  metric: Metric;
  scope: Scope;
  period: Period;
}

interface BoardFiltersProps {
  ids: string;
  choice: BoardChoice;
  metricInfo: MetricInfo;
  usesPeriod: boolean;
  windowText: string;
  onChange: (next: Partial<BoardChoice>) => void;
}

export function BoardFilters({ ids, choice, metricInfo, usesPeriod, windowText, onChange }: BoardFiltersProps) {
  return (
    <Panel title="Choose a board">
      <div className="toolbar cb-filters">
        <Field label="Metric" hint={metricInfo.draft ? "Draft board" : "From the plans"}>
          <select value={choice.metric} onChange={(e) => onChange({ metric: e.target.value as Metric })} aria-describedby={`${ids}-metric`}>
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.draft ? " (Draft)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Scope" hint={choice.metric === "level" ? "Level in that track" : "Builders whose home track matches"}>
          <select value={choice.scope} onChange={(e) => onChange({ scope: e.target.value as Scope })}>
            <option value="all">All tracks</option>
            {TRACKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Period" hint={usesPeriod ? "Season boards reset each Season" : "Does not apply to levels"}>
          <select value={usesPeriod ? choice.period : "all"} disabled={!usesPeriod} onChange={(e) => onChange({ period: e.target.value as Period })}>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p id={`${ids}-metric`} className="mut">
        {metricInfo.draft ? <Tag tone="warn">Draft</Tag> : null} {metricInfo.note} {windowText}
      </p>
    </Panel>
  );
}

// ---- Podium --------------------------------------------------------------------------------------------

export function PodiumPanel({ top, unit }: { top: Row[]; unit: string }) {
  if (top.length === 0) return null;
  return (
    <Panel title="Podium">
      <ol className="cb-podium" aria-label={`Top ${top.length} on this board`}>
        {top.map((entry) => (
          <li key={entry.row.handle} className="cb-podium-card" data-rank={entry.rank}>
            <p className="cb-podium-rank">
              <span className="sr-only">Rank </span>
              {entry.rank}
            </p>
            <p>
              <strong>{entry.row.name}</strong>
              {entry.row.isYou ? " (you)" : ""}
            </p>
            <p className="mut">
              @{entry.row.handle} · {entry.row.track}
            </p>
            <p className="cb-podium-score">
              {fmt(entry.value)} <span className="mut">{unit}</span>
            </p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

// ---- Standings -----------------------------------------------------------------------------------------

function sortMark(sort: SortState, key: SortKey): string {
  if (sort.key !== key) return "";
  return sort.dir === "asc" ? " ▲" : " ▼";
}

interface SortableTableProps {
  caption: string;
  rows: Row[];
  sort: SortState;
  metricLabel: string;
  unit: string;
  onSort: (key: SortKey) => void;
}

function SortableTable({ caption, rows, sort, metricLabel, unit, onSort }: SortableTableProps) {
  return (
    <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="tbl cb-table">
        <caption className="cb-caption">{caption}</caption>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} scope="col" className={col.numeric ? "num" : undefined} aria-sort={ariaSortValue(sort, col.key)}>
                <button type="button" className="cb-sort" onClick={() => onSort(col.key)}>
                  {col.key === "value" ? metricLabel : col.label}
                  <span aria-hidden="true" className="cb-sort-mark">
                    {sortMark(sort, col.key)}
                  </span>
                  <span className="sr-only">, sort {sort.key === col.key && sort.dir === "asc" ? "descending" : "ascending"}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <RankedRows rows={rows} unit={unit} />
        </tbody>
      </table>
    </div>
  );
}

function Pager({ pageData, onGo }: { pageData: Page<Row>; onGo: (page: number) => void }) {
  return (
    <nav className="cb-pager" aria-label="Leaderboard pages">
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => onGo(pageData.page - 1)} disabled={pageData.page <= 1}>
        Previous
      </button>
      <p>
        Page {pageData.page} of {pageData.pageCount}
      </p>
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => onGo(pageData.page + 1)} disabled={pageData.page >= pageData.pageCount}>
        Next
      </button>
    </nav>
  );
}

function PinnedRow({ row, metricLabel, unit }: { row: Row; metricLabel: string; unit: string }) {
  return (
    <div className="cb-pinned">
      <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="tbl cb-table">
          <caption className="cb-caption">Your position, shown here because you are not on this page.</caption>
          <thead>
            <tr>
              <th scope="col" className="num">Rank</th>
              <th scope="col">Builder</th>
              <th scope="col">Home track</th>
              <th scope="col" className="num">{metricLabel}</th>
            </tr>
          </thead>
          <tbody>
            <RankedRows rows={[row]} unit={unit} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NoRowsState({ hidden }: { hidden: boolean }) {
  return (
    <EmptyState
      title="No one is ranked on this board yet"
      action={
        <Link className="btn btn-sm" href="/seasons">
          Log work in Seasons
        </Link>
      }
    >
      {hidden
        ? "You are hidden from public boards, and nobody else has a value here."
        : "A builder needs a value above zero in this window to be ranked. Try another board, or log some work to add your own."}
    </EmptyState>
  );
}

interface StandingsPanelProps {
  status: ReactNode;
  caption: string;
  allRows: Row[];
  pageData: Page<Row>;
  pinned: Row | null;
  sort: SortState;
  metricInfo: MetricInfo;
  hidden: boolean;
  onSort: (key: SortKey) => void;
  onGo: (page: number) => void;
}

export function StandingsPanel({ status, caption, allRows, pageData, pinned, sort, metricInfo, hidden, onSort, onGo }: StandingsPanelProps) {
  const range = pageData.total ? `${pageData.from} to ${pageData.to} of ${pageData.total}` : "No rows";
  return (
    <Panel
      title="Standings"
      actions={
        <span className="mut" aria-hidden="true">
          {range}
        </span>
      }
    >
      {allRows.length === 0 ? (
        <NoRowsState hidden={hidden} />
      ) : (
        <>
          <SortableTable caption={caption} rows={pageData.items} sort={sort} metricLabel={metricInfo.label} unit={metricInfo.unit} onSort={onSort} />
          <Pager pageData={pageData} onGo={onGo} />
          {pinned ? <PinnedRow row={pinned} metricLabel={metricInfo.label} unit={metricInfo.unit} /> : null}
        </>
      )}
      {status}
    </Panel>
  );
}

// ---- Privacy and notes ---------------------------------------------------------------------------------

export function PrivacyPanel({ hidden, onToggle }: { hidden: boolean; onToggle: (hide: boolean) => void }) {
  return (
    <Panel title="Privacy">
      <label className="check">
        <input type="checkbox" checked={hidden} onChange={(e) => onToggle(e.target.checked)} />
        <span>Hide me from public leaderboards</span>
      </label>
      <p className="mut">
        Boards only list builders who have made their handle public. With this on, your row and podium place are removed and ranks are worked
        out without you. You still see your own score above. Saved in this browser.
      </p>
    </Panel>
  );
}

export function HowBoardsWorkPanel() {
  return (
    <Panel title="How these boards work">
      <ul className="cb-notes">
        <li>{DRAFT_RULES.leaderboard}</li>
        <li>{DRAFT_RULES.week}</li>
        <li>{DRAFT_RULES.level}</li>
        <li>Season rankings reset each Season; lifetime Ore, Track XP and project history do not (Plan 02, Seasons).</li>
        <li>
          Boards in the plans that are not here yet: Signal, Review Contribution (quality-weighted) and New Builders. They need data the preview
          cannot produce.
        </li>
      </ul>
    </Panel>
  );
}
