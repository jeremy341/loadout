// Draft autosave for reviewer notes. A draft lives in the reviewer's own browser (localStorage) and is only a convenience:
// nothing here is a record. A draft is restored only for the same ship version, so a re-shipped project never picks up
// text written against an earlier submission.
//
// API:
//   DRAFT_SAVE_INTERVAL_MS = 3000, DRAFT_MAX_AGE_MS = 7 days, DRAFT_MAX_CHARS = 5000
//   draftKey(reviewerId, shipId)                 -> storage key
//   shouldAutosave({ text, savedText, lastSavedAt, now }) -> boolean
//   readDraft(raw, { shipVersion, now })         -> { text, savedAt } | null; anything unexpected is discarded (null)

export const DRAFT_SAVE_INTERVAL_MS = 3000;
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const DRAFT_MAX_CHARS = 5000;

export function draftKey(reviewerId: string, shipId: string): string {
  return `loadout:review-draft:v1:${reviewerId}:${shipId}`;
}

export function shouldAutosave(input: { text: string; savedText: string; lastSavedAt: number | null; now: number }): boolean {
  if (input.text === input.savedText) return false;
  if (input.text.length > DRAFT_MAX_CHARS) return false;
  if (input.lastSavedAt === null) return true;
  return input.now - input.lastSavedAt >= DRAFT_SAVE_INTERVAL_MS;
}

export type StoredDraft = { text: string; savedAt: number; shipVersion: number };

export function readDraft(raw: unknown, input: { shipVersion: number; now: number }): { text: string; savedAt: number } | null {
  if (typeof raw !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const draft = parsed as Partial<StoredDraft>;
  if (typeof draft.text !== "string" || typeof draft.savedAt !== "number" || typeof draft.shipVersion !== "number") return null;
  if (draft.text.length === 0 || draft.text.length > DRAFT_MAX_CHARS) return null;
  if (draft.shipVersion !== input.shipVersion) return null;
  if (input.now - draft.savedAt > DRAFT_MAX_AGE_MS || draft.savedAt > input.now) return null;
  return { text: draft.text, savedAt: draft.savedAt };
}
