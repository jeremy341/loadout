// Guidelines gate: a first-time reviewer reads each guideline page for a minimum time, then confirms. Rules change, so a version
// number forces a re-read. Pure: the caller measures time on the page and passes it in.
//
// API:
//   READ_WORDS_PER_MINUTE = 200, MIN_READ_MS = 15 s, MAX_READ_MS = 5 min
//   requiredReadMs(wordCount)                 -> ms, scaled to the page length and clamped
//   guidelineGate({ acceptedVersion, currentVersion, dwellMs, wordCount }) -> { canConfirm, needsReread, remainingMs, requiredMs }
export const READ_WORDS_PER_MINUTE = 200;
export const MIN_READ_MS = 15 * 1000;
export const MAX_READ_MS = 5 * 60 * 1000;

export function requiredReadMs(wordCount: number): number {
  const words = Number.isFinite(wordCount) && wordCount > 0 ? wordCount : 0;
  const ms = Math.round((words / READ_WORDS_PER_MINUTE) * 60 * 1000);
  return Math.min(MAX_READ_MS, Math.max(MIN_READ_MS, ms));
}

export function guidelineGate(input: {
  acceptedVersion: number | null;
  currentVersion: number;
  dwellMs: number;
  wordCount: number;
}) {
  const requiredMs = requiredReadMs(input.wordCount);
  const needsReread = input.acceptedVersion !== input.currentVersion;
  const remainingMs = Math.max(0, requiredMs - Math.max(0, input.dwellMs));
  return { requiredMs, needsReread, remainingMs, canConfirm: remainingMs === 0 };
}
