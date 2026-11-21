import { afterAll, describe, expect, test } from "bun:test";
import { db } from "./db";
import {
  hashToken,
  impersonationCookieOptions,
  newToken,
  PREVIEW_EMAILS,
  previewRoleEmail,
  purgeExpiredSessions,
  sessionCookieOptions,
  sessionExpiry,
  SESSION_DAYS,
  validCookieDomain,
  viewAsRoleKey,
} from "./session";

describe("session tokens", () => {
  test("hash is stable and never equals the raw token", () => {
    const token = "example-token";
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  test("new tokens are long, url-safe and unique", () => {
    const first = newToken();
    const second = newToken();
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first).not.toBe(second);
  });

  test("expiry is the configured number of days after creation", () => {
    const now = new Date("2026-10-30T12:00:00Z");
    const expires = sessionExpiry(now);
    expect(expires.getTime() - now.getTime()).toBe(SESSION_DAYS * 24 * 60 * 60 * 1000);
  });

  test("cookies are httponly and lax, and never readable by page scripts", () => {
    const options = sessionCookieOptions(new Date());
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("secure is explicit: production or LOADOUT_SECURE_COOKIES=true, never just a host guess", () => {
    const expires = new Date();
    expect(sessionCookieOptions(expires, { NODE_ENV: "development" }).secure).toBe(false);
    expect(sessionCookieOptions(expires, { NODE_ENV: "production" }).secure).toBe(true);
    expect(sessionCookieOptions(expires, { NODE_ENV: "development", LOADOUT_SECURE_COOKIES: "true" }).secure).toBe(true);
    expect(sessionCookieOptions(expires, { NODE_ENV: "development", LOADOUT_SECURE_COOKIES: "TRUE" }).secure).toBe(false);
  });

  test("SESSION_COOKIE_DOMAIN is applied only when the cookie is secure", () => {
    const expires = new Date();
    const dev = sessionCookieOptions(expires, { NODE_ENV: "development", SESSION_COOKIE_DOMAIN: "example.com" });
    expect("domain" in dev).toBe(false);
    const prod = sessionCookieOptions(expires, { NODE_ENV: "production", SESSION_COOKIE_DOMAIN: "example.com" });
    expect(prod).toMatchObject({ secure: true, domain: "example.com" });
  });
});

describe("cookie domains", () => {
  test("a parent of the current host is accepted, a bare public suffix is not", () => {
    expect(validCookieDomain(".example.com", "review.example.com")).toBe("example.com");
    expect(validCookieDomain("example.com", "example.com")).toBe("example.com");
    expect(validCookieDomain("com", "review.example.com")).toBeNull();
    expect(validCookieDomain("co.uk", "review.co.uk")).toBeNull();
    expect(validCookieDomain(".example.com", "review.other.test")).toBeNull();
    expect(validCookieDomain(".example.com", null)).toBeNull();
    expect(validCookieDomain("127.0.0.1", "review.127.0.0.1")).toBeNull();
  });

  test("an invalid impersonation domain keeps the cookie host-only", () => {
    const expires = new Date();
    const base = { NODE_ENV: "production" } as NodeJS.ProcessEnv;
    expect(impersonationCookieOptions(expires, base, "review.example.com")).not.toHaveProperty("domain");
    expect(impersonationCookieOptions(expires, { ...base, LOADOUT_IMPERSONATION_COOKIE_DOMAIN: "com" }, "review.example.com")).not.toHaveProperty("domain");
    expect(impersonationCookieOptions(expires, { ...base, LOADOUT_IMPERSONATION_COOKIE_DOMAIN: ".example.com" }, "review.example.com")).toMatchObject({ domain: "example.com" });
  });
});

describe("preview roles", () => {
  test("only a declared role resolves to an email", () => {
    expect(PREVIEW_EMAILS.staff).toBe("staff@loadout.test");
    expect(PREVIEW_EMAILS.builder).toBe("builder@loadout.test");
    expect(PREVIEW_EMAILS["not-a-role"]).toBeUndefined();
  });

  test("a prototype key in the cookie cannot become an email address", () => {
    expect(PREVIEW_EMAILS["__proto__"]).toBeUndefined();
    expect(PREVIEW_EMAILS.constructor).toBeUndefined();
    expect(PREVIEW_EMAILS.toString).toBeUndefined();
  });

  test("an unknown value is signed out in the reader and in the View as menu", () => {
    expect(previewRoleEmail(undefined)).toBe("builder@loadout.test");
    expect(previewRoleEmail("reviewer")).toBe("reviewer@loadout.test");
    expect(previewRoleEmail("__proto__")).toBeNull();
    expect(previewRoleEmail("not-a-role")).toBeNull();
    expect(viewAsRoleKey("reviewer")).toBe("reviewer");
    expect(viewAsRoleKey("not-a-role")).toBe("signed-out");
    expect(viewAsRoleKey("__proto__")).toBe("signed-out");
  });
});

// The sweep runs against the local Postgres. `now` is pinned to the year 2000 so the delete cannot touch a real session from a
// fixture or another test: only the rows created here, with expiries around that date, are in range.
const PURGE_RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
let purgePersonId = "";

describe.skipIf(!process.env.DATABASE_URL)("purgeExpiredSessions (the session-cleanup job)", () => {
  afterAll(async () => {
    if (purgePersonId) {
      await db().session.deleteMany({ where: { personId: purgePersonId } });
      await db().person.deleteMany({ where: { id: purgePersonId } });
    }
  });

  test("removes sessions at or past the cutoff and leaves live ones, reporting only a count", async () => {
    const person = await db().person.create({
      data: { email: `session-purge-${PURGE_RUN}@imp-test.example`, displayName: "Session purge test" },
    });
    purgePersonId = person.id;
    const now = new Date("2000-01-01T00:00:00Z");
    for (const expiresAt of [
      new Date("1999-12-31T23:59:59Z"), // expired
      now, // exactly at the cutoff: expired too
      new Date("2000-01-01T00:00:01Z"), // still live
    ]) {
      await db().session.create({ data: { personId: person.id, tokenHash: hashToken(newToken()), expiresAt } });
    }

    expect(await purgeExpiredSessions(now)).toBe(2);
    const remaining = await db().session.findMany({ where: { personId: person.id }, select: { expiresAt: true } });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].expiresAt.getTime()).toBe(new Date("2000-01-01T00:00:01Z").getTime());
  });
});
