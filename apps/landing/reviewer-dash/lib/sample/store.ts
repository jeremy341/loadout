// The in-memory sample store behind the reviewer site's adapters (reviewer-dash/lib/db.ts, app/actions.ts).
// Nothing here is saved anywhere: it lives in this server process and is empty again on a restart. The copied pages read the rows
// built in ./index.ts; an action that must visibly change a row (a claim, a verdict, a note, a hold) records the change here and
// the db adapter lays it over the base row. Never imply that any of it is real.
import type { ProjectNoteRow, ProjectRow, ReviewAuditRow } from "../db";
import type { StaffSettings } from "../staffSettings";

type Globals = {
  overrides: Map<number, Partial<ProjectRow>>;
  notes: ProjectNoteRow[];
  audits: ReviewAuditRow[];
  journalApprovals: Map<number, { approved_hours: number | null; deflation_reason: string | null }>;
  ackedGuidelines: Map<string, number>;
  settings: Map<string, StaffSettings>;
  nextId: number;
};

// One store per server process, kept on globalThis so a hot reload in development does not drop it halfway through a session.
const KEY = "__loadoutReviewerSampleStore";
const root = globalThis as unknown as Record<string, Globals | undefined>;
export const store: Globals = (root[KEY] ??= {
  overrides: new Map(),
  notes: [],
  audits: [],
  journalApprovals: new Map(),
  ackedGuidelines: new Map(),
  settings: new Map(),
  nextId: 900_000,
});

export function patchProject(id: number, patch: Partial<ProjectRow>): void {
  store.overrides.set(id, { ...(store.overrides.get(id) ?? {}), ...patch });
}

export function nextSampleId(): number {
  store.nextId += 1;
  return store.nextId;
}

// The one quiet line every action result and notice uses.
export const NOT_SAVED = "Sample data. Nothing was saved.";
