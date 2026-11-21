import { describe, expect, test } from "bun:test";
import { reviewErrorCopy } from "./reviewError";

describe("reviewErrorCopy", () => {
  test("a known code gets its fixed copy", () => {
    expect(reviewErrorCopy("reserved")).toBe("That project is reserved for another reviewer right now.");
    expect(reviewErrorCopy("second_pass")).toBe("Only a final reviewer can update this decision.");
  });

  test("a legacy redirect message is mapped, never echoed", () => {
    const old = "Only a final reviewer can update this.";
    expect(reviewErrorCopy(old)).toBe("Only a final reviewer can update this decision.");
    expect(reviewErrorCopy(old)).not.toContain("<");
  });

  test("unknown, injected and array values get one generic sentence", () => {
    const generic = "That action could not be completed. Reload and try again.";
    expect(reviewErrorCopy("<script>alert(1)</script>")).toBe(generic);
    expect(reviewErrorCopy(["javascript:alert(1)"])).toBe(generic);
    expect(reviewErrorCopy("x".repeat(500))).toBe(generic);
  });

  test("an absent error shows nothing", () => {
    expect(reviewErrorCopy(undefined)).toBeNull();
    expect(reviewErrorCopy("")).toBeNull();
  });
});
