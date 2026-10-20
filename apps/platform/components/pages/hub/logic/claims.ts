import { HUB_RULES } from "./rules";
import { validateHttpsUrl } from "./profile";
import { charLength, hasControlChars, isRecord, tidy } from "./text";

// The external-contributor claim (Plan 02 section 20): the first meaningful contribution from outside the
// project team earns a one-time achievement worth +50 Ore. Verification is not built, so the preview lets the
// participant record the claim and a Preview tool stands in for the reviewer's approval. The Ore is credited
// exactly once: `credited` is the idempotency guard, and the ledger itself is checked as a second guard.

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface ContributorClaim {
  projectId: string;
  projectName: string;
  link: string;
  note: string;
  attested: boolean;
  submittedAt: string;
  status: ClaimStatus;
  decidedAt: string | null;
}

export interface Credit {
  at: string;
  /** The ledger entry that carried the Ore. */
  ledgerId: string;
}

export interface ClaimsState {
  contributor: ContributorClaim | null;
  /** Guard keyed by the reward: a key present here means that reward was already credited. */
  credited: Record<string, Credit>;
}

export const NO_CLAIMS: ClaimsState = { contributor: null, credited: {} };

export const CREDIT_KEY = "outside-contribution";
export const CREDIT_REASON = "Achievement: first outside contribution";
export const CREDIT_SOURCE = "achievement";

export interface ClaimInput {
  projectId: string;
  link: string;
  note: string;
  attested: boolean;
}

export interface ClaimErrors {
  project?: string;
  link?: string;
  note?: string;
  attested?: string;
}

export type ClaimCheck = { ok: true; errors: ClaimErrors } | { ok: false; errors: ClaimErrors };

export function validateClaim(input: ClaimInput, projects: readonly { id: string }[]): ClaimCheck {
  const errors: ClaimErrors = {};
  if (!projects.some((p) => p.id === input.projectId)) errors.project = "Choose the project that received the contribution.";
  const link = validateHttpsUrl(input.link);
  if (!link.ok) errors.link = link.error;
  const note = tidy(input.note);
  if (hasControlChars(note)) errors.note = "Use plain text only.";
  else if (charLength(note) > HUB_RULES.claimNoteMax) errors.note = `Keep the note to ${HUB_RULES.claimNoteMax} characters or fewer.`;
  if (!input.attested) errors.attested = "Confirm the statement to record the claim.";
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Can a new claim be recorded? Not while one is waiting, and not once the reward has been credited. */
export function canSubmit(state: ClaimsState): boolean {
  if (Object.hasOwn(state.credited, CREDIT_KEY)) return false;
  return state.contributor === null || state.contributor.status === "rejected";
}

export type SubmitResult = { ok: true; state: ClaimsState } | { ok: false; error: string };

export function submitClaim(state: ClaimsState, input: ClaimInput, projects: readonly { id: string; name: string }[], at: string): SubmitResult {
  if (!canSubmit(state)) return { ok: false, error: "A claim is already recorded." };
  const check = validateClaim(input, projects);
  if (!check.ok) return { ok: false, error: Object.values(check.errors)[0] ?? "Check the form." };
  const project = projects.find((p) => p.id === input.projectId);
  const link = validateHttpsUrl(input.link);
  if (!project || !link.ok) return { ok: false, error: "Check the form." };
  return {
    ok: true,
    state: {
      ...state,
      contributor: {
        projectId: project.id,
        projectName: project.name,
        link: link.value,
        note: tidy(input.note),
        attested: true,
        submittedAt: at,
        status: "pending",
        decidedAt: null,
      },
    },
  };
}

export function withdrawClaim(state: ClaimsState): ClaimsState {
  if (state.contributor?.status !== "pending") return state;
  return { ...state, contributor: null };
}

export function rejectClaim(state: ClaimsState, at: string): ClaimsState {
  if (state.contributor?.status !== "pending") return state;
  return { ...state, contributor: { ...state.contributor, status: "rejected", decidedAt: at } };
}

/** The minimal slice of a ledger entry this module looks at. */
export interface LedgerLike {
  id: string;
  reason: string;
  source: string;
}

/** True when the ledger already carries the contributor Ore, whatever the claims state says. */
export function ledgerHasCredit(entries: readonly LedgerLike[]): boolean {
  return entries.some((e) => e.source === CREDIT_SOURCE && e.reason === CREDIT_REASON);
}

export interface ApprovePlan {
  state: ClaimsState;
  /** True when the caller must now append +50 Ore to the ledger, then call recordCredit. */
  shouldCredit: boolean;
}

/** Marks a pending claim approved. Says whether Ore is still owed; it never is twice. */
export function approveClaim(state: ClaimsState, ledger: readonly LedgerLike[], at: string): ApprovePlan {
  const claim = state.contributor;
  if (!claim || claim.status !== "pending") return { state, shouldCredit: false };
  const approved: ClaimsState = { ...state, contributor: { ...claim, status: "approved", decidedAt: at } };
  const already = Object.hasOwn(state.credited, CREDIT_KEY) || ledgerHasCredit(ledger);
  return { state: approved, shouldCredit: !already };
}

/** Records that the Ore went out, closing the idempotency guard. */
export function recordCredit(state: ClaimsState, ledgerId: string, at: string): ClaimsState {
  if (Object.hasOwn(state.credited, CREDIT_KEY)) return state;
  return { ...state, credited: { ...state.credited, [CREDIT_KEY]: { at, ledgerId } } };
}

export function isApproved(state: ClaimsState): boolean {
  return state.contributor?.status === "approved" || Object.hasOwn(state.credited, CREDIT_KEY);
}

const CLAIM_STATUSES: readonly ClaimStatus[] = ["pending", "approved", "rejected"];

function isClaimStatus(value: unknown): value is ClaimStatus {
  return CLAIM_STATUSES.includes(value as ClaimStatus);
}

function normalizeCredit(value: unknown): Credit | null {
  if (!isRecord(value)) return null;
  if (typeof value.at !== "string" || typeof value.ledgerId !== "string") return null;
  return { at: value.at, ledgerId: value.ledgerId };
}

function normalizeCredited(raw: unknown): Record<string, Credit> {
  const credited: Record<string, Credit> = {};
  if (!isRecord(raw)) return credited;
  const credit = Object.hasOwn(raw, CREDIT_KEY) ? normalizeCredit(raw[CREDIT_KEY]) : null;
  if (credit) credited[CREDIT_KEY] = credit;
  return credited;
}

function normalizeContributor(c: unknown): ContributorClaim | null {
  if (!isRecord(c)) return null;
  if (typeof c.projectId !== "string" || typeof c.projectName !== "string") return null;
  if (typeof c.link !== "string" || typeof c.submittedAt !== "string") return null;
  if (!isClaimStatus(c.status)) return null;
  const link = validateHttpsUrl(c.link);
  if (!link.ok) return null;
  return {
    projectId: c.projectId,
    projectName: c.projectName.slice(0, 200),
    link: link.value,
    note: typeof c.note === "string" ? c.note.slice(0, HUB_RULES.claimNoteMax) : "",
    attested: c.attested === true,
    submittedAt: c.submittedAt,
    status: c.status,
    decidedAt: typeof c.decidedAt === "string" ? c.decidedAt : null,
  };
}

export function normalizeClaims(raw: unknown): ClaimsState {
  if (!isRecord(raw)) return NO_CLAIMS;
  return { contributor: normalizeContributor(raw.contributor), credited: normalizeCredited(raw.credited) };
}
