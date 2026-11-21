import { describe, expect, test } from "bun:test";
import { TRACKS } from "./progress";
import { trackBySlug, trackSlug } from "./tracks";

describe("track addresses", () => {
  test("a slug names its track, ignoring case", () => {
    expect(trackBySlug("tools")).toBe("Tools");
    expect(trackBySlug("HARDWARE")).toBe("Hardware");
  });

  test("an unknown slug names no track", () => {
    expect(trackBySlug("art")).toBeNull();
    expect(trackBySlug("")).toBeNull();
  });

  test("every track has a slug that finds it", () => {
    for (const track of TRACKS) expect(trackBySlug(trackSlug(track))).toBe(track);
  });
});
