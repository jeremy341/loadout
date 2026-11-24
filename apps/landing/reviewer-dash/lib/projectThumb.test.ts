import { describe, expect, test } from "bun:test";
import { projectInitial, thumbTone } from "./projectThumb";

describe("thumbTone", () => {
  test("each track has its own colour family", () => {
    expect(thumbTone("Tools")).toBe("blue");
    expect(thumbTone("Systems")).toBe("green");
    expect(thumbTone("Compute")).toBe("purple");
    expect(thumbTone("Hardware")).toBe("orange");
  });

  test("an unknown or missing track is neutral", () => {
    expect(thumbTone(null)).toBe("neutral");
    expect(thumbTone(undefined)).toBe("neutral");
    expect(thumbTone("Mystery")).toBe("neutral");
  });
});

describe("projectInitial", () => {
  test("is the first letter or digit, upper-cased", () => {
    expect(projectInitial("rollback netcode")).toBe("R");
    expect(projectInitial("  3D printer")).toBe("3");
    expect(projectInitial("--- Ünïcode")).toBe("Ü");
  });

  test("falls back to a question mark", () => {
    expect(projectInitial("")).toBe("?");
    expect(projectInitial("***")).toBe("?");
    expect(projectInitial(null)).toBe("?");
  });
});
