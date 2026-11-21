import { describe, expect, test } from "bun:test";
import { numericIdFor } from "./moderation-rules";
import {
  decodeDetail,
  encodeDetail,
  handleLike,
  isOwnerEmail,
  lengthText,
  toBanLogRow,
  toBanRow,
  toFlaggedProposalRow,
  toProposalRow,
  toReportRow,
  toViolationRow,
} from "./moderation-data";

// The mappers are pure: the database rows and the name lookup are plain values here. Nothing is read or written.
const names = new Map([
  ["p-owner", "Lintel"],
  ["p-builder", "Pennant"],
  ["p-reporter", "Tamsin"],
]);
const when = new Date("2026-11-01T10:00:00.000Z");
const later = new Date("2026-11-02T10:00:00.000Z");

describe("ban rows", () => {
  test("a ban has a numeric id derived from the stored id, and no end date (the schema has no expiry)", () => {
    const row = toBanRow({ id: "cban1", personId: "p-builder", bannedById: "p-owner", reason: "Copied a repo.", createdAt: when, liftedAt: null }, names);
    expect(row.id).toBe(numericIdFor("ban", "cban1"));
    expect(row.expires_at).toBeNull();
    expect(row.lifted_at).toBeNull();
    expect(row.banned_by).toBe("Lintel");
    expect(row.users?.display_name).toBe("Pennant");
    expect(row.created_at).toBe(when.toISOString());
  });

  test("a lifted ban carries its lift time", () => {
    const row = toBanRow({ id: "cban2", personId: "p-builder", bannedById: "p-owner", reason: "Copied a repo.", createdAt: when, liftedAt: later }, names);
    expect(row.lifted_at).toBe(later.toISOString());
  });

  test("a name the lookup does not have reads as an empty string, not a crash", () => {
    const row = toBanRow({ id: "cban3", personId: "p-unknown", bannedById: "p-gone", reason: "x", createdAt: when, liftedAt: null }, names);
    expect(row.banned_by).toBe("");
    expect(row.users?.display_name).toBe("");
  });
});

describe("the ban log", () => {
  test("a lift is shown as unban, and the detail is the text inside the structured detail", () => {
    const row = toBanLogRow(
      { id: "mod1", action: "lift", personId: "p-builder", actorId: "p-owner", detail: encodeDetail({ text: "Appeal accepted.", days: null, proposal: null, ban: null }), createdAt: when },
      names,
    );
    expect(row.action).toBe("unban");
    expect(row.detail).toBe("Appeal accepted.");
    expect(row.actor).toBe("Lintel");
    expect(row.player_name).toBe("Pennant");
  });

  test("a log row with plain text from before the structured form reads as its text", () => {
    const row = toBanLogRow({ id: "mod2", action: "ban", personId: "p-builder", actorId: "p-owner", detail: "Permanent, old note", createdAt: when }, names);
    expect(row.detail).toBe("Permanent, old note");
  });
});

describe("detail text", () => {
  test("encode then decode gives the same fields back", () => {
    const detail = { text: "7 days, copied a repo", days: 7, proposal: "cprop", ban: "cban9" };
    expect(decodeDetail(encodeDetail(detail))).toEqual(detail);
  });

  test("text that is not JSON, or JSON that is not an object, reads as the text", () => {
    expect(decodeDetail("just words").text).toBe("just words");
    expect(decodeDetail("123").text).toBe("123");
  });

  test("a length reads as days, and zero or no days reads as permanent", () => {
    expect(lengthText(7)).toBe("7 days");
    expect(lengthText(1)).toBe("1 day");
    expect(lengthText(0)).toBe("Permanent");
    expect(lengthText(null)).toBe("Permanent");
  });
});

describe("report rows", () => {
  const base = {
    id: "crep1",
    reporterId: "p-reporter",
    targetType: "project",
    targetId: "proj-1",
    reason: "Kindness",
    detail: "They called another builder stupid.",
    status: "open",
    resolvedById: null,
    resolvedAt: null,
    createdAt: when,
  };

  test("a project report names the project and its owner as the target, and is never anonymous", () => {
    const row = toReportRow(base, { title: "Static config linter", ownerId: "p-builder" }, names);
    expect(row.subject).toBe("Project: Static config linter");
    expect(row.target_id).toBe("p-builder");
    expect(row.target_name).toBe("Pennant");
    expect(row.reporter_name).toBe("Tamsin");
    expect(row.anonymous).toBe(false);
    expect(row.reason).toBe("They called another builder stupid.");
    expect(row.rule).toBe("Kindness");
  });

  test("an actioned report reads as resolved, with who handled it", () => {
    const row = toReportRow({ ...base, status: "actioned", resolvedById: "p-owner", resolvedAt: later }, { title: "x", ownerId: "p-builder" }, names);
    expect(row.status).toBe("resolved");
    expect(row.handled_by).toBe("Lintel");
    expect(row.handled_at).toBe(later.toISOString());
  });

  test("a journal report reads as a post, and a removed subject says so", () => {
    expect(toReportRow({ ...base, targetType: "journal" }, { title: "Week 3", ownerId: "p-builder" }, names).subject).toBe("Post: Week 3");
    expect(toReportRow(base, undefined, names).subject).toBe("Project: (removed)");
  });

  test("a rule the report does not know reads as Other", () => {
    expect(toReportRow({ ...base, reason: "Vibes" }, undefined, names).rule).toBe("Other");
  });
});

describe("ban proposal rows", () => {
  const proposal = {
    id: "cprop1",
    personId: "p-builder",
    proposedById: "p-reporter",
    reason: "Hours the history does not support.",
    status: "open",
    decidedById: null,
    decidedAt: null,
    createdAt: when,
  };

  test("an open proposal reads as pending, with the length from its propose log", () => {
    const row = toProposalRow(proposal, { days: 7, ban: null }, names);
    expect(row.status).toBe("pending");
    expect(row.days).toBe(7);
    expect(row.id).toBe(numericIdFor("proposal", "cprop1"));
    expect(row.proposed_by).toBe("tamsin");
    expect(row.decided_by).toBeNull();
  });

  test("an overturned proposal reads as rejected, and a confirmed one carries its ban id", () => {
    expect(toProposalRow({ ...proposal, status: "overturned", decidedById: "p-owner", decidedAt: later }, undefined, names).status).toBe("rejected");
    const confirmed = toProposalRow({ ...proposal, status: "confirmed", decidedById: "p-owner", decidedAt: later }, { days: null, ban: "cban7" }, names);
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.ban_id).toBe(numericIdFor("ban", "cban7"));
    expect(confirmed.decided_by).toBe("Lintel");
  });

  test("a proposal with no recorded length reads as permanent, never as a length it did not have", () => {
    expect(toProposalRow(proposal, undefined, names).days).toBe(0);
  });

  test("a project the review desk flagged is a pending proposal with a permanent length and its own id", () => {
    const row = toFlaggedProposalRow(
      { id: "proj-9", ownerId: "p-builder", proposedBanBy: "p-reporter", proposedBanReason: "Hours not supported.", createdAt: when, statusChangedAt: later },
      names,
    );
    expect(row.id).toBe(numericIdFor("project-proposal", "proj-9"));
    expect(row.status).toBe("pending");
    expect(row.days).toBe(0);
    expect(row.created_at).toBe(later.toISOString());
    expect(row.proposed_by).toBe("tamsin");
  });
});

describe("handles and owner emails", () => {
  test("a display name becomes the handle the reviewer pages use", () => {
    expect(handleLike("Jeremy Smith")).toBe("jeremy_smith");
    expect(handleLike("  Lintel!  ")).toBe("lintel");
    expect(handleLike("")).toBe("reviewer");
  });

  test("an owner email matches without case or spaces, and a builder's does not", () => {
    expect(isOwnerEmail(" Owner@Loadout.Test ", ["owner@loadout.test"])).toBe(true);
    expect(isOwnerEmail("builder@loadout.test", ["owner@loadout.test"])).toBe(false);
    expect(isOwnerEmail("owner@loadout.test", [])).toBe(false);
  });
});

describe("violation rows", () => {
  test("a violation's content is its note, and the person is embedded", () => {
    const row = toViolationRow({ id: "cvio1", personId: "p-builder", kind: "Privacy", note: "Named another builder's school.", createdAt: when }, names);
    expect(row.kind).toBe("Privacy");
    expect(row.content).toBe("Named another builder's school.");
    expect(row.users?.display_name).toBe("Pennant");
    expect(row.id).toBe(numericIdFor("violation", "cvio1"));
  });
});

describe("expiry, length and anonymity in the rows", () => {
  test("a temporary ban carries its end time to the Bans page", () => {
    const ends = new Date("2026-11-25T10:00:00.000Z");
    const row = toBanRow({ id: "cban9", personId: "p-builder", bannedById: "p-owner", reason: "Copied a repo.", createdAt: when, liftedAt: null, expiresAt: ends }, names);
    expect(row.expires_at).toBe(ends.toISOString());
  });

  test("a proposal reads the length stored on the row, and falls back to the propose log, then to permanent", () => {
    const base = { id: "cprop1", personId: "p-builder", proposedById: "p-owner", reason: "x", status: "open", decidedById: null, decidedAt: null, createdAt: when };
    expect(toProposalRow({ ...base, days: 7 }, undefined, names).days).toBe(7);
    expect(toProposalRow({ ...base, days: null }, { days: 30, ban: null }, names).days).toBe(30);
    expect(toProposalRow({ ...base, days: null }, undefined, names).days).toBe(0);
  });

  test("the staff row always names the reporter, even on an anonymous report", () => {
    const row = toReportRow(
      {
        id: "crep1",
        reporterId: "p-reporter",
        targetType: "project",
        targetId: "cproj1",
        reason: "Own work",
        detail: "They copied the repo from someone else.",
        status: "open",
        resolvedById: null,
        resolvedAt: null,
        createdAt: when,
        anonymous: true,
      },
      { title: "Clock", ownerId: "p-builder" },
      names,
    );
    expect(row.reporter_name).toBe("Tamsin");
    expect(row.anonymous).toBe(false);
  });
});
