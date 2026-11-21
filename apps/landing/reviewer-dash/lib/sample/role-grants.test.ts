import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { FULL_QUEUE, HELPER, FULFILLER, REVIEWER, SECOND_PASS } from "@/lib/reviewer/access";
import { db } from "@/lib/platform/db";
import { persistTeamRoleChange } from "./people-data";
import {
  emailForHandle,
  personKeyFor,
  roleDelta,
  roleKeysForLog,
  rolesAfterTeamLog,
  type TeamLogEntry,
} from "./role-grants";

const KEY = "reviewer@loadout.test";
const SINCE = Date.parse("2026-11-20T10:00:00Z");
const at = (ms: number) => new Date(ms).toISOString();
const entry = (over: Partial<TeamLogEntry> = {}): TeamLogEntry => ({
  slack_id: "tamsin",
  person_key: KEY,
  action: "updated",
  before: [],
  after: [],
  created_at: at(SINCE + 1000),
  ...over,
});

describe("rolesAfterTeamLog", () => {
  test("the newest change wins: a revocation is not undone by an older grant", () => {
    const entries = [
      entry({ created_at: at(SINCE + 2000), before: ["review"], after: [] }),
      entry({ created_at: at(SINCE + 1000), before: [], after: ["review"] }),
    ];
    expect(rolesAfterTeamLog(KEY, [REVIEWER], entries, SINCE)).not.toContain(REVIEWER);

    const readded = [
      entry({ created_at: at(SINCE + 2000), before: [], after: ["review"] }),
      entry({ created_at: at(SINCE + 1000), before: ["review"], after: [] }),
    ];
    expect(rolesAfterTeamLog(KEY, [], readded, SINCE)).toContain(REVIEWER);
  });

  test("equal stamps still revoke: the newest (unshifted) row wins even without a usable timestamp order", () => {
    const same = at(SINCE + 1000);
    const entries = [
      entry({ created_at: same, before: ["review"], after: [] }),
      entry({ created_at: same, before: [], after: ["review"] }),
    ];
    expect(rolesAfterTeamLog(KEY, [REVIEWER], entries, SINCE)).not.toContain(REVIEWER);
  });

  test("helper and fulfiller flips obey the same newest-wins rule", () => {
    const helper = [
      entry({ created_at: at(SINCE + 2000), before: ["helper"], after: [] }),
      entry({ created_at: at(SINCE + 1000), before: [], after: ["helper"] }),
    ];
    expect(rolesAfterTeamLog(KEY, [HELPER], helper, SINCE)).not.toContain(HELPER);
    const fulfiller = [
      entry({ created_at: at(SINCE + 1000), before: [], after: ["fulfiller"] }),
      entry({ created_at: at(SINCE + 2000), before: [], after: ["fulfiller"] }),
    ];
    expect(rolesAfterTeamLog(KEY, [], fulfiller, SINCE)).toContain(FULFILLER);
  });

  test("other people and rows older than the cutoff are ignored", () => {
    const entries = [
      entry({ person_key: "someone-else@loadout.test", created_at: at(SINCE + 2000), after: ["review"] }),
      entry({ created_at: at(SINCE - 1000), after: ["review"] }),
    ];
    expect(rolesAfterTeamLog(KEY, [], entries, SINCE)).toEqual([]);
  });

  test("a legacy row keyed only by handle is found by that handle, not by a display-name slug", () => {
    const legacy = entry({ person_key: null, slack_id: "tamsin", after: ["review"] });
    expect(rolesAfterTeamLog("tamsin", [], [legacy], SINCE)).toContain(REVIEWER);
    expect(rolesAfterTeamLog("Test reviewer", [], [legacy], SINCE)).toEqual([]);
    expect(rolesAfterTeamLog(KEY, [], [legacy], SINCE)).toEqual([]);
  });
});

describe("stable person keys", () => {
  test("sample handles map to the same email the viewer side uses", () => {
    expect(personKeyFor("tamsin")).toBe(KEY);
    expect(personKeyFor(" Reviewer@Loadout.Test ")).toBe(KEY);
    expect(personKeyFor("some-real-handle")).toBe("some-real-handle");
    expect(emailForHandle("tamsin")).toBe(KEY);
    expect(emailForHandle("not-a-handle")).toBeNull();
  });
});

describe("persisting a change to RoleGrant", () => {
  test("Pixl permissions and already-LOADOUT roles become RoleGrant values once", () => {
    expect(roleKeysForLog(["review", "second_pass", "full_queue", "helper", "bogus"])).toEqual([
      REVIEWER,
      SECOND_PASS,
      FULL_QUEUE,
      HELPER,
    ]);
    expect(roleKeysForLog(["review", "reviewer"])).toEqual([REVIEWER]);
  });

  test("only the changed grants are written, so an unrelated grant survives", () => {
    expect(roleDelta(["review", "second_pass"], ["review"])).toEqual({ add: [], remove: [SECOND_PASS] });
    expect(roleDelta([], ["review"])).toEqual({ add: [REVIEWER], remove: [] });
    expect(roleDelta(["review"], ["reviewer"])).toEqual({ add: [], remove: [] });
  });
});

// The overlay is immediate; these rows are what survives a restart. Written in one transaction with an audit row carrying a
// reason of at least ten characters (actions-people.ts passes it through checkReason first).
const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let changedPersonId = "";

describe.skipIf(!process.env.DATABASE_URL)("persisting a team change to RoleGrant", () => {
  beforeAll(async () => {
    const person = await db().person.create({
      data: { email: `team-change-${RUN}@imp-test.example`, displayName: "Team change test" },
    });
    changedPersonId = person.id;
  });

  afterAll(async () => {
    if (!changedPersonId) return;
    await db().auditEvent.deleteMany({ where: { targetId: changedPersonId } });
    await db().roleGrant.deleteMany({ where: { personId: changedPersonId } });
    await db().person.deleteMany({ where: { id: changedPersonId } });
  });

  test("writes only the delta and one audit row with the written reason", async () => {
    const reason = "Promoted to final reviewer.";
    const person = await persistTeamRoleChange({
      personKey: changedPersonId,
      before: [],
      after: ["review", "second_pass"],
      actorId: changedPersonId,
      reason,
      action: "team.role.change",
    });
    expect(person?.id).toBe(changedPersonId);
    const grants = await db().roleGrant.findMany({ where: { personId: changedPersonId }, orderBy: { role: "asc" } });
    expect(grants.map((grant) => grant.role)).toEqual(["reviewer", "second_pass"]);
    const events = await db().auditEvent.findMany({ where: { targetId: changedPersonId, action: "team.role.change" } });
    expect(events).toHaveLength(1);
    expect(events[0]?.reason).toBe(reason);
  });
});
