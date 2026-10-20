import { describe, expect, test } from "bun:test";
import { ALL_MISSION_DEFS, MISSIONS, QUESTS } from "../content";
import {
  approvedIdsOf,
  isEditable,
  lockInfo,
  missionAwardKey,
  prerequisiteChain,
  prerequisiteProblems,
  stepProgress,
  submissionBlockers,
  toggleStep,
  transitionMission,
  type MissionProgress,
} from "./missions";
import { isPublicUrl } from "./validate";

describe("status machine", () => {
  test("draft -> submitted -> in review -> approved", () => {
    expect(transitionMission("draft", "submit")).toBe("submitted");
    expect(transitionMission("submitted", "pickup")).toBe("in_review");
    expect(transitionMission("in_review", "approve")).toBe("approved");
  });
  test("needs changes goes back to submitted", () => {
    expect(transitionMission("in_review", "requestChanges")).toBe("needs_changes");
    expect(transitionMission("needs_changes", "submit")).toBe("submitted");
  });
  test("illegal moves are refused", () => {
    expect(transitionMission("draft", "approve")).toBeNull();
    expect(transitionMission("submitted", "approve")).toBeNull();
    expect(transitionMission("approved", "submit")).toBeNull();
    expect(transitionMission("in_review", "submit")).toBeNull();
  });
  test("only drafts and sent-back missions are editable", () => {
    expect(isEditable("draft")).toBe(true);
    expect(isEditable("needs_changes")).toBe(true);
    expect(isEditable("submitted")).toBe(false);
    expect(isEditable("in_review")).toBe(false);
    expect(isEditable("approved")).toBe(false);
  });
});

describe("prerequisites", () => {
  const def = { prerequisites: ["a", "b"] };
  test("locked until every prerequisite is approved", () => {
    expect(lockInfo(def, []).locked).toBe(true);
    expect(lockInfo(def, ["a"])).toEqual({ locked: true, missing: ["b"] });
    expect(lockInfo(def, ["a", "b"]).locked).toBe(false);
    expect(lockInfo({ prerequisites: [] }, []).locked).toBe(false);
  });
  test("only approved missions unlock others", () => {
    const progress = [
      { missionId: "a", status: "approved" },
      { missionId: "b", status: "in_review" },
      { missionId: "c", status: "draft" },
    ] as MissionProgress[];
    expect(approvedIdsOf(progress)).toEqual(["a"]);
  });
  test("the real catalogue has no unknown, self or circular prerequisites", () => {
    expect(prerequisiteProblems(ALL_MISSION_DEFS)).toEqual([]);
  });
  test("a bad catalogue is caught", () => {
    expect(prerequisiteProblems([{ id: "a", prerequisites: ["a"] }]).length).toBeGreaterThan(0);
    expect(prerequisiteProblems([{ id: "a", prerequisites: ["zzz"] }]).length).toBeGreaterThan(0);
    expect(
      prerequisiteProblems([
        { id: "a", prerequisites: ["b"] },
        { id: "b", prerequisites: ["a"] },
      ]).some((p) => p.startsWith("cycle")),
    ).toBe(true);
  });
  test("the chain lists prerequisites before the mission itself", () => {
    const chain = prerequisiteChain("m-ship-end-to-end", ALL_MISSION_DEFS);
    expect(chain[chain.length - 1]).toBe("m-ship-end-to-end");
    expect(chain.indexOf("m-first-journal")).toBeLessThan(chain.indexOf("m-open-source"));
    expect(chain.indexOf("m-open-source")).toBeLessThan(chain.indexOf("m-readme"));
  });
  test("the first mission has no prerequisite and unlocks the next", () => {
    const first = MISSIONS.find((m) => m.id === "m-first-journal")!;
    const second = MISSIONS.find((m) => m.id === "m-open-source")!;
    expect(lockInfo(first, []).locked).toBe(false);
    expect(lockInfo(second, []).locked).toBe(true);
    expect(lockInfo(second, ["m-first-journal"]).locked).toBe(false);
  });
});

describe("steps and submission", () => {
  const def = MISSIONS.find((m) => m.id === "m-open-source")!;
  test("step progress counts only known steps and toggles", () => {
    expect(stepProgress(def, ["s1", "s2", "nope"])).toEqual({ done: 2, total: def.steps.length });
    expect(toggleStep(["s1"], "s2")).toEqual(["s1", "s2"]);
    expect(toggleStep(["s1", "s2"], "s1")).toEqual(["s2"]);
  });
  test("a submission needs every step, text and a valid link", () => {
    const all = def.steps.map((s) => s.id);
    expect(submissionBlockers(def, { checkedStepIds: [], text: "", url: "" }, isPublicUrl).length).toBe(3);
    expect(submissionBlockers(def, { checkedStepIds: all, text: "Done.", url: "" }, isPublicUrl)).toEqual(["Add a link to your work."]);
    expect(submissionBlockers(def, { checkedStepIds: all, text: "Done.", url: "javascript:x" }, isPublicUrl)).toEqual(["The link must be a public http or https address."]);
    expect(submissionBlockers(def, { checkedStepIds: all, text: "Done.", url: "https://example.org/repo" }, isPublicUrl)).toEqual([]);
  });
  test("a mission that needs no link does not ask for one", () => {
    const noLink = MISSIONS.find((m) => !m.needsUrl)!;
    const all = noLink.steps.map((s) => s.id);
    expect(submissionBlockers(noLink, { checkedStepIds: all, text: "Done.", url: "" }, isPublicUrl)).toEqual([]);
  });
});

describe("catalogue content", () => {
  test("ids are unique and every mission has steps and a guide", () => {
    const ids = ALL_MISSION_DEFS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of ALL_MISSION_DEFS) {
      expect(def.steps.length).toBeGreaterThan(0);
      expect(new Set(def.steps.map((s) => s.id)).size).toBe(def.steps.length);
      expect(def.submissionGuide.length).toBeGreaterThan(0);
    }
  });
  test("curated missions use the draft reward and quests quote the plan's example values", () => {
    expect(MISSIONS.every((m) => m.rewardSource === "draft")).toBe(true);
    expect(QUESTS.every((q) => q.rewardSource === "plan-example")).toBe(true);
    expect(QUESTS.find((q) => q.id === "q-2x")?.rewardOre).toBe(50);
  });
  test("no game, map, NPC or energy wording in any mission", () => {
    const text = JSON.stringify(ALL_MISSION_DEFS).toLowerCase();
    for (const banned of ["npc", "energy", "region", "map "]) expect(text.includes(banned)).toBe(false);
  });
  test("mission award keys are stable", () => {
    expect(missionAwardKey("m-1")).toBe("mission:m-1");
  });
});
