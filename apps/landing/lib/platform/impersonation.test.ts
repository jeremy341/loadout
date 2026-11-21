import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "./db";
import {
  ADMIN_ROLE,
  endImpersonation,
  IMPERSONATION_MINUTES,
  impersonationExpiry,
  mayImpersonate,
  readImpersonation,
  startImpersonation,
  SUBJECT_REFUSAL_MESSAGE,
  subjectRefusal,
} from "./impersonation";
import { hashToken } from "./session";

const OWNERS = ["boss@imp-test.example"];
const person = (email: string, roles: string[]) => ({ id: email, email, roles });

describe("mayImpersonate (the owner's access matrix)", () => {
  test("an owner may", () => {
    expect(mayImpersonate(person("boss@imp-test.example", []), OWNERS)).toBe(true);
  });

  test("a plain reviewer may not, a reviewer holding the admin marker may", () => {
    expect(mayImpersonate(person("r@imp-test.example", ["reviewer"]), OWNERS)).toBe(false);
    expect(mayImpersonate(person("r@imp-test.example", ["reviewer", ADMIN_ROLE]), OWNERS)).toBe(true);
  });

  test("the admin marker alone opens nothing: it needs the reviewer role beside it", () => {
    expect(mayImpersonate(person("a@imp-test.example", [ADMIN_ROLE]), OWNERS)).toBe(false);
    expect(mayImpersonate(person("h@imp-test.example", ["helper", ADMIN_ROLE]), OWNERS)).toBe(false);
  });

  test("no_review takes the reviewer role away, admin marker or not", () => {
    expect(mayImpersonate(person("r@imp-test.example", ["reviewer", "no_review", ADMIN_ROLE]), OWNERS)).toBe(false);
  });

  test("a builder may not", () => {
    expect(mayImpersonate(person("b@imp-test.example", []), OWNERS)).toBe(false);
  });
});

describe("subjectRefusal", () => {
  const actor = person("boss@imp-test.example", []);
  const subject = (email: string, roles: string[] = [], bannedAt: Date | null = null) => ({ ...person(email, roles), bannedAt });

  test("refuses yourself, an owner, an admin and a banned account, with the specific reason kept internal", () => {
    const refusals = [
      subjectRefusal(actor, subject("boss@imp-test.example"), OWNERS),
      subjectRefusal(actor, { ...subject("other@imp-test.example"), id: "boss@imp-test.example" }, OWNERS),
      subjectRefusal(actor, subject("OWNER2@imp-test.example"), ["owner2@imp-test.example"]),
      subjectRefusal(actor, subject("x@imp-test.example", [ADMIN_ROLE]), OWNERS),
      subjectRefusal(actor, subject("y@imp-test.example", [], new Date()), OWNERS),
    ];
    const reasons = [/themselves/i, /themselves/i, /owner/i, /admin/i, /banned/i];
    refusals.forEach((refusal, i) => expect(refusal?.reason).toMatch(reasons[i]));
    // Every refusal yields exactly one generic message externally; none of the specific reasons leak into it.
    for (const refusal of refusals) expect(refusal?.message).toBe(SUBJECT_REFUSAL_MESSAGE);
    for (const refusal of refusals) expect(refusal?.message).not.toMatch(/yourself|owner|admin|banned/);
  });

  test("allows a builder, and a reviewer", () => {
    expect(subjectRefusal(actor, subject("b@imp-test.example"), OWNERS)).toBeNull();
    expect(subjectRefusal(actor, subject("r@imp-test.example", ["reviewer"]), OWNERS)).toBeNull();
  });
});

describe("impersonationExpiry", () => {
  test("lasts the one hour Stasis uses", () => {
    const now = new Date("2026-11-19T10:00:00Z");
    expect(impersonationExpiry(now).getTime() - now.getTime()).toBe(IMPERSONATION_MINUTES * 60_000);
    expect(IMPERSONATION_MINUTES).toBe(60);
  });
});

// The lifecycle runs against the local Postgres (bun test with DATABASE_URL from .env.local). Every person is created here under a
// unique run id and removed afterwards, with their audit rows, so the seed and other tests are untouched.
const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const email = (name: string) => `${name}-${RUN}@imp-test.example`;
const ids: Record<string, string> = {};
let savedOwners: string | undefined;

async function make(name: string, roles: string[], bannedAt: Date | null = null) {
  const created = await db().person.create({
    data: { email: email(name), displayName: `Imp ${name}`, bannedAt, roles: { create: roles.map((role) => ({ role })) } },
  });
  ids[name] = created.id;
  return created.id;
}

const audits = (action: string, actorId: string) => db().auditEvent.findMany({ where: { action, actorId }, orderBy: { createdAt: "asc" } });
const REASON = "Checking what the builder sees on the shop page.";

describe.skipIf(!process.env.DATABASE_URL)("impersonation lifecycle", () => {
  beforeAll(async () => {
    savedOwners = process.env.LOADOUT_OWNER_EMAILS;
    process.env.LOADOUT_OWNER_EMAILS = [email("owner"), email("owner2")].join(",");
    await make("owner", []);
    await make("owner2", []);
    await make("admin", ["reviewer", ADMIN_ROLE]);
    await make("admin2", ["reviewer", ADMIN_ROLE]);
    await make("reviewer", ["reviewer"]);
    await make("builder", []);
    await make("builder2", []);
    await make("banned", [], new Date());
  });

  afterAll(async () => {
    process.env.LOADOUT_OWNER_EMAILS = savedOwners;
    if (savedOwners === undefined) delete process.env.LOADOUT_OWNER_EMAILS;
    const all = Object.values(ids);
    await db().auditEvent.deleteMany({ where: { OR: [{ actorId: { in: all } }, { targetId: { in: all } }] } });
    await db().person.deleteMany({ where: { id: { in: all } } });
  });

  test("start issues a fresh subject session, an Impersonation row and an audit event", async () => {
    const started = await startImpersonation({ actorId: ids.owner, subjectId: ids.builder, reason: REASON });
    if (!started.ok) throw new Error(started.message);

    const hash = hashToken(started.token);
    const session = await db().session.findUnique({ where: { tokenHash: hash } });
    expect(session?.personId).toBe(ids.builder);
    expect(session?.expiresAt.getTime()).toBe(started.expiresAt.getTime());

    const row = await db().impersonation.findUnique({ where: { tokenHash: hash } });
    expect(row).toMatchObject({ id: started.impersonationId, actorId: ids.owner, subjectId: ids.builder, reason: REASON, endedAt: null });
    // The raw token is never stored, on the session or on the row.
    expect(JSON.stringify(row)).not.toContain(started.token);

    const [start] = await audits("impersonation.start", ids.owner);
    expect(start).toMatchObject({ targetType: "Person", targetId: ids.builder, reason: REASON });
    expect(start.after).toMatchObject({ impersonationId: started.impersonationId, subjectId: ids.builder });
    // The owner's own session was never touched: they hold none here, and no session exists for the owner now.
    expect(await db().session.count({ where: { personId: ids.owner } })).toBe(0);
  });

  test("the banner session works while open, then end revokes it, stamps endedAt and audits", async () => {
    const started = await startImpersonation({ actorId: ids.admin, subjectId: ids.builder2, reason: REASON });
    if (!started.ok) throw new Error(started.message);

    const active = await readImpersonation(started.token);
    expect(active?.subject.id).toBe(ids.builder2);
    expect(active?.actor).toEqual({ id: ids.admin, displayName: "Imp admin" });
    expect(await readImpersonation("not-the-token")).toBeNull();

    const endedAt = new Date();
    expect(await endImpersonation(started.token, endedAt)).toBe(true);
    const row = await db().impersonation.findUnique({ where: { id: started.impersonationId } });
    expect(row?.endedAt?.getTime()).toBe(endedAt.getTime());
    expect(await db().session.findUnique({ where: { tokenHash: hashToken(started.token) } })).toBeNull();
    expect(await readImpersonation(started.token)).toBeNull();

    const ends = await audits("impersonation.end", ids.admin);
    expect(ends).toHaveLength(1);
    expect(ends[0]).toMatchObject({ targetId: ids.builder2 });
    expect(ends[0].after).toMatchObject({ impersonationId: started.impersonationId });

    // Ending twice is a quiet no-op and writes nothing more.
    expect(await endImpersonation(started.token)).toBe(false);
    expect(await audits("impersonation.end", ids.admin)).toHaveLength(1);
  });

  test("guard rails: yourself, an owner, an admin, a banned account, a missing person", async () => {
    const before = await db().impersonation.count({ where: { actorId: ids.owner } });
    const refusals = [
      { subjectId: ids.owner, reason: /yourself/i },
      { subjectId: ids.owner2, reason: /owner/i },
      { subjectId: ids.admin, reason: /admin/i },
      { subjectId: ids.banned, reason: /banned/i },
    ];
    for (const { subjectId } of refusals) {
      const result = await startImpersonation({ actorId: ids.owner, subjectId, reason: REASON });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toBe(SUBJECT_REFUSAL_MESSAGE);
    }
    // The specific reason lives only in the audit row; the page could only ever show the generic message above.
    const rows = await db().auditEvent.findMany({
      where: { actorId: ids.owner, action: "impersonation.refused", targetId: { in: refusals.map((r) => r.subjectId) } },
    });
    for (const { subjectId, reason } of refusals) {
      expect(rows.find((row) => row.targetId === subjectId)?.reason).toMatch(reason);
    }
    const missing = await startImpersonation({ actorId: ids.owner, subjectId: "no-such-person", reason: REASON });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.message).toMatch(/no account/);
    expect(await db().impersonation.count({ where: { actorId: ids.owner } })).toBe(before);
  });

  test("an admin may not act as another admin either", async () => {
    const result = await startImpersonation({ actorId: ids.admin, subjectId: ids.admin2, reason: REASON });
    expect(result.ok).toBe(false);
  });

  test("a reviewer without the admin marker, and a builder, may not start one", async () => {
    for (const actorId of [ids.reviewer, ids.builder]) {
      const result = await startImpersonation({ actorId, subjectId: ids.builder2, reason: REASON });
      expect(result).toEqual({ ok: false, message: expect.stringMatching(/owner or admin/) });
    }
    expect(await db().impersonation.count({ where: { actorId: { in: [ids.reviewer, ids.builder] } } })).toBe(0);
  });

  test("a reason is required, and nothing is written without one", async () => {
    const before = await db().session.count({ where: { personId: ids.builder } });
    for (const reason of ["", "short", "   ", undefined]) {
      const result = await startImpersonation({ actorId: ids.owner, subjectId: ids.builder, reason });
      expect(result.ok).toBe(false);
    }
    expect(await db().session.count({ where: { personId: ids.builder } })).toBe(before);
  });

  test("starting again closes the staff member's earlier impersonation, so only one is open", async () => {
    const first = await startImpersonation({ actorId: ids.owner, subjectId: ids.builder, reason: REASON });
    const second = await startImpersonation({ actorId: ids.owner, subjectId: ids.builder2, reason: REASON });
    if (!first.ok || !second.ok) throw new Error("start failed");
    expect(await readImpersonation(first.token)).toBeNull();
    expect((await readImpersonation(second.token))?.subject.id).toBe(ids.builder2);
    const open = await db().impersonation.findMany({ where: { actorId: ids.owner, endedAt: null } });
    expect(open.map((row) => row.id)).toEqual([second.impersonationId]);
    await endImpersonation(second.token);
  });

  test("the unique tokenHash index refuses a second row for the same token", async () => {
    const started = await startImpersonation({ actorId: ids.owner, subjectId: ids.builder, reason: REASON });
    if (!started.ok) throw new Error("start failed");
    // Caught by hand: bun's rejects matcher hangs trying to print Prisma's error object.
    let refused = false;
    try {
      await db().impersonation.create({
        data: { actorId: ids.owner, subjectId: ids.builder2, tokenHash: hashToken(started.token), reason: REASON },
      });
    } catch {
      refused = true;
    }
    expect(refused).toBe(true);
    await endImpersonation(started.token);
  });

  test("it stops working when the session lapses, the staff member loses the gate, or the subject is promoted", async () => {
    // Lapsed session.
    const lapsed = await startImpersonation({ actorId: ids.owner, subjectId: ids.builder, reason: REASON });
    if (!lapsed.ok) throw new Error("start failed");
    expect(await readImpersonation(lapsed.token, new Date(lapsed.expiresAt.getTime() + 1))).toBeNull();
    // An expired but unclosed impersonation is still closed (and audited) when the banner's End is pressed.
    expect(await endImpersonation(lapsed.token, new Date(lapsed.expiresAt.getTime() + 1))).toBe(true);

    // The admin marker is revoked mid-way.
    const gate = await startImpersonation({ actorId: ids.admin, subjectId: ids.builder, reason: REASON });
    if (!gate.ok) throw new Error("start failed");
    expect(await readImpersonation(gate.token)).not.toBeNull();
    await db().roleGrant.delete({ where: { personId_role: { personId: ids.admin, role: ADMIN_ROLE } } });
    expect(await readImpersonation(gate.token)).toBeNull();
    await db().roleGrant.create({ data: { personId: ids.admin, role: ADMIN_ROLE } });

    // The subject is made an admin after the impersonation began.
    const promoted = await startImpersonation({ actorId: ids.owner, subjectId: ids.builder2, reason: REASON });
    if (!promoted.ok) throw new Error("start failed");
    await db().roleGrant.create({ data: { personId: ids.builder2, role: ADMIN_ROLE } });
    expect(await readImpersonation(promoted.token)).toBeNull();
    await db().roleGrant.delete({ where: { personId_role: { personId: ids.builder2, role: ADMIN_ROLE } } });
  });
});
