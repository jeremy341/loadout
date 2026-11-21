// Reviewer food grant progress is a Pixl shop feature (a SQL function behind it). LOADOUT has no grant, so the lookup answers
// with nothing. The types and the two progress helpers are Pixl's, copied from lib/reviewGrants.ts.

export interface ReviewGrantStatus {
  reviews: number;
  milestones: number[];
  earned: number;
  claimed: number;
  available: number;
  next_at: number | null;
  to_go: number | null;
}

export interface ReviewGrantView {
  userId: string;
  status: ReviewGrantStatus;
  itemId: number | null;
}

export async function getReviewGrantView(slackId: string): Promise<ReviewGrantView | null> {
  void slackId;
  return null;
}

// 0..100 progress between the milestone they last passed and the next one. 100 once every milestone is behind them.
export function progressPct(status: ReviewGrantStatus): number {
  if (status.next_at == null) return 100;
  const prev = [...status.milestones].reverse().find((m) => m <= status.reviews) ?? 0;
  const span = status.next_at - prev;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((status.reviews - prev) / span) * 100)));
}

// The one-line "where you are" summary.
export function progressLine(status: ReviewGrantStatus): string {
  const to = status.to_go ?? 0;
  if (status.next_at == null) return `${status.reviews} reviews, every milestone reached.`;
  return `${status.reviews} reviews, ${to} to go for the next grant (at ${status.next_at}).`;
}
