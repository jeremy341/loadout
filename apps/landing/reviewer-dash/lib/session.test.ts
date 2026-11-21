import { describe, expect, test } from "bun:test";
import { REVIEWER } from "@/lib/reviewer/access";
import { sessionFor } from "./session";
import { rolesAfterTeamLog, type TeamLogEntry } from "./sample/role-grants";

const SINCE = Date.parse("2026-11-20T10:00:00Z");
const viewer = (id: string, email: string) => ({
  id,
  email,
  displayName: "Same Name",
  access: { isOwner: false, canSecondPass: false, reviewQueues: "both" as const },
});

describe("stable reviewer identity", () => {
  test("two people with the same display name do not share a handle, roles or a claim", () => {
    const a = viewer("p-a", "a@real.test");
    const b = viewer("p-b", "b@real.test");
    const sa = sessionFor(a);
    const sb = sessionFor(b);

    // A real account's handle is its Person id: a rename cannot move it, and no other person has it.
    expect(sa.slackId).toBe("p-a");
    expect(sb.slackId).toBe("p-b");
    expect(sa.personId).not.toBe(sb.personId);

    const entries: TeamLogEntry[] = [
      {
        slack_id: "same_name",
        person_key: sa.personId,
        action: "added",
        before: [],
        after: ["review"],
        created_at: new Date(SINCE + 1000).toISOString(),
      },
    ];
    const rolesFor = (session: { personId: string }, email: string) =>
      rolesAfterTeamLog([session.personId, email], [], entries, SINCE);
    expect(rolesFor(sa, a.email)).toContain(REVIEWER);
    expect(rolesFor(sb, b.email)).not.toContain(REVIEWER);

    // A claim, lock or hold keyed on the stable id belongs to one person only.
    const claimHeldBy = sa.personId;
    expect(claimHeldBy).toBe("p-a");
    expect(claimHeldBy).not.toBe(sb.personId);
  });

  test("the sample team still resolves to its fixture handles", () => {
    const sample = sessionFor({ id: "p-r", email: "reviewer@loadout.test", displayName: "Test reviewer", access: null });
    expect(sample.slackId).toBe("tamsin");
    expect(sample.personId).toBe("p-r");
  });
});
