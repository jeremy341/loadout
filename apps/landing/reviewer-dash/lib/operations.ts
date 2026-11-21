// Operation Blackout is a Pixl-only event with its own server. LOADOUT has none, so no ship ever belongs to it. Types and labels are Pixl's,
// copied from lib/operations.ts; the lookups answer with nothing.
export const BLACKOUT_SLUG = "operation-blackout";

export type RateMode = "floor" | "additive";

export type OperationStatus = "upcoming" | "active" | "ended" | "paused";
export type EntryStatus =
  | "entered"
  | "shipped"
  | "eligible"
  | "ineligible"
  | "approved"
  | "needs_changes";

export const ENTRY_STATUSES: EntryStatus[] = [
  "entered",
  "shipped",
  "eligible",
  "needs_changes",
  "approved",
  "ineligible",
];

export interface OperationRow {
  id: number;
  slug: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: OperationStatus;
  effectiveStatus: OperationStatus;
  rateUsd: number;
  rateMode: RateMode;
  gracePeriodHours: number;
}

export interface BlackoutContributor {
  userId: string;
  // Legal name (real_name) when on file - owner pages only.
  name: string;
  // display_name only, never real_name: what a first-pass reviewer sees on
  // the review page (canSeeBuilderPII in lib/reviewAccess.ts).
  publicName?: string;
  role: "owner" | "collaborator";
  hackatimeBaseSeconds: number;
  journalBaseSeconds: number;
  fixTrackedSeconds: number;
  eligibleTrackedSeconds: number;
  evidenceOk: boolean;
  evidenceAt: string | null;
  approvedHours: number | null;
  paidHours: number;
  normalUsdRate: number | null;
  effectiveUsdRate: number | null;
  grossPx: number;
  upliftPx: number;
  settled: boolean;
  settleNote: string;
}

export interface BlackoutEntry {
  id: number;
  projectId: number;
  status: EntryStatus;
  joinedAt: string;
  windowStart: string;
  firstQualifiedShipAt: string | null;
  latestShipAt: string | null;
  reshipCount: number;
  rateUsdSnapshot: number;
  rateModeSnapshot: RateMode;
  gracePeriodHoursSnapshot: number;
  decision: "eligible" | "ineligible" | null;
  decisionNote: string;
  decidedBy: string;
  decisionStage: string;
  changesRequestedAt: string | null;
  graceDeadline: string | null;
  fixWindowEnd: string | null;
  systemReason: string;
  contributors: BlackoutContributor[];
  operation: OperationRow;
}


export const TRIAL_HOLD_NOTE = "trial_prize_hold";

export function settleNoteText(note: string): string {
  return note === TRIAL_HOLD_NOTE
    ? "Blackout top-up skipped: Trial prize pending, this person's pixels are held"
    : note;
}


export const ENTRY_STATUS_LABEL: Record<EntryStatus, string> = {
  entered: "Entered",
  shipped: "Shipped, awaiting review",
  eligible: "Eligible",
  needs_changes: "Changes requested",
  approved: "Approved",
  ineligible: "Ineligible",
};


export function fmtHoursFromSeconds(seconds: number): string {
  const h = seconds / 3600;
  return `${Math.round(h * 100) / 100}h`;
}

export function maxApprovableHours(c: Pick<BlackoutContributor, "eligibleTrackedSeconds">): number {
  return Math.round((c.eligibleTrackedSeconds / 3600) * 100) / 100;
}

export const ERROR_TEXT: Record<string, string> = {
  invalid_decision: "Pick eligible or ineligible.",
  reason_required: "Say why this entry is ineligible.",
  no_entry: "This project has no Blackout entry.",
  not_shipped_for_operation: "This entry never shipped inside the operation window.",
  entry_locked: "This Blackout entry is already settled and can't be changed.",
  exceeds_eligible: "Approved Blackout hours can't exceed the tracked time inside the window.",
  invalid_hours: "Blackout hours must be a number of 0 or more.",
  unknown_contributor: "That person isn't credited on this Blackout entry.",
  server_error: "Something went wrong saving the Blackout decision.",
};

export async function getBlackoutEntry(projectId: number): Promise<BlackoutEntry | null> {
  void projectId;
  return null;
}

export async function listBlackoutQueueProjectIds(slug: string = BLACKOUT_SLUG): Promise<number[]> {
  void slug;
  return [];
}

// ---- P4 operations: the sample campaign behind the Operations page ----
// One invented campaign and fifteen entries on real sample projects (sample/ops.ts). The settings an owner changes (pause, extend,
// end, edit, create) are kept in the in-memory store and are gone after a restart. Nothing else (settling, reverting, review
// decisions) does anything. Types are Pixl's.
import { opsStore, type OperationState } from "./sample/ops";

export function effectiveStatusOf(status: OperationStatus, startsAt: string, endsAt: string, now: Date = new Date()): OperationStatus {
  const t = now.getTime();
  if (status === "ended" || t >= new Date(endsAt).getTime()) return "ended";
  if (status === "paused") return "paused";
  if (t < new Date(startsAt).getTime()) return "upcoming";
  return "active";
}

function toOperation(state: OperationState): OperationRow {
  return {
    id: state.id,
    slug: state.slug,
    name: state.name,
    startsAt: state.startsAt,
    endsAt: state.endsAt,
    status: state.status,
    effectiveStatus: effectiveStatusOf(state.status, state.startsAt, state.endsAt),
    rateUsd: state.rateUsd,
    rateMode: state.rateMode,
    gracePeriodHours: state.gracePeriodHours,
  };
}

export async function getOperation(slug: string): Promise<OperationRow | null> {
  const state = opsStore.operation;
  return state && state.slug === slug ? toOperation(state) : null;
}

export async function listOperations(): Promise<OperationRow[]> {
  return opsStore.operation ? [toOperation(opsStore.operation)] : [];
}

export interface OperationStats {
  entries: {
    entries: number;
    not_shipped: number;
    shipped_entries: number;
    pending_review: number;
    eligible: number;
    ineligible: number;
    needs_changes: number;
    approved: number;
  };
  contributors: { approved_hours: number; gross_px: number; uplift_px: number };
  ledger: { net_uplift_px: number; paid_transactions: number };
  pending: { hours: number; gross_usd: number; uplift_max_usd: number };
  participants: number;
  trial_held_skips?: number;
  active_builders_7d: number;
  power_units: number;
  actual_gross_usd: number;
  actual_uplift_usd: number;
  projected_gross_usd: number;
  projected_uplift_max_usd: number;
}

export async function getOperationStats(slug: string): Promise<OperationStats | null> {
  const op = await getOperation(slug);
  if (!op) return null;
  const entries = opsStore.entries;
  const count = (status: EntryStatus) => entries.filter((entry) => entry.status === status).length;
  const approved = entries.reduce((sum, entry) => sum + entry.approvedHours, 0);
  const pendingHours = entries.filter((entry) => entry.status === "shipped" || entry.status === "eligible").reduce((sum, entry) => sum + entry.eligibleHours, 0);
  const upliftPx = entries.reduce((sum, entry) => sum + entry.upliftPx, 0);
  const rate = op.rateUsd;
  return {
    entries: {
      entries: entries.length,
      not_shipped: count("entered"),
      shipped_entries: entries.length - count("entered"),
      pending_review: count("shipped") + count("eligible"),
      eligible: count("eligible"),
      ineligible: count("ineligible"),
      needs_changes: count("needs_changes"),
      approved: count("approved"),
    },
    contributors: { approved_hours: approved, gross_px: upliftPx * 4, uplift_px: upliftPx },
    ledger: { net_uplift_px: upliftPx, paid_transactions: count("approved") },
    pending: { hours: pendingHours, gross_usd: pendingHours * 5, uplift_max_usd: pendingHours * rate },
    participants: entries.length + 3,
    trial_held_skips: 0,
    active_builders_7d: 9,
    power_units: approved * 2,
    actual_gross_usd: approved * 5,
    actual_uplift_usd: approved * rate,
    projected_gross_usd: (approved + pendingHours) * 5,
    projected_uplift_max_usd: (approved + pendingHours) * rate,
  };
}

export interface OperationEntryListItem {
  id: number;
  projectId: number;
  projectName: string;
  ownerName: string;
  status: EntryStatus;
  joinedAt: string;
  firstQualifiedShipAt: string | null;
  eligibleHours: number;
  approvedHours: number;
  paidHours: number;
  upliftPx: number;
  evidenceIncomplete: boolean;
  trialHoldSkipped: boolean;
}

export async function listOperationEntries(
  slug: string,
  opts: { status?: EntryStatus; limit?: number; offset?: number } = {},
): Promise<{ items: OperationEntryListItem[]; total: number }> {
  const op = await getOperation(slug);
  if (!op) return { items: [], total: 0 };
  const rows = opsStore.entries
    .filter((entry) => !opts.status || entry.status === opts.status)
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
  const offset = opts.offset ?? 0;
  return { items: rows.slice(offset, offset + (opts.limit ?? 25)), total: rows.length };
}

export interface RpcResult {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

const ok = async (): Promise<RpcResult> => ({ ok: true });

// Create and the owner's controls change the in-memory campaign; the review-side calls accept and do nothing.
export const operationRpc = {
  reviewDecision: (a: {
    slug: string; projectId: number; decision: "eligible" | "ineligible"; note: string; by: string; stage: "first_pass" | "final";
    hours: { user_id: string; hours: number }[];
  }): Promise<RpcResult> => { void a; return ok(); },
  requestChanges: (projectId: number): Promise<RpcResult> => { void projectId; return ok(); },
  settle: (a: {
    slug: string; projectId: number; by: string;
    contribs: { user_id: string; normal_usd_rate: number; credit_hours: number; skip_reason?: string }[];
  }): Promise<RpcResult> => { void a; return ok(); },
  revert: (projectId: number, by: string): Promise<RpcResult> => { void projectId; void by; return ok(); },
  onBan: (projectId: number): Promise<RpcResult> => { void projectId; return ok(); },
  create: async (a: {
    slug: string; name: string; startsAt: string; endsAt: string; rateUsd: number; rateMode: RateMode; graceHours: number; by: string;
  }): Promise<RpcResult> => {
    if (opsStore.operation && opsStore.operation.slug === a.slug) return { ok: false, error: "slug_taken" };
    if (new Date(a.endsAt).getTime() <= new Date(a.startsAt).getTime()) return { ok: false, error: "ends_before_start" };
    opsStore.operation = {
      id: (opsStore.operation?.id ?? 0) + 1, slug: a.slug, name: a.name, startsAt: a.startsAt, endsAt: a.endsAt,
      status: "active", rateUsd: a.rateUsd, rateMode: a.rateMode, gracePeriodHours: a.graceHours,
    };
    opsStore.entries = [];
    return { ok: true };
  },
  adminUpdate: async (a: {
    slug: string; action: "pause" | "resume" | "extend" | "end" | "edit"; by: string; endsAt?: string | null; startsAt?: string | null;
    name?: string | null; rateUsd?: number | null; rateMode?: RateMode | null; graceHours?: number | null; note?: string;
  }): Promise<RpcResult> => {
    const state = opsStore.operation;
    if (!state || state.slug !== a.slug) return { ok: false, error: "operation_not_found" };
    if (a.action === "end") { state.status = "ended"; state.endsAt = new Date().toISOString(); return { ok: true }; }
    if (state.status === "ended" || new Date(state.endsAt).getTime() <= Date.now()) return { ok: false, error: "operation_ended" };
    if (a.action === "pause") state.status = "paused";
    else if (a.action === "resume") {
      if (state.status !== "paused") return { ok: false, error: "not_paused" };
      state.status = "active";
    } else if (a.action === "extend") {
      if (!a.endsAt || new Date(a.endsAt).getTime() <= new Date(state.endsAt).getTime()) return { ok: false, error: "must_extend_later" };
      state.endsAt = a.endsAt;
    } else {
      if (a.endsAt) state.endsAt = a.endsAt;
      if (a.startsAt) state.startsAt = a.startsAt;
      if (a.name) state.name = a.name;
      if (a.rateUsd != null) state.rateUsd = a.rateUsd;
      if (a.rateMode) state.rateMode = a.rateMode;
      if (a.graceHours != null) state.gracePeriodHours = a.graceHours;
    }
    return { ok: true };
  },
};
