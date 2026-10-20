import { DRAFT_RULES } from "./rules";
import { checkLength, cleanText } from "./text";
import type { ContentReport, ModerationState, ReportReason } from "./types";

// Moderation and abuse handling for the community surfaces (required by the plans: see
// plans/proposals/future-platform-ui.md "Social and community"). In the preview everything is stored in this
// browser only; no one reviews a report. The rules are: report with a reason, hide an item for yourself,
// block a builder, and delete your own content.

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or hate" },
  { value: "unsafe", label: "Personal details or unsafe content" },
  { value: "off-topic", label: "Off topic" },
  { value: "other", label: "Something else" },
];

export function reasonLabel(reason: ReportReason): string {
  return REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

export function hasReported(state: ModerationState, ref: string): boolean {
  return state.reports.some((r) => r.ref === ref);
}

export type ReportResult = { ok: true; state: ModerationState } | { ok: false; error: string };

export interface ReportInput {
  ref: string;
  label: string;
  reason: string;
  note: string;
  hide: boolean;
  id: string;
  at: string;
}

/** Files a report. One report per item per browser; the reason must be one of the listed reasons. */
export function fileReport(state: ModerationState, input: ReportInput): ReportResult {
  if (!REPORT_REASONS.some((r) => r.value === input.reason)) return { ok: false, error: "Choose a reason for the report." };
  const note = cleanText(input.note);
  const noteError = note.length > 0 ? checkLength(note, "Details", { max: DRAFT_RULES.reportNoteMax }) : null;
  if (noteError) return { ok: false, error: noteError };
  if (hasReported(state, input.ref)) return { ok: false, error: "You already reported this." };
  const report: ContentReport = {
    id: input.id,
    ref: input.ref,
    label: input.label.slice(0, 120),
    reason: input.reason as ReportReason,
    note,
    at: input.at,
  };
  return {
    ok: true,
    state: {
      ...state,
      reports: [report, ...state.reports],
      hidden: input.hide ? hideRef(state, input.ref).hidden : state.hidden,
    },
  };
}

export function hideRef(state: ModerationState, ref: string): ModerationState {
  return state.hidden.includes(ref) ? state : { ...state, hidden: [...state.hidden, ref] };
}

export function unhideRef(state: ModerationState, ref: string): ModerationState {
  return state.hidden.includes(ref) ? { ...state, hidden: state.hidden.filter((r) => r !== ref) } : state;
}

/** Unhides every item of one kind ("project", "idea", ...), or all kinds when omitted. */
export function unhideAll(state: ModerationState, kind?: string): ModerationState {
  const keep = kind ? state.hidden.filter((r) => !r.startsWith(`${kind}:`)) : [];
  return keep.length === state.hidden.length ? state : { ...state, hidden: keep };
}

export function blockHandle(state: ModerationState, handle: string): ModerationState {
  return state.blocked.includes(handle) ? state : { ...state, blocked: [...state.blocked, handle] };
}

export function unblockHandle(state: ModerationState, handle: string): ModerationState {
  return state.blocked.includes(handle) ? { ...state, blocked: state.blocked.filter((h) => h !== handle) } : state;
}

/** An item is visible when it is not hidden and its author is not blocked. Your own items are always visible to you. */
export function isVisible(state: ModerationState, ref: string, authorHandle: string, me = "you"): boolean {
  if (authorHandle === me) return true;
  return !state.hidden.includes(ref) && !state.blocked.includes(authorHandle);
}

export function filterVisible<T>(items: T[], state: ModerationState, refOf: (item: T) => string, authorOf: (item: T) => string): T[] {
  return items.filter((item) => isVisible(state, refOf(item), authorOf(item)));
}

/** How many items of a kind are hidden by an explicit hide (blocked authors are counted on the blocked list instead). */
export function hiddenCount(state: ModerationState, kind: string, existingRefs?: string[]): number {
  const mine = state.hidden.filter((r) => r.startsWith(`${kind}:`));
  return existingRefs ? mine.filter((r) => existingRefs.includes(r)).length : mine.length;
}
