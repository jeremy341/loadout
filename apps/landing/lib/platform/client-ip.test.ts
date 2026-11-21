import { describe, expect, test } from "bun:test";
import { clientIp, isTrustedProxy } from "./client-ip";

const req = (headers: Record<string, string>) => new Request("https://x.test/", { headers });

describe("clientIp", () => {
  test("by default no forwarding header is believed, so rotating x-forwarded-for does not change the key", () => {
    const keys = ["203.0.113.1", "203.0.113.2", "198.51.100.7, 203.0.113.3"].map((v) => clientIp(req({ "x-forwarded-for": v }), {}));
    expect(new Set(keys)).toEqual(new Set(["unknown"]));
    expect(clientIp(req({ "x-real-ip": "203.0.113.9" }), {})).toBe("unknown");
    expect(clientIp(req({ "x-vercel-forwarded-for": "203.0.113.9" }), { LOADOUT_TRUST_PROXY: "true" })).not.toBe("203.0.113.9");
  });

  test("LOADOUT_TRUST_PROXY must be exactly true", () => {
    expect(isTrustedProxy({ LOADOUT_TRUST_PROXY: "1" })).toBe(false);
    expect(isTrustedProxy({ LOADOUT_TRUST_PROXY: "true" })).toBe(true);
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.1" }), { LOADOUT_TRUST_PROXY: "false" })).toBe("unknown");
  });

  test("behind a trusted proxy the last hop wins, so a client-prepended value is ignored", () => {
    const env = { LOADOUT_TRUST_PROXY: "true" };
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8, 203.0.113.9" }), env)).toBe("203.0.113.9");
    expect(clientIp(req({ "x-forwarded-for": "9.9.9.9, 203.0.113.9" }), env)).toBe("203.0.113.9");
    expect(clientIp(req({ "x-forwarded-for": "2001:db8::1" }), env)).toBe("2001:db8::1");
  });

  test("falls back to x-real-ip, then unknown, behind a trusted proxy", () => {
    const env = { LOADOUT_TRUST_PROXY: "true" };
    expect(clientIp(req({ "x-real-ip": "203.0.113.4" }), env)).toBe("203.0.113.4");
    expect(clientIp(req({}), env)).toBe("unknown");
    expect(clientIp(req({ "x-forwarded-for": "a\"b" }), env)).toBe("unknown");
    expect(clientIp(req({ "x-forwarded-for": "x".repeat(70) }), env)).toBe("unknown");
  });

  test("on Vercel x-vercel-forwarded-for comes first", () => {
    const env = { VERCEL: "1" };
    expect(clientIp(req({ "x-vercel-forwarded-for": "203.0.113.50", "x-forwarded-for": "1.1.1.1, 203.0.113.60" }), env)).toBe("203.0.113.50");
    expect(clientIp(req({ "x-forwarded-for": "1.1.1.1, 203.0.113.60" }), env)).toBe("203.0.113.60");
  });
});
