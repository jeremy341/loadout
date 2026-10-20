import type { ActivityEvent, ModerationState, SocialState } from "./types";

// "Activity from people you follow": a short list of the latest events, never a feed. It is cut to a fixed
// number and grouped by calendar day (UTC, from the stored timestamp, so server and browser agree).

export function visibleActivity(
  events: ActivityEvent[],
  social: SocialState,
  moderation: ModerationState,
  limit: number,
): ActivityEvent[] {
  return events
    .filter((e) => social.following.includes(e.handle) && !moderation.blocked.includes(e.handle))
    .sort((a, b) => (a.at === b.at ? (a.id < b.id ? 1 : -1) : a.at < b.at ? 1 : -1))
    .slice(0, Math.max(0, limit));
}

/** "2026-10-19" for a stored timestamp. */
export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export interface DayGroup {
  day: string;
  events: ActivityEvent[];
}

/** Groups newest-first events by day, keeping the order. */
export function groupByDay(events: ActivityEvent[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const event of events) {
    const day = dayKey(event.at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.events.push(event);
    else groups.push({ day, events: [event] });
  }
  return groups;
}

/** "19 Oct 2026", always UTC so server and browser render the same text. */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
