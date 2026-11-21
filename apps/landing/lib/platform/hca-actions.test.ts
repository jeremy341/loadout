import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { attemptExpiry, sha256, type HcaIdentity } from "./hca";

const T0 = new Date("2026-11-20T12:00:00.000Z");

type AttemptRow = { state: string; nonceHash: string; expiresAt: Date };
type PersonRow = { id: string; hcaId: string | null; bannedAt: Date | null };

// In-memory stand-ins for the two tables these actions touch. The fake $queryRaw behaves like the database: it only returns a
// LoginAttempt row when BOTH the state and the nonce in the DELETE match, and it only returns one row once.
const attempts = new Map<string, AttemptRow>();
const hits = new Map<string, number>();
let personByHcaId: PersonRow | null = null;
let personByEmail: PersonRow | null = null;
let bannedAtAfter: Date | null = null;
let openBans: Array<{ id: string; liftedAt: Date | null; expiresAt: Date | null }> = [];
let updateManyCount = 1;
let transactions = 0;
const linkWhere: Array<Record<string, unknown>> = [];

const fakePrisma = {
  $transaction: async (fn: (tx: typeof fakePrisma) => Promise<unknown>) => {
    transactions++;
    return fn(fakePrisma);
  },
  $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.join(" ");
    if (sql.includes("DELETE FROM \"LoginAttempt\"")) {
      expect(sql).toContain("RETURNING");
      expect(sql).toContain("\"nonceHash\"");
      const [stateHash, nonceHash] = values as [string, string | null];
      const row = attempts.get(stateHash);
      if (!row || row.nonceHash !== nonceHash) return [];
      attempts.delete(stateHash);
      return [{ state: row.state, nonceHash: row.nonceHash, expiresAt: row.expiresAt }];
    }
    if (sql.includes("INSERT INTO \"RateLimitHit\"")) {
      const key = `${String(values[0])}:${values[1] instanceof Date ? values[1].getTime() : Number(values[1])}`;
      const count = (hits.get(key) ?? 0) + 1;
      hits.set(key, count);
      return [{ count }];
    }
    throw new Error(`Unexpected raw query: ${sql}`);
  },
  loginAttempt: {
    deleteMany: async () => ({ count: 0 }),
    create: async ({ data }: { data: AttemptRow }) => {
      attempts.set(data.state, data);
      return data;
    },
  },
  person: {
    findUnique: async ({ where }: { where: Record<string, unknown> }) => {
      if ("hcaId" in where) return personByHcaId;
      if ("email" in where) return personByEmail;
      if ("id" in where) return { id: where.id as string, bannedAt: bannedAtAfter };
      return null;
    },
    updateMany: async (args: { where: Record<string, unknown> }) => {
      // releaseExpiredBan clears the flag through its own updateMany; the link update has the hcaId/email conditions.
      if (args.where.bannedAt && typeof args.where.bannedAt === "object") {
        bannedAtAfter = null;
        return { count: 1 };
      }
      linkWhere.push(args.where);
      return { count: updateManyCount };
    },
    update: async () => ({}),
    create: async () => ({ id: "new-person" }),
  },
  ban: {
    findMany: async () => openBans,
  },
  auditEvent: {
    create: async () => ({}),
  },
};

// db() caches its client on globalThis, so seeding that cache and a dummy DATABASE_URL gives the real modules a fake client
// without replacing any module: other test files keep their real imports.
const globalForDb = globalThis as unknown as { loadoutDbClientReview?: unknown };
const savedEnv = { ...process.env };
const savedClient = globalForDb.loadoutDbClientReview;
process.env.DATABASE_URL = "postgres://unused@localhost/loadout";
globalForDb.loadoutDbClientReview = fakePrisma;

const { setClientForTests } = await import("./db");
const { consumeAttempt, bindIdentity } = await import("./hca-actions");
const { GET } = await import("../../app/api/auth/hackclub/start/route");

afterAll(() => {
  for (const key of ["DATABASE_URL", "HCA_CLIENT_ID", "LOADOUT_TRUST_PROXY"] as const) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  if (savedClient === undefined) delete globalForDb.loadoutDbClientReview;
  else globalForDb.loadoutDbClientReview = savedClient;
  setClientForTests(undefined);
});

// Re-establish the fake client before every case: the runner shares globalThis across test files,
// and another file can replace the cached client between this file's cases.
beforeEach(() => {
  process.env.DATABASE_URL = "postgres://unused@localhost/loadout";
  globalForDb.loadoutDbClientReview = fakePrisma;
  setClientForTests(fakePrisma as never);
});

const startRequest = (ip: string) =>
  new Request("https://loadout.test/api/auth/hackclub/start", { headers: { "x-forwarded-for": ip } });

describe("consumeAttempt", () => {
  beforeEach(() => {
    attempts.clear();
  });

  test("validates the nonce in the atomic delete: a leaked state cannot consume the real attempt", async () => {
    const state = "leaked-state";
    const nonce = "right-nonce";
    attempts.set(sha256(state), { state: sha256(state), nonceHash: sha256(nonce), expiresAt: attemptExpiry(T0) });

    expect(await consumeAttempt(state, "wrong-nonce", T0)).toEqual({ ok: false, error: "invalid_state" });
    // The wrong nonce matched no row, so the real browser still has a live attempt.
    expect(attempts.size).toBe(1);
    expect(await consumeAttempt(state, nonce, T0)).toEqual({ ok: true });
    expect(attempts.size).toBe(0);
    // A second callback on the same state+nonce gets nothing: the first DELETE consumed the row.
    expect(await consumeAttempt(state, nonce, T0)).toEqual({ ok: false, error: "invalid_state" });
  });

  test("expired attempts are consumed and reported, unknown state and missing nonce are invalid", async () => {
    const state = "old-state";
    const nonce = "nonce";
    attempts.set(sha256(state), { state: sha256(state), nonceHash: sha256(nonce), expiresAt: new Date(T0.getTime() - 1) });
    expect(await consumeAttempt(state, nonce, T0)).toEqual({ ok: false, error: "expired_state" });
    expect(attempts.size).toBe(0);

    expect(await consumeAttempt("never-seen", nonce, T0)).toEqual({ ok: false, error: "invalid_state" });

    attempts.set(sha256(state), { state: sha256(state), nonceHash: sha256(nonce), expiresAt: attemptExpiry(T0) });
    expect(await consumeAttempt(state, null, T0)).toEqual({ ok: false, error: "invalid_state" });
    expect(attempts.size).toBe(1);
  });
});

const identity = (overrides: Partial<HcaIdentity> = {}): HcaIdentity => ({
  id: "hca-1",
  email: "a@b.org",
  displayName: "A",
  birthday: null,
  verificationStatus: null,
  slackId: null,
  ...overrides,
});

describe("bindIdentity", () => {
  beforeEach(() => {
    personByHcaId = null;
    personByEmail = null;
    bannedAtAfter = null;
    openBans = [];
    updateManyCount = 1;
    transactions = 0;
    linkWhere.length = 0;
  });

  test("links in a transaction with a conditional update on hcaId, bannedAt and email", async () => {
    personByEmail = { id: "p1", hcaId: null, bannedAt: null };
    expect(await bindIdentity(identity(), T0)).toEqual({ personId: "p1" });
    expect(transactions).toBe(1);
    expect(linkWhere).toHaveLength(1);
    expect(linkWhere[0]).toMatchObject({ id: "p1", hcaId: null, bannedAt: null, email: "a@b.org" });
  });

  test("refuses a concurrent link that changed the row instead of overwriting it", async () => {
    personByEmail = { id: "p1", hcaId: null, bannedAt: null };
    updateManyCount = 0;
    expect(await bindIdentity(identity(), T0)).toEqual({ error: "server_error" });
  });

  test("an active ban refuses sign-in; an expired one is released before binding", async () => {
    const bannedAt = new Date("2026-11-01T00:00:00Z");
    personByEmail = { id: "p1", hcaId: null, bannedAt };
    bannedAtAfter = bannedAt;
    openBans = [{ id: "ban-1", liftedAt: null, expiresAt: new Date("2026-12-01T00:00:00Z") }];
    expect(await bindIdentity(identity(), T0)).toEqual({ error: "account_closed" });
    expect(linkWhere).toHaveLength(0);

    openBans = [{ id: "ban-1", liftedAt: null, expiresAt: new Date("2026-11-02T00:00:00Z") }];
    expect(await bindIdentity(identity(), T0)).toEqual({ personId: "p1" });
    expect(linkWhere).toHaveLength(1);
  });

  test("re-checks bannedAt inside the transaction before handing back a person id", async () => {
    personByHcaId = { id: "p2", hcaId: "hca-1", bannedAt: null };
    bannedAtAfter = new Date("2026-11-19T00:00:00Z");
    expect(await bindIdentity(identity(), T0)).toEqual({ error: "account_closed" });
  });

  test("creates a person when nothing matches", async () => {
    expect(await bindIdentity(identity(), T0)).toEqual({ personId: "new-person" });
  });
});

describe("hackclub start route", () => {
  beforeEach(() => {
    hits.clear();
    attempts.clear();
    process.env.HCA_CLIENT_ID = "test-client";
    process.env.LOADOUT_TRUST_PROXY = "true";
  });

  test("applies the DB rate limiter before startAttempt and returns 429 with rate-limit headers", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await GET(startRequest("203.0.113.7"))).status).toBe(303);
    }
    const limited = await GET(startRequest("203.0.113.7"));
    // A throttled sign-in is a browser navigation, so it gets the friendly sign-in error page rather than raw JSON.
    expect(limited.status).toBe(303);
    expect(limited.headers.get("location")).toContain("error=throttled");
    expect(limited.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(limited.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(limited.headers.get("Retry-After")).toBeTruthy();
    // The rejected request never called startAttempt: only the ten allowed ones wrote LoginAttempt rows.
    expect(attempts.size).toBe(10);
  });
});
