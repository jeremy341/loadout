export const round1 = (n: number): number => Math.round(n * 10) / 10;

export interface JournalRow {
  hours: number | string;
  approved_hours?: number | string | null;
  user_id?: string;
}

export function computeClaimedHours(params: {
  hackatimeSeconds: number | null | undefined;
  kind?: string | null;
  /** Required for hardware projects to isolate owner journal hours. */
  ownerUserId?: string;
  journals: JournalRow[];
  raw?: boolean;
}): number {
  const { hackatimeSeconds, kind, ownerUserId, journals, raw = false } = params;
  const journalHours = round1(
    journals.reduce((s, j) => s + (Number(raw ? j.hours : (j.approved_hours ?? j.hours)) || 0), 0),
  );
  const rawTrackedHours = round1(((Number(hackatimeSeconds) || 0) / 3600));

  if (kind === "hardware") {
    const ownerJournals = ownerUserId ? journals.filter((j) => j.user_id === ownerUserId) : journals;
    const rawOwnerJournalHours = round1(
      ownerJournals.reduce((s, j) => s + (Number(j.hours) || 0), 0),
    );
    const hackatimeOnlyHours = Math.max(0, round1(rawTrackedHours - rawOwnerJournalHours));
    return round1(hackatimeOnlyHours + journalHours);
  }

  return round1(rawTrackedHours + journalHours);
}
