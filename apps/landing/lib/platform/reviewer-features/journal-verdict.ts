// Per-journal approval and hour correction. A reviewer decides each journal entry's minutes before an approval can be sent.
// Pure: the caller passes the entries and gets back what is decided, what is missing, and whether approval may go ahead.
//
// API:
//   CORRECTION_REASON_MIN = 10, CORRECTION_REASON_MAX = 280
//   checkHourCorrection({ assignedMinutes, correctedMinutes, reason }) -> { ok: true, reason } | { ok: false, message }
//   summarizeJournalDecisions(entries)  -> { complete, approvedMinutes, undecidedIds, overAssignedIds, approvable }
//   checkVerdict({ verdict, summary })  -> { ok: true } | { ok: false, message }; approval needs every entry decided and within its minutes
import { cleanPlainText } from "./text";

export const CORRECTION_REASON_MIN = 10;
export const CORRECTION_REASON_MAX = 280;

export const VERDICTS = ["approved", "needs-changes", "rejected"] as const;
export type JournalVerdict = (typeof VERDICTS)[number];

export type HourCorrectionCheck = { ok: true; reason: string } | { ok: false; message: string };

function isMinutes(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function checkHourCorrection(input: { assignedMinutes: number; correctedMinutes: unknown; reason: unknown }): HourCorrectionCheck {
  const reason = cleanPlainText(input.reason);
  if (!isMinutes(input.correctedMinutes)) return { ok: false, message: "Enter whole minutes, zero or more." };
  if (input.correctedMinutes > input.assignedMinutes) {
    return { ok: false, message: "A correction cannot be more than the minutes logged for the entry." };
  }
  if (input.correctedMinutes === input.assignedMinutes) {
    return { ok: false, message: "The corrected minutes match the logged minutes. Nothing to correct." };
  }
  if (reason.length < CORRECTION_REASON_MIN || reason.length > CORRECTION_REASON_MAX) {
    return { ok: false, message: `Give a reason of ${CORRECTION_REASON_MIN} to ${CORRECTION_REASON_MAX} characters.` };
  }
  return { ok: true, reason };
}

export type JournalDecisionInput = { entryId: string; assignedMinutes: number; approvedMinutes: number | null };

export type JournalSummary = {
  complete: boolean;
  approvedMinutes: number;
  undecidedIds: string[];
  overAssignedIds: string[];
  approvable: boolean;
};

export function summarizeJournalDecisions(entries: readonly JournalDecisionInput[]): JournalSummary {
  const undecidedIds = entries.filter((entry) => !isMinutes(entry.approvedMinutes)).map((entry) => entry.entryId);
  const overAssignedIds = entries
    .filter((entry) => isMinutes(entry.approvedMinutes) && entry.approvedMinutes > entry.assignedMinutes)
    .map((entry) => entry.entryId);
  const approvedMinutes = entries.reduce((sum, entry) => sum + (isMinutes(entry.approvedMinutes) ? entry.approvedMinutes : 0), 0);
  const complete = undecidedIds.length === 0;
  return {
    complete,
    approvedMinutes,
    undecidedIds,
    overAssignedIds,
    approvable: complete && overAssignedIds.length === 0 && entries.length > 0,
  };
}

export type VerdictCheck = { ok: true } | { ok: false; message: string };

export function checkVerdict(input: { verdict: string; summary: JournalSummary }): VerdictCheck {
  if (!(VERDICTS as readonly string[]).includes(input.verdict)) return { ok: false, message: "Unknown verdict." };
  if (input.verdict !== "approved") return { ok: true };
  if (input.summary.undecidedIds.length > 0) {
    return { ok: false, message: `${input.summary.undecidedIds.length} journal entries still need minutes.` };
  }
  if (input.summary.overAssignedIds.length > 0) {
    return { ok: false, message: "An approved amount is more than the logged minutes for an entry." };
  }
  if (!input.summary.approvable) return { ok: false, message: "No journal entries to approve." };
  return { ok: true };
}
