// Owner-only rules: erasure of one builder's data, and age exceptions. Pure decisions. Neither deletes anything here; the caller
// performs the work once the decision is "ok", and the database shape for both is in the design note at the end of this file.
//
// API:
//   checkErasureRequest({ actorRole, builderId, confirmText }) -> { ok: true, scope } | { ok: false, message }
//       the owner must type "ERASE <builderId>" exactly; the scope lists what the caller must remove
//   checkAgeException({ actorRole, builderId, justification }) -> { ok: true, justification } | { ok: false, message }
//   AGE_JUSTIFICATION_MIN = 20, AGE_JUSTIFICATION_MAX = 500
//
// Design (not built; needs schema work owned by the platform plan):
//   AgeException  { id, builderId, justification, grantedBy, grantedAt, revokedAt }  one row per grant; a project shows the
//                 active justification. The roadmap stores the justification on the project, so a copy lands on Project.
//   Erasure       removes rows keyed by builderId in every table that holds builder data, including tables with no foreign key
//                 (log rows that store the user id as text). The list of those tables must come from a schema audit, which is
//                 not done yet, so this rule returns the scope as the set of families and does not invent table names.
import { cleanPlainText } from "./text";

export const AGE_JUSTIFICATION_MIN = 20;
export const AGE_JUSTIFICATION_MAX = 500;

// Families of builder data. Whether ledger and audit rows are removed or kept (anonymised) is an open owner decision, so they are
// not listed here.
export const ERASURE_SCOPE = ["profile", "projects", "journals", "media", "reviews-as-builder", "notifications", "community"] as const;

export type OwnerCheck = { ok: true } | { ok: false; message: string };

export function checkErasureRequest(input: { actorRole: string; builderId: string; confirmText: unknown }):
  | { ok: true; scope: readonly string[] }
  | { ok: false; message: string } {
  if (input.actorRole !== "owner") return { ok: false, message: "Only an owner can erase a builder's data." };
  if (input.confirmText !== `ERASE ${input.builderId}`) {
    return { ok: false, message: `Type ERASE ${input.builderId} to confirm.` };
  }
  return { ok: true, scope: ERASURE_SCOPE };
}

export function checkAgeException(input: { actorRole: string; builderId: string; justification: unknown }):
  | { ok: true; justification: string }
  | { ok: false; message: string } {
  if (input.actorRole !== "owner") return { ok: false, message: "Only an owner can add an age exception." };
  if (!input.builderId) return { ok: false, message: "Choose a builder." };
  const justification = cleanPlainText(input.justification, true);
  if (justification.length < AGE_JUSTIFICATION_MIN || justification.length > AGE_JUSTIFICATION_MAX) {
    return { ok: false, message: `Give a justification of ${AGE_JUSTIFICATION_MIN} to ${AGE_JUSTIFICATION_MAX} characters.` };
  }
  return { ok: true, justification };
}
