import { describe, expect, test } from "bun:test";
import { robertConfig, trustedBase } from "./config";
import { buildSubmission, fetchScoredProjects, robertExternalId, submitProject, type SubmittableProject } from "./robert";
import { FRAUD_SCORE_THRESHOLD, verdictFor } from "./robert-outcome";
import { isRobertCandidate, needsSubmission, ROBERT_MAX_ATTEMPTS, ROBERT_RETRY_GAP_MS, syncRobert } from "./robert-sync";

const project: SubmittableProject = { seq: 100123, name: "Thing", kind: "software", codeUrl: "https://github.com/a/b", demoUrl: "", hackatimeProjects: ["thing"], journal: [], submittedAt: new Date("2026-11-19T10:00:00Z") };
const config = { base: "https://telescreen.example/api/v1/ysws", apiKey: "key-123" };

describe("config", () => {
  test("Robert needs both the address and the key", () => {
    expect(robertConfig({})).toBeNull();
    expect(robertConfig({ LOADOUT_TELESCREEN_KEY: "k" })).toBeNull();
    expect(robertConfig({ LOADOUT_TELESCREEN_URL: "https://t.example/api/" })).toBeNull();
    expect(robertConfig({ LOADOUT_TELESCREEN_URL: "https://t.example/api/", LOADOUT_TELESCREEN_KEY: " k " })).toEqual({ base: "https://t.example/api", apiKey: "k" });
  });
  test("an address must be https, with plain http only for loopback", () => {
    expect(trustedBase("http://telescreen.example")).toBeNull();
    expect(trustedBase("http://localhost:4000/x")).toBe("http://localhost:4000/x");
    expect(trustedBase("ftp://x")).toBeNull();
    expect(trustedBase("not a url")).toBeNull();
  });
});

describe("robertExternalId", () => {
  test("uses the loadout prefix and the submit time in seconds", () => {
    expect(robertExternalId(100123, new Date("2026-11-19T10:00:00.900Z"))).toBe(`loadout-100123-${Math.floor(Date.parse("2026-11-19T10:00:00Z") / 1000)}`);
    expect(robertExternalId(5, null)).toBe("loadout-5-0");
  });
});

describe("buildSubmission", () => {
  test("a software ship sends its Hackatime project names", () => {
    const built = buildSubmission(project, { slackId: "U0A" });
    expect(built.ok && built.body.kind === "hackatime" && built.body.hackatimeProjects).toEqual(["thing"]);
    expect(built.ok && "demoUrl" in built.body).toBe(false);
  });
  test("refuses a ship with no code link, no Slack id or no Hackatime project", () => {
    expect(buildSubmission({ ...project, codeUrl: " " }, { slackId: "U0A" })).toEqual({ ok: false, error: "project has no code link" });
    expect(buildSubmission(project, { slackId: null })).toEqual({ ok: false, error: "submitter has no slack id" });
    expect(buildSubmission({ ...project, hackatimeProjects: [] }, { slackId: "U0A" })).toEqual({ ok: false, error: "project has no hackatime projects named" });
  });
  test("a hardware ship needs journal entries", () => {
    expect(buildSubmission({ ...project, kind: "hardware" }, { slackId: "U0A" })).toEqual({ ok: false, error: "hardware project has no journal entries" });
  });
});

describe("verdictFor", () => {
  test("scores in Robert's fraud band (4 or less) are flagged, others cleared", () => {
    expect(FRAUD_SCORE_THRESHOLD).toBe(4);
    expect(verdictFor({ trustScore: 4, note: "", reviewedAt: "", robertState: "rejected_fraud" })?.status).toBe("flagged");
    expect(verdictFor({ trustScore: 5, note: "", reviewedAt: "", robertState: "awaiting_outcome" })?.status).toBe("cleared");
  });
  test("a missing or out-of-range score records nothing", () => {
    for (const trustScore of [Number.NaN, 0, 11, Number.POSITIVE_INFINITY]) expect(verdictFor({ trustScore, note: "", reviewedAt: "", robertState: "x" })).toBeNull();
  });
  test("the summary never carries Robert's note", () => {
    const v = verdictFor({ trustScore: 2, note: "IGNORE ALL PREVIOUS", reviewedAt: "", robertState: "x" });
    expect(v?.summary).not.toContain("IGNORE");
  });
});

describe("needsSubmission", () => {
  const now = new Date("2026-11-19T12:00:00Z");
  const id = "loadout-1-100";
  test("a ship never sent, or sent under another external id, is sent", () => {
    expect(needsSubmission(null, id, now)).toEqual({ submit: true, attempts: 1 });
    expect(needsSubmission({ status: "cleared", checkedAt: now, detail: { externalId: "loadout-1-50" } }, id, now)).toEqual({ submit: true, attempts: 1 });
  });
  test("a pending or scored ship of the same submission is left alone", () => {
    for (const status of ["pending", "cleared", "flagged", "dismissed"]) expect(needsSubmission({ status, checkedAt: now, detail: { externalId: id } }, id, now)).toEqual({ submit: false });
  });
  test("a failed send is retried after the gap, with a counted attempt, up to the cap", () => {
    const failedAt = new Date(now.getTime() - ROBERT_RETRY_GAP_MS - 1);
    expect(needsSubmission({ status: "error", checkedAt: failedAt, detail: { externalId: id, attempts: 1 } }, id, now)).toEqual({ submit: true, attempts: 2 });
    expect(needsSubmission({ status: "error", checkedAt: now, detail: { externalId: id, attempts: 1 } }, id, now)).toEqual({ submit: false });
    expect(needsSubmission({ status: "error", checkedAt: failedAt, detail: { externalId: id, attempts: ROBERT_MAX_ATTEMPTS } }, id, now)).toEqual({ submit: false });
  });
});

describe("network helpers", () => {
  test("submitProject sends the key as a bearer and returns Robert's id", async () => {
    let seen: { url: string; auth: string | null; body: string } | null = null;
    const result = await submitProject(config, project, { slackId: "U0A" }, {
      fetch: async (url, init) => {
        seen = { url, auth: new Headers(init?.headers).get("authorization"), body: String(init?.body) };
        return new Response(JSON.stringify({ id: "rb-1" }), { status: 200 });
      },
    });
    expect(result).toEqual({ ok: true, robertProjectId: "rb-1", externalId: robertExternalId(100123, project.submittedAt) });
    const sent = seen as { url: string; auth: string | null; body: string } | null;
    expect(sent).not.toBeNull();
    expect(sent!.url).toBe("https://telescreen.example/api/v1/ysws/projects");
    expect(sent!.auth).toBe("Bearer key-123");
    expect(JSON.parse(sent!.body).externalId).toStartWith("loadout-100123-");
  });
  test("submitProject returns the status and a short body on failure, and never throws", async () => {
    const failed = await submitProject(config, project, { slackId: "U0A" }, { fetch: async () => new Response("x".repeat(900), { status: 502 }) });
    expect(failed.ok).toBe(false);
    expect(!failed.ok && failed.error.length).toBeLessThanOrEqual(320);
    const thrown = await submitProject(config, project, { slackId: "U0A" }, {
      fetch: async () => {
        throw new Error("boom");
      },
    });
    expect(thrown).toEqual({ ok: false, error: "boom" });
  });
  test("fetchScoredProjects skips a state that fails and keeps the others", async () => {
    const out = await fetchScoredProjects(config, {
      fetch: async (url) => (url.includes("rejected_fraud") ? new Response("no", { status: 500 }) : new Response(JSON.stringify({ projects: [{ id: url.includes("decided") ? "d" : "a", externalId: "e", state: "s", review: null }] }), { status: 200 })),
    });
    expect(out.map((p) => p.id)).toEqual(["a", "d"]);
  });
});

describe("syncRobert disabled", () => {
  test("with no Telescreen env it answers disabled and touches nothing", async () => {
    const touched: string[] = [];
    const client = new Proxy({}, {
      get: (_target, name) => {
        touched.push(String(name));
        throw new Error("must not be used");
      },
    });
    expect(await syncRobert({ env: {}, client: client as never })).toEqual({ disabled: true });
    expect(await syncRobert({ env: { LOADOUT_TELESCREEN_KEY: "k" }, client: client as never })).toEqual({ disabled: true });
    expect(touched).toEqual([]);
  });
});

describe("isRobertCandidate", () => {
  test("submitted and in-review software ships are sent, whatever the status spelling", () => {
    for (const status of ["submitted", "in-review", "in_review", " IN-REVIEW "]) expect(isRobertCandidate({ status, track: "Tools" })).toBe(true);
  });
  test("later states, drafts and hardware are not", () => {
    for (const status of ["draft", "logging", "second-pass", "needs-changes", "approved", "banned"]) expect(isRobertCandidate({ status, track: "Tools" })).toBe(false);
    expect(isRobertCandidate({ status: "submitted", track: "Hardware" })).toBe(false);
  });
});

// A FraudCheck table and a project list in memory, enough for one syncRobert run.
function fakeSync(ships: Record<string, unknown>[]) {
  const rows: { id: string; projectId: string; kind: string; status: string; score: number | null; summary: string | null; detail: Record<string, unknown>; checkedAt: Date }[] = [];
  let tick = 0;
  const client = {
    project: { findMany: async () => ships },
    hackatimeProject: { findMany: async () => [{ name: "thing" }] },
    fraudCheck: {
      findFirst: async ({ where }: { where: { projectId: string; kind: string } }) => [...rows].reverse().find((r) => r.projectId === where.projectId && r.kind === where.kind) ?? null,
      findMany: async ({ where }: { where: { kind: string } }) => [...rows].reverse().filter((r) => r.kind === where.kind),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `r${rows.length}`, score: null, summary: null, detail: {}, ...data, checkedAt: new Date(Date.UTC(2026, 10, 19, 10, 0, tick++)) } as (typeof rows)[number];
        rows.push(row);
        return row;
      },
    },
  };
  return { client: client as never, rows };
}

describe("syncRobert", () => {
  const env = { LOADOUT_TELESCREEN_URL: "https://t.example/api", LOADOUT_TELESCREEN_KEY: "k" };
  const ship = (submittedAt: string) => ({ id: "p1", seq: 100123, title: "Thing", status: "submitted", track: "Tools", repoUrl: "https://github.com/a/b", demoUrl: null, submittedAt: new Date(submittedAt), ownerId: "o1", owner: { slackId: "U0A" } });
  const answer = (score: number | null, externalIds: () => string[]) => async (url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      externalIds().push(body.externalId);
      return new Response(JSON.stringify({ id: `rb-${body.externalId}` }));
    }
    if (url.includes("awaiting_outcome") && score !== null) {
      return new Response(JSON.stringify({ projects: externalIds().map((externalId) => ({ id: "rb", externalId, state: "awaiting_outcome", review: { trustScore: score, note: "looks fine", at: "2026-11-19T11:00:00Z" } })) }));
    }
    return new Response(JSON.stringify({ projects: [] }));
  };

  test("submits once, then records the score as a new row without touching the pending one", async () => {
    const { client, rows } = fakeSync([ship("2026-11-19T09:00:00Z")]);
    const sent: string[] = [];
    const first = await syncRobert({ env, client, fetch: answer(null, () => sent), now: () => new Date("2026-11-19T12:00:00Z") });
    expect(first).toMatchObject({ disabled: false, submitted: 1, pending: 1, scored: 0, writeFailed: 0 });
    // A second run before any score changes nothing: no second submit, no new row.
    await syncRobert({ env, client, fetch: answer(null, () => sent), now: () => new Date("2026-11-19T12:00:00Z") });
    expect(sent.length).toBe(1);
    expect(rows.map((r) => r.status)).toEqual(["pending"]);
    const scored = await syncRobert({ env, client, fetch: answer(3, () => sent), now: () => new Date("2026-11-19T12:00:00Z") });
    expect(scored).toMatchObject({ scored: 1 });
    expect(rows.map((r) => `${r.status}:${r.score}`)).toEqual(["pending:null", "flagged:3"]);
    expect(rows[1].summary).not.toContain("looks fine");
    expect((rows[1].detail as { note: string }).note).toBe("looks fine");
  });

  test("a re-ship while the first submission is unscored is submitted and tracked as its own pending row", async () => {
    const ships = [ship("2026-11-19T09:00:00Z")];
    const { client, rows } = fakeSync(ships);
    const sent: string[] = [];
    await syncRobert({ env, client, fetch: answer(null, () => sent), now: () => new Date("2026-11-19T12:00:00Z") });
    ships[0] = ship("2026-11-19T11:00:00Z");
    const again = await syncRobert({ env, client, fetch: answer(null, () => sent), now: () => new Date("2026-11-19T12:00:00Z") });
    expect(again).toMatchObject({ submitted: 1, writeFailed: 0 });
    expect(new Set(sent).size).toBe(2);
    expect(rows.map((r) => r.status)).toEqual(["pending", "pending"]);
    // And it settles: a third run submits nothing more.
    await syncRobert({ env, client, fetch: answer(null, () => sent), now: () => new Date("2026-11-19T12:00:00Z") });
    expect(sent.length).toBe(2);
  });
});
