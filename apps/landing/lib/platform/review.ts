import type { ReviewQueueScope, ReviewerAccess } from "../reviewer/access";
import { oreForMinutes, tenthsOfHour } from "./ledger";
import type { Track } from "./progress";
import { REVIEW_AUDITS, REVIEW_LOG, REVIEW_SHIPS, REVIEWERS } from "./review-fixtures";

export { REVIEW_AUDITS, REVIEW_LOG, REVIEW_SHIPS, REVIEWERS };

// The reviewer site's types and pure helpers. There are no ship or review tables yet, so every ship, builder, reviewer and
// audit entry (in review-fixtures.ts) is invented and nothing can be saved. The shape follows Pixl's review area
// (references/pixl/apps/internal-dashboard: app/review, lib/db.ts, lib/reviewAssignment.ts, app/actions.ts reviewProject):
//   first pass (the queue)  ->  second pass, where an owner or final reviewer gives the verdict  ->  approved
//   a first-pass "request changes" goes straight back to the builder; a first-pass "ban" is only a proposal that an owner
//   confirms or overturns in Proposed bans.
// Pixl's fraud-review stage (Robert) is not ported, so a first-pass approval parks in Second pass directly. There are no scores,
// no multipliers and no peer review: the four quality dimensions guide a written reason (plans/01 sections 6.4, 8 and 35).

export type ReviewKind = "software" | "hardware";
export const REVIEW_KINDS: readonly ReviewKind[] = ["software", "hardware"];
export const KIND_LABELS: Record<ReviewKind, string> = { software: "Software", hardware: "Hardware" };

// Where a ship is. Waiting and Claimed are the first-pass queue (Pixl: status "shipped", Claimed is a reviewer holding it).
// Second pass and Proposed ban are Pixl's "second_review": the first pass passed it, or proposed banning it, and a final
// reviewer decides. Approved, Needs changes and Banned are the verdicts.
export type ReviewStatus = "waiting" | "claimed" | "second-pass" | "proposed-ban" | "approved" | "needs-changes" | "banned";
export const REVIEW_STATUSES: readonly ReviewStatus[] = ["waiting", "claimed", "second-pass", "proposed-ban", "approved", "needs-changes", "banned"];
export const STATUS_LABELS: Record<ReviewStatus, string> = {
  waiting: "Waiting",
  claimed: "Claimed",
  "second-pass": "Second pass",
  "proposed-ban": "Ban proposed",
  approved: "Approved",
  "needs-changes": "Needs changes",
  banned: "Banned",
};
export const STATUS_MEANING: Record<ReviewStatus, string> = {
  waiting: "Submitted and in the first-pass queue. Nobody has taken it.",
  claimed: "A reviewer opened it for the first pass and is working on it.",
  "second-pass": "Passed the first pass. An owner or a final reviewer gives the verdict.",
  "proposed-ban": "A first-pass reviewer proposed banning it. An owner confirms or overturns the proposal.",
  approved: "Approved. The builder sees the written reason and the approved hours count.",
  "needs-changes": "Sent back to the builder with a written reason. They fix it and ship again.",
  banned: "Banned. It cannot be shipped again.",
};

// The moves a ship can make. A builder who ships again after changes puts it back in the queue; a final reviewer who is not sure
// can send a ship in Second pass back to the first pass.
export const STATUS_TRANSITIONS: Record<ReviewStatus, readonly ReviewStatus[]> = {
  waiting: ["claimed"],
  claimed: ["waiting", "second-pass", "proposed-ban", "needs-changes"],
  "second-pass": ["approved", "needs-changes", "banned", "waiting"],
  "proposed-ban": ["banned", "approved", "needs-changes", "second-pass", "waiting"],
  approved: [],
  "needs-changes": ["waiting"],
  banned: [],
};

export function nextStatuses(status: ReviewStatus): readonly ReviewStatus[] {
  return STATUS_TRANSITIONS[status];
}

export function canMove(from: ReviewStatus, to: ReviewStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

// The first-pass queue is the ships nobody has finished a first look at.
export function inQueue(status: ReviewStatus): boolean {
  return status === "waiting" || status === "claimed";
}

// Second pass and Proposed ban hold a final reviewer's decision (Pixl: status second_review).
export function inFinalStage(status: ReviewStatus): boolean {
  return status === "second-pass" || status === "proposed-ban";
}

// A verdict has been given. Needs changes counts: it sits in Reviewed until the builder ships again. Banned does not (Pixl's
// Reviewed list is approved and needs-changes only).
export function isDecided(status: ReviewStatus): boolean {
  return status === "approved" || status === "needs-changes";
}

// A verdict on a ship: Pixl's approved, needs changes (request changes) and banned.
export type ReviewOutcome = "approved" | "needs-changes" | "banned";
export const OUTCOME_LABELS: Record<ReviewOutcome, string> = { approved: "Approved", "needs-changes": "Needs changes", banned: "Banned" };

// What a reviewer does with the time one journal entry claims (plan 01 section 6.4).
export type JournalAction = "approve-all" | "partial" | "clarify" | "reject";
export const JOURNAL_ACTIONS: readonly JournalAction[] = ["approve-all", "partial", "clarify", "reject"];
export const JOURNAL_ACTION_LABELS: Record<JournalAction, string> = {
  "approve-all": "Approve all assigned time",
  partial: "Approve part of it",
  clarify: "Ask for clarification",
  reject: "Reject as unverifiable",
};

export type ReviewJournal = {
  day: string;
  minutes: number;
  text: string;
  // Only on ships whose time a reviewer has already judged.
  action?: JournalAction;
  // Minutes kept when the action is partial.
  keptMinutes?: number;
  // The reason a reviewer gave for keeping less than the entry claims.
  reason?: string;
};

export type BomLine = { part: string; qty: number; source: string };
export type BuildPhoto = { day: string; caption: string };

export type HackatimeProject = { name: string; minutes: number; sessions: number; first: string; last: string };
export type TrustLevel = "green" | "yellow" | "red" | "blue";

// Software time comes from Hackatime. Hardware time comes from Lapse, whose recordings only reviewers can see, and hardware
// ships also carry a bill of materials, build photos and a list of the design files in the public source.
export type ReviewEvidence =
  | { source: "hackatime"; projects: HackatimeProject[]; languages: { name: string; percent: number }[]; trust: TrustLevel }
  | { source: "lapse"; recordings: { day: string; minutes: number }[]; bom: BomLine[]; photos: BuildPhoto[]; designFiles: string[] };

// The preset reasons for a needs-changes decision. They are reasons, not verdicts.
export type ChangeReason = "track" | "readme" | "hours" | "ai" | "other";
export const CHANGE_REASONS: readonly ChangeReason[] = ["track", "readme", "hours", "ai", "other"];
export const CHANGE_REASON_LABELS: Record<ChangeReason, string> = {
  track: "Does not fit the track",
  readme: "README missing steps",
  hours: "Hours do not match the work",
  ai: "Too much AI",
  other: "Other",
};

export type ReviewDecision = {
  outcome: ReviewOutcome;
  by: string;
  hoursAgo: number;
  // The note the builder sees.
  reason: string;
  // Why changes were asked for. "track" means the work does not fit the project's track (plan 01 section 4.7).
  reasonCode?: ChangeReason;
};

// Pixl's project types (lib/reviewTypeFilter.ts groups them for the queue filter).
export type ProjectType = "web" | "windows" | "mac" | "linux" | "cross_platform" | "python" | "android" | "ios" | "hardware" | "cad" | "other";
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  web: "Web",
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
  cross_platform: "Cross-platform",
  python: "Python",
  android: "Android",
  ios: "iOS",
  hardware: "Hardware",
  cad: "CAD",
  other: "Other",
};

export type FirstPassVerdict = "approved" | "needs-changes" | "banned";

// What the first-pass reviewer wrote when they passed a ship to a final reviewer or proposed a ban.
export type FirstPass = {
  by: string;
  hoursAgo: number;
  verdict: FirstPassVerdict;
  // Minutes they credited of what was claimed.
  minutes: number | null;
  note: string;
};

export type ReviewCommit = {
  sha: string;
  day: string;
  message: string;
  author: string;
  additions: number;
  deletions: number;
  // Tracked coding time since the previous commit, in minutes, when there is a record to compare with.
  codedMinutes: number | null;
  // Signed by an AI tool (co-author trailer, bot author or generated-with footer).
  ai?: boolean;
};

export type ReadmeSection = { heading: string; text: string };
export type Readme = { title: string; sections: ReadmeSection[] };

export type ProjectNote = { id: string; author: string; hoursAgo: number; body: string };

export type ReviewCollaborator = { handle: string; trackedMinutes: number; journalMinutes: number };

export type ReviewShip = {
  id: string;
  title: string;
  builder: string;
  kind: ReviewKind;
  projectType: ProjectType;
  isGame: boolean;
  // The project's one track. Picked at creation, locked on submit; all Track XP from the ship goes to it.
  track: Track;
  researchMode: boolean;
  status: ReviewStatus;
  // When this ship was sent in. A fix-and-reship counts from the first time the builder sent it in (firstShippedHoursAgo), an
  // update of an approved ship only from this ship (Pixl: lib/queueWait.ts).
  submittedHoursAgo: number;
  firstShippedHoursAgo?: number;
  claimedBy: string | null;
  capability: string;
  evidence: ReviewEvidence;
  journals: ReviewJournal[];
  ai: { percent: number; uses: string[]; note: string };
  // The public source and demo addresses, as text. These are samples, so they are not links.
  source: string;
  demo: string | null;
  commits: ReviewCommit[];
  readme: Readme | null;
  collaborators?: ReviewCollaborator[];
  firstPass?: FirstPass;
  decision?: ReviewDecision;
  // Reserved for the reviewer who asked for changes: only they (and owners) can open it until the window ends.
  reserved?: { reviewer: string; hoursLeft: number };
  hold?: { by: string; hoursAgo: number; reason: string };
  ban?: { by: string; hoursAgo: number; reason: string };
  // An update of an already approved ship: the hours are cumulative.
  update?: { priorApprovedMinutes: number; notes: string };
  shipNote?: string;
  expeditionId?: string;
  // The builder turned 19 between shipping and this review (the age policy is 13 to 18).
  turnedNineteen?: boolean;
  builderAge: number;
  builderCountry: string;
  notes: ProjectNote[];
  // The three final-stage checks, in order, when a final reviewer has ticked them.
  finalChecks?: [boolean, boolean, boolean];
};

export type ReviewAccess = "software" | "hardware" | "both";
export const ACCESS_LABELS: Record<ReviewAccess, string> = { software: "Software", hardware: "Hardware", both: "Both queues" };

// One reviewer's verdict counts for a window of time (Pixl's chart buckets): final approvals, first-pass approvals, changes
// requested, and bans. A first-pass ban proposal is not a verdict, so it is not counted.
export type VerdictCounts = { approved: number; firstPass: number; changes: number; rejected: number };
export type VerdictWindowKey = "all" | "day" | "week" | "month";

export type Reviewer = {
  id: string;
  handle: string;
  access: ReviewAccess;
  secondPass: boolean;
  thisWeek: number;
  allTime: number;
  // Approvals at any stage (final approvals plus first-pass approvals), and everything sent back or banned.
  accepted: number;
  rejected: number;
  avgSeconds: number;
  verdicts: Record<VerdictWindowKey, VerdictCounts>;
  // Hours credited on final approvals.
  hoursCredited: number;
  lastActiveHoursAgo: number;
};

// ---- Audits: the verdict history (Pixl's review_audits) ----

// Pixl writes one of these for every verdict, including the first pass.
export type AuditVerdict = "approved" | "first_pass_approved" | "needs_changes" | "banned" | "first_pass_banned" | "reverted";
export const AUDIT_VERDICT_LABELS: Record<AuditVerdict, string> = {
  approved: "Approved",
  first_pass_approved: "Approved (1st pass)",
  needs_changes: "Needs changes",
  banned: "Banned",
  first_pass_banned: "Ban proposed",
  reverted: "Reverted",
};
export type AuditTone = "ok" | "info" | "warn" | "err";
export const AUDIT_VERDICT_TONES: Record<AuditVerdict, AuditTone> = {
  approved: "ok",
  first_pass_approved: "ok",
  needs_changes: "warn",
  banned: "err",
  first_pass_banned: "err",
  reverted: "info",
};

// The internal audit note a reviewer writes with a verdict. Builders never see it.
export type AuditSections = { technical?: string; deflation?: string; age?: string; notes?: string };

export type ReviewAudit = {
  id: string;
  ship: string;
  reviewer: string;
  verdict: AuditVerdict;
  hoursAgo: number;
  claimedMinutes: number;
  // Null for a verdict that credits nothing.
  approvedMinutes: number | null;
  // Time on the review page, and whether the repo and the demo were opened and for how long.
  seconds: number;
  repoSeconds: number | null;
  demoSeconds: number | null;
  // The note the builder saw.
  note: string;
  sections?: AuditSections;
};

export type LogAction = "claimed" | "released" | "approved" | "first-pass-approved" | "needs-changes" | "ban-proposed" | "banned";
export const LOG_ACTION_LABELS: Record<LogAction, string> = {
  claimed: "Claimed",
  released: "Released",
  approved: "Approved",
  "first-pass-approved": "Passed to second pass",
  "needs-changes": "Needs changes",
  "ban-proposed": "Ban proposed",
  banned: "Banned",
};
export const DECISION_ACTIONS: readonly LogAction[] = ["approved", "first-pass-approved", "needs-changes", "ban-proposed", "banned"];

export type LogEntry = {
  id: string;
  hoursAgo: number;
  reviewer: string;
  ship: string;
  action: LogAction;
  note: string;
  // Time spent on the review page, for actions that end a review.
  seconds: number;
  claimedMinutes?: number;
  approvedMinutes?: number;
};

// ---- Lookups ----

export function shipById(id: string): ReviewShip | null {
  return REVIEW_SHIPS.find((ship) => ship.id === id) ?? null;
}

export function reviewerById(id: string): Reviewer | null {
  return REVIEWERS.find((reviewer) => reviewer.id === id) ?? null;
}

export function reviewerHandle(id: string | null): string {
  if (!id) return "nobody";
  return reviewerById(id)?.handle ?? id;
}

// The address of a ship's review desk on the review host.
export function shipHref(id: string): string {
  return `/review/${id}`;
}

// ---- Time ----

// "2h 14m", "45m", "3h". Zero reads "0m".
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

// Hours with one decimal at most: "32 H", "31.5 H".
export function formatHours(minutes: number): string {
  const hours = Math.round((Math.max(0, minutes) / 60) * 10) / 10;
  return `${hours} H`;
}

// "4m 05s" for the time a reviewer spent on a page.
export function formatSeconds(seconds: number): string {
  if (seconds <= 0) return "none";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${String(Math.round(seconds % 60)).padStart(2, "0")}s`;
}

// Pixl's short form for an average review time: "-", "45s", "12m", "1.4h".
export function formatAverage(seconds: number): string {
  if (seconds <= 0) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

// Under a minute a review is probably not a review (Pixl flags it for owners).
export function isRushed(avgSeconds: number): boolean {
  return avgSeconds > 0 && avgSeconds < 60;
}

// How long ago, from a count of hours: "under 1h", "18h", then days.
export function ageLabel(hours: number): string {
  if (hours < 1) return "under 1h";
  if (hours < 48) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function trackedMinutes(ship: ReviewShip): number {
  return ship.evidence.source === "hackatime"
    ? ship.evidence.projects.reduce((sum, item) => sum + item.minutes, 0)
    : ship.evidence.recordings.reduce((sum, item) => sum + item.minutes, 0);
}

// The time the builder assigned to journal entries. Each tracked minute can be assigned only once (plan 01 section 6.6),
// so this is never more than the tracked time.
export function journaledMinutes(ship: ReviewShip): number {
  return ship.journals.reduce((sum, item) => sum + item.minutes, 0);
}

// The minutes the reviewer keeps from one entry, or null while no action has been recorded.
export function keptMinutes(journal: ReviewJournal): number | null {
  switch (journal.action) {
    case undefined:
      return null;
    case "approve-all":
      return journal.minutes;
    case "partial":
      return Math.min(Math.max(journal.keptMinutes ?? 0, 0), journal.minutes);
    default:
      return 0;
  }
}

// The approved total, or null until every entry has an action.
export function approvedMinutes(ship: ReviewShip): number | null {
  let total = 0;
  for (const journal of ship.journals) {
    const kept = keptMinutes(journal);
    if (kept === null) return null;
    total += kept;
  }
  return total;
}

// The hours a reviewer is asked to credit: what the verdict recorded, else what the first pass credited, else what was claimed.
export function creditDefaultMinutes(ship: ReviewShip): number {
  const decided = approvedMinutes(ship);
  if (decided !== null) return decided;
  if (inFinalStage(ship.status) && ship.firstPass?.minutes != null) return ship.firstPass.minutes;
  return journaledMinutes(ship);
}

// What the builder receives for approved hours (plan 01: 10 Ore per approved hour, 10 Ore = $4.35, depth 1 m per hour).
export const ORE_PER_HOUR = 10;
export const USD_PER_TEN_ORE = 4.35;
// Track XP per approved hour, all to the project's one track (plans/02, owner 14 Nov 2026). Not spendable.
export const TRACK_XP_PER_HOUR = 10;
export function creditFor(minutes: number): { hours: number; ore: number; usd: number; depth: number } {
  // The single rules version (ledger.ts): hours to 0.1, then the Ore rounds up. Callers pass hours * 60, so float noise is rounded off.
  const whole = Number.isFinite(minutes) ? Math.round(Math.max(0, minutes)) : 0;
  const hours = tenthsOfHour(whole) / 10;
  const ore = oreForMinutes(whole, ORE_PER_HOUR);
  return { hours, ore, usd: Math.round(((ore * USD_PER_TEN_ORE) / 10) * 100) / 100, depth: hours };
}

// The journal guide is at least one entry for every eight hours of development, and at least one entry at all.
export const JOURNAL_HOURS = 8;
export function journalsExpected(minutes: number): number {
  return Math.max(1, Math.floor(minutes / 60 / JOURNAL_HOURS));
}

// Tracked against journaled time as the share of the total that is tracked time (Pixl's logged hours bar, split by source).
export function hoursSplit(ship: ReviewShip): { tracked: number; journaled: number; trackedPercent: number } {
  const tracked = trackedMinutes(ship);
  const journaled = journaledMinutes(ship);
  const total = tracked + journaled;
  return { tracked, journaled, trackedPercent: total === 0 ? 0 : Math.round((tracked / total) * 100) };
}

// ---- Track (plan 01 section 4.7) ----

// The track is the builder's. It locks on submit and is open again once the ship is in "needs changes".
export function trackLockedFor(status: ReviewStatus): boolean {
  return status !== "needs-changes";
}

// A needs-changes decision with the reason "Does not fit the track" tells the builder they may change the track before shipping again.
export function unlocksTrack(decision: Pick<ReviewDecision, "outcome" | "reasonCode"> | undefined): boolean {
  return decision?.outcome === "needs-changes" && decision.reasonCode === "track";
}

// ---- Validity checklist (plan 01 section 8, Stage 1) ----

export type ValidityCheck = { id: string; label: string; hint: string };

// The checks Stage 1 names, in its order, with where to look. The hints are working guidance.
export const VALIDITY_CHECKS: readonly ValidityCheck[] = [
  { id: "exists", label: "The project exists", hint: "The source is public under an open-source licence and the files are there." },
  { id: "works", label: "It works enough to count as shipped", hint: "Run it, or watch the demo or the hardware test." },
  { id: "hours", label: "Claimed hours are believable", hint: "Set the tracked time beside what was built." },
  { id: "journals", label: "Journals match the work", hint: "Each entry names changes you can find in the source or the footage." },
  { id: "duplicates", label: "No duplicated hours", hint: "A tracked minute is in one entry only, and the time was not used in another YSWS." },
  { id: "ai", label: "AI policy is satisfied", hint: "Declared use is allowed and the builder's own share is clear. Do not rely on AI detectors." },
  { id: "copied", label: "The project is not copied", hint: "Check the history and compare with the projects it resembles." },
  { id: "spam", label: "It is not low-effort spam", hint: "There is real technical work, not a template with a new name." },
  { id: "links", label: "Links work", hint: "The source and any demo open for someone who is not the builder." },
  { id: "evidence", label: "Required evidence exists", hint: "Software: Hackatime time and journals. Hardware: Lapse recordings, a bill of materials with quantities and sources, and design files." },
];

// The four dimensions guide the written reason. They are not scores and produce no multiplier.
export const QUALITY_DIMENSIONS: readonly { name: string; ask: string }[] = [
  { name: "Originality", ask: "Is there a new idea or approach, beyond following a tutorial?" },
  { name: "Technical Depth", ask: "How hard was the core, and did the builder do it themselves?" },
  { name: "Execution", ask: "Does it work, and is it finished enough to use?" },
  { name: "Documentation", ask: "Could someone else build, run and understand it?" },
];

export const REASON_MAX = 1000;
// The internal "technical features" note needs this much to count (Pixl: TECHNICAL_FEATURES_MIN).
export const TECHNICAL_FEATURES_MIN = 120;

// Text macros for the note to the builder: type a trigger and it becomes the canned message (Pixl: lib/reviewMacros.ts, with
// LOADOUT's own wording).
export type ReviewMacro = { trigger: string; label: string; text: string };
export const REVIEW_MACROS: readonly ReviewMacro[] = [
  {
    trigger: "/track",
    label: "Does not fit the track",
    text: "Thanks for shipping this. The work does not fit the {track} track yet: most of what was built belongs to another track. Add more work in this track, or change the project's track, then ship it again.",
  },
  {
    trigger: "/ai",
    label: "Too much AI",
    text: "Thanks for shipping this. It is being sent back because too much of the implementation looks AI-written for the work to be yours. Keep AI to a minimum and write the core yourself, then ship it again.",
  },
  {
    trigger: "/readme",
    label: "README missing steps",
    text: "Good project. The README does not yet say how to build and run it from a clean checkout. Add the steps, what you need installed and one example, then ship it again.",
  },
  {
    trigger: "/hours",
    label: "Hours do not match the work",
    text: "The tracked time is much higher than what the journals and commits show. Describe the work in each journal entry so the time can be matched, then ship it again.",
  },
];

// Fills the {track} placeholder in a macro with the ship's track.
export function fillMacro(text: string, ship: Pick<ReviewShip, "track">): string {
  return text.replaceAll("{track}", ship.track);
}

// ---- Project types (Pixl: lib/reviewTypeFilter.ts) ----

export const REVIEW_TYPE_FILTERS = [
  { id: "all", label: "All types" },
  { id: "games", label: "Games" },
  { id: "web", label: "Web" },
  { id: "desktop", label: "Desktop" },
  { id: "python", label: "Python" },
  { id: "mobile", label: "Mobile" },
  { id: "hardware", label: "Hardware" },
  { id: "cad", label: "CAD" },
  { id: "other", label: "Other" },
] as const;

export type ReviewTypeFilter = (typeof REVIEW_TYPE_FILTERS)[number]["id"];

export function reviewTypeGroup(projectType: ProjectType | null | undefined, isGame = false): Exclude<ReviewTypeFilter, "all"> {
  if (isGame) return "games";
  switch (projectType) {
    case "web":
      return "web";
    case "windows":
    case "mac":
    case "linux":
    case "cross_platform":
      return "desktop";
    case "python":
      return "python";
    case "android":
    case "ios":
      return "mobile";
    case "hardware":
      return "hardware";
    case "cad":
      return "cad";
    default:
      return "other";
  }
}

export function parseReviewTypeFilter(input: string | undefined): ReviewTypeFilter {
  return REVIEW_TYPE_FILTERS.find((filter) => filter.id === input)?.id ?? "all";
}

// The caller computes who may open a row against the whole queue first: a filter must never unlock a ship.
export function filterReviewType<T extends { projectType?: ProjectType | null; isGame?: boolean | null }>(rows: readonly T[], selected: ReviewTypeFilter): T[] {
  if (selected === "all") return [...rows];
  return rows.filter((row) => reviewTypeGroup(row.projectType, row.isGame === true) === selected);
}

// ---- Queue views ----

// Pixl's queue pages hold 15. The shared pager default (REVIEW_PAGE_SIZE) stays 10 for the other staff lists.
export const REVIEW_PAGE_SIZE = 10;
export const QUEUE_PAGE_SIZE = 15;

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

// A page number from the address: whole numbers from 1, anything else is page 1. The page is clamped to the last page later.
export function parsePage(raw: string | string[] | undefined): number {
  const value = Number.parseInt(first(raw), 10);
  return Number.isFinite(value) && value >= 1 ? value : 1;
}

export type ReviewQuery = { kind: ReviewKind; type: ReviewTypeFilter; page: number };

// Reads the queue, the project type and the page from the address. Anything unknown falls back to the default view.
export function parseReviewQuery(raw: { kind?: string | string[]; type?: string | string[]; page?: string | string[] }): ReviewQuery {
  const kindText = first(raw.kind).trim().toLowerCase();
  return {
    kind: REVIEW_KINDS.find((kind) => kind === kindText) ?? "software",
    type: parseReviewTypeFilter(first(raw.type).trim().toLowerCase()),
    page: parsePage(raw.page),
  };
}

// A reviewer limited to one queue cannot view the other whatever the address asks for (Pixl: access.reviewQueues).
export function clampKind(scope: ReviewQueueScope, requested: ReviewKind): ReviewKind {
  return scope === "both" ? requested : scope;
}

// The address for a queue view on the review host. The software queue with no filter is plain "/review". Pixl serves the
// hardware queue as /review?kind=hardware too, and /review/hardware only redirects there.
export function reviewHref(query: ReviewQuery): string {
  const params = new URLSearchParams();
  if (query.kind === "hardware") params.set("kind", "hardware");
  if (query.type !== "all") params.set("type", query.type);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/review?${text}` : "/review";
}

// The address of a project-type chip: it keeps the queue and drops the page.
export function typeHref(kind: ReviewKind, selected: ReviewTypeFilter): string {
  return reviewHref({ kind, type: selected, page: 1 });
}

export function filterShips(ships: readonly ReviewShip[], filter: { kind?: ReviewKind; statuses?: readonly ReviewStatus[] }): ReviewShip[] {
  return ships.filter((ship) => (!filter.kind || ship.kind === filter.kind) && (!filter.statuses || filter.statuses.includes(ship.status)));
}

// When a ship's wait started, counted back from now in hours (Pixl: lib/queueWait.ts). A first ship, or a fix-and-reship, waits
// from the first time it was sent in. An update of an approved ship is a new submission, so it waits from this ship.
export function waitHours(ship: Pick<ReviewShip, "submittedHoursAgo" | "firstShippedHoursAgo" | "update">): number {
  if (ship.update) return ship.submittedHoursAgo;
  return ship.firstShippedHoursAgo ?? ship.submittedHoursAgo;
}

// Longest wait first. Ties fall back to the id so the order never shifts between loads.
export function sortShips(ships: readonly ReviewShip[]): ReviewShip[] {
  return [...ships].sort((a, b) => waitHours(b) - waitHours(a) || a.id.localeCompare(b.id));
}

export type Page<T> = { items: T[]; page: number; pages: number; total: number; from: number; to: number };

// One page of a list. A page past the end shows the last page.
export function paginate<T>(list: readonly T[], page: number, size = REVIEW_PAGE_SIZE): Page<T> {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(Math.max(Math.floor(page) || 1, 1), pages);
  const start = (current - 1) * size;
  const items = list.slice(start, start + size);
  return { items, page: current, pages, total: list.length, from: items.length === 0 ? 0 : start + 1, to: start + items.length };
}

export type TypeChip = { id: ReviewTypeFilter; label: string; count: number };

// The chips above the queue: every type with ships in it, plus All types, Games and the chosen one even when they are empty.
export function typeChips(rows: readonly ReviewShip[], selected: ReviewTypeFilter): TypeChip[] {
  return REVIEW_TYPE_FILTERS.map((filter) => ({ ...filter, count: filterReviewType(rows, filter.id).length })).filter(
    (chip) => chip.count > 0 || chip.id === "all" || chip.id === "games" || chip.id === selected,
  );
}

export type QueueView = { chips: TypeChip[]; page: Page<ReviewShip>; total: number };

// The first-pass queue for one view: the kind's waiting and claimed ships, oldest wait first, narrowed by project type.
// `match` narrows the rows by the toolbar's search, and `per` is the page size the reader picked (default QUEUE_PAGE_SIZE). The chips
// count the searched queue, so a chip never promises ships the search has already hidden.
export function queueView(ships: readonly ReviewShip[], query: ReviewQuery, options: { per?: number; match?: (ship: ReviewShip) => boolean } = {}): QueueView {
  const searched = sortShips(filterShips(ships, { kind: query.kind, statuses: ["waiting", "claimed"] })).filter(options.match ?? (() => true));
  const rows = filterReviewType(searched, query.type);
  return { chips: typeChips(searched, query.type), page: paginate(rows, query.page, options.per ?? QUEUE_PAGE_SIZE), total: rows.length };
}

// ---- The viewer ----

// Who is looking, for the rules that depend on it. The reviewer and builder handles stand in for the signed-in person: the
// local test accounts are matched to invented handles so the lock, claim and own-submission states can be seen.
export type DeskViewer = Pick<ReviewerAccess, "isOwner" | "canSecondPass" | "reviewQueues"> & { reviewer: string; builder: string };

const SAMPLE_PEOPLE: Record<string, { reviewer: string; builder: string }> = {
  "Test owner": { reviewer: "bellwether", builder: "kestrel42" },
  "Test reviewer": { reviewer: "tamsin", builder: "ploughshare" },
  "Test final reviewer": { reviewer: "lintel", builder: "ostler" },
  "Test hardware reviewer": { reviewer: "fenwick", builder: "dovetail" },
  "Test software reviewer": { reviewer: "marlowe", builder: "" },
  "Test senior reviewer": { reviewer: "hartley", builder: "" },
  "Test integrity reviewer": { reviewer: "quill", builder: "" },
  "Test owner, no review": { reviewer: "ashdown", builder: "" },
};

export function deskViewer(access: Pick<ReviewerAccess, "isOwner" | "canSecondPass" | "reviewQueues">, displayName: string): DeskViewer {
  const person = Object.hasOwn(SAMPLE_PEOPLE, displayName) ? SAMPLE_PEOPLE[displayName as keyof typeof SAMPLE_PEOPLE] : { reviewer: "", builder: "" };
  return { isOwner: access.isOwner, canSecondPass: access.canSecondPass, reviewQueues: access.reviewQueues, ...person };
}

export function isOwnShip(ship: Pick<ReviewShip, "builder" | "collaborators">, viewer: Pick<DeskViewer, "builder">): boolean {
  if (!viewer.builder) return false;
  return ship.builder === viewer.builder || (ship.collaborators ?? []).some((item) => item.handle === viewer.builder);
}

export type QueueLock = { assignee: string; hoursLeft: number };

// Why a first-pass row cannot be opened: it is reserved for the reviewer who asked for changes, inside their window. Owners
// are never locked out (Pixl: lib/reviewAssignment.ts).
export function lockFor(ship: Pick<ReviewShip, "status" | "reserved">, viewer: Pick<DeskViewer, "isOwner" | "reviewer">): QueueLock | null {
  if (!ship.reserved || !inQueue(ship.status) || viewer.isOwner) return null;
  if (ship.reserved.reviewer === viewer.reviewer || ship.reserved.hoursLeft <= 0) return null;
  return { assignee: ship.reserved.reviewer, hoursLeft: ship.reserved.hoursLeft };
}

export function lockLabel(lock: QueueLock): string {
  return `Reserved for @${reviewerHandle(lock.assignee)}, ${ageLabel(lock.hoursLeft)} left`;
}

// Whether another reviewer has the ship open (Pixl: "is reviewing", a 30 minute claim the holder keeps alive).
export function claimedByOther(ship: Pick<ReviewShip, "claimedBy">, viewer: Pick<DeskViewer, "reviewer">): string | null {
  return ship.claimedBy && ship.claimedBy !== viewer.reviewer ? ship.claimedBy : null;
}

// May this viewer give a verdict on this ship? Not while it is on hold or banned, never on their own or a collaborator's
// project, and at the final stages only as an owner or final reviewer. A proposed ban needs a final reviewer.
export function canReview(ship: ReviewShip, viewer: DeskViewer): boolean {
  if (ship.hold || ship.ban || ship.status === "banned" || isOwnShip(ship, viewer)) return false;
  if (inQueue(ship.status)) return queueAllowsKind(viewer.reviewQueues, ship.kind);
  if (ship.status === "second-pass") return viewer.isOwner || viewer.canSecondPass;
  if (ship.status === "proposed-ban") return viewer.canSecondPass || viewer.isOwner;
  return false;
}

function queueAllowsKind(scope: ReviewQueueScope, kind: ReviewKind): boolean {
  return scope === "both" || scope === kind;
}

export type DeskStage = "first-pass" | "second-pass" | "final-pass";
export const DESK_STAGE_LABELS: Record<DeskStage, string> = { "first-pass": "First pass", "second-pass": "Second pass", "final-pass": "Final pass" };

export function deskStage(ship: Pick<ReviewShip, "status">): DeskStage {
  if (ship.status === "proposed-ban") return "final-pass";
  if (ship.status === "second-pass") return "second-pass";
  return "first-pass";
}

// The list a ship belongs to, for the desk's "back" link and its previous and next buttons.
export function listFor(ship: Pick<ReviewShip, "status" | "kind">): { href: string; label: string } {
  switch (ship.status) {
    case "second-pass":
      return { href: "/review/second-pass", label: "Second pass" };
    case "proposed-ban":
      return { href: "/review/proposed-bans", label: "Proposed bans" };
    case "approved":
    case "needs-changes":
      return { href: "/review/reviewed", label: "Reviewed" };
    case "banned":
      return { href: "/review", label: "Review queue" };
    default:
      return { href: reviewHref({ kind: ship.kind, type: "all", page: 1 }), label: "Review queue" };
  }
}

export type DeskNeighbours = { prev: ReviewShip | null; next: ReviewShip | null; index: number; total: number };

// The ships in the same list as this one, in the queue's order, that this viewer may open. "Not in queue" is index -1.
export function neighbours(ships: readonly ReviewShip[], ship: ReviewShip, viewer: DeskViewer): DeskNeighbours {
  const stage = deskStage(ship);
  const statuses: readonly ReviewStatus[] = stage === "first-pass" ? ["waiting", "claimed"] : [ship.status];
  const pool = sortShips(ships.filter((item) => statuses.includes(item.status) && queueAllowsKind(viewer.reviewQueues, item.kind) && lockFor(item, viewer) === null));
  const index = pool.findIndex((item) => item.id === ship.id);
  return {
    prev: index > 0 ? pool[index - 1] : null,
    next: index >= 0 && index < pool.length - 1 ? pool[index + 1] : null,
    index,
    total: pool.length,
  };
}

// Counts for the tab row: the first-pass queue (both kinds), Second pass and Proposed bans.
export function tabCounts(ships: readonly ReviewShip[]): { pending: number; secondPass: number; proposedBans: number } {
  const count = (statuses: readonly ReviewStatus[]) => filterShips(ships, { statuses }).length;
  return { pending: count(["waiting", "claimed"]), secondPass: count(["second-pass"]), proposedBans: count(["proposed-ban"]) };
}

// The Second pass list and the Proposed bans list: oldest wait first.
export function stageRows(ships: readonly ReviewShip[], status: ReviewStatus): ReviewShip[] {
  return sortShips(filterShips(ships, { statuses: [status] }));
}

// Reviewed: ships that got a verdict, newest verdict first.
export function reviewedRows(ships: readonly ReviewShip[]): ReviewShip[] {
  return filterShips(ships, { statuses: ["approved", "needs-changes"] }).sort(
    (a, b) => (a.decision?.hoursAgo ?? Infinity) - (b.decision?.hoursAgo ?? Infinity) || a.id.localeCompare(b.id),
  );
}

// Whether a list shows the First pass column: only when some row has been through a first pass that is still current.
export function hasCurrentFirstPass(ship: Pick<ReviewShip, "status" | "firstPass">): boolean {
  return !inQueue(ship.status) && Boolean(ship.firstPass);
}

// ---- Audits and the log ----

export function auditsForShip(shipId: string, audits: readonly ReviewAudit[] = REVIEW_AUDITS): ReviewAudit[] {
  return audits.filter((item) => item.ship === shipId);
}

// A reviewer's latest verdicts, newest first (the "Recently reviewed by you" table).
export function recentAudits(reviewer: string, limit = 5, audits: readonly ReviewAudit[] = REVIEW_AUDITS): ReviewAudit[] {
  if (!reviewer) return [];
  return audits.filter((item) => item.reviewer === reviewer).slice(0, limit);
}

export function auditHasNotes(audit: ReviewAudit): boolean {
  const sections = audit.sections;
  return Boolean(sections && Object.values(sections).some((value) => value && value.trim() !== ""));
}

export const AUDIT_SECTION_LABELS: Record<keyof AuditSections, string> = {
  technical: "Technical features",
  deflation: "Why the hours were lowered",
  age: "Age justification",
  notes: "Additional notes",
};
export const AUDIT_SECTION_ORDER: readonly (keyof AuditSections)[] = ["technical", "deflation", "age", "notes"];

// The hours line under a log row: "40h credited as logged", "hours 24h to 22h" or "no hours credited".
export function hoursLine(audit: Pick<ReviewAudit, "claimedMinutes" | "approvedMinutes">): string {
  if (audit.approvedMinutes === null) return "no hours credited";
  if (audit.approvedMinutes !== null && audit.approvedMinutes !== audit.claimedMinutes) {
    return `hours ${formatDuration(audit.claimedMinutes)} to ${formatDuration(audit.approvedMinutes)}`;
  }
  return `${formatDuration(audit.claimedMinutes)} credited as logged`;
}

export type LogQuery = { reviewer: string | null; page: number };

export function parseLogQuery(raw: { reviewer?: string | string[]; page?: string | string[] }): LogQuery {
  const id = first(raw.reviewer).trim().toLowerCase();
  return { reviewer: reviewerById(id)?.id ?? null, page: parsePage(raw.page) };
}

export function logHref(query: LogQuery): string {
  const params = new URLSearchParams();
  if (query.reviewer) params.set("reviewer", query.reviewer);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/review/log?${text}` : "/review/log";
}

export function filterLog(entries: readonly LogEntry[], reviewer: string | null): LogEntry[] {
  return reviewer ? entries.filter((item) => item.reviewer === reviewer) : [...entries];
}

export function filterAudits(audits: readonly ReviewAudit[], reviewer: string | null): ReviewAudit[] {
  return reviewer ? audits.filter((item) => item.reviewer === reviewer) : [...audits];
}

// A reviewer's decisions, newest first: approved, passed to second pass, sent back, or a ban step.
export function decisionsBy(entries: readonly LogEntry[], reviewer: string): LogEntry[] {
  return entries.filter((item) => item.reviewer === reviewer && DECISION_ACTIONS.includes(item.action));
}

// ---- Stats (Pixl: lib/reviewStats.ts and the stats page) ----

export const VERDICT_WINDOWS: readonly { key: VerdictWindowKey; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "day", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

export const emptyCounts = (): VerdictCounts => ({ approved: 0, firstPass: 0, changes: 0, rejected: 0 });
export const countsTotal = (counts: VerdictCounts): number => counts.approved + counts.firstPass + counts.changes + counts.rejected;

// The chart bars, in Pixl's order and wording. Each also has its own word on the page, so colour is never the only signal.
export const VERDICT_BUCKETS: readonly { key: keyof VerdictCounts; label: string }[] = [
  { key: "approved", label: "Approved (final)" },
  { key: "firstPass", label: "Approved (first pass)" },
  { key: "changes", label: "Changes requested" },
  { key: "rejected", label: "Banned" },
];

export type VerdictWindow = { key: VerdictWindowKey; label: string; counts: VerdictCounts; reviewers: number; reviewerList: { name: string; reviews: number }[] };

// Verdict counts plus how many reviewers gave them, for one window. A reviewer with no verdicts in it is not counted.
export function summarizeWindow(reviewers: readonly Reviewer[], key: VerdictWindowKey): VerdictWindow {
  const counts = emptyCounts();
  const list: { name: string; reviews: number }[] = [];
  for (const reviewer of reviewers) {
    const own = reviewer.verdicts[key];
    const total = countsTotal(own);
    if (total === 0) continue;
    counts.approved += own.approved;
    counts.firstPass += own.firstPass;
    counts.changes += own.changes;
    counts.rejected += own.rejected;
    list.push({ name: `@${reviewer.handle}`, reviews: total });
  }
  list.sort((a, b) => b.reviews - a.reviews || a.name.localeCompare(b.name));
  return { key, label: VERDICT_WINDOWS.find((item) => item.key === key)?.label ?? key, counts, reviewers: list.length, reviewerList: list };
}

export type ReviewerRow = {
  id: string;
  handle: string;
  total: number;
  thisWeek: number;
  approved: number;
  firstPass: number;
  changes: number;
  hoursCredited: number;
  avgSeconds: number;
  lastActiveHoursAgo: number;
};

// One row per reviewer, most reviews first (Pixl sorts the table by total).
export function reviewerRows(reviewers: readonly Reviewer[]): ReviewerRow[] {
  return reviewers
    .map((item) => ({
      id: item.id,
      handle: item.handle,
      total: item.allTime,
      thisWeek: item.thisWeek,
      approved: item.verdicts.all.approved,
      firstPass: item.verdicts.all.firstPass,
      changes: item.verdicts.all.changes,
      hoursCredited: item.hoursCredited,
      avgSeconds: item.avgSeconds,
      lastActiveHoursAgo: item.lastActiveHoursAgo,
    }))
    .sort((a, b) => b.total - a.total || a.handle.localeCompare(b.handle));
}

// The share of a reviewer's decisions that approved, as a whole percent. Zero when there are none.
export function acceptShare(reviewer: Pick<Reviewer, "accepted" | "rejected">): number {
  const total = reviewer.accepted + reviewer.rejected;
  return total === 0 ? 0 : Math.round((reviewer.accepted / total) * 100);
}

export function teamTotals(reviewers: readonly Reviewer[]): { thisWeek: number; allTime: number; accepted: number; rejected: number; avgSeconds: number } {
  const allTime = reviewers.reduce((sum, item) => sum + item.allTime, 0);
  const weighted = reviewers.reduce((sum, item) => sum + item.avgSeconds * item.allTime, 0);
  return {
    thisWeek: reviewers.reduce((sum, item) => sum + item.thisWeek, 0),
    allTime,
    accepted: reviewers.reduce((sum, item) => sum + item.accepted, 0),
    rejected: reviewers.reduce((sum, item) => sum + item.rejected, 0),
    avgSeconds: allTime === 0 ? 0 : Math.round(weighted / allTime),
  };
}

// Whether a reviewer's access covers a kind of ship.
export function canAccessKind(reviewer: Pick<Reviewer, "access">, kind: ReviewKind): boolean {
  return reviewer.access === "both" || reviewer.access === kind;
}

// The reviewers who can take a kind of ship.
export function reviewersFor(kind: ReviewKind, reviewers: readonly Reviewer[] = REVIEWERS): Reviewer[] {
  return reviewers.filter((reviewer) => canAccessKind(reviewer, kind));
}

// Ships a reviewer could take or finish right now: the first-pass queue for the kinds they can see, plus Second pass and
// Proposed ban ships when they are a final reviewer.
export function openFor(reviewer: Reviewer, ships: readonly ReviewShip[]): ReviewShip[] {
  return ships.filter((ship) => {
    if (!canAccessKind(reviewer, ship.kind)) return false;
    if (inQueue(ship.status)) return true;
    return reviewer.secondPass && inFinalStage(ship.status);
  });
}

// ---- Hardware ----

export type BomTotals = { lines: number; parts: number; sources: number };

// The size of a bill of materials: lines, the parts in all of them, and how many different places the parts came from.
export function bomTotals(bom: readonly BomLine[]): BomTotals {
  return {
    lines: bom.length,
    parts: bom.reduce((sum, line) => sum + Math.max(0, line.qty), 0),
    sources: new Set(bom.map((line) => line.source.trim().toLowerCase()).filter(Boolean)).size,
  };
}

// Lines a reviewer should ask about: no source named, or a quantity that is not a whole number of at least 1.
export function bomGaps(bom: readonly BomLine[]): BomLine[] {
  return bom.filter((line) => line.source.trim() === "" || !Number.isInteger(line.qty) || line.qty < 1);
}

export type HardwareFacts = { recordings: number; recordingMinutes: number; bom: BomTotals; gaps: number; photos: number; designFiles: number };

// What a hardware ship brings, in numbers, for the evidence summary. Null for a software ship.
export function hardwareFacts(ship: ReviewShip): HardwareFacts | null {
  if (ship.evidence.source !== "lapse") return null;
  const { recordings, bom, photos, designFiles } = ship.evidence;
  return {
    recordings: recordings.length,
    recordingMinutes: recordings.reduce((sum, item) => sum + item.minutes, 0),
    bom: bomTotals(bom),
    gaps: bomGaps(bom).length,
    photos: photos.length,
    designFiles: designFiles.length,
  };
}

// ---- Commits (Pixl: CommitList) ----

// Pixl's rule for a paste: a large commit with almost no tracked coding time behind it, over 1,500 lines an hour.
export function isCodeDump(commit: Pick<ReviewCommit, "additions" | "codedMinutes">): boolean {
  if (commit.codedMinutes === null || commit.additions < 200) return false;
  return commit.additions / (Math.max(commit.codedMinutes * 60, 60) / 3600) > 1500;
}

// "~0m coded" when code landed with no tracked time behind it, else the tracked time since the previous commit.
export function codedLabel(minutes: number): { text: string; none: boolean } {
  if (minutes < 2) return { text: "~0m coded", none: true };
  return { text: minutes >= 60 ? `${(minutes / 60).toFixed(1)}h coded` : `${Math.round(minutes)}m coded`, none: false };
}

export function usedAi(ship: Pick<ReviewShip, "ai">): boolean {
  return ship.ai.percent > 0 || ship.ai.uses.length > 0;
}

// Commits signed by an AI tool when the builder did not declare AI use.
export function undisclosedAiCommits(ship: Pick<ReviewShip, "ai" | "commits">): number {
  return usedAi(ship) ? 0 : ship.commits.filter((commit) => commit.ai).length;
}

// The project page for a ship in the People group.
export function projectHref(ship: Pick<ReviewShip, "id">): string {
  return `/projects/pr-${ship.id.replace(/^sh-/, "")}`;
}

// ---- The builder's details (Pixl: lib/reviewAccess.ts builderDetailsView) ----

export type BuilderView = { privileged: boolean; name: string; email: string; age: string; country: string; address: string | null };

// A first-pass reviewer gets the age and whether each field is on file, never the values. Owners and final reviewers see the
// sample values, and the address only at the final stages. The values here are placeholders, not anyone's details.
export function builderView(viewer: Pick<DeskViewer, "isOwner" | "canSecondPass">, ship: Pick<ReviewShip, "status" | "builderAge" | "builderCountry">): BuilderView {
  if (!(viewer.isOwner || viewer.canSecondPass)) {
    return { privileged: false, name: "on file", email: "on file", age: String(ship.builderAge), country: "on file", address: null };
  }
  return {
    privileged: true,
    name: "Sample name",
    email: "sample@example.invalid",
    age: String(ship.builderAge),
    country: ship.builderCountry,
    address: inFinalStage(ship.status) ? "Sample address" : null,
  };
}

// ---- The pipeline (Pixl: ReviewPipelineSteps, without fraud review and the export steps) ----

export type StepState = "done" | "current" | "upcoming";

export function pipelineSteps(ship: Pick<ReviewShip, "status" | "firstPass">): { label: string; state: StepState }[] {
  const decided = ship.status === "approved";
  const firstDone = !inQueue(ship.status) && Boolean(ship.firstPass) ? true : decided;
  return [
    { label: "Initial submission", state: "done" },
    { label: "First pass", state: firstDone ? "done" : "current" },
    { label: "Second pass", state: decided ? "done" : inFinalStage(ship.status) ? "current" : "upcoming" },
    { label: "Approved", state: decided ? "done" : "upcoming" },
  ];
}

export const FINAL_CHECKS: readonly string[] = ["Checked the Hackatime or Lapse record", "Hours cut where needed", "Evidence added to the justification"];

export const UNSHIP_WARNINGS: Partial<Record<ReviewStatus, string>> = {
  "second-pass": "The first-pass verdict, its notes and the final checks are cleared, and the review starts again from scratch.",
  "proposed-ban": "The ban proposal, its notes and the final checks are cleared, and the review starts again from scratch.",
};
