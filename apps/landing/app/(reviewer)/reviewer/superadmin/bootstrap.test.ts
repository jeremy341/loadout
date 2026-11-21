import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { db } from "@/lib/platform/db";
import { ADMIN_ROLE, mayImpersonate } from "@/lib/platform/impersonation";
import { bootstrapDecision, bootstrapSecret, grantAdmin, mayBootstrap, secretMatches } from "./bootstrap";

const SECRET = "correct-horse-battery-staple";
const signedIn = { id: "p1", hcaId: "hca_123" };
const envWith = (value: string) => ({ LOADOUT_SUPERADMIN_BOOTSTRAP_SECRET: value }) as unknown as NodeJS.ProcessEnv;

describe("bootstrapSecret (the environment switch)", () => {
  test("unset, empty and blank all mean the page does not exist", () => {
    expect(bootstrapSecret({})).toBeNull();
    expect(bootstrapSecret(envWith(""))).toBeNull();
    expect(bootstrapSecret(envWith("   "))).toBeNull();
  });

  test("a set value is returned trimmed", () => {
    expect(bootstrapSecret(envWith(` ${SECRET} `))).toBe(SECRET);
  });

  test("short, placeholder and repeated values are treated as off, with a loud warning that never echoes the value", () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      for (const value of ["short", "secret", "password", "changeme", "aaaaaaaaaaaaaaaa"]) {
        expect(bootstrapSecret(envWith(value))).toBeNull();
      }
      expect(warn).toHaveBeenCalled();
      expect(String(warn.mock.calls[0]?.[0])).toContain("DISABLED");
      for (const call of warn.mock.calls) expect(String(call[0])).not.toContain("aaaaaaaaaaaaaaaa");
    } finally {
      warn.mockRestore();
    }
  });

  test("a long random secret stays enabled and does not warn", () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(bootstrapSecret(envWith(SECRET))).toBe(SECRET);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe("secretMatches", () => {
  test("accepts only the exact secret", () => {
    expect(secretMatches(SECRET, SECRET)).toBe(true);
    expect(secretMatches(`${SECRET} `, SECRET)).toBe(false);
    expect(secretMatches(SECRET.toUpperCase(), SECRET)).toBe(false);
    expect(secretMatches("", SECRET)).toBe(false);
    expect(secretMatches(null, SECRET)).toBe(false);
    expect(secretMatches(undefined, SECRET)).toBe(false);
  });
});

describe("mayBootstrap (the shared secret is not enough)", () => {
  test("an owner or an existing admin may use it, a plain reviewer may not", () => {
    expect(mayBootstrap({ isOwner: true, roles: [] })).toBe(true);
    expect(mayBootstrap({ isOwner: false, roles: [ADMIN_ROLE] })).toBe(true);
    expect(mayBootstrap({ isOwner: false, roles: ["reviewer"] })).toBe(false);
    expect(mayBootstrap({ isOwner: false, roles: ["reviewer", ADMIN_ROLE] })).toBe(true);
  });
});

describe("bootstrapDecision (Stasis's order of refusals)", () => {
  test("switch off is a 404 whatever else is true", () => {
    expect(bootstrapDecision({ secret: null, person: signedIn, provided: SECRET })).toMatchObject({ ok: false, status: "not_found" });
  });

  test("nobody signed in is a 404", () => {
    expect(bootstrapDecision({ secret: SECRET, person: null, provided: SECRET })).toMatchObject({ ok: false, status: "not_found" });
  });

  test("no Hack Club Auth identity is forbidden, except for local test accounts", () => {
    const noHca = { id: "p1", hcaId: null };
    expect(bootstrapDecision({ secret: SECRET, person: noHca, provided: SECRET })).toMatchObject({ ok: false, status: "forbidden" });
    expect(bootstrapDecision({ secret: SECRET, person: noHca, provided: SECRET, hcaOptional: true })).toEqual({ ok: true });
  });

  test("a wrong secret is refused, the right one passes", () => {
    expect(bootstrapDecision({ secret: SECRET, person: signedIn, provided: "nope" })).toMatchObject({ ok: false, status: "wrong_secret" });
    expect(bootstrapDecision({ secret: SECRET, person: signedIn, provided: SECRET })).toEqual({ ok: true });
  });
});

const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let personId = "";

describe.skipIf(!process.env.DATABASE_URL)("grantAdmin", () => {
  beforeAll(async () => {
    const person = await db().person.create({
      data: { email: `boot-${RUN}@imp-test.example`, displayName: "Boot test", roles: { create: [{ role: "reviewer" }] } },
    });
    personId = person.id;
  });

  afterAll(async () => {
    await db().auditEvent.deleteMany({ where: { actorId: personId } });
    await db().person.deleteMany({ where: { id: personId } });
  });

  test("writes the admin RoleGrant and an audit event with before and after", async () => {
    expect(await grantAdmin(personId)).toEqual({ created: true });
    const grants = await db().roleGrant.findMany({ where: { personId }, orderBy: { role: "asc" } });
    expect(grants.map((grant) => grant.role)).toEqual([ADMIN_ROLE, "reviewer"]);

    const [event] = await db().auditEvent.findMany({ where: { actorId: personId, action: "superadmin.grant" } });
    expect(event).toMatchObject({ targetType: "Person", targetId: personId, reason: "Superadmin bootstrap." });
    expect(event.before).toEqual({ roles: ["reviewer"] });
    expect(event.after).toEqual({ roles: [ADMIN_ROLE, "reviewer"] });
  });

  test("a second call changes no grant but is audited again, as Stasis's is", async () => {
    expect(await grantAdmin(personId)).toEqual({ created: false });
    expect(await db().roleGrant.count({ where: { personId, role: ADMIN_ROLE } })).toBe(1);
    expect(await db().auditEvent.count({ where: { actorId: personId, action: "superadmin.grant" } })).toBe(2);
  });

  test("the grant is what opens impersonation, for a reviewer, and nothing more", () => {
    expect(mayImpersonate({ id: "x", email: "x@imp-test.example", roles: ["reviewer"] }, [])).toBe(false);
    expect(mayImpersonate({ id: "x", email: "x@imp-test.example", roles: ["reviewer", ADMIN_ROLE] }, [])).toBe(true);
  });
});
