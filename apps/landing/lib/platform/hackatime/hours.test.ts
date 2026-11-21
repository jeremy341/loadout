import { describe, expect, test } from "bun:test";
import { bucket, sumByDay, sumByTrack } from "./hours";

describe("sumByDay", () => {
  test("adds up several rows for one day and sorts by day", () => {
    expect(
      sumByDay([
        { day: "2026-11-12", seconds: 100 },
        { day: "2026-11-10", seconds: 50 },
        { day: "2026-11-12", seconds: 25 },
      ]),
    ).toEqual([
      { day: "2026-11-10", seconds: 50 },
      { day: "2026-11-12", seconds: 125 },
    ]);
  });

  test("an empty list is an empty list", () => {
    expect(sumByDay([])).toEqual([]);
  });
});

describe("sumByTrack", () => {
  test("sums by track, sends unmapped and track-less names to null, largest first", () => {
    const tracks = new Map<string, string | null>([
      ["pixel-app", "Tools"],
      ["robot", "Hardware"],
      ["side", null],
    ]);
    expect(
      sumByTrack(
        [
          { name: "pixel-app", seconds: 300 },
          { name: "robot", seconds: 100 },
          { name: "side", seconds: 50 },
          { name: "never-seen", seconds: 500 },
          { name: "pixel-app", seconds: 200 },
        ],
        tracks,
      ),
    ).toEqual([
      { track: null, seconds: 550 },
      { track: "Tools", seconds: 500 },
      { track: "Hardware", seconds: 100 },
    ]);
  });
});

describe("bucket", () => {
  const rows = [
    { day: "2026-11-16", seconds: 10 }, // Monday
    { day: "2026-11-18", seconds: 20 }, // Wednesday, same ISO week
    { day: "2026-11-22", seconds: 5 }, // Sunday, same ISO week
    { day: "2026-11-23", seconds: 7 }, // next Monday
  ];

  test("day keeps one bucket per day", () => {
    expect(bucket(rows, "day")).toEqual([
      { start: "2026-11-16", seconds: 10 },
      { start: "2026-11-18", seconds: 20 },
      { start: "2026-11-22", seconds: 5 },
      { start: "2026-11-23", seconds: 7 },
    ]);
  });

  test("week starts on Monday and groups Sunday with the week before it", () => {
    expect(bucket(rows, "week")).toEqual([
      { start: "2026-11-16", seconds: 35 },
      { start: "2026-11-23", seconds: 7 },
    ]);
  });
});
