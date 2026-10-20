import { describe, expect, test } from "bun:test";
import type { EraState } from "./era";
import {
  becameAdvancementReady,
  buildContributionDraft,
  describeLogged,
  firstErrorField,
  plural,
  shipEvents,
  type ValidatedContribution,
} from "./log-submit";
import type { Contribution } from "./quests";

const DAY = Date.UTC(2026, 9, 20);
const NOW = Date.UTC(2026, 9, 20, 9);
const valid = (extra: Partial<ValidatedContribution> = {}): ValidatedContribution => ({ qty: 2, hours: undefined, dateMs: DAY, note: "", ...extra });

describe("plural", () => {
  test("handles one, many and the irregular journal entry", () => {
    expect(plural(1, "ship")).toBe("1 ship");
    expect(plural(3, "review")).toBe("3 reviews");
    expect(plural(1, "journal entry")).toBe("1 journal entry");
    expect(plural(2, "journal entry")).toBe("2 journal entries");
  });
});

describe("firstErrorField", () => {
  test("returns the first field in form order", () => {
    expect(firstErrorField({})).toBeUndefined();
    expect(firstErrorField({ note: "n", date: "d" })).toBe("date");
    expect(firstErrorField({ note: "n", qty: "q", hours: "h" })).toBe("qty");
  });
});

describe("buildContributionDraft", () => {
  test("stamps noon on the chosen day, capped at now", () => {
    const earlier = buildContributionDraft({ type: "ship", track: "Systems" }, valid({ dateMs: DAY - 86_400_000 }), NOW, "Tools");
    expect(earlier.at).toBe(new Date(DAY - 86_400_000 + 12 * 3_600_000).toISOString());
    const capped = buildContributionDraft({ type: "ship", track: "Systems" }, valid(), NOW, "Tools");
    expect(capped.at).toBe(new Date(NOW).toISOString());
  });

  test("only ships keep the chosen track and an empty note becomes undefined", () => {
    expect(buildContributionDraft({ type: "ship", track: "Systems" }, valid(), NOW, "Tools")).toMatchObject({ track: "Systems", note: undefined });
    const review = buildContributionDraft({ type: "review", track: "Systems" }, valid({ note: "hi", hours: 3 }), NOW, "Tools");
    expect(review).toMatchObject({ type: "review", qty: 2, track: "Tools", note: "hi", hours: 3 });
  });
});

describe("shipEvents", () => {
  test("keeps ships only and scales points by qty", () => {
    const log: Contribution[] = [
      { id: "a", type: "ship", qty: 2, track: "Tools", at: "2026-10-20T12:00:00.000Z" },
      { id: "b", type: "review", qty: 5, track: "Tools", at: "2026-10-20T12:00:00.000Z" },
    ];
    expect(shipEvents(log, 10)).toEqual([{ atMs: Date.UTC(2026, 9, 20, 12), points: 20 }]);
  });
});

describe("becameAdvancementReady", () => {
  const era = (index: number, status: EraState["status"]) => ({ index, status }) as EraState;
  test("only fires on the transition inside the same Era", () => {
    expect(becameAdvancementReady(era(0, "active"), era(0, "ready"))).toBe(true);
    expect(becameAdvancementReady(era(0, "ready"), era(0, "ready"))).toBe(false);
    expect(becameAdvancementReady(era(0, "active"), era(1, "ready"))).toBe(false);
    expect(becameAdvancementReady(era(0, "active"), era(0, "active"))).toBe(false);
  });
});

describe("describeLogged", () => {
  test("ships report Era Points or why there are none", () => {
    expect(describeLogged({ type: "ship", qty: 1, eraPointsGained: 10, completedQuestNames: [] })).toBe("Logged 1 ship. +10 Era Points (Draft).");
    expect(describeLogged({ type: "ship", qty: 2, eraPointsGained: 0, completedQuestNames: [] })).toBe(
      "Logged 2 ships. It is dated before this Era began, so it adds no Era Points.",
    );
  });

  test("other actions say they add no Era Points and quests are listed", () => {
    expect(describeLogged({ type: "journal", qty: 2, eraPointsGained: 0, completedQuestNames: ["A", "B"] })).toBe(
      "Logged 2 journal entries. It counts toward quests and your streak, not Era Points. Quest complete: A, B.",
    );
  });
});
