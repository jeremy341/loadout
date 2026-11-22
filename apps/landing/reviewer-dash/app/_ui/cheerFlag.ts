// The flag that carries "an approval was just sent" across the redirect to the next ship. A verdict's server action redirects, so the
// page that sent it is gone by the time the celebration should show; sessionStorage holds the flag for the next page. Every access is in
// a try/catch: private windows and blocked storage must never break a verdict. A flag older than a minute is ignored, so a closed tab
// does not cheer on the next visit.
const KEY = "loadout-review-cheer";
const MAX_AGE_MS = 60_000;

export function markReviewCheer(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // no storage: no celebration, the verdict still goes
  }
}

export function clearReviewCheer(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

/** True once for a fresh flag, then clears it. */
export function takeReviewCheer(now = Date.now()): boolean {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    sessionStorage.removeItem(KEY);
    const at = Number(raw);
    return Number.isFinite(at) && now - at >= 0 && now - at <= MAX_AGE_MS;
  } catch {
    return false;
  }
}
