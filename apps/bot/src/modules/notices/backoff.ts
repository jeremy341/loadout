// Retry schedule for failed deliveries (spec section 5): 1 minute, then 5 minutes, then 30 minutes, then stop.
// API: nextDelayMs(failedAttempts) -> milliseconds to wait, or null to stop.
// The site applies this schedule to outbox rows; the bot keeps the same table so its own retries (if any) match it.
export const BACKOFF_MS = [60_000, 300_000, 1_800_000] as const;

export function nextDelayMs(failedAttempts: number): number | null {
  // failedAttempts counts failures so far. Zero or less still means "first retry", so it gets the shortest wait.
  const index = Math.max(0, Math.floor(failedAttempts) - 1);
  if (index >= BACKOFF_MS.length) return null;
  return BACKOFF_MS[index] ?? null;
}
