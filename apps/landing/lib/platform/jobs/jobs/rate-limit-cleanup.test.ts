import { afterAll, describe, expect, mock, test } from "bun:test";
import * as realRateLimitDb from "../../rate-limit-db";

const cleanupExpired = mock(async (): Promise<number> => 0);
mock.module("../../rate-limit-db", () => ({ ...realRateLimitDb, cleanupExpired }));
afterAll(() => mock.restore());

const { runRateLimitCleanup } = await import("./rate-limit-cleanup");

describe("rate-limit-cleanup", () => {
  test("calls cleanupExpired with the runner's clock and reports only the count", async () => {
    cleanupExpired.mockImplementation(async () => 7);
    const now = new Date("2026-11-20T04:10:00.000Z");
    const result = await runRateLimitCleanup(now);
    expect(cleanupExpired).toHaveBeenCalledWith(now.getTime());
    expect(result).toEqual({ deleted: 7 });
  });

  test("a sweep that removes nothing still reports zero", async () => {
    cleanupExpired.mockImplementation(async () => 0);
    expect(await runRateLimitCleanup(new Date(0))).toEqual({ deleted: 0 });
  });
});
