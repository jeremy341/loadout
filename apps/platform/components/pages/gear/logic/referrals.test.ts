import { describe, expect, test } from "bun:test";
import {
  CODE_PATTERN,
  MAX_INVITES,
  REFERRAL_STAGES,
  addReferral,
  advanceReferral,
  inviteMessage,
  isQualified,
  isSelfReference,
  qualifiedCount,
  referralCode,
  removeReferral,
  removeUsage,
  rewindReferral,
  saveUsage,
  stageLabel,
  validateAppliedCode,
  type Referral,
  type SelfContext,
} from "./referrals";

const NOW = "2026-10-20T10:00:00.000Z";
const code = referralCode("you");
const self: SelfContext = { aliases: ["you", "You (preview)"], code };

function add(list: Referral[], label: string, id = `r${list.length + 1}`) {
  const result = addReferral(list, label, self, id, NOW);
  if (!result.ok) throw new Error(result.error);
  return result.list;
}

describe("referralCode", () => {
  test("is stable for a handle and has the LO- format", () => {
    expect(referralCode("you")).toBe(referralCode("you"));
    expect(referralCode(" YOU ")).toBe(referralCode("you"));
    expect(CODE_PATTERN.test(referralCode("you"))).toBe(true);
    expect(CODE_PATTERN.test(referralCode("ada-cuts"))).toBe(true);
  });

  test("differs between handles", () => {
    const codes = new Set(["you", "ada-cuts", "bit-ferry", "coil-kit", "dee-gpu", "eli-lathe"].map(referralCode));
    expect(codes.size).toBe(6);
  });
});

describe("self-referral is blocked", () => {
  test("your own handle, name and code are refused as an invite", () => {
    for (const label of ["you", "YOU", "You (preview)", "y.o.u", code, code.toLowerCase(), `invite ${code}`]) {
      const result = addReferral([], label, self, "r1", NOW);
      expect(result.ok).toBe(false);
    }
  });

  test("isSelfReference ignores unrelated names", () => {
    expect(isSelfReference("Ada", self)).toBe(false);
    expect(isSelfReference("", self)).toBe(false);
  });

  test("applying your own code is refused", () => {
    const result = validateAppliedCode(code.toLowerCase(), code);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("own code");
  });

  test("applying a well-formed code from someone else is accepted", () => {
    const other = referralCode("ada-cuts");
    const result = validateAppliedCode(` ${other.toLowerCase()} `, code);
    expect(result).toEqual({ ok: true, code: other });
  });

  test("malformed or empty codes are refused", () => {
    expect(validateAppliedCode("", code).ok).toBe(false);
    expect(validateAppliedCode("HELLO", code).ok).toBe(false);
    expect(validateAppliedCode("LO-ABC", code).ok).toBe(false);
  });
});

describe("addReferral", () => {
  test("accepts a pseudonymous nickname", () => {
    const list = add([], "  Robot   Club ");
    expect(list[0].label).toBe("Robot Club");
    expect(list[0].completed).toBe(0);
    expect(stageLabel(list[0])).toBe("Invite sent");
  });

  test("refuses emails, links, symbols, too short and too long", () => {
    for (const label of ["me@example.com", "https://x.test", "www.site.test", "a", "x".repeat(25), "<b>hi</b>", "name!"]) {
      expect(addReferral([], label, self, "r1", NOW).ok).toBe(false);
    }
  });

  test("refuses a duplicate nickname, ignoring case and spacing", () => {
    const list = add([], "Robot Club");
    expect(addReferral(list, "robot  club", self, "r2", NOW).ok).toBe(false);
  });

  test("stops at the invite limit", () => {
    let list: Referral[] = [];
    for (let i = 0; i < MAX_INVITES; i += 1) list = add(list, `Friend ${i}`, `r${i}`);
    expect(addReferral(list, "One more", self, "rx", NOW).ok).toBe(false);
  });

  test("remove drops the invite", () => {
    const list = add(add([], "Alpha"), "Beta");
    expect(removeReferral(list, "r1").map((r) => r.label)).toEqual(["Beta"]);
  });
});

describe("referral funnel", () => {
  test("has the four plan stages ending at the first approved ship", () => {
    expect(REFERRAL_STAGES.map((s) => s.id)).toEqual(["joined", "verified", "working", "shipped"]);
  });

  test("only qualifies after all four stages, in order", () => {
    let list = add([], "Alpha");
    for (let step = 1; step <= 4; step += 1) {
      const result = advanceReferral(list, "r1", NOW);
      list = result.list;
      expect(result.referral?.completed).toBe(step);
      expect(result.qualifiedNow).toBe(step === 4);
      expect(isQualified(list[0])).toBe(step === 4);
    }
    expect(qualifiedCount(list)).toBe(1);
  });

  test("a qualified referral cannot advance further", () => {
    let list = add([], "Alpha");
    for (let i = 0; i < 4; i += 1) list = advanceReferral(list, "r1", NOW).list;
    const extra = advanceReferral(list, "r1", NOW);
    expect(extra.referral).toBeNull();
    expect(extra.qualifiedNow).toBe(false);
    expect(extra.list[0].completed).toBe(4);
  });

  test("an unknown id changes nothing", () => {
    const list = add([], "Alpha");
    expect(advanceReferral(list, "zzz", NOW).referral).toBeNull();
  });

  test("mid-funnel referrals are not counted as qualified", () => {
    let list = add(add([], "Alpha"), "Beta");
    list = advanceReferral(list, "r1", NOW).list;
    list = advanceReferral(list, "r1", NOW).list;
    list = advanceReferral(list, "r1", NOW).list;
    expect(qualifiedCount(list)).toBe(0);
    expect(stageLabel(list[0])).toContain("Stage 3 of 4");
  });

  test("rewind steps back one stage and never below zero", () => {
    let list = add([], "Alpha");
    list = advanceReferral(list, "r1", NOW).list;
    list = rewindReferral(list, "r1");
    list = rewindReferral(list, "r1");
    expect(list[0].completed).toBe(0);
    expect(list[0].stamps).toEqual([]);
  });
});

describe("inviteMessage", () => {
  test("contains the code and no link", () => {
    const text = inviteMessage(code);
    expect(text).toContain(code);
    expect(text).not.toContain("http");
  });
});

describe("Usage Milestones", () => {
  test("saves a whole number of users for a project", () => {
    const result = saveUsage([], { project: " Pixel Forge ", users: "120", note: "" }, "u1", NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entry.project).toBe("Pixel Forge");
      expect(result.entry.users).toBe(120);
    }
  });

  test("updating the same project replaces its entry instead of adding another", () => {
    const first = saveUsage([], { project: "Pixel Forge", users: 10, note: "" }, "u1", NOW);
    if (!first.ok) throw new Error("first");
    const second = saveUsage(first.list, { project: "pixel   forge", users: 40, note: "launch" }, "u2", NOW);
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.list).toHaveLength(1);
      expect(second.list[0].users).toBe(40);
      expect(second.list[0].id).toBe("u1");
    }
  });

  test("refuses negative, fractional, huge and non-numeric counts and short names", () => {
    for (const users of ["-1", "1.5", "abc", "", "99999999999"]) {
      expect(saveUsage([], { project: "Valid name", users, note: "" }, "u1", NOW).ok).toBe(false);
    }
    expect(saveUsage([], { project: "x", users: 5, note: "" }, "u1", NOW).ok).toBe(false);
  });

  test("remove drops the entry", () => {
    const made = saveUsage([], { project: "Pixel Forge", users: 5, note: "" }, "u1", NOW);
    if (!made.ok) throw new Error("made");
    expect(removeUsage(made.list, "u1")).toEqual([]);
  });
});
