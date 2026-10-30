import { describe, expect, test } from "bun:test";
import { hashToken, newToken, sessionCookieOptions, sessionExpiry, SESSION_DAYS } from "./session";

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
});
