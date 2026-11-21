import { describe, expect, test } from "bun:test";
import { withNotice } from "./referer";

describe("withNotice", () => {
  test("puts the query string before a fragment, so the server receives the notice", () => {
    expect(withNotice("/notify#form", "error", "bad input")).toBe("/notify?error=bad+input#form");
    expect(withNotice("/notify?tab=all#form", "error", "bad input")).toBe("/notify?tab=all&error=bad+input#form");
    expect(withNotice("/notify#form", "sent", "3")).toBe("/notify?sent=3#form");
  });

  test("replaces an old notice of any kind", () => {
    expect(withNotice("/notify?error=old&tab=all", "ok", "saved")).toBe("/notify?tab=all&ok=saved");
  });
});
