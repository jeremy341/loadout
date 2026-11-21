import { describe, expect, test } from "bun:test";
import { doubleDipView } from "./doubleDip";

describe("doubleDipView", () => {
  test("no note, no banner", () => {
    expect(doubleDipView("")).toBeNull();
    expect(doubleDipView("   ")).toBeNull();
  });

  test("an undisclosed match is the loud one", () => {
    const v = doubleDipView(
      'SYSTEM: https://github.com/a/b already appears in the Hack Club YSWS archive under "Sprig" but the player did NOT disclose it. Possible double dip. 5h there.',
    );
    expect(v?.kind).toBe("undisclosed");
    expect(v?.tone).toBe("danger");
    expect(v?.text.startsWith("SYSTEM")).toBe(false);
  });

  test("a disclosed match is a warning", () => {
    const v = doubleDipView('SYSTEM: Player disclosed this was submitted to "Sprig" (https://x). 5h there.');
    expect(v?.kind).toBe("disclosed");
    expect(v?.tone).toBe("warning");
  });

  test("imports and re-ships are recognised", () => {
    expect(doubleDipView('SYSTEM: Imported from "Sprig" (https://x) through the YSWS importer.')?.kind).toBe("imported");
    expect(doubleDipView("SYSTEM: https://x was already approved in Pixl before, so this is a re-ship: only new work counts.")?.kind).toBe("reship");
  });

  test("an unknown note still gets a banner", () => {
    const v = doubleDipView("SYSTEM: something new");
    expect(v?.kind).toBe("other");
    expect(v?.text).toBe("something new");
  });
});
