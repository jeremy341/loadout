import { describe, expect, test } from "bun:test";
import { canGiveKudos, kudosLabel } from "./kudos";

const viewer = { id: "me" };
const project = (over: Partial<{ ownerId: string; status: string; ownerBanned: boolean }> = {}) => ({
  ownerId: "maker", status: "approved", ...over,
});
const code = (r: ReturnType<typeof canGiveKudos>) => (r.ok ? "ok" : r.code);

describe("canGiveKudos", () => {
  test("a project of someone else", () => {
    expect(canGiveKudos({ viewer, project: project() })).toEqual({ ok: true });
  });
  test("never your own project, in any state", () => {
    expect(code(canGiveKudos({ viewer, project: project({ ownerId: "me" }) }))).toBe("own-project");
    expect(code(canGiveKudos({ viewer, project: project({ ownerId: "me", status: "draft" }) }))).toBe("own-project");
  });
  test("every stage is public, drafts included", () => {
    for (const status of ["draft", "logging", "submitted", "in-review", "needs_changes", "approved"]) {
      expect(canGiveKudos({ viewer, project: project({ status }) }).ok).toBe(true);
    }
  });
  test("status spelling is normalised", () => {
    expect(canGiveKudos({ viewer, project: project({ status: " Approved " }) }).ok).toBe(true);
  });
  test("banned owners and banned projects are not visible", () => {
    expect(code(canGiveKudos({ viewer, project: project({ ownerBanned: true }) }))).toBe("not-visible");
    expect(code(canGiveKudos({ viewer, project: project({ status: "banned" }) }))).toBe("not-visible");
  });
});

describe("kudosLabel", () => {
  test("zero, one and many", () => {
    expect(kudosLabel(0)).toBe("No kudos yet");
    expect(kudosLabel(1)).toBe("1 kudo");
    expect(kudosLabel(12)).toBe("12 kudos");
  });
  test("bad input reads as zero or rounds down", () => {
    expect(kudosLabel(-3)).toBe("No kudos yet");
    expect(kudosLabel(Number.NaN)).toBe("No kudos yet");
    expect(kudosLabel(2.9)).toBe("2 kudos");
  });
});
