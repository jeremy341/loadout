// Reviewer records: the public verdict announcement, verdict stats, and reviewer pay. Pure.
//
// API:
//   COUNTED_OUTCOMES = ["approved", "needs-changes", "rejected", "banned"]   housekeeping rows are never counted
//   verdictAnnouncement({ outcome, projectName, projectPath }) -> { channel: "community", text } | { channel: "none" }
//       bans are never announced publicly; the builder hears about them privately (see proposed-bans.ts)
//   countOutcomes(events, { fromMs, toMs }) -> { totals, byReviewerDay }
//   reviewerPayOre(outcome)                -> 2 | 1 | null
//       2 Ore on approval or ban, 1 Ore on needs-changes (settled 22 Nov 2026). Rejected is not settled yet, so it returns null.
export const COUNTED_OUTCOMES = ["approved", "needs-changes", "rejected", "banned"] as const;
export type Outcome = (typeof COUNTED_OUTCOMES)[number];

export function isCountedOutcome(value: string): value is Outcome {
  return (COUNTED_OUTCOMES as readonly string[]).includes(value);
}

export type Announcement = { channel: "community"; text: string } | { channel: "none" };

function cleanName(raw: string): string {
  return raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function verdictAnnouncement(input: { outcome: string; projectName: string; projectPath: string }): Announcement {
  if (!isCountedOutcome(input.outcome) || input.outcome === "banned") return { channel: "none" };
  // Only internal project paths are linked, so an announcement can never point somewhere else.
  if (!/^\/projects\/[a-z0-9-]+$/i.test(input.projectPath)) return { channel: "none" };
  const name = cleanName(input.projectName) || "A project";
  const verb =
    input.outcome === "approved" ? "was approved" : input.outcome === "needs-changes" ? "needs changes" : "was not accepted";
  return { channel: "community", text: `${name} ${verb}. ${input.projectPath}` };
}

export type OutcomeEvent = { reviewerId: string; outcome: string; at: number };

export function countOutcomes(events: readonly OutcomeEvent[], range: { fromMs: number; toMs: number }) {
  const totals: Record<Outcome, number> = { approved: 0, "needs-changes": 0, rejected: 0, banned: 0 };
  const byReviewerDay: Record<string, Record<string, Record<Outcome, number>>> = {};
  for (const event of events) {
    if (!isCountedOutcome(event.outcome)) continue;
    if (event.at < range.fromMs || event.at >= range.toMs) continue;
    totals[event.outcome] += 1;
    const day = new Date(event.at).toISOString().slice(0, 10);
    const byDay = (byReviewerDay[event.reviewerId] ??= {});
    const counts = (byDay[day] ??= { approved: 0, "needs-changes": 0, rejected: 0, banned: 0 });
    counts[event.outcome] += 1;
  }
  return { totals, byReviewerDay };
}

export function reviewerPayOre(outcome: string): 2 | 1 | null {
  if (outcome === "approved" || outcome === "banned") return 2;
  if (outcome === "needs-changes") return 1;
  return null;
}
