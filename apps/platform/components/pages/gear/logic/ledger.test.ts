import { describe, expect, test } from "bun:test";
import type { OreEntry } from "../../../../lib/ore-ledger";
import { csvText, ledgerToCsv, ledgerTotals, recentEntries, sourceLabel, withRunningBalance } from "./ledger";

function entry(id: string, amount: number, reason: string, source = "preview"): OreEntry {
  return { id, amount, reason, source, at: "2026-10-20T09:00:00.000Z" };
}

const entries: OreEntry[] = [
  entry("a", 120, "Sample opening balance"),
  entry("b", -50, "Order LO-0001: ESP32 starter kit", "shop"),
  entry("c", 50, "Refund for cancelled order LO-0001", "shop"),
  entry("d", 30, "Award", "award"),
];

describe("withRunningBalance", () => {
  test("adds the balance after each entry", () => {
    expect(withRunningBalance(entries).map((row) => row.balanceAfter)).toEqual([120, 70, 120, 150]);
  });

  test("an empty ledger has no rows", () => {
    expect(withRunningBalance([])).toEqual([]);
  });

  test("never changes the entries it is given", () => {
    const before = JSON.stringify(entries);
    withRunningBalance(entries);
    expect(JSON.stringify(entries)).toBe(before);
  });
});

describe("ledgerTotals", () => {
  test("a refund returns spent Ore, it does not count as earned", () => {
    expect(ledgerTotals(entries)).toEqual({ balance: 150, earned: 150, spent: 0 });
  });

  test("counts spends and earnings separately", () => {
    const totals = ledgerTotals([entry("a", 200, "x"), entry("b", -75, "y", "shop")]);
    expect(totals).toEqual({ balance: 125, earned: 200, spent: 75 });
  });
});

describe("recentEntries", () => {
  test("returns the newest first", () => {
    expect(recentEntries(entries, 2).map((e) => e.id)).toEqual(["d", "c"]);
  });
});

describe("csv export", () => {
  test("quotes cells that hold commas, quotes or line breaks", () => {
    expect(csvText("plain")).toBe("plain");
    expect(csvText("a,b")).toBe('"a,b"');
    expect(csvText('say "hi"')).toBe('"say ""hi"""');
    expect(csvText("two\nlines")).toBe('"two\nlines"');
  });

  test("neutralises spreadsheet formulas", () => {
    expect(csvText("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(csvText("+1")).toBe("'+1");
    expect(csvText("-2")).toBe("'-2");
    expect(csvText("@cmd")).toBe("'@cmd");
    expect(csvText("=HYPERLINK(\"x\",\"y\")")).toBe('"\'=HYPERLINK(""x"",""y"")"');
  });

  test("writes a header, one row per entry and the running balance", () => {
    const csv = ledgerToCsv([entry("a", 120, "Open, with comma"), entry("b", -50, "=evil()", "shop")]);
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[0]).toBe("id,date,source,reason,amount,balance_after");
    expect(lines[1]).toBe('a,2026-10-20T09:00:00.000Z,preview,"Open, with comma",120,120');
    expect(lines[2]).toBe("b,2026-10-20T09:00:00.000Z,shop,'=evil(),-50,70");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  test("an empty ledger still exports the header", () => {
    expect(ledgerToCsv([])).toBe("id,date,source,reason,amount,balance_after\r\n");
  });
});

describe("sourceLabel", () => {
  test("names known sources and passes unknown ones through", () => {
    expect(sourceLabel("shop")).toBe("Shop");
    expect(sourceLabel("mystery")).toBe("mystery");
  });
});
