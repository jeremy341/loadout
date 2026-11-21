import { describe, expect, it } from "bun:test";
import { balances, canSpend, checkLedgerEntry, dayKey, formatOre, groupByDay, clawbackPlan, hoursToOre, oreForMinutes, tenthsOfHour, isLedgerKind, kindLabel, LEDGER_KINDS, runningBalance, statusLabel } from "./ledger";

const at = (iso: string) => new Date(iso);
const e = (amountOre: number, status: string, iso: string) => ({ amountOre, status, createdAt: at(iso) });

describe("balances", () => {
  it("is all zero for no entries", () => {
    expect(balances([])).toEqual({ confirmed: 0, pending: 0, available: 0 });
  });
  it("adds confirmed and keeps pending apart", () => {
    expect(balances([e(240, "confirmed", "2026-11-01"), e(80, "pending", "2026-11-02")])).toEqual({ confirmed: 240, pending: 80, available: 240 });
  });
  it("subtracts negative spends from the confirmed balance", () => {
    expect(balances([e(240, "confirmed", "2026-11-01"), e(-120, "confirmed", "2026-11-02")]).available).toBe(120);
  });
  it("handles a pending-only ledger: nothing is available", () => {
    expect(balances([e(80, "pending", "2026-11-01")])).toEqual({ confirmed: 0, pending: 80, available: 0 });
  });
  it("lets a confirmed spend exceed income (negative balance is reported, not hidden)", () => {
    expect(balances([e(-50, "confirmed", "2026-11-01")]).confirmed).toBe(-50);
  });
  it("ignores an unknown status", () => {
    expect(balances([e(10, "weird", "2026-11-01")])).toEqual({ confirmed: 0, pending: 0, available: 0 });
  });
});

describe("hoursToOre", () => {
  it("is 10 Ore per approved hour", () => {
    expect(hoursToOre(1)).toBe(10);
    expect(hoursToOre(24)).toBe(240);
    expect(hoursToOre(2.25)).toBe(23);
  });
  it("is zero for zero, negative and non-finite hours", () => {
    expect(hoursToOre(0)).toBe(0);
    expect(hoursToOre(-3)).toBe(0);
    expect(hoursToOre(Number.NaN)).toBe(0);
    expect(hoursToOre(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("hoursToOre on the one rules version (hours to 0.1, then Ore rounded up)", () => {
  it("rounds hours to a tenth first, so 1h40 is 1.7 hours and 17 Ore", () => {
    expect(hoursToOre(100 / 60)).toBe(17);
    expect(hoursToOre(1.6666666666666667)).toBe(17);
    expect(hoursToOre(0.25)).toBe(3);
    expect(hoursToOre(1.75)).toBe(18);
  });
  it("gives nothing under 3 minutes", () => {
    expect(hoursToOre(2 / 60)).toBe(0);
    expect(hoursToOre(3 / 60)).toBe(1);
  });
});

describe("oreForMinutes and tenthsOfHour", () => {
  it("tenths of an hour: 100 minutes is 17, under 3 minutes is 0, junk is 0", () => {
    expect(tenthsOfHour(100)).toBe(17);
    expect(tenthsOfHour(2)).toBe(0);
    expect(tenthsOfHour(3)).toBe(1);
    expect(tenthsOfHour(-5)).toBe(0);
    expect(tenthsOfHour(Number.NaN)).toBe(0);
  });
  it("rounds Ore up after the tenths at another rate, and never goes negative", () => {
    expect(oreForMinutes(60)).toBe(10);
    expect(oreForMinutes(6, 5)).toBe(1);
    expect(oreForMinutes(18, 5)).toBe(2);
    expect(oreForMinutes(60, 0)).toBe(0);
    expect(oreForMinutes(-60)).toBe(0);
  });
});

describe("clawbackPlan (unship)", () => {
  it("takes back everything when the builder still holds it", () => {
    expect(clawbackPlan({ netEarnedOre: 120, confirmedBalanceOre: 500 })).toEqual({ clawbackOre: 120, shortfallOre: 0 });
    expect(clawbackPlan({ netEarnedOre: 120, confirmedBalanceOre: 120 })).toEqual({ clawbackOre: 120, shortfallOre: 0 });
  });
  it("caps the clawback at the confirmed balance and reports what was already spent", () => {
    expect(clawbackPlan({ netEarnedOre: 120, confirmedBalanceOre: 45 })).toEqual({ clawbackOre: 45, shortfallOre: 75 });
  });
  it("takes nothing from an empty or negative balance, and nothing when nothing was earned", () => {
    expect(clawbackPlan({ netEarnedOre: 120, confirmedBalanceOre: 0 })).toEqual({ clawbackOre: 0, shortfallOre: 120 });
    expect(clawbackPlan({ netEarnedOre: 120, confirmedBalanceOre: -30 })).toEqual({ clawbackOre: 0, shortfallOre: 120 });
    expect(clawbackPlan({ netEarnedOre: 0, confirmedBalanceOre: 100 })).toEqual({ clawbackOre: 0, shortfallOre: 0 });
    expect(clawbackPlan({ netEarnedOre: -5, confirmedBalanceOre: 100 })).toEqual({ clawbackOre: 0, shortfallOre: 0 });
  });
  it("applying the plan never leaves the balance negative", () => {
    for (const balance of [0, 10, 119, 120, 500]) {
      const { clawbackOre } = clawbackPlan({ netEarnedOre: 120, confirmedBalanceOre: balance });
      expect(balance - clawbackOre).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("formatOre", () => {
  it("groups thousands", () => expect(formatOre(1250)).toBe("1,250 Ore"));
  it("shows zero", () => expect(formatOre(0)).toBe("0 Ore"));
  it("uses a real minus for spends", () => expect(formatOre(-120)).toBe("−120 Ore"));
  it("adds a plus only when signed and positive", () => {
    expect(formatOre(40, { signed: true })).toBe("+40 Ore");
    expect(formatOre(0, { signed: true })).toBe("0 Ore");
    expect(formatOre(-5, { signed: true })).toBe("−5 Ore");
    expect(formatOre(40)).toBe("40 Ore");
  });
  it("rounds fractions", () => expect(formatOre(12.6)).toBe("13 Ore"));
});

describe("labels", () => {
  it("names every kind in plain words", () => {
    for (const kind of LEDGER_KINDS) expect(kindLabel(kind)).not.toBe("Other");
    expect(kindLabel("approved_hours")).toBe("Approved hours");
    expect(kindLabel("dev_seed")).toBe("Starting balance");
  });
  it("falls back for an unknown kind", () => expect(kindLabel("nope")).toBe("Other"));
  it("checks kinds", () => {
    expect(isLedgerKind("shop_purchase")).toBe(true);
    expect(isLedgerKind("x")).toBe(false);
    expect(isLedgerKind(3)).toBe(false);
  });
  it("labels statuses", () => {
    expect(statusLabel("pending")).toBe("Pending");
    expect(statusLabel("confirmed")).toBe("Confirmed");
    expect(statusLabel("x")).toBe("Unknown");
  });
});

describe("groupByDay", () => {
  it("is empty for no entries", () => expect(groupByDay([])).toEqual([]));
  it("groups newest day first with a net", () => {
    const groups = groupByDay([
      e(100, "confirmed", "2026-11-01T09:00:00Z"),
      e(-30, "confirmed", "2026-11-03T10:00:00Z"),
      e(20, "pending", "2026-11-03T08:00:00Z"),
    ]);
    expect(groups.map((g) => g.day)).toEqual(["2026-11-03", "2026-11-01"]);
    expect(groups[0].entries.map((x) => x.amountOre)).toEqual([-30, 20]);
    expect(groups[0].net).toBe(-10);
    expect(groups[1].net).toBe(100);
  });
  it("does not change its input", () => {
    const input = [e(1, "confirmed", "2026-11-01"), e(2, "confirmed", "2026-11-02")];
    groupByDay(input);
    expect(input[0].amountOre).toBe(1);
  });
  it("uses the UTC day", () => expect(dayKey(at("2026-11-01T23:59:59Z"))).toBe("2026-11-01"));
});

describe("runningBalance", () => {
  it("is empty for no entries", () => expect(runningBalance([])).toEqual([]));
  it("runs oldest first and skips pending", () => {
    const rows = runningBalance([
      e(-120, "confirmed", "2026-11-03"),
      e(240, "confirmed", "2026-11-01"),
      e(80, "pending", "2026-11-04"),
      e(50, "confirmed", "2026-11-05"),
    ]);
    expect(rows.map((r) => r.balanceAfter)).toEqual([240, 120, 120, 170]);
  });
  it("can go negative after a spend", () => {
    expect(runningBalance([e(-10, "confirmed", "2026-11-01")])[0].balanceAfter).toBe(-10);
  });
  it("starts at zero for a pending-only ledger", () => {
    expect(runningBalance([e(80, "pending", "2026-11-01")])[0].balanceAfter).toBe(0);
  });
});

describe("canSpend", () => {
  it("allows up to the confirmed balance", () => {
    expect(canSpend(100, 100)).toBe(true);
    expect(canSpend(100, 101)).toBe(false);
  });
  it("rejects zero, negative and fractional amounts", () => {
    expect(canSpend(100, 0)).toBe(false);
    expect(canSpend(100, -5)).toBe(false);
    expect(canSpend(100, 1.5)).toBe(false);
  });
});

describe("checkLedgerEntry", () => {
  const ok = { amountOre: 10, status: "confirmed", kind: "approved_hours", reason: " Ore for 1 hour " };
  it("accepts and trims a good entry", () => {
    const r = checkLedgerEntry(ok);
    expect(r.ok && r.entry.reason).toBe("Ore for 1 hour");
  });
  it("rejects zero, fractions and non-numbers", () => {
    expect(checkLedgerEntry({ ...ok, amountOre: 0 }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, amountOre: 1.5 }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, amountOre: "10" }).ok).toBe(false);
  });
  it("rejects a bad status or kind", () => {
    expect(checkLedgerEntry({ ...ok, status: "done" }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, kind: "gift" }).ok).toBe(false);
  });
  it("needs a reason of at most 200 characters", () => {
    expect(checkLedgerEntry({ ...ok, reason: "  " }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, reason: 5 }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, reason: "a".repeat(200) }).ok).toBe(true);
    expect(checkLedgerEntry({ ...ok, reason: "a".repeat(201) }).ok).toBe(false);
  });
  it("enforces the sign by kind", () => {
    expect(checkLedgerEntry({ ...ok, amountOre: -5 }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, kind: "toolbelt_reward", amountOre: -5 }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, kind: "shop_refund", amountOre: -5 }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, kind: "shop_purchase", amountOre: 5 }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, kind: "funding_deduction", amountOre: 5 }).ok).toBe(false);
    expect(checkLedgerEntry({ ...ok, kind: "shop_purchase", amountOre: -5 }).ok).toBe(true);
    expect(checkLedgerEntry({ ...ok, kind: "adjustment", amountOre: -5 }).ok).toBe(true);
    expect(checkLedgerEntry({ ...ok, kind: "adjustment", amountOre: 5, status: "pending" }).ok).toBe(true);
  });
});
