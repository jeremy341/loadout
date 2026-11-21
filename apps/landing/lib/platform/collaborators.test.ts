import { describe, expect, test } from "bun:test";
import { acceptTitle, canInvite, canRemove, canRespond, countsTowardLimit, inviteTitle, MAX_COLLABORATORS } from "./collaborators";

const project = { ownerId: "owner", status: "approved" };
const target = { id: "friend", banned: false };
const base = { actorId: "owner", project, target, blocked: false, existingStatus: null, activeCount: 0 };

describe("canInvite", () => {
  test("the owner can invite a builder", () => {
    expect(canInvite(base)).toEqual({ ok: true });
  });
  test("only the owner invites", () => {
    const result = canInvite({ ...base, actorId: "friend" });
    expect(!result.ok && result.code).toBe("not-owner");
  });
  test("a banned project is not found", () => {
    const result = canInvite({ ...base, project: { ownerId: "owner", status: "banned" } });
    expect(!result.ok && result.code).toBe("not-found");
  });
  test("no invite to yourself", () => {
    const result = canInvite({ ...base, target: { id: "owner", banned: false } });
    expect(!result.ok && result.code).toBe("self");
  });
  test("a banned or blocked builder reads as unavailable", () => {
    expect(!canInvite({ ...base, target: { id: "friend", banned: true } }).ok).toBe(true);
    const blocked = canInvite({ ...base, blocked: true });
    expect(!blocked.ok && blocked.code).toBe("unavailable");
  });
  test("no second pending invite and no duplicate collaborator", () => {
    const invited = canInvite({ ...base, existingStatus: "invited" });
    expect(!invited.ok && invited.code).toBe("already-invited");
    const accepted = canInvite({ ...base, existingStatus: "accepted" });
    expect(!accepted.ok && accepted.code).toBe("already-collaborating");
  });
  test("a declined builder can be invited again", () => {
    expect(canInvite({ ...base, existingStatus: "declined" })).toEqual({ ok: true });
  });
  test("four collaborators is the most", () => {
    expect(MAX_COLLABORATORS).toBe(4);
    expect(canInvite({ ...base, activeCount: 3 }).ok).toBe(true);
    const full = canInvite({ ...base, activeCount: 4 });
    expect(!full.ok && full.code).toBe("full");
  });
});

describe("countsTowardLimit", () => {
  test("invited and accepted count, declined does not", () => {
    expect(countsTowardLimit("invited")).toBe(true);
    expect(countsTowardLimit("accepted")).toBe(true);
    expect(countsTowardLimit("declined")).toBe(false);
  });
});

describe("canRespond", () => {
  test("only the invited person can answer, and only while invited", () => {
    expect(canRespond({ personId: "friend", row: { personId: "friend", status: "invited" } }).ok).toBe(true);
    expect(canRespond({ personId: "other", row: { personId: "friend", status: "invited" } }).ok).toBe(false);
    expect(canRespond({ personId: "friend", row: { personId: "friend", status: "accepted" } }).ok).toBe(false);
  });
});

describe("canRemove", () => {
  test("the owner or the collaborator may remove, nobody else", () => {
    const row = { personId: "friend" };
    expect(canRemove({ actorId: "owner", ownerId: "owner", row }).ok).toBe(true);
    expect(canRemove({ actorId: "friend", ownerId: "owner", row }).ok).toBe(true);
    expect(canRemove({ actorId: "stranger", ownerId: "owner", row }).ok).toBe(false);
  });
});

describe("titles", () => {
  test("invite and accept titles name the builder and the project", () => {
    expect(inviteTitle("ada", "Hour counter")).toBe("ada invited you to Hour counter");
    expect(acceptTitle("ada", "Hour counter")).toBe("ada joined Hour counter");
  });
  test("a long project title is clipped to 120", () => {
    expect(Array.from(inviteTitle("ada", "x".repeat(200))).length).toBe(120);
    expect(inviteTitle(null, "Hour counter")).toBe("A builder invited you to Hour counter");
  });
});
