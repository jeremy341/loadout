// Age exceptions (area E, owner only). Internal age policy is 13-18. An exception is a person who would otherwise fall outside
// it for a stated reason (for example, turned 19 after shipping). Each one needs a justification. Adding is a Stub.

export type AgeException = { id: string; handle: string; ship: string; justification: string };

export const MIN_JUSTIFICATION = 20;
export const MAX_JUSTIFICATION = 400;

export type ExceptionDraft = { handle: string; justification: string };
export type ExceptionCheck = { ok: true } | { ok: false; reason: string };

// What adding one would check. The form is disabled for now, so this runs only in tests.
export function checkException(draft: ExceptionDraft, existing: readonly Pick<AgeException, "handle">[] = []): ExceptionCheck {
  const handle = draft.handle.trim().replace(/^@/, "").toLowerCase();
  const text = draft.justification.trim();
  if (!/^[a-z0-9_.-]{2,32}$/.test(handle)) return { ok: false, reason: "Enter a handle." };
  if (existing.some((item) => item.handle === handle)) return { ok: false, reason: "This handle already has an exception." };
  if (text.length < MIN_JUSTIFICATION) return { ok: false, reason: `Write a justification of at least ${MIN_JUSTIFICATION} characters.` };
  if (text.length > MAX_JUSTIFICATION) return { ok: false, reason: `Keep the justification under ${MAX_JUSTIFICATION} characters.` };
  return { ok: true };
}
