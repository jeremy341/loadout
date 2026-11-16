import { describe, expect, test } from "bun:test";
import {
  canEquip,
  canRemoveUse,
  checkBlockTarget,
  publicToolUses,
  checkUseNote,
  gateConditions,
  pendingToDecline,
  TOOLBELT_MAKER_CAP_ORE,
  TOOLBELT_MAKER_ORE,
  TOOLBELT_MIN_HOURS,
  TOOLBELT_USER_ORE,
  usedByCount,
  type EquipInput,
} from "./toolbelt";

const base = (): EquipInput => ({
  equipper: { id: "me" },
  project: { id: "mine", ownerId: "me", status: "logging" },
  tool: { id: "tool1", ownerId: "maker", status: "approved", hidden: false, repoUrl: "https://github.com/example-handle/tool" },
  existingUses: [],
  blocks: [],
});

const code = (input: EquipInput) => {
  const r = canEquip(input);
  return r.ok ? "ok" : r.code;
};

describe("canEquip", () => {
  test("allows the normal case", () => {
    expect(canEquip(base())).toEqual({ ok: true });
  });
  test("allowed project statuses", () => {
    for (const status of ["draft", "logging", "needs-changes", "needs_changes"]) {
      expect(code({ ...base(), project: { id: "mine", ownerId: "me", status } })).toBe("ok");
    }
    for (const status of ["submitted", "in-review", "approved"]) {
      expect(code({ ...base(), project: { id: "mine", ownerId: "me", status } })).toBe("project-status");
    }
  });
  test("the equipping project must belong to the viewer", () => {
    expect(code({ ...base(), project: { id: "mine", ownerId: "other", status: "draft" } })).toBe("not-your-project");
  });
  test("not your own tool", () => {
    const input = base();
    input.tool.ownerId = "me";
    expect(code(input)).toBe("own-tool");
    const same = base();
    same.tool.id = "mine";
    expect(code(same)).toBe("own-tool");
  });
  test("tool must be approved, visible and open source", () => {
    const a = base();
    a.tool.status = "draft";
    expect(code(a)).toBe("not-approved");
    const b = base();
    b.tool.hidden = true;
    expect(code(b)).toBe("hidden");
    const c = base();
    c.tool.repoUrl = null;
    expect(code(c)).toBe("not-open-source");
    const d = base();
    d.tool.repoUrl = "";
    expect(code(d)).toBe("not-open-source");
  });
  test("a block by that maker refuses; other blocks do not", () => {
    expect(code({ ...base(), blocks: [{ makerId: "maker", blockedId: "me" }] })).toBe("blocked");
    expect(code({ ...base(), blocks: [{ makerId: "maker", blockedId: "someone" }, { makerId: "other", blockedId: "me" }, { makerId: "me", blockedId: "maker" }] })).toBe("ok");
  });
  test("duplicate: pending or confirmed refused, declined allowed again", () => {
    for (const status of ["pending", "confirmed"]) {
      expect(code({ ...base(), existingUses: [{ projectId: "mine", toolId: "tool1", status }] })).toBe("duplicate");
    }
    expect(code({ ...base(), existingUses: [{ projectId: "mine", toolId: "tool1", status: "declined" }] })).toBe("ok");
  });
  test("two tools max, counting pending and confirmed in this project only", () => {
    const two = [
      { projectId: "mine", toolId: "a", status: "pending" },
      { projectId: "mine", toolId: "b", status: "confirmed" },
    ];
    expect(code({ ...base(), existingUses: two })).toBe("limit");
    expect(code({ ...base(), existingUses: [two[0]] })).toBe("ok");
    expect(code({ ...base(), existingUses: [two[0], { projectId: "mine", toolId: "b", status: "declined" }] })).toBe("ok");
    expect(code({ ...base(), existingUses: [...two.map((u) => ({ ...u, projectId: "elsewhere" }))] })).toBe("ok");
  });
  test("refusals carry a readable reason", () => {
    const r = canEquip({ ...base(), existingUses: [{ projectId: "mine", toolId: "a", status: "pending" }, { projectId: "mine", toolId: "b", status: "pending" }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("up to 2");
  });
});

describe("checkUseNote", () => {
  test("accepts a path or a feature", () => {
    expect(checkUseNote("It parses the config in src/config/load.ts at startup.")).toEqual({ ok: true, note: "It parses the config in src/config/load.ts at startup." });
    expect(checkUseNote("Used by the export feature to write files")).toMatchObject({ ok: true });
    expect(checkUseNote("render.py calls it once per frame")).toMatchObject({ ok: true });
  });
  test("collapses whitespace", () => {
    expect(checkUseNote("  the   export\nfeature  here ")).toEqual({ ok: true, note: "the export feature here" });
  });
  test("too short, with the hint", () => {
    const r = checkUseNote("cool");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("at least 10");
    expect(checkUseNote("export it").ok).toBe(false);
    expect(checkUseNote(null).ok).toBe(false);
  });
  test("too long", () => {
    expect(checkUseNote("feature ".repeat(100)).ok).toBe(false);
    expect(checkUseNote(("the feature " + "x".repeat(500)).slice(0, 500)).ok).toBe(true);
  });
  test("long enough but nothing concrete", () => {
    const r = checkUseNote("I used it because it is really great and nice");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("file or feature");
  });
});

describe("gate and counts", () => {
  test("constants", () => {
    expect(TOOLBELT_MIN_HOURS).toBe(25);
    expect([TOOLBELT_USER_ORE, TOOLBELT_MAKER_ORE, TOOLBELT_MAKER_CAP_ORE]).toEqual([50, 10, 500]);
  });
  test("hours condition flips at 25", () => {
    const low = gateConditions({ id: "p" }, { approved: 24 });
    expect(low.conditions.map((c) => c.key)).toEqual(["hours", "core-use", "journal", "review"]);
    expect(low.conditions[0].state).toBe("unmet");
    expect(low.conditions[0].detail).toBe("24 of 25 approved hours on this project.");
    expect(gateConditions({ id: "p" }, { approved: 25 }).conditions[0].state).toBe("met");
    expect(gateConditions({ id: "p" }, { approved: -3 }).hoursApproved).toBe(0);
  });
  test("core use is met only with an active use; reviewer steps never met; never confirmed", () => {
    expect(gateConditions({ id: "p" }, { approved: 30 }).conditions[1].state).toBe("unmet");
    expect(gateConditions({ id: "p" }, { approved: 30 }, [{ status: "declined" }]).conditions[1].state).toBe("unmet");
    const view = gateConditions({ id: "p" }, { approved: 30 }, [{ status: "pending" }]);
    expect(view.conditions[1].state).toBe("met");
    expect(view.conditions[2].state).toBe("review");
    expect(view.conditions[3].state).toBe("review");
    expect(view.confirmed).toBe(false);
  });
  test("usedByCount counts confirmed only", () => {
    expect(usedByCount([])).toBe(0);
    expect(usedByCount([{ status: "pending" }, { status: "confirmed" }, { status: "declined" }, { status: "confirmed" }])).toBe(2);
  });
  test("pendingToDecline picks pending ids", () => {
    expect(pendingToDecline([{ id: "a", status: "pending" }, { id: "b", status: "confirmed" }, { id: "c", status: "declined" }, { id: "d", status: "pending" }])).toEqual(["a", "d"]);
  });
});

describe("removal, blocks and public rows", () => {
  test("canRemoveUse", () => {
    expect(canRemoveUse("pending").ok).toBe(true);
    expect(canRemoveUse("declined").ok).toBe(true);
    expect(canRemoveUse("confirmed").ok).toBe(false);
  });
  test("checkBlockTarget", () => {
    expect(checkBlockTarget("a", "b").ok).toBe(true);
    expect(checkBlockTarget("a", "a").ok).toBe(false);
    expect(checkBlockTarget("a", "").ok).toBe(false);
  });
  test("publicToolUses needs confirmed and both sides public", () => {
    const vis = { status: "approved", hidden: false, showBuilding: false };
    const row = (id: string, status: string, project = vis, tool = vis) => ({ id, status, project, tool });
    const rows = [
      row("ok", "confirmed"),
      row("pending", "pending"),
      row("declined", "declined"),
      row("hidden-tool", "confirmed", vis, { ...vis, hidden: true }),
      row("hidden-project", "confirmed", { ...vis, hidden: true }),
      row("draft-project", "confirmed", { ...vis, status: "draft" }),
      row("building", "confirmed", { status: "logging", hidden: false, showBuilding: true }),
      row("logging-private", "confirmed", { status: "logging", hidden: false, showBuilding: false }),
    ];
    expect(publicToolUses(rows).map((r) => r.id)).toEqual(["ok", "building"]);
  });
});
