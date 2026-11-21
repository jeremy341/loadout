import { describe, expect, test } from "bun:test";
import { fraudyConfig } from "./config";
import { addChecks, FRAUDY_FLAG_BELOW_PCT, fraudyCheckAi, fraudyHours, sweepFraudy, verdictFromSplit } from "./fraudy";
import { authorizeCron, runFraudJob } from "./job";

const req = (authorization?: string) => new Request("http://localhost/api/cron/fraud-x", { headers: authorization ? { authorization } : {} });

// A JobRun table in memory, newest last.
function fakeJobs() {
  const runs: { id: string; job: string; status: string; detail?: unknown; finishedAt?: Date }[] = [];
  const client = {
    jobRun: {
      create: async ({ data }: { data: { job: string; status: string } }) => {
        const row = { id: `j${runs.length}`, job: data.job, status: data.status };
        runs.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: { status: string; detail?: unknown; finishedAt?: Date } }) => {
        const row = runs.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
    },
  };
  return { runs, client: client as never };
}

describe("authorizeCron", () => {
  test("an unset secret fails closed with 403, whatever is sent", () => {
    expect(authorizeCron("Bearer anything", {})).toEqual({ ok: false, status: 403 });
    expect(authorizeCron(null, { CRON_SECRET: "  " })).toEqual({ ok: false, status: 403 });
  });
  test("a missing or wrong bearer is 401 and the right one passes", () => {
    const env = { CRON_SECRET: "s3cret" };
    expect(authorizeCron(null, env)).toEqual({ ok: false, status: 401 });
    expect(authorizeCron("Basic s3cret", env)).toEqual({ ok: false, status: 401 });
    expect(authorizeCron("Bearer nope", env)).toEqual({ ok: false, status: 401 });
    expect(authorizeCron("Bearer s3cret", env)).toEqual({ ok: true });
    expect(authorizeCron("bearer  s3cret ", env)).toEqual({ ok: true });
  });
});

describe("runFraudJob", () => {
  const env = { CRON_SECRET: "s3cret" };
  test("refuses before touching the database when the secret is unset or wrong", async () => {
    const { runs, client } = fakeJobs();
    expect((await runFraudJob("fraud-x", req("Bearer s3cret"), async () => ({}), { env: {}, client })).status).toBe(403);
    expect((await runFraudJob("fraud-x", req("Bearer wrong"), async () => ({}), { env, client })).status).toBe(401);
    expect(runs.length).toBe(0);
  });
  test("a disabled job is ok with its detail, recorded running then ok", async () => {
    const { runs, client } = fakeJobs();
    const res = await runFraudJob("fraud-x", req("Bearer s3cret"), async () => ({ disabled: true }), { env, client });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, job: "fraud-x", detail: { disabled: true } });
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe("ok");
    expect(runs[0].detail).toEqual({ disabled: true });
    expect(runs[0].finishedAt).toBeInstanceOf(Date);
  });
  test("a throw ends the row as error, never stuck at running", async () => {
    const { runs, client } = fakeJobs();
    const res = await runFraudJob("fraud-x", req("Bearer s3cret"), async () => { throw new Error("db down"); }, { env, client });
    expect(res.status).toBe(500);
    expect(runs[0].status).toBe("error");
    expect(runs[0].detail).toEqual({ error: "db down" });
  });
});

describe("fraudy", () => {
  test("is off without its key", () => {
    expect(fraudyConfig({})).toBeNull();
    expect(fraudyConfig({ LOADOUT_FRAUDY_KEY: "k" })?.url).toBe("https://fraudy.hackclub.com/api/v1/check-ai");
    expect(fraudyConfig({ LOADOUT_FRAUDY_KEY: "k", LOADOUT_FRAUDY_URL: "http://evil.example" })).toBeNull();
  });
  test("asks nothing for an unset key, a non-integer id or no project", async () => {
    let calls = 0;
    const fetch = async () => { calls += 1; return new Response("{}"); };
    expect(await fraudyCheckAi(7, "p", { config: null, fetch })).toBeNull();
    const config = { url: "https://f.example/check", apiKey: "k" };
    expect(await fraudyCheckAi("abc", "p", { config, fetch })).toBeNull();
    expect(await fraudyCheckAi(7.5, "p", { config, fetch })).toBeNull();
    expect(await fraudyCheckAi(7, "", { config, fetch })).toBeNull();
    expect(calls).toBe(0);
  });
  test("sends the id and project with the bearer and reads the split", async () => {
    let seen: { auth: string | null; body: string } | null = null;
    const out = await fraudyCheckAi("42", "thing", {
      config: { url: "https://f.example/check", apiKey: "k" },
      fetch: async (_url, init) => {
        seen = { auth: new Headers(init?.headers).get("authorization"), body: String(init?.body) };
        return new Response(JSON.stringify({ human_seconds: 7200, ai_seconds: 3600, recommended_deflation_seconds: 1200 }));
      },
    });
    expect(out).toEqual({ humanSeconds: 7200, aiSeconds: 3600, deflationSeconds: 1200 });
    const sent = seen as { auth: string | null; body: string } | null;
    expect(sent!.auth).toBe("Bearer k");
    expect(JSON.parse(sent!.body)).toEqual({ hackatime_id: 42, project: "thing" });
  });
  test("an error answer or a thrown fetch means no numbers", async () => {
    const config = { url: "https://f.example/check", apiKey: "k" };
    expect(await fraudyCheckAi(1, "p", { config, fetch: async () => new Response("{}", { status: 500 }) })).toBeNull();
    expect(await fraudyCheckAi(1, "p", { config, fetch: async () => { throw new Error("x"); } })).toBeNull();
  });
  test("the human share is the score, and a clear majority of AI time flags", () => {
    expect(fraudyHours(5400)).toBe("1.5");
    const total = addChecks([{ humanSeconds: 3600, aiSeconds: 0, deflationSeconds: 0 }, { humanSeconds: 0, aiSeconds: 3600, deflationSeconds: 1200 }]);
    expect(verdictFromSplit(total)).toMatchObject({ status: "cleared", score: 50 });
    expect(FRAUDY_FLAG_BELOW_PCT).toBe(50);
    expect(verdictFromSplit({ humanSeconds: 1000, aiSeconds: 3000, deflationSeconds: 1000 })).toMatchObject({ status: "flagged", score: 25 });
    expect(verdictFromSplit({ humanSeconds: 0, aiSeconds: 0, deflationSeconds: 0 })).toBeNull();
  });
  test("the sweep is disabled without a key and never reads the database", async () => {
    const client = new Proxy({}, { get: () => { throw new Error("must not be used"); } });
    expect(await sweepFraudy({ env: {}, client: client as never })).toEqual({ disabled: true });
  });
});
