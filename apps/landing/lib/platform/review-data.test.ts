import { describe, expect, test } from "bun:test";
import { factsForReviewer, toDeskShip } from "./review-data";

type Row = Parameters<typeof toDeskShip>[0];

// A project row as projectSelect loads it (the fields the mapper reads). Only the team and owner fields matter to these tests.
function row(overrides: Partial<Record<string, unknown>> = {}): Row {
  return {
    id: "ship-1",
    seq: 1,
    ownerId: "owner-1",
    title: "A ship",
    description: null,
    track: "software",
    status: "second-pass",
    repoUrl: null,
    demoUrl: null,
    isUpdate: false,
    changeNote: null,
    resubmitCount: 0,
    createdAt: new Date("2026-11-01T00:00:00Z"),
    submittedAt: null,
    firstShippedAt: null,
    reshippedAt: null,
    approvedMinutes: 0,
    reviewNote: null,
    reviewReason: null,
    bannedAt: null,
    firstPassBy: null,
    firstPassAt: null,
    firstPassNote: null,
    firstPassMinutes: null,
    triage: null,
    triageBy: null,
    triageNote: null,
    triageAt: null,
    heldAt: null,
    heldBy: null,
    holdReason: null,
    assignedTo: null,
    assignmentRemindedAt: null,
    proposedBanBy: null,
    proposedBanReason: null,
    claimedBy: null,
    claimedAt: null,
    claimHeartbeatAt: null,
    collaborators: [],
    journal: [],
    owner: { id: "owner-1", displayName: "Owner", birthday: null },
    ...overrides,
  } as unknown as Row;
}

describe("toDeskShip: team facts come from ProjectCollaborator", () => {
  test("accepted rows are collaborators and invited rows are pending invitees", () => {
    const ship = toDeskShip(
      row({
        collaborators: [
          { personId: "c1", status: "accepted" },
          { personId: "i1", status: "invited" },
          { personId: "d1", status: "declined" },
        ],
      }),
    );
    expect(ship.facts.collaboratorIds).toEqual(["c1"]);
    expect(ship.facts.pendingInviteIds).toEqual(["i1"]);
  });

  test("with no collaborators both lists are empty", () => {
    const ship = toDeskShip(row());
    expect(ship.facts.collaboratorIds).toEqual([]);
    expect(ship.facts.pendingInviteIds).toEqual([]);
    expect(ship.selfReviewExceptionIds).toEqual([]);
  });
});

describe("factsForReviewer: SelfReviewException", () => {
  const withTeam = () =>
    toDeskShip(
      row({ collaborators: [{ personId: "c1", status: "accepted" }, { personId: "i1", status: "invited" }] }),
      ["c1", "i1"],
    );

  test("without an exception the stored facts are used unchanged", () => {
    const ship = toDeskShip(row({ collaborators: [{ personId: "c1", status: "accepted" }] }));
    expect(factsForReviewer(ship, "c1")).toBe(ship.facts);
  });

  test("an excepted collaborator is taken off the lists for them, and only for them", () => {
    const ship = withTeam();
    const forC1 = factsForReviewer(ship, "c1");
    expect(forC1.collaboratorIds).toEqual([]);
    expect(forC1.pendingInviteIds).toEqual(["i1"]);
    // Everyone else still sees the team as it is.
    expect(factsForReviewer(ship, "stranger").collaboratorIds).toEqual(["c1"]);
  });

  test("an excepted invitee is lifted too", () => {
    expect(factsForReviewer(withTeam(), "i1").pendingInviteIds).toEqual([]);
  });

  test("an owner is never lifted, even with an exception on their id", () => {
    const ship = toDeskShip(row(), ["owner-1"]);
    const facts = factsForReviewer(ship, "owner-1");
    expect(facts.ownerId).toBe("owner-1");
    expect(facts.collaboratorIds).toEqual([]);
  });
});

describe("toDeskShip: builder privacy in the reviewer payload", () => {
  test("the payload carries no email and no Slack id anywhere", () => {
    const ship = toDeskShip(
      row({ collaborators: [{ personId: "c1", status: "accepted" }], journal: [{ id: "j1", seq: 1, title: "t", body: "b", hours: 1, status: "pending", reviewAction: null, keptMinutes: null, reviewReason: null, authorId: "owner-1", createdAt: new Date() }] }),
    );
    const text = JSON.stringify(ship);
    expect(text).not.toContain("email");
    expect(text).not.toContain("slackId");
    expect(Object.keys(ship.owner).sort()).toEqual(["birthday", "displayName", "id"]);
  });
});
