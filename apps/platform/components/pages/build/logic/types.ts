import type { TrackName } from "../../../../lib/sample/builders";

// Record shapes for the Build tabs (Projects, Journals, Reviews, Missions). They are what the preview keeps in
// localStorage. A real service replaces the storage, not these shapes.

export type { TrackName };

/** The four LOADOUT quality dimensions, scored 1 to 9 (Plan 22 section 1, Plan 02 section 9). */
export type Category = "originality" | "technicalDepth" | "execution" | "documentation";
export type Scores = Record<Category, number>;

export interface BomRow {
  id: string;
  part: string;
  qty: number;
  unitCost: number;
  /** Source: a supplier link or a vendor name. Plan 01 section 6.5 asks for quantities and sources. */
  link: string;
}

export interface ProjectVersion {
  id: string;
  label: string;
  notes: string;
  at: number;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  /** Plan 01 section 3: what new technical capability the project creates. Optional in the preview form. */
  capability: string;
  track: TrackName;
  researchMode: boolean;
  repoUrl: string;
  /** SPDX-style id from OPEN_LICENSES, or "" when none is chosen yet. */
  license: string;
  visibility: "public" | "private";
  collaborators: string;
  createdAt: number;
  /** Hackatime (software) or Lapse (hardware), simulated. */
  trackerConnected: boolean;
  /** Hours the simulated tracker reports. A preview input, not data from a real tracker. */
  trackerHours: number;
  /** Hours the builder assigns to this project, never above trackerHours. */
  allocatedHours: number;
  bom: BomRow[];
  versions: ProjectVersion[];
}

export interface JournalEntry {
  id: string;
  projectId: string;
  title: string;
  body: string;
  /** Development hours this entry covers. Each hour can be covered once (Plan 01 section 6.6). */
  hours: number;
  tags: string[];
  isPublic: boolean;
  /** Creation time on the preview clock. The 24-hour payout gate reads the latest of these. */
  at: number;
  editedAt?: number;
}

export interface ReceivedReview {
  id: string;
  createdAt: number;
  scores: Scores;
  reason: string;
  /** Set when an upheld flag removed the review from the countable set. */
  discarded?: boolean;
}

export interface Flag {
  id: string;
  reviewId: string;
  reason: string;
  at: number;
  status: "pending" | "upheld" | "rejected";
  resolvedAt?: number;
}

export interface Snapshot {
  id: string;
  lockedAt: number;
  windowEndsAt: number;
  reviewIds: string[];
  medians: Scores;
  overall: number;
  categoryPercentiles: Scores;
  overallPercentile: number;
  multiplier: number;
  hours: number;
  great: boolean;
  curveVersion: string;
}

export type ShipState = "submitted" | "team_check" | "peer_review" | "flag_window" | "paid" | "changes_requested" | "rejected";

export interface Payout {
  key: string;
  gross: number;
  penalty: number;
  net: number;
  paidAt: number;
}

export interface Ship {
  id: string;
  projectId: string;
  projectName: string;
  version: string;
  state: ShipState;
  submittedAt: number;
  submittedHours: number;
  /** Hours the team approved. Null until the team check passes. */
  approvedHours: number | null;
  aiUse: string[];
  changes: string;
  teamNote: string;
  reviews: ReceivedReview[];
  flags: Flag[];
  snapshot: Snapshot | null;
  /** How many snapshots this ship has taken. Each new one gets a new id, so an award is keyed per snapshot. */
  snapshotCount: number;
  /** A reviewer-approved Great Signal claim lets the curve's ceiling reach 30x (Plan 22 section 3). */
  great: boolean;
  payout: Payout | null;
}

export interface GivenReview {
  id: string;
  shipId: string;
  scores: Scores;
  reason: string;
  claimedAt: number;
  submittedAt: number;
  repoViewed: boolean;
}

export interface ReviewDraft {
  scores: Partial<Scores>;
  reason: string;
}

export interface ActiveAssignment {
  shipId: string;
  claimedAt: number;
  repoViewed: boolean;
  draft: ReviewDraft;
}

export interface ReviewsState {
  active: ActiveAssignment | null;
  done: GivenReview[];
  skipped: string[];
  reported: string[];
  /** Preview shortcut: reviews counted without doing them. Always shown as such. */
  dutyShortcut: number;
}

export interface FlagPenaltyState {
  /** Times (preview clock) of this builder's rejected flags that can still count toward the penalty. */
  rejectedAt: number[];
  /** True when the next final Ore payout loses 5% (Plan 22 section 2). */
  pending: boolean;
}
