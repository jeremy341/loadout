"use client";

import { useId, useMemo, useState } from "react";
import { PageHeader, PreviewNote, Stat, StatGrid, Status } from "../../ui/ui";
import { METRICS, seasonLabel } from "./data";
import { BoardFilters, HowBoardsWorkPanel, PodiumPanel, PrivacyPanel, StandingsPanel, type BoardChoice } from "./leaderboards-parts";
import { boardCaption, nextSort, sortAnnouncement, windowText, yourLine, type SortState } from "./logic/leaderboard-text";
import { paginate, pinnedRow, podium, sortRanked, type SortKey } from "./logic/ranking";
import { buildBoard, periodApplies } from "./logic/standings";
import { windowFor, type Period } from "./logic/windows";
import { useCommunityModel } from "./model";
import { PreviewToolsPanel, fmt, useAnnounce } from "./shared";
import { usePrivacy } from "./state";

const PAGE_SIZE = 10;

const INITIAL_CHOICE: BoardChoice = { metric: "ore", scope: "all", period: "season" };
const INITIAL_SORT: SortState = { key: "rank", dir: "asc" };

export function LeaderboardsPage() {
  const model = useCommunityModel();
  const { hideFromBoards, setHide } = usePrivacy();
  const [message, say] = useAnnounce();
  const ids = useId();

  const [choice, setChoice] = useState<BoardChoice>(INITIAL_CHOICE);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(INITIAL_SORT);

  const { metric, scope, period } = choice;
  const metricInfo = METRICS.find((m) => m.id === metric) ?? METRICS[0];
  const usesPeriod = periodApplies(metric);
  const effectivePeriod: Period = usesPeriod ? period : "all";
  const slot = model.season.slot;

  const board = useMemo(
    () => buildBoard(model.board, { metric, scope, period: effectivePeriod }, hideFromBoards),
    [model.board, metric, scope, effectivePeriod, hideFromBoards],
  );
  const sorted = useMemo(() => sortRanked(board.rows, sort.key, sort.dir), [board.rows, sort]);
  const pageData = paginate(sorted, page, PAGE_SIZE);
  const pinned = pinnedRow(board.rows, pageData.items, (row) => row.isYou);

  const win = windowFor(effectivePeriod, model.nowMs, slot);
  const rangeText = windowText({ usesPeriod, period: effectivePeriod, win, seasonLabelText: seasonLabel(slot) });
  const caption = boardCaption({ metricLabel: metricInfo.label, scope, usesPeriod, period, sort });
  const positionHint = yourLine(
    { hidden: hideFromBoards, youValue: board.youValue, unit: metricInfo.unit, rank: board.you?.rank ?? null, rowCount: board.rows.length },
    fmt,
  );

  function changeChoice(next: Partial<BoardChoice>) {
    setPage(1);
    setChoice((prev) => ({ ...prev, ...next }));
  }

  function toggleSort(key: SortKey) {
    const next = nextSort(sort, key);
    setSort(next);
    setPage(1);
    say(sortAnnouncement(next.key, next.dir));
  }

  function goTo(next: number) {
    const clamped = Math.min(pageData.pageCount, Math.max(1, next));
    setPage(clamped);
    say(`Page ${clamped} of ${pageData.pageCount}.`);
  }

  function setHidden(hide: boolean) {
    setHide(hide);
    say(hide ? "You are now hidden from public leaderboards." : "You appear on public leaderboards again.");
    setPage(1);
  }

  return (
    <>
      <PageHeader eyebrow="Community" title="Leaderboards" lead="Rankings across tracks and Seasons." />
      <PreviewNote>
        The standings of other builders are invented sample data. Your own row comes from what you log in this browser (Ore ledger and the Seasons
        contribution log). Nothing is sent to LOADOUT.
      </PreviewNote>

      <div className="pg-stack cb-stack">
        <BoardFilters ids={ids} choice={choice} metricInfo={metricInfo} usesPeriod={usesPeriod} windowText={rangeText} onChange={changeChoice} />

        <StatGrid>
          <Stat label="Your position" value={board.you ? `#${board.you.rank}` : "None"} hint={positionHint} />
          <Stat label="Your score" value={fmt(board.youValue)} hint={metricInfo.unit} />
          <Stat label="Ranked builders" value={fmt(board.rows.length)} hint={board.privateCount ? `${board.privateCount} keep their standing private` : "Public builders only"} />
        </StatGrid>

        <PodiumPanel top={podium(board.rows)} unit={metricInfo.unit} />

        <StandingsPanel
          status={<Status message={message} />}
          caption={caption}
          allRows={board.rows}
          pageData={pageData}
          pinned={pinned}
          sort={sort}
          metricInfo={metricInfo}
          hidden={hideFromBoards}
          onSort={toggleSort}
          onGo={goTo}
        />

        <PrivacyPanel hidden={hideFromBoards} onToggle={setHidden} />
        <HowBoardsWorkPanel />
        <PreviewToolsPanel />
      </div>
    </>
  );
}
