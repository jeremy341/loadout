import { describe, expect, test } from "bun:test";
import { checkPlatformPassword, hasPlatformUnlockCookie, platformGateEnabled, platformGateToken } from "./platform-gate";

describe("platform password gate", () => {
  test("is off until a password is configured", () => {
    expect(platformGateEnabled({})).toBe(false);
    expect(platformGateEnabled({ LOADOUT_PLATFORM_PASSWORD: "   " })).toBe(false);
    expect(platformGateEnabled({ LOADOUT_PLATFORM_PASSWORD: "shared-secret" })).toBe(true);
  });

  test("accepts the shared password in constant time and rejects everything else", () => {
    const env = { LOADOUT_PLATFORM_PASSWORD: "shared-secret" };
    expect(checkPlatformPassword("shared-secret", env)).toBe(true);
    expect(checkPlatformPassword("shared-secret ", env)).toBe(false);
    expect(checkPlatformPassword("wrong", env)).toBe(false);
    expect(checkPlatformPassword("", env)).toBe(false);
    expect(checkPlatformPassword(null, env)).toBe(false);
    expect(checkPlatformPassword(42, env)).toBe(false);
    expect(checkPlatformPassword("anything", {})).toBe(false);
  });

  test("the unlock token is stable for a secret and changes with it", () => {
    const env = { LOADOUT_PLATFORM_PASSWORD: "shared-secret" };
    const token = platformGateToken(env);
    expect(token).toBe(platformGateToken(env));
    expect(token).toMatch(/^\d+\.[A-Za-z0-9_-]+$/);
    expect(token).not.toContain("shared-secret");
    expect(platformGateToken({ LOADOUT_PLATFORM_PASSWORD: "other-secret" })).not.toBe(token);
  });

  test("a token expires on the server after the max age, not only in the browser", () => {
    const env = { LOADOUT_PLATFORM_PASSWORD: "shared-secret" };
    const now = Math.floor(Date.now() / 1000);
    const day = 24 * 60 * 60;
    expect(hasPlatformUnlockCookie(platformGateToken(env, now - day), env)).toBe(true);
    expect(hasPlatformUnlockCookie(platformGateToken(env, now - 8 * day), env)).toBe(false);
    expect(hasPlatformUnlockCookie(platformGateToken(env, now + 600), env)).toBe(false);
  });

  test("a request cookie unlocks the gate only when the token is valid", () => {
    const env = { LOADOUT_PLATFORM_PASSWORD: "shared-secret" };
    const token = platformGateToken(env);
    expect(hasPlatformUnlockCookie(token, env)).toBe(true);
    expect(hasPlatformUnlockCookie(undefined, env)).toBe(false);
    expect(hasPlatformUnlockCookie(null, env)).toBe(false);
    expect(hasPlatformUnlockCookie("", env)).toBe(false);
    expect(hasPlatformUnlockCookie("nope", env)).toBe(false);
    expect(hasPlatformUnlockCookie(`${token}x`, env)).toBe(false);
    expect(hasPlatformUnlockCookie(token.slice(0, -1), env)).toBe(false);
    expect(hasPlatformUnlockCookie(token, { LOADOUT_PLATFORM_PASSWORD: "other-secret" })).toBe(false);
  });

  test("the cookie check is a no-op while the gate is off", () => {
    expect(hasPlatformUnlockCookie(undefined, {})).toBe(true);
    expect(hasPlatformUnlockCookie("anything", { LOADOUT_PLATFORM_PASSWORD: "  " })).toBe(true);
    expect(hasPlatformUnlockCookie("anything", {})).toBe(true);
  });
});
