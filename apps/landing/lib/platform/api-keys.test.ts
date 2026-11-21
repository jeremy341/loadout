import { describe, expect, test } from "bun:test";
import {
  API_SCOPES,
  KEY_PREFIX,
  canCreateKey,
  checkExpiry,
  checkKeyName,
  checkScopes,
  accountBlock,
  generateKey,
  hasScope,
  hashKey,
  keyStatus,
  keyView,
  parseBearer,
  sameHash,
  touchDue,
} from "./api-keys";

const NOW = new Date("2026-11-18T12:00:00.000Z");
const DAY = 86_400_000;

describe("generateKey", () => {
  test("makes ldk_ plus 43 base64url characters", () => {
    const key = generateKey(new Uint8Array(32).fill(7));
    expect(key.plaintext.startsWith(KEY_PREFIX)).toBe(true);
    expect(key.plaintext).toMatch(/^ldk_[A-Za-z0-9_-]{43}$/);
  });

  test("stores only a sha256 hex digest and an 8 character display prefix", () => {
    const key = generateKey(new Uint8Array(32).fill(9));
    expect(key.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(key.hash).toBe(hashKey(key.plaintext));
    expect(key.prefix).toBe(key.plaintext.slice(0, 8));
    expect(key.prefix.length).toBe(8);
    expect(key.hash).not.toContain(key.plaintext);
  });

  test("the same bytes give the same key, different bytes a different key", () => {
    const a = generateKey(new Uint8Array(32).fill(1));
    const b = generateKey(new Uint8Array(32).fill(1));
    const c = generateKey(new Uint8Array(32).fill(2));
    expect(a.plaintext).toBe(b.plaintext);
    expect(a.plaintext).not.toBe(c.plaintext);
  });

  test("random keys differ", () => {
    expect(generateKey().plaintext).not.toBe(generateKey().plaintext);
  });

  test("refuses bytes of the wrong length", () => {
    expect(() => generateKey(new Uint8Array(16))).toThrow();
  });
});

describe("parseBearer", () => {
  const good = generateKey(new Uint8Array(32).fill(3)).plaintext;

  test("reads a well-formed bearer key", () => {
    expect(parseBearer(`Bearer ${good}`)).toBe(good);
  });

  test("rejects other schemes, missing headers and malformed keys", () => {
    expect(parseBearer(null)).toBeNull();
    expect(parseBearer(undefined)).toBeNull();
    expect(parseBearer("")).toBeNull();
    expect(parseBearer(`Basic ${good}`)).toBeNull();
    expect(parseBearer("Bearer")).toBeNull();
    expect(parseBearer(`Bearer ${good} extra`)).toBeNull();
    expect(parseBearer("Bearer ldk_short")).toBeNull();
    expect(parseBearer(`Bearer sk_${good.slice(4)}`)).toBeNull();
    expect(parseBearer(`Bearer ${good}!`)).toBeNull();
  });
});

describe("checkKeyName", () => {
  test("trims and collapses spaces", () => {
    expect(checkKeyName("  Laptop   script ")).toEqual({ ok: true, name: "Laptop script" });
  });

  test("needs a name and at most 60 characters", () => {
    expect(checkKeyName("   ").ok).toBe(false);
    expect(checkKeyName(42).ok).toBe(false);
    expect(checkKeyName("a".repeat(60)).ok).toBe(true);
    expect(checkKeyName("a".repeat(61)).ok).toBe(false);
  });

  test("refuses control characters", () => {
    expect(checkKeyName("bad\u0007name").ok).toBe(false);
  });
});

describe("checkScopes", () => {
  test("keeps the scopes in the API_SCOPES order and drops duplicates", () => {
    expect(checkScopes(["stats", "profile", "stats"])).toEqual({ ok: true, scopes: ["profile", "stats"] });
  });

  test("the scope list is exactly the eight in the plan", () => {
    expect([...API_SCOPES]).toEqual(["profile", "projects", "journal", "hours", "ledger", "activity", "export", "stats"]);
  });

  test("refuses an empty list, an unknown scope and a non-list", () => {
    expect(checkScopes([]).ok).toBe(false);
    expect(checkScopes(["write"]).ok).toBe(false);
    expect(checkScopes("profile").ok).toBe(false);
    expect(checkScopes([1]).ok).toBe(false);
  });

  test("refuses any write-like scope name: there are none", () => {
    for (const name of ["write", "admin", "ledger:write", "journal:write"]) {
      expect(checkScopes([name]).ok).toBe(false);
    }
  });
});

describe("checkExpiry", () => {
  test("empty means no expiry", () => {
    expect(checkExpiry(undefined, NOW)).toEqual({ ok: true, expiresAt: null });
    expect(checkExpiry("", NOW)).toEqual({ ok: true, expiresAt: null });
    expect(checkExpiry(null, NOW)).toEqual({ ok: true, expiresAt: null });
  });

  test("accepts a future date within the limit", () => {
    const when = new Date(NOW.getTime() + 30 * DAY);
    const result = checkExpiry(when.toISOString(), NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.expiresAt?.getTime()).toBe(when.getTime());
  });

  test("refuses the past, the present, a longer span and garbage", () => {
    expect(checkExpiry(new Date(NOW.getTime() - DAY).toISOString(), NOW).ok).toBe(false);
    expect(checkExpiry(NOW.toISOString(), NOW).ok).toBe(false);
    expect(checkExpiry(new Date(NOW.getTime() + 731 * DAY).toISOString(), NOW).ok).toBe(false);
    expect(checkExpiry("not a date", NOW).ok).toBe(false);
    expect(checkExpiry(12, NOW).ok).toBe(false);
  });
});

describe("canCreateKey", () => {
  test("five active keys at most", () => {
    expect(canCreateKey(0)).toBe(true);
    expect(canCreateKey(4)).toBe(true);
    expect(canCreateKey(5)).toBe(false);
    expect(canCreateKey(9)).toBe(false);
  });
});

describe("keyStatus", () => {
  test("revoked wins over expired; a past expiry is expired", () => {
    const past = new Date(NOW.getTime() - 1);
    const future = new Date(NOW.getTime() + DAY);
    expect(keyStatus({ revokedAt: NOW, expiresAt: past }, NOW)).toBe("revoked");
    expect(keyStatus({ revokedAt: null, expiresAt: past }, NOW)).toBe("expired");
    expect(keyStatus({ revokedAt: null, expiresAt: NOW }, NOW)).toBe("expired");
    expect(keyStatus({ revokedAt: null, expiresAt: future }, NOW)).toBe("active");
    expect(keyStatus({ revokedAt: null, expiresAt: null }, NOW)).toBe("active");
  });
});

describe("accountBlock", () => {
  test("a banned person or an open erasure request blocks every key", () => {
    expect(accountBlock({ bannedAt: NOW }, false)).toBe("banned");
    expect(accountBlock({ bannedAt: null }, true)).toBe("erasure_requested");
    expect(accountBlock({ bannedAt: null }, false)).toBeNull();
  });
});

describe("hasScope", () => {
  test("only the listed scopes pass", () => {
    expect(hasScope(["profile", "hours"], "hours")).toBe(true);
    expect(hasScope(["profile", "hours"], "export")).toBe(false);
    expect(hasScope([], "profile")).toBe(false);
  });
});

describe("touchDue", () => {
  test("writes lastUsedAt when none is set or the last write is a minute old", () => {
    expect(touchDue(null, NOW)).toBe(true);
    expect(touchDue(new Date(NOW.getTime() - 60_000), NOW)).toBe(true);
    expect(touchDue(new Date(NOW.getTime() - 59_999), NOW)).toBe(false);
  });
});

describe("sameHash", () => {
  test("equal digests match; different or different-length ones do not", () => {
    const h = hashKey("ldk_x");
    expect(sameHash(h, hashKey("ldk_x"))).toBe(true);
    expect(sameHash(h, hashKey("ldk_y"))).toBe(false);
    expect(sameHash(h, h.slice(0, 10))).toBe(false);
  });
});

describe("keyView", () => {
  test("copies only the public fields, never a hash", () => {
    const row = {
      id: "k1",
      name: "Laptop",
      prefix: "ldk_abcd",
      scopes: ["profile"],
      createdAt: NOW,
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
      hash: "deadbeef",
    };
    const view = keyView(row, NOW);
    expect(Object.keys(view).sort()).toEqual(
      ["createdAt", "expiresAt", "id", "lastUsedAt", "name", "prefix", "revokedAt", "scopes", "status"].sort(),
    );
    expect(JSON.stringify(view)).not.toContain("deadbeef");
    expect(view.status).toBe("active");
  });
});
