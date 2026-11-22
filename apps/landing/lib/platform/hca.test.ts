import { describe, expect, test } from "bun:test";
import {
  attemptExpiry,
  buildAuthorizeUrl,
  checkAttempt,
  decideBinding,
  hcaConfig,
  isSignInError,
  newRandom,
  parseBirthday,
  parseIdentity,
  placeholderEmail,
  sha256,
  signInErrorPath,
  SIGN_IN_ERROR_MESSAGES,
  hcaScopes,
} from "./hca";

describe("hcaConfig", () => {
  test("is null without a client id, with the default redirect otherwise", () => {
    expect(hcaConfig({} as NodeJS.ProcessEnv)).toBeNull();
    expect(hcaConfig({ HCA_CLIENT_ID: "  " } as NodeJS.ProcessEnv)).toBeNull();
    const config = hcaConfig({ HCA_CLIENT_ID: "abc", HCA_CLIENT_SECRET: "s" } as NodeJS.ProcessEnv);
    expect(config?.redirectUri).toBe("http://localhost:3010/api/auth/hackclub/callback");
    expect(config?.clientSecret).toBe("s");
  });
});

describe("buildAuthorizeUrl", () => {
  test("code flow with the sign-in scopes and the state", () => {
    const url = new URL(buildAuthorizeUrl({ clientId: "abc", redirectUri: "http://x/cb", baseUrl: "https://auth.hackclub.com" }, "st"));
    expect(url.origin + url.pathname).toBe("https://auth.hackclub.com/oauth/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid profile slack_id verification_status");
    expect(url.searchParams.get("state")).toBe("st");
    expect(url.searchParams.get("code_challenge")).toBeNull();
  });
});

describe("random and hashing", () => {
  test("32 bytes of base64url, different each time", () => {
    const a = newRandom();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(newRandom()).not.toBe(a);
    expect(sha256("a")).toHaveLength(64);
  });
});

describe("checkAttempt", () => {
  const now = new Date("2026-11-16T12:00:00Z");
  const attempt = { stateHash: "h", nonceHash: sha256("nonce"), expiresAt: attemptExpiry(now) };
  test("accepts a live attempt from the same browser", () => {
    expect(checkAttempt(attempt, "nonce", now)).toEqual({ ok: true });
  });
  test("refuses unknown, expired and other-browser attempts", () => {
    expect(checkAttempt(null, "nonce", now)).toEqual({ ok: false, error: "invalid_state" });
    expect(checkAttempt(attempt, "nonce", attempt.expiresAt)).toEqual({ ok: false, error: "expired_state" });
    expect(checkAttempt(attempt, "other", now)).toEqual({ ok: false, error: "invalid_state" });
    expect(checkAttempt(attempt, null, now)).toEqual({ ok: false, error: "invalid_state" });
  });
});

describe("parseBirthday", () => {
  test("real dates only", () => {
    expect(parseBirthday("2010-02-28")?.toISOString()).toBe("2010-02-28T00:00:00.000Z");
    expect(parseBirthday("2008-02-29")).not.toBeNull();
    expect(parseBirthday("2010-02-29")).toBeNull();
    expect(parseBirthday("2010-13-01")).toBeNull();
    expect(parseBirthday("soon")).toBeNull();
    expect(parseBirthday(20100101)).toBeNull();
  });
  test("a date-only claim with trailing text is not a birthday", () => {
    expect(parseBirthday("2010-02-28junk")).toBeNull();
    expect(parseBirthday("2010-02-28T00:00:00Z")).toBeNull();
    expect(parseBirthday(" 2010-02-28 \t")).not.toBeNull();
  });
});

describe("placeholderEmail", () => {
  test("is stable for one id and unique for ids that sanitize alike", () => {
    expect(placeholderEmail("abc!")).toBe(placeholderEmail("abc!"));
    expect(placeholderEmail("abc!")).not.toBe(placeholderEmail("abc?"));
    expect(placeholderEmail("!!!")).not.toBe(placeholderEmail("???"));
    expect(placeholderEmail("!!!")).toMatch(/^hca-[a-z0-9-]+@users\.invalid$/);
  });
});

describe("parseIdentity", () => {
  test("reads the fields it needs", () => {
    const identity = parseIdentity({
      identity: { id: "ident!abc123", primary_email: "A@B.org", first_name: "Sam", last_name: "Lee", birthday: "2010-05-05", verification_status: "verified" },
    });
    expect(identity).toMatchObject({ id: "ident!abc123", email: "a@b.org", displayName: "Sam Lee", verificationStatus: "verified" });
    expect(identity?.birthday?.getUTCFullYear()).toBe(2010);
  });
  test("survives missing and wrong typed fields", () => {
    expect(parseIdentity(null)).toBeNull();
    expect(parseIdentity({})).toBeNull();
    expect(parseIdentity({ identity: { id: 5 } })).toBeNull();
    const odd = parseIdentity({ identity: { id: "x1", primary_email: "not an email", birthday: 7, verification_status: {} } });
    expect(odd).toMatchObject({ email: null, birthday: null, verificationStatus: null });
    expect(odd?.displayName).toContain("Builder");
  });
});

describe("decideBinding", () => {
  test("uses the person already bound to the id", () => {
    expect(decideBinding({ hcaId: "i1", email: "a@b.org", byHcaId: { id: "p1", hcaId: "i1" }, byEmail: null })).toEqual({ action: "use", personId: "p1" });
  });
  test("links an unbound person with the same email", () => {
    expect(decideBinding({ hcaId: "i1", email: "a@b.org", byHcaId: null, byEmail: { id: "p2", hcaId: null } })).toEqual({ action: "link", personId: "p2" });
  });
  test("never links two identities to one person", () => {
    expect(decideBinding({ hcaId: "i1", email: "a@b.org", byHcaId: null, byEmail: { id: "p2", hcaId: "i9" } })).toEqual({ action: "conflict" });
  });
  test("never links onto a local test address", () => {
    expect(decideBinding({ hcaId: "i1", email: "builder@loadout.test", byHcaId: null, byEmail: { id: "p3", hcaId: null } })).toEqual({ action: "conflict" });
  });
  test("never creates a local test address, including an owner, whatever its case", () => {
    expect(decideBinding({ hcaId: "i1", email: "staff@loadout.test", byHcaId: null, byEmail: null })).toEqual({ action: "conflict" });
    expect(decideBinding({ hcaId: "i1", email: " STAFF@LOADOUT.TEST ", byHcaId: null, byEmail: null })).toEqual({ action: "conflict" });
    expect(decideBinding({ hcaId: "i1", email: "STAFF@LOADOUT.TEST", byHcaId: null, byEmail: { id: "p3", hcaId: null } })).toEqual({ action: "conflict" });
  });
  test("creates a person when nothing matches", () => {
    expect(decideBinding({ hcaId: "i1", email: null, byHcaId: null, byEmail: null })).toEqual({ action: "create" });
  });
});

describe("error redirects", () => {
  test("short codes with plain messages", () => {
    expect(signInErrorPath("expired_state")).toBe("/dashboard/sign-in?error=expired_state");
    expect(isSignInError("denied")).toBe(true);
    expect(isSignInError("<script>")).toBe(false);
    for (const message of Object.values(SIGN_IN_ERROR_MESSAGES)) expect(message).not.toMatch(/[–—]| - /);
  });
});

describe("hcaScopes", () => {
  test("uses the default when the variable is empty", () => {
    expect(hcaScopes({} as NodeJS.ProcessEnv)).toBe("openid profile slack_id verification_status");
  });
  test("splits on spaces and commas and keeps only scope-shaped words", () => {
    expect(hcaScopes({ HCA_SCOPES: "openid profile, slack_id  verification_status" } as NodeJS.ProcessEnv)).toBe("openid profile slack_id verification_status");
    expect(hcaScopes({ HCA_SCOPES: "openid profile%20evil&x=1" } as NodeJS.ProcessEnv)).toBe("openid");
  });
  test("falls back to the default when openid is missing", () => {
    expect(hcaScopes({ HCA_SCOPES: "profile slack_id" } as NodeJS.ProcessEnv)).toBe("openid profile slack_id verification_status");
  });
});
