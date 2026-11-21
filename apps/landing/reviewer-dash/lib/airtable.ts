// Pixl reads and writes an Airtable base (its YSWS submissions). LOADOUT has none, so the reads answer "not connected" without a
// network call and no key is read. Types and field names are Pixl's, copied from lib/airtable.ts.
export type AirtableFieldName = string;

export const JUSTIFICATION_DISPLAY_FIELDS: AirtableFieldName[] = [
  "Optional - Override Hours Spent",
  "Justification - Specific Technical Features",
  "Justification - Deflation Justification",
  "Optional - Override Age Justification",
  "Justification - Additional Justification",
  "Optional - Override Duplicate Justification",
  "Justification - Hackatime Project Name(s) + Date Range(s)",
  "Justification - Submitter Hackatime ID",
  "Justification - Lapse Links, comma-separated",
  "Justification - Alternate Tracking Method",
];

export type FetchRecordResult =
  | { ok: true; fields: Partial<Record<AirtableFieldName, unknown>> }
  | { ok: false; error: string };

export async function fetchAirtableRecord(recordId: string): Promise<FetchRecordResult> {
  void recordId;
  return { ok: false, error: "No submissions table is connected to this site" };
}

// There is no record page to link to.
export function airtableRecordUrl(recordId: string): string | null {
  void recordId;
  return null;
}

export interface SubmissionInfo {
  submitted: boolean;
  unifiedId: string | null;
}

export type SubmissionLookup =
  | { kind: "found"; info: SubmissionInfo }
  | { kind: "missing" }
  | { kind: "error"; error: string };

export const STATUS_FIELD = "Automation - Status";
export const SUBMITTED_STATUS = "2\u2013Submitted";

export async function fetchSubmissionStates(recordIds: string[]): Promise<Map<string, SubmissionLookup>> {
  return new Map(recordIds.map((id) => [id, { kind: "error", error: "No submissions table is connected to this site" } as SubmissionLookup]));
}
