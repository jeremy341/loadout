import { describe, expect, test } from "bun:test";
import { cronBearerOk } from "./guard";

describe("cronBearerOk (fail closed on the CRON_SECRET bearer)", () => {
  const SECRET = "a-secret-long-enough-to-be-real";

  test("the right secret with the Bearer scheme passes", () => {
    expect(cronBearerOk(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  test("an unset secret refuses everything, so a deployment without CRON_SECRET runs no job", () => {
    expect(cronBearerOk(`Bearer ${SECRET}`, undefined)).toBe(false);
  });

  test("an empty string is not a secret", () => {
    expect(cronBearerOk(`Bearer ${SECRET}`, "")).toBe(false);
  });

  test("no header is refused", () => {
    expect(cronBearerOk(null, SECRET)).toBe(false);
  });

  test("the wrong secret is refused, and a different length does not throw", () => {
    expect(cronBearerOk("Bearer the-wrong-secret", SECRET)).toBe(false);
    expect(cronBearerOk("Bearer x", SECRET)).toBe(false);
    expect(cronBearerOk(`Bearer ${SECRET}x`, SECRET)).toBe(false);
  });

  test("the scheme is checked: only literal Bearer", () => {
    expect(cronBearerOk(`bearer ${SECRET}`, SECRET)).toBe(false);
    expect(cronBearerOk(`Basic ${SECRET}`, SECRET)).toBe(false);
    expect(cronBearerOk(SECRET, SECRET)).toBe(false);
  });
});
