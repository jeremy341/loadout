import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db } from "@/lib/platform/db";
import { persistTeamRoleChange } from "./people-data";

const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let personId = "";

describe.skipIf(!process.env.DATABASE_URL)("persistTeamRoleChange", () => {
  beforeAll(async () => {
    const person = await db().person.create({
      data: {
        email: `team-${RUN}@role-test.example`,
        displayName: "Role test",
        roles: { create: [{ role: "reviewer" }, { role: "helper" }] },
      },
    });
    personId = person.id;
  });

  afterAll(async () => {
    await db().auditEvent.deleteMany({ where: { targetId: personId } });
    await db().person.deleteMany({ where: { id: personId } });
  });

  test("a removal writes the RoleGrant delta and an audit row, leaving unrelated grants alone", async () => {
    const result = await persistTeamRoleChange({
      personKey: personId,
      before: ["review"],
      after: [],
      actorId: "actor-1",
      reason: "Removed from the review team.",
    });
    expect(result?.id).toBe(personId);

    const roles = (await db().roleGrant.findMany({ where: { personId }, select: { role: true } }))
      .map((grant) => grant.role)
      .sort();
    expect(roles).toEqual(["helper"]);

    const [event] = await db().auditEvent.findMany({ where: { targetId: personId, action: "team.role.change" } });
    expect(event).toMatchObject({ targetType: "Person", targetId: personId, reason: "Removed from the review team." });
    expect(event.before).toEqual({ roles: ["reviewer"] });
    expect(event.after).toEqual({ roles: [] });
  });

  test("adding the same grant twice leaves one RoleGrant row", async () => {
    for (let i = 0; i < 2; i += 1) {
      await persistTeamRoleChange({ personKey: personId, before: [], after: ["review"], actorId: "actor-1" });
    }
    expect(await db().roleGrant.count({ where: { personId, role: "reviewer" } })).toBe(1);
  });

  test("a real person handle resolves to the Person, not a display-name slug", async () => {
    const handle = `role-${RUN}`;
    const person = await db().person.create({
      data: { email: `byname-${RUN}@role-test.example`, displayName: "By handle", handle },
    });
    try {
      const result = await persistTeamRoleChange({ personKey: handle, before: [], after: ["review"], actorId: "actor-1" });
      expect(result?.id).toBe(person.id);
      expect(await db().roleGrant.count({ where: { personId: person.id, role: "reviewer" } })).toBe(1);
    } finally {
      await db().auditEvent.deleteMany({ where: { targetId: person.id } });
      await db().person.deleteMany({ where: { id: person.id } });
    }
  });
});
