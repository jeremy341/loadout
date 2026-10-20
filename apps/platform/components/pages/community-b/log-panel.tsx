"use client";

import { useId, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { pushNotification } from "../../../lib/notifications";
import { ME, type TrackName } from "../../../lib/sample/builders";
import { EmptyState, Field, Panel, Status, Tag } from "../../ui/ui";
import { DRAFT_RULES, ERA_CONFIG, QUEST_DEFS, seasonLabel } from "./data";
import { formatDateUtc, fromDateInput, parseMs, startOfUtcDay, toDateInput } from "./logic/dates";
import { simulateEras, type EraState } from "./logic/era";
import {
  ACTION_PLURAL,
  becameAdvancementReady,
  buildContributionDraft,
  describeLogged,
  firstErrorField,
  plural,
  shipEvents,
} from "./logic/log-submit";
import {
  MAX_HOURS,
  MAX_NOTE,
  MAX_QTY,
  completionKey,
  newlyCompleted,
  validateContribution,
  type ActionType,
  type Contribution,
  type ContributionErrors,
  type QuestDef,
} from "./logic/quests";
import { TRACKS } from "./logic/standings";
import { computeStreak } from "./logic/streak";
import type { useCommunityModel } from "./model";
import { InlineConfirm, useAnnounce } from "./shared";
import { useContributions, useQuestCompletions } from "./state";

type Model = ReturnType<typeof useCommunityModel>;

const ACTION_LABEL: Record<ActionType, string> = {
  ship: "Ship approved",
  review: "Review done",
  journal: "Journal written",
};

const QTY_LABEL: Record<ActionType, string> = { ship: "Ships", review: "Reviews", journal: "Entries" };

interface LogFormState {
  type: ActionType;
  qty: string;
  hours: string;
  track: TrackName;
  note: string;
}

const EMPTY_FORM: LogFormState = { type: "ship", qty: "1", hours: "", track: ME.track, note: "" };

// ---- What a new entry changes --------------------------------------------------------------------------

/** Records and announces every quest the new entry completed, then returns them. */
function completeQuests(model: Model, next: readonly Contribution[], record: (keys: string[], atIso: string) => void): QuestDef[] {
  const nextStreak = computeStreak(next.map((c) => parseMs(c.at)), model.nowMs);
  const fresh = newlyCompleted(QUEST_DEFS, model.season.slot.id, model.questsDone, {
    contributions: next,
    window: model.seasonWin,
    streakCurrent: nextStreak.current,
  });
  if (fresh.length === 0) return fresh;
  record(fresh.map((d) => completionKey(model.season.slot.id, d.id)), new Date(model.nowMs).toISOString());
  for (const def of fresh) {
    pushNotification({
      kind: "mission",
      title: `Quest complete: ${def.name}`,
      body: `${seasonLabel(model.season.slot)} preview quest. The preview awards no Ore for quests.`,
      href: "/seasons",
    });
  }
  return fresh;
}

/** The Era as it stands after the new entry; notifies when it just became ADVANCEMENT READY. */
function advanceEra(model: Model, next: readonly Contribution[]): EraState {
  const before = model.era.current;
  const after = simulateEras(ERA_CONFIG, shipEvents(next, DRAFT_RULES.eraPointsPerShip), model.nowMs).current;
  if (becameAdvancementReady(before, after)) {
    pushNotification({
      kind: "mission",
      title: `Era ${after.spec.name}: ADVANCEMENT READY`,
      body: "The preview threshold is met. The Era advances at the next eligible weekly reset.",
      href: "/seasons",
    });
  }
  return after;
}

// ---- Panel ---------------------------------------------------------------------------------------------

export function LogPanel({ model }: { model: Model }) {
  const ids = useId();
  const [message, announce] = useAnnounce();
  const { add, remove } = useContributions();
  const { record } = useQuestCompletions();
  const [form, setForm] = useState<LogFormState>(EMPTY_FORM);
  const [dateOverride, setDateOverride] = useState<string | null>(null);
  const [errors, setErrors] = useState<ContributionErrors>({});
  const [removing, setRemoving] = useState<string | null>(null);

  const todayMs = startOfUtcDay(model.nowMs);
  const dateValue = dateOverride ?? toDateInput(todayMs);

  function rejectSubmit(found: ContributionErrors) {
    setErrors(found);
    const first = firstErrorField(found);
    if (!first) return;
    announce(`Not added. ${found[first]}`);
    window.requestAnimationFrame(() => document.getElementById(`${ids}-${first}`)?.focus());
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validateContribution({ ...form, date: dateValue }, todayMs, fromDateInput);
    if (!result.ok) return rejectSubmit(result.errors);
    setErrors({});
    const created = add(buildContributionDraft(form, result, model.nowMs, ME.track));

    // Work out what this entry changed, from the same pure functions the page renders with.
    const next = [...model.contributions, created];
    const fresh = completeQuests(model, next, record);
    const after = advanceEra(model, next);
    announce(
      describeLogged({
        type: form.type,
        qty: result.qty,
        eraPointsGained: after.yourPoints - model.era.current.yourPoints,
        completedQuestNames: fresh.map((d) => d.name),
      }),
    );
    setForm((prev) => ({ ...prev, qty: "1", hours: "", note: "" }));
  }

  const entries = [...model.contributions].reverse().sort((a, b) => parseMs(b.at) - parseMs(a.at));
  const toRemove = entries.find((c) => c.id === removing);

  return (
    <Panel title="Log work" actions={<Tag>Preview tools</Tag>}>
      <p className="mut">
        In the live platform, contributions come from reviewed work and cannot be typed in. Here you record them yourself so the Era pool, quests and
        streak can be tested. Ships need no real project.
      </p>
      <form onSubmit={submit} noValidate>
        <fieldset className="cb-fieldset">
          <legend>Add a contribution</legend>
          <LogFields
            ids={ids}
            form={form}
            setForm={setForm}
            errors={errors}
            clearErrors={() => setErrors({})}
            dateValue={dateValue}
            maxDate={toDateInput(todayMs)}
            onDateChange={setDateOverride}
          />
          <div className="pg-actions cb-submit">
            <button type="submit" className="btn">
              Add to log
            </button>
          </div>
        </fieldset>
      </form>
      <Status message={message} />
      <ContributionLog entries={entries} removing={removing} onRemove={setRemoving} />
      {toRemove ? (
        <InlineConfirm
          message={`Remove this entry (${ACTION_LABEL[toRemove.type]}, ${formatDateUtc(parseMs(toRemove.at))})? Quests you already completed stay completed; progress and the Era pool drop back.`}
          confirmLabel="Remove entry"
          onConfirm={() => {
            remove(toRemove.id);
            setRemoving(null);
            announce("Entry removed.");
          }}
          onCancel={() => setRemoving(null)}
        />
      ) : null}
    </Panel>
  );
}

// ---- Form fields ---------------------------------------------------------------------------------------

interface LogFieldsProps {
  ids: string;
  form: LogFormState;
  setForm: Dispatch<SetStateAction<LogFormState>>;
  errors: ContributionErrors;
  clearErrors: () => void;
  dateValue: string;
  maxDate: string;
  onDateChange: (value: string) => void;
}

function LogFields({ ids, form, setForm, errors, clearErrors, dateValue, maxDate, onDateChange }: LogFieldsProps) {
  const set = <K extends keyof LogFormState>(key: K, value: LogFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="form-grid">
      <Field label="What you did">
        <select
          value={form.type}
          onChange={(e) => {
            set("type", e.target.value as ActionType);
            clearErrors();
          }}
        >
          {(Object.keys(ACTION_LABEL) as ActionType[]).map((t) => (
            <option key={t} value={t}>
              {ACTION_LABEL[t]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={QTY_LABEL[form.type]} hint={`1 to ${MAX_QTY}`} error={errors.qty}>
        <input
          id={`${ids}-qty`}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QTY}
          step={1}
          value={form.qty}
          aria-invalid={errors.qty ? true : undefined}
          onChange={(e) => set("qty", e.target.value)}
        />
      </Field>
      {form.type === "journal" ? (
        <Field label="Hours covered" hint={`Build time these entries cover, up to ${MAX_HOURS}`} error={errors.hours}>
          <input
            id={`${ids}-hours`}
            type="number"
            inputMode="decimal"
            min={0.1}
            max={MAX_HOURS}
            step={0.1}
            value={form.hours}
            aria-invalid={errors.hours ? true : undefined}
            onChange={(e) => set("hours", e.target.value)}
          />
        </Field>
      ) : null}
      {form.type === "ship" ? (
        <Field label="Track" hint="Raises your level in this track">
          <select value={form.track} onChange={(e) => set("track", e.target.value as TrackName)}>
            {TRACKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="Date" hint="Preview time, up to 90 days back" error={errors.date}>
        <input
          id={`${ids}-date`}
          type="date"
          value={dateValue}
          max={maxDate}
          aria-invalid={errors.date ? true : undefined}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </Field>
      <div className="wide">
        <Field label="Note (optional)" hint={`Up to ${MAX_NOTE} characters`} error={errors.note}>
          <input
            id={`${ids}-note`}
            type="text"
            maxLength={MAX_NOTE + 40}
            value={form.note}
            aria-invalid={errors.note ? true : undefined}
            onChange={(e) => set("note", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

// ---- Contribution log ----------------------------------------------------------------------------------

/** The grey detail line under an entry: date, then track, hours and Era Points where they apply. */
function entryDetail(c: Contribution): string {
  const parts = [formatDateUtc(parseMs(c.at))];
  if (c.type === "ship") parts.push(c.track);
  if (c.type === "journal" && c.hours) parts.push(`${c.hours} h`);
  if (c.type === "ship") {
    const beforeEra = parseMs(c.at) < ERA_CONFIG.startMs;
    parts.push(beforeEra ? "before this Era began, no Era Points" : `+${c.qty * DRAFT_RULES.eraPointsPerShip} Era Points (Draft)`);
  }
  return parts.join(" · ");
}

interface ContributionLogProps {
  entries: readonly Contribution[];
  removing: string | null;
  onRemove: (id: string) => void;
}

function ContributionLog({ entries, removing, onRemove }: ContributionLogProps) {
  return (
    <>
      <h3 className="cb-sub">Contribution log</h3>
      {entries.length === 0 ? (
        <EmptyState title="Nothing logged yet">Add a ship, a review or a journal entry above. Quests, your streak, the Era pool and the Leaderboards read from this log.</EmptyState>
      ) : (
        <ul className="row-list">
          {entries.map((c) => (
            <li key={c.id} className="row-item cb-log-item">
              <div>
                <p>
                  <strong>{plural(c.qty, ACTION_PLURAL[c.type])}</strong> <span className="mut">{ACTION_LABEL[c.type].toLowerCase()}</span>
                </p>
                <p className="mut">{entryDetail(c)}</p>
                {c.note ? <p>{c.note}</p> : null}
              </div>
              {removing === c.id ? null : (
                <button
                  type="button"
                  className="btn btn-quiet btn-sm"
                  onClick={() => onRemove(c.id)}
                  aria-label={`Remove entry: ${ACTION_LABEL[c.type]}, ${formatDateUtc(parseMs(c.at))}`}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
