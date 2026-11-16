import { db } from "@/reviewer-dash/lib/db";
import { slackIdFromLabel } from "@/reviewer-dash/lib/reviewStats";

// Reviewers are stored as "Name (SlackID)" labels. This resolves each label's
// Slack id to that person's own Pixl account so their name can link to
// /players/<id>. Reviewers without a Pixl account simply get no link.
export async function reviewerPlayerIds(labels: (string | null | undefined)[]): Promise<Map<string, string>> {
  const slackIds = [...new Set(labels.map((l) => slackIdFromLabel(l ?? "")).filter((id): id is string => !!id))];
  const out = new Map<string, string>();
  if (slackIds.length === 0) return out;
  const { data } = await db.from("users").select("id, slack_id").in("slack_id", slackIds);
  for (const u of (data ?? []) as { id: string; slack_id: string }[]) {
    if (!out.has(u.slack_id)) out.set(u.slack_id, u.id);
  }
  return out;
}

export function reviewerPlayerId(ids: Map<string, string>, label: string | null | undefined): string | null {
  const slackId = slackIdFromLabel(label ?? "");
  return (slackId && ids.get(slackId)) || null;
}
