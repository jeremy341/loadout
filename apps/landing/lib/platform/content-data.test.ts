import { describe, expect, test } from "bun:test";
import {
  canDecideSubmission,
  checkEventDraft,
  checkNewsDraft,
  checkPollDraft,
  checkPollVote,
  eventStopCheck,
  eventStopEnd,
  eventView,
  formConfigView,
  formOpen,
  formSubmissionView,
  NEWS_TITLE_MAX,
  POLL_MAX_OPTIONS,
} from "./content-data";

const now = new Date("2026-11-18T12:00:00Z");
const hour = 60 * 60 * 1000;

describe("events", () => {
  const start = new Date(now.getTime() + hour);
  test("a name and an end after the start are required", () => {
    expect(checkEventDraft({ name: "  ", note: "", startsAt: start, endsAt: new Date(start.getTime() + hour) }).ok).toBe(false);
    expect(checkEventDraft({ name: "Show and Tell", note: "", startsAt: start, endsAt: null }).ok).toBe(false);
    expect(checkEventDraft({ name: "Show and Tell", note: "", startsAt: start, endsAt: start }).ok).toBe(false);
    expect(checkEventDraft({ name: "Show and Tell", note: "", startsAt: start, endsAt: new Date(start.getTime() + hour) }).ok).toBe(true);
  });
  test("a stop moves the end to now, only for a started, still running event", () => {
    const running = { startsAt: new Date(now.getTime() - hour), endsAt: new Date(now.getTime() + hour) };
    expect(eventStopEnd(running, now)).toEqual({ ok: true, endsAt: now });
    expect(eventStopEnd({ startsAt: start, endsAt: new Date(start.getTime() + hour) }, now).ok).toBe(false);
    expect(eventStopEnd({ startsAt: new Date(now.getTime() - 2 * hour), endsAt: new Date(now.getTime() - hour) }, now).ok).toBe(false);
  });
  test("the page shape: type is show and tell, the note is in config, stopped is never set", () => {
    const view = eventView({ id: "e1", title: "Show and Tell 5", body: "Demos.", startsAt: start, endsAt: null, createdAt: now });
    expect(view).toEqual({
      id: "e1",
      type: "show_and_tell",
      name: "Show and Tell 5",
      config: { note: "Demos." },
      starts_at: start.toISOString(),
      ends_at: start.toISOString(),
      created_by: "",
      stopped_at: null,
      created_at: now.toISOString(),
    });
  });
});

describe("polls", () => {
  const closes = new Date(now.getTime() + hour);
  test("a poll needs a question, 2 to 10 different options, and a future close", () => {
    expect(checkPollDraft({ question: "Pick", options: ["a", "b"], closesAt: null }, now).ok).toBe(true);
    expect(checkPollDraft({ question: "Pick", options: ["a"], closesAt: null }, now).ok).toBe(false);
    const tooMany = Array.from({ length: POLL_MAX_OPTIONS + 1 }, (_, i) => `option ${i}`);
    expect(checkPollDraft({ question: "Pick", options: tooMany, closesAt: null }, now).ok).toBe(false);
    expect(checkPollDraft({ question: "Pick", options: ["a", "a"], closesAt: null }, now).ok).toBe(false);
    expect(checkPollDraft({ question: "Pick", options: ["a", "b"], closesAt: new Date(now.getTime() - 1) }, now).ok).toBe(false);
    expect(checkPollDraft({ question: "Pick", options: ["a", "b"], closesAt: closes }, now).ok).toBe(true);
  });
  test("a vote needs an option in range and an open poll", () => {
    const poll = { options: ["a", "b"], closesAt: closes };
    expect(checkPollVote(poll, 0, now).ok).toBe(true);
    expect(checkPollVote(poll, 1, now).ok).toBe(true);
    expect(checkPollVote(poll, 2, now).ok).toBe(false);
    expect(checkPollVote(poll, -1, now).ok).toBe(false);
    expect(checkPollVote(poll, 0.5, now).ok).toBe(false);
    expect(checkPollVote(poll, "0", now).ok).toBe(false);
    expect(checkPollVote({ options: ["a"], closesAt: new Date(now.getTime() - 1) }, 0, now).ok).toBe(false);
    expect(checkPollVote({ options: ["a"], closesAt: null }, 0, now).ok).toBe(true);
  });
});

describe("news", () => {
  test("title and body are required and the title has a limit", () => {
    expect(checkNewsDraft({ title: "", body: "x" }).ok).toBe(false);
    expect(checkNewsDraft({ title: "t", body: "  " }).ok).toBe(false);
    expect(checkNewsDraft({ title: "x".repeat(NEWS_TITLE_MAX + 1), body: "b" }).ok).toBe(false);
    expect(checkNewsDraft({ title: "Title", body: "Body" })).toEqual({ ok: true });
  });
});

describe("forms", () => {
  test("config fields in JSON map to the page shape", () => {
    const view = formConfigView({
      id: "reviewer",
      name: "Reviewer application",
      fields: {
        description: "Apply here.",
        questions: [{ key: "why", label: "Why?" }, { key: "", label: "bad" }],
        closeAt: "2026-12-01T00:00:00.000Z",
        updatedBy: "owner",
        updatedAt: "2026-11-01T00:00:00.000Z",
      },
      createdAt: now,
    });
    expect(view).toEqual({
      form_key: "reviewer",
      title: "Reviewer application",
      description: "Apply here.",
      questions: [{ key: "why", label: "Why?" }],
      close_at: "2026-12-01T00:00:00.000Z",
      updated_by: "owner",
      updated_at: "2026-11-01T00:00:00.000Z",
    });
  });
  test("a missing or bad fields value still maps", () => {
    const view = formConfigView({ id: "x", name: "X", fields: null, createdAt: now });
    expect(view.questions).toEqual([]);
    expect(view.close_at).toBeNull();
    expect(view.updated_at).toBe(now.toISOString());
  });
  test("open follows the close time", () => {
    expect(formOpen(null, now)).toBe(true);
    expect(formOpen(new Date(now.getTime() + hour), now)).toBe(true);
    expect(formOpen(new Date(now.getTime() - hour), now)).toBe(false);
  });
  test("a submission maps its JSON data and defaults to pending", () => {
    const view = formSubmissionView({
      id: "s1",
      formId: "reviewer",
      data: { slack_id: "ostler", name: "Ostler", answers: { why: "Because" } },
      createdAt: now,
    });
    expect(view).toMatchObject({ id: "s1", form_key: "reviewer", slack_id: "ostler", status: "pending", answers: { why: "Because" }, decided_at: null, interesting_at: null });
    expect(canDecideSubmission(view)).toBe(true);
    const decided = formSubmissionView({ id: "s2", formId: "reviewer", data: { status: "accepted", decided_at: now.toISOString() }, createdAt: now });
    expect(decided.status).toBe("accepted");
    expect(canDecideSubmission(decided)).toBe(false);
    expect(formSubmissionView({ id: "s3", formId: "f", data: { status: "weird" }, createdAt: now }).status).toBe("pending");
  });
});

describe("event columns", () => {
  test("a stop is refused only when the event is already stopped; an upcoming event may be stopped", () => {
    expect(eventStopCheck({ stoppedAt: null }).ok).toBe(true);
    expect(eventStopCheck({}).ok).toBe(true);
    expect(eventStopCheck({ stoppedAt: now }).ok).toBe(false);
  });

  test("the page reads the kind, the creator and the stop time from their columns", () => {
    const stopped = new Date("2026-11-18T13:00:00Z");
    const view = eventView({
      id: "e9",
      kind: "show_and_tell",
      title: "Show and Tell 9",
      body: "",
      startsAt: new Date("2026-11-18T10:00:00Z"),
      endsAt: new Date("2026-11-20T12:00:00Z"),
      stoppedAt: stopped,
      createdById: "cperson1",
      createdAt: now,
    });
    expect(view.type).toBe("show_and_tell");
    expect(view.created_by).toBe("cperson1");
    expect(view.stopped_at).toBe(stopped.toISOString());
    expect(view.ends_at).toBe("2026-11-20T12:00:00.000Z");
  });
});
