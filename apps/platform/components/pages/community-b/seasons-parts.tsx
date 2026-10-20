"use client";

import { Meter, Panel, Stat, StatGrid, Tag } from "../../ui/ui";
import {
  DRAFT_RULES,
  ERA_CONFIG,
  ERA_OBJECTIVE_EXAMPLES,
  ERA_SEQUENCE_NOTE,
  PLAN_NOTES,
  PLAN_QUEST_EXAMPLES,
  SEASONS,
  SYSTEM_DIFFERENCES,
  seasonLabel,
} from "./data";
import { formatDateUtc, formatDayUtc, parseMs } from "./logic/dates";
import { eraProgressPct } from "./logic/era";
import { phaseOf } from "./logic/windows";
import { SEASON_SCHEDULE, type useCommunityModel } from "./model";
import { fmt } from "./shared";

export { LogPanel } from "./log-panel";

type Model = ReturnType<typeof useCommunityModel>;

// ---------------------------------------------------------------------------------------------------------

export function SeasonPanel({ model }: { model: Model }) {
  const { slot, state } = model.season;
  const { progress, nowMs } = model;
  const next = SEASON_SCHEDULE[slot.index + 1];
  return (
    <Panel title={`Season: ${seasonLabel(slot)}`} actions={<Tag tone="warn">Draft calendar</Tag>}>
      <p>{SEASONS[slot.index]?.theme}</p>
      <div className="cb-block">
        <Meter value={progress.pct} max={100} label={`Season progress: ${progress.pct} percent of ${seasonLabel(slot)}`} />
        <p className="mut">
          {state === "before-start"
            ? `Starts ${formatDayUtc(slot.startMs)}.`
            : state === "schedule-ended"
              ? `The preview calendar ends with this Season (${formatDateUtc(slot.endMs - 1)}).`
              : `Week ${progress.weekNumber} of ${progress.weeksTotal}. ${progress.daysLeft} ${progress.daysLeft === 1 ? "day" : "days"} left. Ends ${formatDateUtc(slot.endMs - 1)}.`}
        </p>
      </div>
      <p className="mut">
        {next ? `Next on the preview calendar: ${seasonLabel(next)}.` : "No later Season in the preview calendar."} Preview date: {formatDayUtc(nowMs)} (UTC).
      </p>
      <p className="mut">{PLAN_NOTES.seasons}</p>
      <p className="mut">{DRAFT_RULES.calendar}</p>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------

export function EraPanel({ model }: { model: Model }) {
  const era = model.era.current;
  const pct = eraProgressPct(era);
  const dayOfMin = Math.min(era.elapsedDays, ERA_CONFIG.minDays);
  let statusTag = <Tag>Active</Tag>;
  let statusText: string;
  if (era.status === "ready") {
    statusTag = <Tag tone="accent">ADVANCEMENT READY</Tag>;
    statusText = era.hasNext
      ? `The threshold is met. The Era stays active until the scheduled check on ${formatDayUtc(era.nextCheckMs ?? era.minDurationEndsMs)}; it never advances on a timer alone.`
      : "The threshold is met. This is the last Era in the illustrative sequence, so there is nothing to advance to.";
  } else if (!era.minDurationMet) {
    statusText = `Day ${dayOfMin} of the ${ERA_CONFIG.minDays}-day minimum. The first advancement check is the second weekly reset, ${formatDayUtc(era.minDurationEndsMs)}.`;
  } else {
    statusText = `The ${ERA_CONFIG.minDays}-day minimum has passed but the threshold is not met, so the Era stays active. It advances at the first weekly reset after the threshold is met${era.nextCheckMs ? ` (next reset ${formatDayUtc(era.nextCheckMs)})` : ""}.`;
  }

  return (
    <Panel title={`Community Era: ${era.spec.name}`} actions={<Tag tone="warn">Illustrative</Tag>}>
      <p>
        <strong>LOADOUT advances when builders do.</strong> Approved projects add non-spendable Era Points to one shared total. Era Points are not Ore, are not
        Track XP and cannot be spent or transferred.
      </p>
      <div className="cb-block">
        <Meter
          value={era.points}
          max={era.threshold}
          label={`Era progress: ${era.points} of ${era.threshold} Era Points (Draft threshold), ${pct} percent`}
        />
        <p className="cb-era-status">
          {statusTag} <span>{statusText}</span>
        </p>
      </div>
      <StatGrid>
        <Stat label="Pool" value={`${fmt(era.points)} / ${fmt(era.threshold)}`} hint="Draft threshold, not a program value" />
        <Stat label="Sample baseline" value={fmt(era.baseline)} hint="Invented community starting total" />
        <Stat label="Your approved ships" value={fmt(era.yourPoints)} hint={`${DRAFT_RULES.eraPointsPerShip} Draft points each`} />
      </StatGrid>
      <ul className="cb-notes">
        <li>{DRAFT_RULES.eraPoints}</li>
        <li>
          Reviews and journal entries count toward quests and your streak but add no Era Points, because only approved project work contributes (Plan 11).
        </li>
        <li>
          Planned Era build bonus: a qualifying project may earn +10% of its approved base Ore, decided by a separate reviewer decision. It adds no Track XP.
          The preview does not apply it.
        </li>
        <li>{ERA_SEQUENCE_NOTE}</li>
      </ul>
      <details className="cb-details">
        <summary>Optional Era objectives (examples from Plan 11)</summary>
        <p className="mut">
          Each Era may offer about 4 to 8 optional objectives. The examples in the plan for an Electrification-themed Era are listed here; they are not exhaustive and
          do not guarantee approval.
        </p>
        <ul className="row-list">
          {ERA_OBJECTIVE_EXAMPLES.map((o) => (
            <li key={o.name} className="row-item">
              <strong>{o.name}</strong>
              <span>{o.text}</span>
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------

export function QuestsPanel({ model }: { model: Model }) {
  const done = model.quests.filter((q) => q.complete).length;
  return (
    <Panel title="Seasonal quests" actions={<Tag tone="warn">Draft quests</Tag>}>
      <p className="mut">
        Seasonal quests are short optional challenges inside a Season; they add variety, not most of the payout (Plan 02). The quest list and values are
        open in the plans, so these Draft quests use the three things you can log. The preview awards no Ore for them.
      </p>
      <p>
        <strong>
          {done} of {model.quests.length}
        </strong>{" "}
        complete in {seasonLabel(model.season.slot)}. A new Season starts every quest fresh.
      </p>
      <ul className="card-grid cb-quests">
        {model.quests.map(({ def, progress, complete, completedAt }) => (
          <li key={def.id} className="card">
            <div className="cb-quest-head">
              <h3>{def.name}</h3>
              {complete ? <Tag tone="ok">Complete</Tag> : progress.pct > 0 ? <Tag>In progress</Tag> : <Tag>Not started</Tag>}
            </div>
            <p className="mut">{def.blurb}</p>
            <Meter value={progress.pct} max={100} label={`${def.name} progress: ${complete ? 100 : progress.pct} percent`} />
            <ul className="cb-steps">
              {progress.steps.map((s) => (
                <li key={s.step.id}>
                  <span aria-hidden="true">{s.done || complete ? "✓" : "○"}</span>{" "}
                  {s.step.label}{" "}
                  <span className="mut">
                    ({s.value}/{s.target}
                    {s.done ? ", done" : ""})
                  </span>
                </li>
              ))}
            </ul>
            {completedAt ? <p className="mut">Completed {formatDateUtc(parseMs(completedAt))}.</p> : null}
          </li>
        ))}
      </ul>
      <details className="cb-details">
        <summary>Quest ideas in Plan 02 that need review</summary>
        <p className="mut">These need a reviewer or real users to verify, which the preview cannot do, so they are listed and not playable.</p>
        <ul className="row-list">
          {PLAN_QUEST_EXAMPLES.map((q) => (
            <li key={q.name} className="row-item">
              <strong>{q.name}</strong>
              <span>{q.text}</span>
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------

export function StreakPanel({ model }: { model: Model }) {
  const { streak, nowMs } = model;
  const weekEnd = model.streak.recent[model.streak.recent.length - 1].weekStartMs + 7 * 86_400_000 - 1;
  return (
    <Panel title="Weekly streak" actions={<Tag tone="warn">Draft rule</Tag>}>
      <StatGrid>
        <Stat label="Current streak" value={`${streak.current} ${streak.current === 1 ? "week" : "weeks"}`} />
        <Stat label="Longest streak" value={`${streak.longest} ${streak.longest === 1 ? "week" : "weeks"}`} />
        <Stat label="This week" value={streak.thisWeekDone ? "Done" : "Not yet"} hint={`Ends ${formatDayUtc(weekEnd)}`} />
      </StatGrid>
      {streak.atRisk ? (
        <p className="cb-risk" role="note">
          <Tag tone="warn">At risk</Tag> You have no qualifying action this week. Log one before {formatDayUtc(weekEnd)} (UTC) to keep your{" "}
          {streak.current}-week streak.
        </p>
      ) : streak.current === 0 ? (
        <p className="mut">No streak yet. Log a ship, a review or a journal entry to start one.</p>
      ) : null}
      <ol className="cb-weeks" aria-label="Last 12 weeks, oldest first">
        {streak.recent.map((w) => (
          <li key={w.weekStartMs} className={w.done ? "cb-week cb-week-on" : "cb-week"}>
            <span aria-hidden="true" className="cb-week-mark">
              {w.done ? "✓" : "–"}
            </span>
            <span className="cb-week-label">{w.label.slice(5)}</span>
            <span className="sr-only">
              {w.label}: {w.done ? "action logged" : "no action"}
              {w.isCurrent ? ", this week" : ""}
            </span>
          </li>
        ))}
      </ol>
      <p className="mut">{DRAFT_RULES.streak}</p>
      <p className="mut">Preview date {formatDayUtc(nowMs)} (UTC). {DRAFT_RULES.week}</p>
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------

export function ArchivePanel({ model }: { model: Model }) {
  const { nowMs } = model;
  const sequence = ERA_CONFIG.specs;
  return (
    <Panel title="Seasons and Eras archive">
      <p className="mut">Only what the plans define. There is no past program history here; Plan 11 leaves open how Era history is kept and shown.</p>
      <h3 className="cb-sub">Seasons (Plan 02)</h3>
      <ul className="row-list">
        {SEASON_SCHEDULE.map((slot) => {
          const phase = phaseOf(slot, nowMs);
          return (
            <li key={slot.id} className="row-item">
              <div>
                <p>
                  <strong>{seasonLabel(slot)}</strong>{" "}
                  <Tag tone={phase === "current" ? "accent" : "plain"}>{phase === "current" ? "Current" : phase === "past" ? "Ended" : "Upcoming"}</Tag>
                </p>
                <p className="mut">{SEASONS[slot.index].theme}</p>
              </div>
              <p className="mut">
                {slot.weeks} weeks · {formatDateUtc(slot.startMs)} to {formatDateUtc(slot.endMs - 1)}
              </p>
            </li>
          );
        })}
      </ul>
      <h3 className="cb-sub">Community Eras in this preview</h3>
      <ul className="row-list">
        {sequence.map((spec, i) => {
          const state = model.era.eras[i];
          const isCurrent = state && state.endMs === null;
          return (
            <li key={spec.id} className="row-item">
              <div>
                <p>
                  <strong>
                    {`Era ${String(i + 1).padStart(2, "0")} // ${spec.name}`}
                  </strong>{" "}
                  {state ? <Tag tone={isCurrent ? "accent" : "ok"}>{isCurrent ? "Current" : "Completed"}</Tag> : <Tag>Illustrative, not scheduled</Tag>}
                </p>
                {state ? (
                  <p className="mut">
                    {formatDateUtc(state.startMs)} to {state.endMs ? formatDateUtc(state.endMs - 1) : "now"} · {fmt(state.points)} of {fmt(state.threshold)} Era Points (Draft)
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {model.era.eras.length === 1 ? <p className="mut">No Era has advanced yet. Raise the pool with approved ships and move the Preview date past a weekly reset to see one advance.</p> : null}
    </Panel>
  );
}

export function DifferencesPanel() {
  return (
    <Panel title="Seasons, Eras and weekly resets">
      <p className="mut">These are three different systems (Plan 11).</p>
      <div className="tbl-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="tbl">
          <caption className="sr-only">How Seasons, Eras and weekly resets differ</caption>
          <thead>
            <tr>
              <th scope="col">System</th>
              <th scope="col">Meaning</th>
              <th scope="col">Reset behaviour</th>
            </tr>
          </thead>
          <tbody>
            {SYSTEM_DIFFERENCES.map((row) => (
              <tr key={row.system}>
                <th scope="row">{row.system}</th>
                <td>{row.meaning}</td>
                <td>{row.reset}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mut">Lifetime Ore, the Digital Loadout, lifetime Track XP and project history do not reset when a Season or an Era changes.</p>
    </Panel>
  );
}
