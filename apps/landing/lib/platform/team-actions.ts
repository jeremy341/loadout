// Team facts and Slack identity placeholders. Pure: no database, no network, nothing is sent. Every function has a bun test
// (team-actions.test.ts). The collaborator writes are in collaborators-data.ts; the review desk reads teamFacts through
// review-data.ts.
//
// Staging posture (docs/development/staging-posture.md): a DM placeholder is a record shaped like a BotOutbox row for the future
// queue. It is never enqueued from here, and it says so (status "placeholder", live false). No live Slack claim is made.
//
// API:
//   teamFacts(rows) -> { collaboratorIds, pendingInviteIds }
//       accepted rows are collaborators, invited rows are pending invitees, declined rows count for neither.
//   slackProfileLink(slackId, viewer) -> string | null
//       staff only (viewer.isStaff). Person.slackId is never shown to other builders. The format is
//       https://slack.com/team/<id>; it has NOT been checked against a live workspace.
//   dmPlaceholder({ kind, personId, slackId, text, key, href? }) -> DmPlaceholder | null
//       null when the slack id is not a Slack id. Otherwise an outbox-shaped record (kind, slackId, text, href, dedupeKey) with
//       status "placeholder" and live false. The text is clipped to the outbox limit.
//   TEAM_DM_KINDS                  "team-invite", "team-accepted"
import { isSlackId } from "./bot/auth";
import { checkHref, clipOutbox, siteBase } from "./bot/outbox";

export const TEAM_DM_KINDS = ["team-invite", "team-accepted"] as const;
export type TeamDmKind = (typeof TEAM_DM_KINDS)[number];

export type TeamRow = { personId: string; status: string };

export function teamFacts(rows: readonly TeamRow[]): { collaboratorIds: string[]; pendingInviteIds: string[] } {
  const collaboratorIds = new Set<string>();
  const pendingInviteIds = new Set<string>();
  for (const row of rows) {
    if (!row.personId) continue;
    if (row.status === "accepted") collaboratorIds.add(row.personId);
    if (row.status === "invited") pendingInviteIds.add(row.personId);
  }
  return { collaboratorIds: [...collaboratorIds], pendingInviteIds: [...pendingInviteIds] };
}

export function slackProfileLink(slackId: string | null | undefined, viewer: { isStaff: boolean }): string | null {
  if (!viewer.isStaff || !isSlackId(slackId)) return null;
  return `https://slack.com/team/${slackId}`;
}

export type DmPlaceholder = {
  status: "placeholder";
  live: false;
  kind: TeamDmKind;
  slackId: string;
  text: string;
  href: string | null;
  dedupeKey: string;
};

export function dmPlaceholder(input: {
  kind: TeamDmKind;
  personId: string;
  slackId: string | null | undefined;
  text: string;
  key: string;
  href?: string | null;
}): DmPlaceholder | null {
  if (!isSlackId(input.slackId)) return null;
  const href = checkHref(input.href ?? null, siteBase());
  if (!href.ok) return null;
  return {
    status: "placeholder",
    live: false,
    kind: input.kind,
    slackId: input.slackId,
    text: clipOutbox(input.text),
    href: href.value,
    dedupeKey: `placeholder:${input.kind}:${input.personId}:${input.key}`,
  };
}
