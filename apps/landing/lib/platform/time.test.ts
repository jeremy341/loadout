import { describe, expect, test } from "bun:test";
import { timeAgo } from "./time";

const now = new Date("2026-11-01T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("time ago", () => {
  test("under a minute and a half is just now, and so is the future", () => {
    expect(timeAgo(ago(10), now)).toBe("just now");
    expect(timeAgo(ago(89), now)).toBe("just now");
    expect(timeAgo(ago(-500), now)).toBe("just now");
  });

  test("minutes, hours and days", () => {
    expect(timeAgo(ago(5 * 60), now)).toBe("5m ago");
    expect(timeAgo(ago(3 * 3600), now)).toBe("3h ago");
    expect(timeAgo(ago(2 * 86400), now)).toBe("2d ago");
  });

  test("after a month it is a date", () => {
    expect(timeAgo(ago(40 * 86400), now)).toBe("22 Sep 2026");
  });
});
