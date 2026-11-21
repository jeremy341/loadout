import { describe, expect, test } from "bun:test";
import { join } from "path";
import {
  canCancelErasure,
  canRequestErasure,
  ERASURE_DELAY_DAYS,
  ERASURE_KEPT_MODELS,
  ERASURE_REMOVED_MODELS,
  erasureScheduledFor,
  exportEnvelope,
  EXPORT_FORMAT,
  EXPORT_VERSION,
  planErasure,
  toExportJson,
} from "./privacy";

const SCHEMA = join(import.meta.dir, "..", "..", "prisma", "schema.prisma");

// Splits the schema into model name -> body lines.
async function modelBodies(): Promise<Map<string, string[]>> {
  const text = (await Bun.file(SCHEMA).text()).replace(/\r/g, "");
  const out = new Map<string, string[]>();
  for (const chunk of text.split(/^model /m).slice(1)) {
    const name = chunk.split(/\s/)[0];
    const body = chunk.split("\n}")[0].split("\n").slice(1);
    out.set(name, body);
  }
  return out;
}

// A relation to Person that cascades on delete: the model's row goes with the person.
function cascadesFromPerson(body: string[]): boolean {
  return body.some((line) => /^\s+\w+\s+Person\b/.test(line) && /onDelete: Cascade/.test(line));
}

// Plain text columns that hold a person id, with no foreign key.
const PERSON_ID_COLUMN = /^\s+(personId|actorId|bannedById|liftedById|proposedById|decidedById|reviewerId|invitedById|authorId|fulfillerId|addedById|assignedTo|claimedBy|firstPassBy|heldBy|triageBy)\s+String/;

const NOW = new Date("2026-11-18T09:00:00.000Z");

describe("erasureScheduledFor", () => {
  test("seven days after the request", () => {
    expect(ERASURE_DELAY_DAYS).toBe(7);
    expect(erasureScheduledFor(NOW).toISOString()).toBe("2026-11-25T09:00:00.000Z");
  });
});

describe("canRequestErasure and canCancelErasure", () => {
  test("a second request is refused while one is open", () => {
    expect(canRequestErasure([])).toBe(true);
    expect(canRequestErasure(["cancelled", "done"])).toBe(true);
    expect(canRequestErasure(["requested"])).toBe(false);
  });

  test("only an open request can be cancelled", () => {
    expect(canCancelErasure("requested")).toBe(true);
    expect(canCancelErasure("cancelled")).toBe(false);
    expect(canCancelErasure("done")).toBe(false);
    expect(canCancelErasure(null)).toBe(false);
    expect(canCancelErasure(undefined)).toBe(false);
  });
});

describe("planErasure", () => {
  test("names the person, the removed and kept lists, and that keys are revoked", () => {
    const plan = planErasure("c123");
    expect(plan.personId).toBe("c123");
    expect(plan.revokesKeys).toBe(true);
    expect(plan.removed).toContain("Project");
    expect(plan.removed).toContain("LedgerEntry");
    expect(plan.kept).toContain("AuditEvent");
  });

  test("no model is both removed and kept", () => {
    const removed = new Set(ERASURE_REMOVED_MODELS);
    expect(ERASURE_KEPT_MODELS.filter((m) => removed.has(m))).toEqual([]);
  });

  test("the removed list is exactly the models that cascade from Person in the schema", async () => {
    const bodies = await modelBodies();
    const cascade = [...bodies.entries()].filter(([, body]) => cascadesFromPerson(body)).map(([name]) => name).sort();
    expect([...ERASURE_REMOVED_MODELS].sort()).toEqual(cascade);
  });

  test("every model that holds a plain person id is listed as removed or kept", async () => {
    const bodies = await modelBodies();
    const removed = new Set(ERASURE_REMOVED_MODELS);
    const kept = new Set(ERASURE_KEPT_MODELS);
    const unlisted: string[] = [];
    for (const [name, body] of bodies) {
      if (!body.some((line) => PERSON_ID_COLUMN.test(line))) continue;
      if (!removed.has(name) && !kept.has(name)) unlisted.push(name);
    }
    expect(unlisted).toEqual([]);
  });

  test("the kept list only names models that exist", async () => {
    const bodies = await modelBodies();
    for (const name of ERASURE_KEPT_MODELS) expect(bodies.has(name)).toBe(true);
    for (const name of ERASURE_REMOVED_MODELS) expect(bodies.has(name)).toBe(true);
  });
});

describe("toExportJson", () => {
  test("Dates become ISO strings, invalid dates null, undefined keys dropped, bigint a number", () => {
    const out = toExportJson({
      when: new Date("2026-11-18T09:00:00.000Z"),
      bad: new Date("nope"),
      gone: undefined,
      nested: [{ at: new Date("2026-01-01T00:00:00.000Z"), n: BigInt(7) }],
      nothing: null,
    });
    expect(out).toEqual({
      when: "2026-11-18T09:00:00.000Z",
      bad: null,
      nested: [{ at: "2026-01-01T00:00:00.000Z", n: 7 }],
      nothing: null,
    });
  });

  test("a value with no JSON form becomes null", () => {
    expect(toExportJson(undefined)).toBeNull();
  });
});

describe("exportEnvelope", () => {
  test("names the format, the version and the time, then the parts", () => {
    const out = exportEnvelope({ profile: { handle: "ada" }, when: new Date("2026-11-18T09:00:00.000Z") }, NOW);
    expect(out.format).toBe(EXPORT_FORMAT);
    expect(out.version).toBe(EXPORT_VERSION);
    expect(out.exportedAt).toBe("2026-11-18T09:00:00.000Z");
    expect(out.profile).toEqual({ handle: "ada" });
    expect(out.when).toBe("2026-11-18T09:00:00.000Z");
  });

  test("a part cannot overwrite the envelope fields", () => {
    const out = exportEnvelope({ format: "other", version: 9 }, NOW);
    expect(out.format).toBe(EXPORT_FORMAT);
    expect(out.version).toBe(EXPORT_VERSION);
  });
});
