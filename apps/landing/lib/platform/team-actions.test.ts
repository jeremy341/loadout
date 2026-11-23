import { describe, expect, test } from "bun:test";
import { dmPlaceholder, slackProfileLink, teamFacts } from "./team-actions";

const SLACK = "U0ABCDEF12";

describe("teamFacts", () => {
  test("accepted rows are collaborators, invited rows are pending invitees, declined rows count for neither", () => {
    const facts = teamFacts([
      { personId: "a", status: "accepted" },
      { personId: "b", status: "invited" },
      { personId: "c", status: "declined" },
      { personId: "d", status: "accepted" },
    ]);
    expect(facts).toEqual({ collaboratorIds: ["a", "d"], pendingInviteIds: ["b"] });
  });

  test("an empty team gives empty lists, and blank person ids are ignored", () => {
    expect(teamFacts([])).toEqual({ collaboratorIds: [], pendingInviteIds: [] });
    expect(teamFacts([{ personId: "", status: "accepted" }])).toEqual({ collaboratorIds: [], pendingInviteIds: [] });
  });
});

describe("slackProfileLink", () => {
  test("staff get a profile link for a valid Slack id", () => {
    expect(slackProfileLink(SLACK, { isStaff: true })).toBe(`https://slack.com/team/${SLACK}`);
  });

  test("builders never get the link, because the Slack id is never shown to other builders", () => {
    expect(slackProfileLink(SLACK, { isStaff: false })).toBeNull();
  });

  test("a missing or malformed Slack id gives no link", () => {
    expect(slackProfileLink(null, { isStaff: true })).toBeNull();
    expect(slackProfileLink("not-a-slack-id", { isStaff: true })).toBeNull();
    expect(slackProfileLink(undefined, { isStaff: true })).toBeNull();
  });
});

describe("dmPlaceholder", () => {
  const base = { kind: "team-invite" as const, personId: "p1", slackId: SLACK, text: "You were invited to a project.", key: "ship-1" };

  test("is an outbox-shaped record that is marked as a placeholder and is never live", () => {
    const item = dmPlaceholder(base);
    expect(item).toEqual({
      status: "placeholder",
      live: false,
      kind: "team-invite",
      slackId: SLACK,
      text: "You were invited to a project.",
      href: null,
      dedupeKey: "placeholder:team-invite:p1:ship-1",
    });
  });

  test("returns null without a Slack id, so nothing is queued for a builder with no linked Slack account", () => {
    expect(dmPlaceholder({ ...base, slackId: null })).toBeNull();
    expect(dmPlaceholder({ ...base, slackId: "bad" })).toBeNull();
  });

  test("an href must be a site path; an outside link is refused", () => {
    expect(dmPlaceholder({ ...base, href: "/dashboard/projects/1" })?.href).toBe("/dashboard/projects/1");
    expect(dmPlaceholder({ ...base, href: "https://evil.example/x" })).toBeNull();
  });

  test("the text is clipped to the outbox limit", () => {
    const item = dmPlaceholder({ ...base, text: "x".repeat(900) });
    expect(item?.text.length).toBeLessThanOrEqual(600);
  });
});
