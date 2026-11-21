import { describe, expect, test } from "bun:test";
import { keyView } from "../api-keys";
import {
  hoursFromMinutes,
  iso,
  serializeBuilder,
  serializeKey,
  serializeLeaderboardRow,
  serializeLedgerEntry,
  serializePublicJournal,
  serializePublicProject,
  serializeSelf,
  serializeSnapshot,
  serializeTrackLevel,
} from "./serializers";

const WHEN = new Date("2026-11-18T09:30:00.000Z");

// Values that must never reach a public response, whatever column they sit in.
const SECRETS = {
  email: "ada@example.test",
  birthday: "2011-05-04",
  hcaId: "hca_secret_123",
  slackId: "U0SECRETSLACK",
  bannedAt: WHEN,
  banReason: "private ban reason",
  address: "1 Secret Street",
  reviewNote: "the reviewer said something private about another builder",
  ore: 99999,
  hash: "f00dfeedcafebabe",
};

function noSecret(value: unknown): void {
  const text = JSON.stringify(value);
  for (const needle of [SECRETS.email, SECRETS.hcaId, SECRETS.slackId, SECRETS.banReason, SECRETS.address, SECRETS.hash, "2011-05-04"]) {
    expect(text).not.toContain(needle);
  }
}

describe("iso", () => {
  test("writes UTC ISO 8601 and copes with absent or bad dates", () => {
    expect(iso(WHEN)).toBe("2026-11-18T09:30:00.000Z");
    expect(iso("2026-11-18T09:30:00.000Z")).toBe("2026-11-18T09:30:00.000Z");
    expect(iso(null)).toBeNull();
    expect(iso(undefined)).toBeNull();
    expect(iso("not a date")).toBeNull();
  });
});

describe("hoursFromMinutes", () => {
  test("two decimals, never negative", () => {
    expect(hoursFromMinutes(90)).toBe(1.5);
    expect(hoursFromMinutes(100)).toBe(1.67);
    expect(hoursFromMinutes(-5)).toBe(0);
    expect(hoursFromMinutes(Number.NaN)).toBe(0);
  });
});

describe("serializeSelf", () => {
  test("has exactly the own public fields", () => {
    const out = serializeSelf({
      id: "c1",
      handle: "ada",
      displayName: "Ada",
      bio: "hi",
      createdAt: WHEN,
      statsVisible: true,
      ...SECRETS,
    } as Parameters<typeof serializeSelf>[0]);
    expect(Object.keys(out).sort()).toEqual(["bio", "displayName", "handle", "id", "joinedAt", "statsVisible"]);
    expect(out.joinedAt).toBe("2026-11-18T09:30:00.000Z");
    noSecret(out);
  });
});

describe("serializePublicProject", () => {
  const row = {
    id: "p1",
    title: "Robot arm",
    description: "A small arm",
    track: "Hardware",
    status: "in_review",
    approvedMinutes: 120,
    repoUrl: "https://github.com/ada/arm",
    demoUrl: null,
    createdAt: WHEN,
    owner: { handle: "ada" },
    ...SECRETS,
  } as Parameters<typeof serializePublicProject>[0];

  test("exact field list, status normalised, no review fields", () => {
    const out = serializePublicProject(row);
    expect(Object.keys(out).sort()).toEqual(
      ["approvedHours", "createdAt", "demoUrl", "description", "id", "ownerHandle", "repoUrl", "status", "title", "track"].sort(),
    );
    expect(out.status).toBe("in-review");
    expect(out.ownerHandle).toBe("ada");
    expect(out.approvedHours).toBe(2);
    noSecret(out);
    expect(JSON.stringify(out)).not.toContain("private about another builder");
  });
});

describe("serializePublicJournal", () => {
  test("drops reviewer fields and keeps the public body", () => {
    const out = serializePublicJournal({
      id: "j1",
      title: "Day one",
      body: "Soldered",
      hours: 2,
      status: "logged",
      createdAt: WHEN,
      updatedAt: WHEN,
      ...{ reviewAction: "partial", keptMinutes: 40, reviewReason: "private", lapseUrl: "https://lapse.example/x" },
    } as Parameters<typeof serializePublicJournal>[0]);
    expect(Object.keys(out).sort()).toEqual(["body", "createdAt", "hours", "id", "status", "title", "updatedAt"]);
    expect(JSON.stringify(out)).not.toContain("private");
    expect(JSON.stringify(out)).not.toContain("lapse");
  });
});

describe("serializeBuilder", () => {
  test("handle, bio and join date only", () => {
    const out = serializeBuilder({ handle: "ada", bio: null, createdAt: WHEN, ...SECRETS } as Parameters<typeof serializeBuilder>[0]);
    expect(Object.keys(out).sort()).toEqual(["bio", "handle", "joinedAt"]);
    noSecret(out);
  });
});

describe("serializeLedgerEntry", () => {
  test("own entry, no project title or other person, and no internal Desk id in the reason", () => {
    const out = serializeLedgerEntry({
      id: "l1",
      amountOre: 40,
      status: "confirmed",
      kind: "approved_hours",
      reason: "Approved: 2 new hours on Desk approve 1794869784110.",
      projectId: "p1",
      createdAt: WHEN,
      confirmedAt: null,
    });
    expect(out).toEqual({
      id: "l1",
      amountOre: 40,
      status: "confirmed",
      kind: "approved_hours",
      reason: "Approved: 2 new hours.",
      projectId: "p1",
      createdAt: "2026-11-18T09:30:00.000Z",
      confirmedAt: null,
    });
    expect(JSON.stringify(out)).not.toContain("Desk approve");
  });
});

describe("serializeTrackLevel", () => {
  test("keeps the level fields", () => {
    const out = serializeTrackLevel({
      track: "Tools",
      approvedHours: 30,
      level: 3,
      levelCap: 20,
      discountPercent: 1.7,
      hoursToNextLevel: 6,
    });
    expect(Object.keys(out).sort()).toEqual(["approvedHours", "discountPercent", "hoursToNextLevel", "level", "levelCap", "track"]);
  });
});

describe("serializeKey", () => {
  test("a key never carries its hash, even when the input row has one", () => {
    const row = {
      id: "k1",
      name: "Laptop",
      prefix: "ldk_abcd",
      scopes: ["profile", "hours"],
      createdAt: WHEN,
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
      hash: SECRETS.hash,
    };
    const out = serializeKey(keyView(row, WHEN));
    expect(Object.keys(out).sort()).toEqual(
      ["createdAt", "expiresAt", "id", "lastUsedAt", "name", "prefix", "revokedAt", "scopes", "status"].sort(),
    );
    expect(out.status).toBe("active");
    noSecret(out);
  });
});

describe("serializeSnapshot", () => {
  test("day as YYYY-MM-DD with the stored data", () => {
    const out = serializeSnapshot(new Date("2026-11-18T00:00:00.000Z"), "overview", { builders: 3 });
    expect(out).toEqual({ day: "2026-11-18", kind: "overview", data: { builders: 3 } });
  });
});

describe("serializeLeaderboardRow", () => {
  test("handle and hours only", () => {
    const out = serializeLeaderboardRow({ handle: "ada", seconds: 7200, ...SECRETS } as { handle: string; seconds: number });
    expect(out).toEqual({ handle: "ada", hours: 2 });
  });
});
