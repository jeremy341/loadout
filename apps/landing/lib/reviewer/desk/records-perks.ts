// Reviewer pay and perks (area E, owner only). Pay per review is not set. Milestone perks are rewards for how many reviews a
// reviewer has done; the thresholds are working values, shown as provisional, and what each perk is has not been chosen.
// Progress is counted in reviews (every counted verdict), never in hours or Ore. Pixl's tiers and pixel payouts are not copied.
import { NOT_SET } from "./records-copy";

export const PAY_PER_REVIEW = NOT_SET;
export const PERKS_PROVISIONAL = "Provisional. The owner has not set these milestones or what each perk is.";

export type PerkMilestone = { id: string; reviews: number; label: string; perk: string };

export const PERK_MILESTONES: readonly PerkMilestone[] = [
  { id: "perk-1", reviews: 10, label: "Reviewer perk 1", perk: NOT_SET },
  { id: "perk-2", reviews: 25, label: "Reviewer perk 2", perk: NOT_SET },
  { id: "perk-3", reviews: 50, label: "Reviewer perk 3", perk: NOT_SET },
  { id: "perk-4", reviews: 100, label: "Reviewer perk 4", perk: NOT_SET },
];

export type PerkState = "reached" | "next" | "ahead";
export type PerkRow = PerkMilestone & { state: PerkState; remaining: number };
export type PerkProgress = { reviews: number; rows: PerkRow[]; next: PerkRow | null; percentToNext: number; allReached: boolean };

export function perkProgress(reviews: number, milestones: readonly PerkMilestone[] = PERK_MILESTONES): PerkProgress {
  const count = Math.max(0, Math.floor(reviews));
  const sorted = [...milestones].sort((a, b) => a.reviews - b.reviews);
  const nextId = sorted.find((item) => item.reviews > count)?.id ?? null;
  const rows: PerkRow[] = sorted.map((item) => ({
    ...item,
    state: item.reviews <= count ? "reached" : item.id === nextId ? "next" : "ahead",
    remaining: Math.max(0, item.reviews - count),
  }));
  const next = rows.find((row) => row.state === "next") ?? null;
  const previous = [...rows].reverse().find((row) => row.state === "reached")?.reviews ?? 0;
  const percentToNext = next ? Math.round(((count - previous) / (next.reviews - previous)) * 100) : 100;
  return { reviews: count, rows, next, percentToNext, allReached: next === null && rows.length > 0 };
}

export function perkLine(progress: PerkProgress): string {
  if (progress.allReached) return `${progress.reviews} reviews. Every milestone is reached.`;
  if (!progress.next) return `${progress.reviews} reviews.`;
  return `${progress.reviews} ${progress.reviews === 1 ? "review" : "reviews"}. ${progress.next.remaining} more to ${progress.next.label.toLowerCase()}.`;
}
