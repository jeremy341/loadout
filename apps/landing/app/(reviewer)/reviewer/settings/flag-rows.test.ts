import { afterAll, describe, expect, test } from "bun:test";
import { recordAudit } from "@/lib/platform/audit";
import { db } from "@/lib/platform/db";
import { createFlagReader, forgetFlag, KNOWN_FLAGS, writeFlag } from "@/lib/platform/flags";
import { mergeFlagRows } from "./flag-rows";

const AT = new Date("2026-11-19T10:00:00Z");

describe("mergeFlagRows", () => {
  test("a known flag with no stored row is off, never changed, with its code label", () => {
    const rows = mergeFlagRows([], { shop_voting: "Shop voting" });
    expect(rows).toEqual([{ name: "shop_voting", description: "Shop voting", enabled: false, updatedAt: null, known: true }]);
  });

  test("a stored row supplies the state, description and update time", () => {
    const rows = mergeFlagRows([{ name: "shop_voting", description: "Stored words", enabled: true, updatedAt: AT }], { shop_voting: "Shop voting" });
    expect(rows[0]).toEqual({ name: "shop_voting", description: "Stored words", enabled: true, updatedAt: AT.toISOString(), known: true });
  });

  test("a stored row the code no longer lists is kept, last and marked unknown", () => {
    const rows = mergeFlagRows([{ name: "old_flag", description: "Gone", enabled: true, updatedAt: AT }], { a: "A" });
    expect(rows.map((row) => [row.name, row.known])).toEqual([
      ["a", true],
      ["old_flag", false],
    ]);
  });

  test("lists every real known flag", () => {
    expect(mergeFlagRows([]).map((row) => row.name)).toEqual(Object.keys(KNOWN_FLAGS));
  });

  test("a stored row named after an inherited Object.prototype key is unknown, not toggleable", () => {
    const rows = mergeFlagRows(
      [{ name: "toString", description: "Inherited", enabled: true, updatedAt: AT }],
      { shop_voting: "Shop voting" },
    );
    expect(rows.map((row) => [row.name, row.known])).toEqual([
      ["shop_voting", true],
      ["toString", false],
    ]);
  });
});

// The toggle itself is setFlagState (lib/platform/actions.ts), whose owner check needs a Next request, so it is not run here. This
// runs the same writes it makes, in the same order, against the local database: the flag row and its audit event in one
// transaction, then the cache forgotten. It proves the audit shape the Flags section relies on, that the section's list shows the
// new state, and that forgetting makes a reader see the new value at once.
const NAME = "workshops" as const;
let before: { enabled: boolean } | null = null;
let actorId = "";

describe.skipIf(!process.env.DATABASE_URL)("flag toggle writes an audit event", () => {
  afterAll(async () => {
    if (actorId) {
      await db().auditEvent.deleteMany({ where: { actorId } });
      await db().person.deleteMany({ where: { id: actorId } });
    }
    if (before) await db().featureFlag.update({ where: { name: NAME }, data: { enabled: before.enabled } });
    else await db().featureFlag.deleteMany({ where: { name: NAME } });
  });

  test("row, audit event (before and after) and cache forget agree", async () => {
    const actor = await db().person.create({ data: { email: `flag-${Date.now().toString(36)}@imp-test.example`, displayName: "Flag test" } });
    actorId = actor.id;
    const existing = await db().featureFlag.findUnique({ where: { name: NAME } });
    before = existing ? { enabled: existing.enabled } : null;
    const target = !(existing?.enabled ?? false);

    await db().$transaction(async (tx) => {
      const old = await tx.featureFlag.findUnique({ where: { name: NAME } });
      await writeFlag(NAME, target, tx);
      await recordAudit(tx, {
        actorId: actor.id,
        action: "flag.set",
        targetType: "flag",
        targetId: NAME,
        reason: "Testing the flag admin section.",
        before: { enabled: old?.enabled ?? false },
        after: { enabled: target },
      });
    });
    forgetFlag(NAME);

    const [event] = await db().auditEvent.findMany({ where: { actorId: actor.id, action: "flag.set" } });
    expect(event.targetId).toBe(NAME);
    expect(event.before).toEqual({ enabled: !target });
    expect(event.after).toEqual({ enabled: target });

    const row = await db().featureFlag.findUnique({ where: { name: NAME } });
    expect(row?.enabled).toBe(target);
    const listed = mergeFlagRows(await db().featureFlag.findMany()).find((flag) => flag.name === NAME);
    expect(listed).toMatchObject({ enabled: target, known: true });

    // A reader that cached the old value serves it until forgotten; after forget it reads the new one.
    const clock = 0;
    const reader = createFlagReader(async () => (await db().featureFlag.findUnique({ where: { name: NAME } }))?.enabled ?? false, 30_000, () => clock);
    expect(await reader.isOn(NAME)).toBe(target);
    await db().featureFlag.update({ where: { name: NAME }, data: { enabled: !target } });
    expect(await reader.isOn(NAME)).toBe(target);
    reader.forget(NAME);
    expect(await reader.isOn(NAME)).toBe(!target);
  });
});
