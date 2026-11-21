// Content domain for the reviewer site: events, forms (configs and submissions), news, polls and poll votes. The pure rules and the
// row-to-page mappers come first and need no database (content-data.test.ts). The Prisma functions below them write through
// one transaction each, with an AuditEvent (lib/platform/audit.ts) for staff changes.
//
// The reviewer pages keep Pixl's row shapes, which the mappers return. Three of those shapes carry fields the schema has no column
// for, so they live in JSON columns: FormConfig.fields holds the description, questions and close time; FormSubmission.data holds the
// answers, decision and interest flags. Event has a kind (show_and_tell by default), a stoppedAt time and a createdById: a stop sets
// stoppedAt and leaves endsAt alone, and created_by is the creator's Person id.
import type { Prisma } from "../generated/prisma/client";
import { recordAudit } from "./audit";
import { db } from "./db";

// ---- Shapes the reviewer pages read (Pixl's, as in reviewer-dash/lib/sample/content-data.ts) ----

export type EventView = {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  starts_at: string;
  ends_at: string;
  created_by: string;
  stopped_at: string | null;
  created_at: string;
};

export type FormQuestionView = { key: string; label: string };

export type FormConfigView = {
  form_key: string;
  title: string;
  description: string;
  questions: FormQuestionView[];
  close_at: string | null;
  updated_by: string;
  updated_at: string;
};

export type SubmissionStatus = "pending" | "accepted" | "rejected";

export type FormSubmissionView = {
  id: string;
  form_key: string;
  slack_id: string;
  name: string;
  answers: Record<string, string>;
  status: SubmissionStatus;
  decided_by: string;
  decided_at: string | null;
  decision_note: string;
  created_at: string;
  interesting_at: string | null;
  interesting_by: string;
};

export type Check = { ok: true } | { ok: false; reason: string };

export const EVENT_TYPE_SHOW_AND_TELL = "show_and_tell";
export const POLL_MAX_OPTIONS = 10;
export const POLL_OPTION_MAX = 120;
export const POLL_QUESTION_MAX = 280;
export const NEWS_TITLE_MAX = 140;
export const NEWS_BODY_MAX = 10_000;
export const EVENT_NAME_MAX = 100;
export const EVENT_NOTE_MAX = 500;

// ---- Pure rules ----

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const asString = (value: unknown, fallback = ""): string => (typeof value === "string" ? value : fallback);
const asIso = (value: unknown): string | null => (typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null);

export function checkEventDraft(input: { name: unknown; note: unknown; startsAt: Date; endsAt: Date | null }): Check {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) return { ok: false, reason: "Give the event a name builders will see." };
  if (name.length > EVENT_NAME_MAX) return { ok: false, reason: `Keep the event name under ${EVENT_NAME_MAX} characters.` };
  if (typeof input.note === "string" && input.note.length > EVENT_NOTE_MAX) return { ok: false, reason: `Keep the note under ${EVENT_NOTE_MAX} characters.` };
  if (!input.endsAt || Number.isNaN(input.endsAt.getTime())) return { ok: false, reason: "An end time is required." };
  if (Number.isNaN(input.startsAt.getTime()) || input.endsAt.getTime() <= input.startsAt.getTime()) {
    return { ok: false, reason: "The event must end after it starts." };
  }
  return { ok: true };
}

// A stop only makes sense once the event has started. It moves the end to now, and only while the event is still running.
export function eventStopEnd(row: { startsAt: Date; endsAt: Date | null }, now: Date): Check & { endsAt?: Date } {
  if (row.startsAt.getTime() > now.getTime()) return { ok: false, reason: "Only an event that has started can be stopped." };
  if (row.endsAt && row.endsAt.getTime() <= now.getTime()) return { ok: false, reason: "This event has already ended." };
  return { ok: true, endsAt: now };
}

// A stop is refused only for an event that is already stopped. An upcoming event may be stopped too (the sample allowed this).
export function eventStopCheck(row: { stoppedAt?: Date | null }): Check {
  if (row.stoppedAt) return { ok: false, reason: "This event is already stopped." };
  return { ok: true };
}

export function eventView(row: {
  id: string;
  kind?: string;
  title: string;
  body: string;
  startsAt: Date;
  endsAt: Date | null;
  stoppedAt?: Date | null;
  createdById?: string | null;
  createdAt: Date;
}): EventView {
  return {
    id: row.id,
    type: row.kind ?? EVENT_TYPE_SHOW_AND_TELL,
    name: row.title,
    config: { note: row.body },
    starts_at: row.startsAt.toISOString(),
    ends_at: (row.endsAt ?? row.startsAt).toISOString(),
    created_by: row.createdById ?? "",
    stopped_at: row.stoppedAt ? row.stoppedAt.toISOString() : null,
    created_at: row.createdAt.toISOString(),
  };
}

export function checkPollDraft(input: { question: unknown; options: unknown; closesAt: Date | null }, now: Date): Check {
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (!question) return { ok: false, reason: "Write the question." };
  if (question.length > POLL_QUESTION_MAX) return { ok: false, reason: `Keep the question under ${POLL_QUESTION_MAX} characters.` };
  const options = Array.isArray(input.options) ? input.options.map((o) => (typeof o === "string" ? o.trim() : "")) : [];
  if (options.length < 2 || options.length > POLL_MAX_OPTIONS) return { ok: false, reason: `Give between 2 and ${POLL_MAX_OPTIONS} options.` };
  if (options.some((o) => !o || o.length > POLL_OPTION_MAX)) return { ok: false, reason: `Each option needs text under ${POLL_OPTION_MAX} characters.` };
  if (new Set(options).size !== options.length) return { ok: false, reason: "Each option must be different." };
  if (input.closesAt && input.closesAt.getTime() <= now.getTime()) return { ok: false, reason: "The close time must be in the future." };
  return { ok: true };
}

export function pollOptionsFrom(json: unknown): string[] {
  return Array.isArray(json) ? json.filter((o): o is string => typeof o === "string") : [];
}

// One vote per person is enforced by the composite primary key (see castPollVote). This rule covers the option and the close time.
export function checkPollVote(poll: { options: unknown; closesAt: Date | null }, option: unknown, now: Date): Check {
  const options = pollOptionsFrom(poll.options);
  if (typeof option !== "number" || !Number.isSafeInteger(option) || option < 0 || option >= options.length) {
    return { ok: false, reason: "Pick one of the options." };
  }
  if (poll.closesAt && poll.closesAt.getTime() <= now.getTime()) return { ok: false, reason: "This poll is closed." };
  return { ok: true };
}

export function checkNewsDraft(input: { title: unknown; body: unknown }): Check {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  if (!title) return { ok: false, reason: "Give the news a title." };
  if (title.length > NEWS_TITLE_MAX) return { ok: false, reason: `Keep the title under ${NEWS_TITLE_MAX} characters.` };
  if (!body) return { ok: false, reason: "Write the news." };
  if (body.length > NEWS_BODY_MAX) return { ok: false, reason: `Keep the body under ${NEWS_BODY_MAX} characters.` };
  return { ok: true };
}

export function formConfigView(row: { id: string; name: string; fields: unknown; createdAt: Date }): FormConfigView {
  const f = asRecord(row.fields);
  const questions = Array.isArray(f.questions)
    ? f.questions
        .map((q) => ({ key: asString(asRecord(q).key), label: asString(asRecord(q).label) }))
        .filter((q) => q.key && q.label)
    : [];
  return {
    form_key: row.id,
    title: row.name,
    description: asString(f.description),
    questions,
    close_at: asIso(f.closeAt),
    updated_by: asString(f.updatedBy),
    updated_at: asIso(f.updatedAt) ?? row.createdAt.toISOString(),
  };
}

// The `open` column follows the close time: open until the close time passes (or forever when there is none).
export function formOpen(closeAt: Date | null, now: Date): boolean {
  return !closeAt || closeAt.getTime() > now.getTime();
}

export function formSubmissionView(row: { id: string; formId: string; data: unknown; createdAt: Date }): FormSubmissionView {
  const d = asRecord(row.data);
  const answers = Object.fromEntries(
    Object.entries(asRecord(d.answers)).map(([key, value]) => [key, asString(value)]),
  );
  const status: SubmissionStatus = d.status === "accepted" || d.status === "rejected" ? d.status : "pending";
  return {
    id: row.id,
    form_key: row.formId,
    slack_id: asString(d.slack_id),
    name: asString(d.name),
    answers,
    status,
    decided_by: asString(d.decided_by),
    decided_at: asIso(d.decided_at),
    decision_note: asString(d.decision_note),
    created_at: row.createdAt.toISOString(),
    interesting_at: asIso(d.interesting_at),
    interesting_by: asString(d.interesting_by),
  };
}

// A submission can be decided only while it is pending. Re-deciding is refused so the audit trail stays one decision long.
export function canDecideSubmission(view: { status: SubmissionStatus }): boolean {
  return view.status === "pending";
}

// ---- Database: events ----

export async function listDbEvents(limit = 100): Promise<EventView[]> {
  const rows = await db().event.findMany({ orderBy: { startsAt: "desc" }, take: limit });
  return rows.map(eventView);
}

export async function createDbEvent(
  input: { name: string; note: string; startsAt: Date; endsAt: Date | null },
  actorId: string,
): Promise<{ id: string }> {
  const check = checkEventDraft(input);
  if (!check.ok) throw new Error(check.reason);
  return db().$transaction(async (tx) => {
    const row = await tx.event.create({
      data: {
        title: input.name.trim(),
        body: input.note.trim(),
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        kind: EVENT_TYPE_SHOW_AND_TELL,
        createdById: actorId,
      },
    });
    await recordAudit(tx, {
      actorId,
      action: "event.create",
      targetType: "event",
      targetId: row.id,
      reason: "Owner created an event on the Events page.",
      after: { title: row.title, startsAt: row.startsAt.toISOString(), endsAt: row.endsAt?.toISOString() ?? null },
    });
    return { id: row.id };
  });
}

export async function stopDbEvent(id: string, actorId: string, now: Date = new Date()): Promise<void> {
  await db().$transaction(async (tx) => {
    const row = await tx.event.findUnique({ where: { id } });
    if (!row) throw new Error("That event does not exist.");
    const check = eventStopCheck(row);
    if (!check.ok) throw new Error(check.reason);
    const updated = await tx.event.updateMany({ where: { id, stoppedAt: null }, data: { stoppedAt: now } });
    if (updated.count === 0) throw new Error("This event is already stopped.");
    await recordAudit(tx, {
      actorId,
      action: "event.stop",
      targetType: "event",
      targetId: id,
      reason: "Owner stopped an event on the Events page.",
      before: { stoppedAt: null },
      after: { stoppedAt: now.toISOString() },
    });
  });
}

export async function deleteDbEvent(id: string, actorId: string): Promise<void> {
  await db().$transaction(async (tx) => {
    const row = await tx.event.findUnique({ where: { id } });
    if (!row) return;
    await tx.event.delete({ where: { id } });
    await recordAudit(tx, {
      actorId,
      action: "event.delete",
      targetType: "event",
      targetId: id,
      reason: "Owner deleted an event on the Events page.",
      before: { title: row.title, startsAt: row.startsAt.toISOString() },
    });
  });
}

// ---- Database: forms ----

export async function listDbFormConfigs(): Promise<FormConfigView[]> {
  const rows = await db().formConfig.findMany({ orderBy: { id: "asc" } });
  return rows.map(formConfigView);
}

export async function saveDbFormConfig(
  input: { formKey: string; title: string; description: string; questions: FormQuestionView[]; closeAt: Date | null },
  actorId: string,
  now: Date = new Date(),
): Promise<void> {
  if (!/^[a-z0-9_-]{1,50}$/.test(input.formKey)) throw new Error("Form keys use lower-case letters, digits, dashes and underscores.");
  const fields = {
    description: input.description,
    questions: input.questions,
    closeAt: input.closeAt ? input.closeAt.toISOString() : null,
    updatedBy: actorId,
    updatedAt: now.toISOString(),
  };
  await db().$transaction(async (tx) => {
    const before = await tx.formConfig.findUnique({ where: { id: input.formKey } });
    await tx.formConfig.upsert({
      where: { id: input.formKey },
      create: { id: input.formKey, name: input.title, fields, open: formOpen(input.closeAt, now) },
      update: { name: input.title, fields, open: formOpen(input.closeAt, now) },
    });
    await recordAudit(tx, {
      actorId,
      action: "form_config.save",
      targetType: "form_config",
      targetId: input.formKey,
      reason: "Owner saved a form on the Forms page.",
      before: before ? { name: before.name } : undefined,
      after: { name: input.title, questions: input.questions.length, closeAt: fields.closeAt },
    });
  });
}

export async function listDbFormSubmissions(formKey?: string): Promise<FormSubmissionView[]> {
  const rows = await db().formSubmission.findMany({
    where: formKey ? { formId: formKey } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(formSubmissionView);
}

// Writes one decision or interest flag onto a submission's JSON data, with its audit row.
export async function patchDbSubmission(
  id: string,
  patch: Record<string, unknown>,
  action: "form_submission.decide" | "form_submission.interest" | "form_submission.uninterest",
  actorId: string,
  reason: string,
): Promise<void> {
  await db().$transaction(async (tx) => {
    const row = await tx.formSubmission.findUnique({ where: { id } });
    if (!row) throw new Error("That submission does not exist.");
    const current = asRecord(row.data);
    const next = { ...current, ...patch } as Prisma.InputJsonObject;
    await tx.formSubmission.update({ where: { id }, data: { data: next } });
    await recordAudit(tx, {
      actorId,
      action,
      targetType: "form_submission",
      targetId: id,
      reason,
      before: { status: current.status ?? "pending" },
      after: patch as Prisma.InputJsonObject,
    });
  });
}

export async function decideDbSubmission(
  id: string,
  decision: "accepted" | "rejected",
  note: string,
  actorId: string,
  now: Date = new Date(),
): Promise<void> {
  const row = await db().formSubmission.findUnique({ where: { id } });
  if (!row) throw new Error("That submission does not exist.");
  if (!canDecideSubmission(formSubmissionView(row))) throw new Error("Only a pending submission can be decided.");
  await patchDbSubmission(
    id,
    { status: decision, decided_by: actorId, decided_at: now.toISOString(), decision_note: note.slice(0, 1000) },
    "form_submission.decide",
    actorId,
    `Owner ${decision} a form submission on the Forms page.`,
  );
}

export async function setDbSubmissionInterest(id: string, on: boolean, actorId: string, now: Date = new Date()): Promise<void> {
  const row = await db().formSubmission.findUnique({ where: { id } });
  if (!row) throw new Error("That submission does not exist.");
  if (on) {
    if (!canDecideSubmission(formSubmissionView(row))) throw new Error("Only a pending submission can be kept.");
    await patchDbSubmission(id, { interesting_at: now.toISOString(), interesting_by: actorId }, "form_submission.interest", actorId, "Owner kept a form submission for later on the Forms page.");
  } else {
    await patchDbSubmission(id, { interesting_at: null, interesting_by: "" }, "form_submission.uninterest", actorId, "Owner removed a form submission from the kept list.");
  }
}

// ---- Database: news, polls ----

export async function listNews(limit = 50) {
  return db().news.findMany({ orderBy: { publishedAt: "desc" }, take: limit });
}

export async function createNews(input: { title: string; body: string }, authorId: string): Promise<{ id: string }> {
  const check = checkNewsDraft(input);
  if (!check.ok) throw new Error(check.reason);
  return db().$transaction(async (tx) => {
    const row = await tx.news.create({ data: { title: input.title.trim(), body: input.body.trim(), authorId } });
    await recordAudit(tx, {
      actorId: authorId,
      action: "news.publish",
      targetType: "news",
      targetId: row.id,
      reason: "Staff published a news item.",
      after: { title: row.title },
    });
    return { id: row.id };
  });
}

export async function listPolls(limit = 50) {
  return db().poll.findMany({ orderBy: { createdAt: "desc" }, take: limit, include: { _count: { select: { votes: true } } } });
}

export async function createPoll(
  input: { question: string; options: string[]; closesAt: Date | null },
  actorId: string,
  now: Date = new Date(),
): Promise<{ id: string }> {
  const check = checkPollDraft(input, now);
  if (!check.ok) throw new Error(check.reason);
  return db().$transaction(async (tx) => {
    const row = await tx.poll.create({
      data: { question: input.question.trim(), options: input.options.map((o) => o.trim()), closesAt: input.closesAt },
    });
    await recordAudit(tx, {
      actorId,
      action: "poll.create",
      targetType: "poll",
      targetId: row.id,
      reason: "Staff created a poll.",
      after: { options: input.options.length, closesAt: input.closesAt?.toISOString() ?? null },
    });
    return { id: row.id };
  });
}

// One vote per person: the composite primary key (pollId, personId) rejects a second `create` with P2002, which becomes a message.
export async function castPollVote(pollId: string, personId: string, option: number, now: Date = new Date()): Promise<void> {
  await db().$transaction(async (tx) => {
    const poll = await tx.poll.findUnique({ where: { id: pollId } });
    if (!poll) throw new Error("That poll does not exist.");
    const check = checkPollVote(poll, option, now);
    if (!check.ok) throw new Error(check.reason);
    try {
      await tx.pollVote.create({ data: { pollId, personId, option, votedAt: now } });
    } catch (error) {
      if (typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002") {
        throw new Error("You have already voted in this poll.");
      }
      throw error;
    }
    await recordAudit(tx, {
      actorId: personId,
      action: "poll.vote",
      targetType: "poll",
      targetId: pollId,
      reason: "A person voted in a poll.",
      after: { option },
    });
  });
}
