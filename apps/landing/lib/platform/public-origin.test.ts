import { describe, expect, test } from "bun:test";
import { publicOrigin, publicUrl } from "./public-origin";
import { platformGateCookieOptions } from "./platform-gate";

// Behind the Nest proxy the request arrives as http://localhost:3001, so the configured origin must win.
const bound = new Request("http://localhost:3001/api/auth/hackclub/start");

describe("publicOrigin", () => {
  test("prefers NEXT_PUBLIC_LOADOUT_SITE_URL over the bind address", () => {
    expect(publicOrigin(bound, { NEXT_PUBLIC_LOADOUT_SITE_URL: "https://loadout.dino.icu/" })).toBe("https://loadout.dino.icu");
  });

  test("falls back to the origin of HCA_REDIRECT_URI", () => {
    expect(publicOrigin(bound, { HCA_REDIRECT_URI: "https://loadout.dino.icu/api/auth/hackclub/callback" })).toBe(
      "https://loadout.dino.icu",
    );
  });

  test("falls back to the request origin when nothing is configured", () => {
    expect(publicOrigin(bound, {})).toBe("http://localhost:3001");
  });

  test("ignores a malformed configured value", () => {
    expect(publicOrigin(bound, { NEXT_PUBLIC_LOADOUT_SITE_URL: "not a url" })).toBe("http://localhost:3001");
  });
});

describe("publicUrl", () => {
  test("builds a redirect on the public host", () => {
    expect(publicUrl(bound, "/dashboard/sign-in", { NEXT_PUBLIC_LOADOUT_SITE_URL: "https://loadout.dino.icu" }).href).toBe(
      "https://loadout.dino.icu/dashboard/sign-in",
    );
  });
});

describe("platformGateCookieOptions", () => {
  test("shares SESSION_COOKIE_DOMAIN in production", () => {
    const options = platformGateCookieOptions({ NODE_ENV: "production", SESSION_COOKIE_DOMAIN: "loadout.dino.icu" });
    expect(options.domain).toBe("loadout.dino.icu");
    expect(options.secure).toBe(true);
  });

  test("stays host-only without a domain", () => {
    expect(platformGateCookieOptions({ NODE_ENV: "production" })).not.toHaveProperty("domain");
  });

  test("never sets a domain on an insecure cookie", () => {
    expect(platformGateCookieOptions({ NODE_ENV: "development", SESSION_COOKIE_DOMAIN: "loadout.dino.icu" })).not.toHaveProperty("domain");
  });
});
