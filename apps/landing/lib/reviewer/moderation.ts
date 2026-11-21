// The moderation group of the reviewer site: reports, recorded violations, proposed bans, bans and removed items. There are no
// moderation tables yet, so everything below is invented, nothing can be saved, and every person is a sample handle taken from
// the other fixtures (builders from the review and community samples, staff from the reviewer sample). The shape follows
// Pixl's reports, violations and bans pages (6 Nov 2026 internal dashboard) without its chat and AI features: LOADOUT has no live
// chat, so a report is about a project or a post, and no model scores it. The rule names are working wording for this sample, not final community rules.

import { BULK_REPORTS, type ReportSeed } from "../platform/review-fixtures-bulk";

export const MODERATION_CLOSED = "Opens with the review service. Nothing here is saved.";
export const MODERATION_SAMPLE = "Sample content. The reports, players and decisions on this page are invented, and nothing here is saved.";

// ---- Time ----

// "Now" for the sample, so dates read the same on every load: 6 Nov 2026, 12:00 UTC.
export const SAMPLE_NOW = Date.UTC(2026, 10, 6, 12, 0, 0);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The sample date for a moment some hours ago. A negative number is a moment still to come: "6 Nov 2026".
export function sampleDate(hoursAgo: number): string {
  const date = new Date(SAMPLE_NOW - hoursAgo * 3_600_000);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// How long ago, from a count of hours: "under 1h", "18h", then days.
export function since(hoursAgo: number): string {
  if (hoursAgo < 1) return "under 1h";
  if (hoursAgo < 48) return `${Math.floor(hoursAgo)}h`;
  return `${Math.floor(hoursAgo / 24)}d`;
}

// ---- Shared ----

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

// A page number from the address: whole numbers from 1, anything else is page 1.
function pageOf(raw: string | string[] | undefined): number {
  const value = Number.parseInt(first(raw), 10);
  return Number.isFinite(value) && value >= 1 ? value : 1;
}

export const MODERATION_PAGE_SIZE = 10;

// The player page for a handle. Players are the sample builders, so the handle is the id.
export function playerHref(handle: string): string {
  return `/players/${handle}`;
}

// The community rules the sample uses. Working wording, not final.
export const RULES = [
  { id: "kind", label: "Be kind to other builders", short: "Kindness" },
  { id: "own-work", label: "Ship your own work", short: "Own work" },
  { id: "private", label: "Keep personal information private", short: "Privacy" },
  { id: "safe", label: "Keep it safe", short: "Safety" },
  { id: "spam", label: "No spam or unsafe links", short: "Spam" },
  { id: "honest", label: "Honest hours and evidence", short: "Honest hours" },
] as const;
export type RuleId = (typeof RULES)[number]["id"];

export function isRuleId(value: string): value is RuleId {
  return RULES.some((rule) => rule.id === value);
}

export function ruleLabel(id: RuleId | "other"): string {
  return id === "other" ? "Something else" : (RULES.find((rule) => rule.id === id)?.label ?? id);
}

// ---- Reports ----

export type ReportStatus = "open" | "resolved" | "dismissed";
export const REPORT_FILTERS = ["open", "resolved", "dismissed", "all"] as const;
export type ReportFilter = (typeof REPORT_FILTERS)[number];
export const REPORT_FILTER_LABELS: Record<ReportFilter, string> = { open: "Open", resolved: "Resolved", dismissed: "Dismissed", all: "All" };
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = { open: "Open", resolved: "Resolved", dismissed: "Dismissed" };

export type ReportOutcome = "no-action" | "owner-asked" | "removed" | "warning" | "ban-proposed";
export const REPORT_OUTCOMES: readonly ReportOutcome[] = ["no-action", "owner-asked", "removed", "warning", "ban-proposed"];
export const OUTCOME_LABELS: Record<ReportOutcome, string> = {
  "no-action": "No further action",
  "owner-asked": "Owner asked to change it",
  removed: "Item removed",
  warning: "Warning recorded",
  "ban-proposed": "Ban proposed",
};

export type ReportTarget = { kind: "project" | "post"; title: string; where: string; owner: string };
export type Report = {
  id: string;
  target: ReportTarget;
  reporter: string;
  // The reporter asked to stay anonymous. Staff still see the name once the reporter has filed REPEAT_REPORTS or more.
  anonymous: boolean;
  reason: RuleId | "other";
  note: string;
  hoursAgo: number;
  status: ReportStatus;
  handled?: { by: string; hoursAgo: number; outcome: ReportOutcome; note: string };
};

const HAND_REPORTS: readonly Report[] = [
  {
    id: "rp-312",
    target: { kind: "project", title: "Static config linter", where: "Explore", owner: "pennant" },
    reporter: "lathelark",
    anonymous: true,
    reason: "own-work",
    note: "The README says the parser is original, but the grammar file looks the same as one in another repository.",
    hoursAgo: 6,
    status: "open",
  },
  {
    id: "rp-311",
    target: { kind: "post", title: "Reply on \"A random project button on Explore\"", where: "Ideas", owner: "wick" },
    reporter: "solderbee",
    anonymous: false,
    reason: "kind",
    note: "A reply calls the idea a waste of everyone's time and says the builder should not post again.",
    hoursAgo: 12,
    status: "open",
  },
  {
    id: "rp-309",
    target: { kind: "post", title: "Tide clock on a spare e-paper screen", where: "Show & Tell", owner: "brasskettle" },
    reporter: "tinwren",
    anonymous: false,
    reason: "private",
    note: "The photo shows a street sign and a house number behind the clock.",
    hoursAgo: 20,
    status: "open",
  },
  {
    id: "rp-308",
    target: { kind: "project", title: "Soil moisture sensor board", where: "Explore", owner: "cobble" },
    reporter: "mothvector",
    anonymous: true,
    reason: "safe",
    note: "The write-up suggests running the board from mains power to test it faster. That is not safe for a beginner.",
    hoursAgo: 30,
    status: "open",
  },
  {
    id: "rp-307",
    target: { kind: "post", title: "Free Ore generator link", where: "Ideas", owner: "wick" },
    reporter: "quartzfox",
    anonymous: false,
    reason: "spam",
    note: "A post with a link that promises free Ore.",
    hoursAgo: 50,
    status: "resolved",
    handled: { by: "tamsin", hoursAgo: 44, outcome: "removed", note: "Post removed. The owner was told which rule it broke." },
  },
  {
    id: "rp-304",
    target: { kind: "post", title: "Comment on \"Bench label printer script\"", where: "Show & Tell", owner: "wick" },
    reporter: "solderbee",
    anonymous: true,
    reason: "kind",
    note: "A comment makes fun of the builder's age.",
    hoursAgo: 95,
    status: "resolved",
    handled: { by: "lintel", hoursAgo: 90, outcome: "removed", note: "Comment removed and the second violation recorded for the commenter." },
  },
  {
    id: "rp-306",
    target: { kind: "project", title: "Pico thermal data logger", where: "Explore", owner: "halyard" },
    reporter: "nullwisp",
    anonymous: false,
    reason: "private",
    note: "The README gives a home address as the place to send parts.",
    hoursAgo: 130,
    status: "resolved",
    handled: { by: "fenwick", hoursAgo: 120, outcome: "owner-asked", note: "The owner took the address out of the README the same day. No further step." },
  },
  {
    id: "rp-305",
    target: { kind: "project", title: "Shader hot-reload toolchain", where: "Explore", owner: "cairn" },
    reporter: "tinwren",
    anonymous: true,
    reason: "own-work",
    note: "It looks too good to be original.",
    hoursAgo: 160,
    status: "dismissed",
    handled: { by: "bellwether", hoursAgo: 150, outcome: "no-action", note: "The commit history shows three weeks of work and the journal entries match. The reporter was thanked." },
  },
  {
    id: "rp-303",
    target: { kind: "post", title: "Show hours as metres of depth", where: "Ideas", owner: "mothvector" },
    reporter: "nullwisp",
    anonymous: false,
    reason: "spam",
    note: "It looks like the same idea posted twice.",
    hoursAgo: 210,
    status: "dismissed",
    handled: { by: "saltmarsh", hoursAgo: 205, outcome: "no-action", note: "Two posts on one topic are allowed in Ideas. Left up." },
  },
  {
    id: "rp-302",
    target: { kind: "post", title: "Reply on \"Peer scores on every project\"", where: "Ideas", owner: "wick" },
    reporter: "picopilgrim",
    anonymous: false,
    reason: "kind",
    note: "A reply tells another builder their idea is stupid.",
    hoursAgo: 235,
    status: "resolved",
    handled: { by: "lintel", hoursAgo: 230, outcome: "warning", note: "First warning recorded. The reply stays up with the rude sentence removed." },
  },
  {
    id: "rp-301",
    target: { kind: "post", title: "Reply on \"Pin one project to your profile\"", where: "Ideas", owner: "tessel" },
    reporter: "solderbee",
    anonymous: true,
    reason: "kind",
    note: "Replies that keep mocking one builder's idea.",
    hoursAgo: 570,
    status: "resolved",
    handled: { by: "lintel", hoursAgo: 562, outcome: "removed", note: "Replies removed. A warning is already on record for the same behaviour." },
  },
];

// Generated reports for the list pages (review-fixtures-bulk.ts). A handled report has a handler and an outcome; a dismissed one ends with none.
function bulkReport(seed: ReportSeed): Report {
  const base: Report = {
    id: `rp-${seed.number}`,
    target: { kind: seed.kind, title: seed.title, where: seed.where, owner: seed.owner },
    reporter: seed.reporter,
    anonymous: seed.anonymous,
    reason: seed.reason,
    note: "A sample report. The details are invented.",
    hoursAgo: seed.hoursAgo,
    status: seed.status,
  };
  if (seed.status === "open") return base;
  const outcome: ReportOutcome = seed.status === "dismissed" ? "no-action" : "owner-asked";
  return { ...base, handled: { by: seed.handler, hoursAgo: Math.max(1, seed.hoursAgo - 10), outcome, note: seed.status === "dismissed" ? "Nothing against the rules." : "The owner was asked to change it." } };
}

export const REPORTS: readonly Report[] = [...HAND_REPORTS, ...BULK_REPORTS.map(bulkReport)];

export function reportById(id: string): Report | null {
  return REPORTS.find((report) => report.id === id) ?? null;
}

// A person who is the subject of this many reports is flagged for a closer look (Pixl uses the same idea).
export const REPEAT_REPORTS = 3;

export function reportsAbout(owner: string, reports: readonly Report[] = REPORTS): Report[] {
  return reports.filter((report) => report.target.owner === owner);
}

export function isRepeatTarget(owner: string, reports: readonly Report[] = REPORTS): boolean {
  return reportsAbout(owner, reports).length >= REPEAT_REPORTS;
}

// Other reports about the same person, newest first. The report itself is left out.
export function relatedReports(report: Report, reports: readonly Report[] = REPORTS): Report[] {
  return reportsAbout(report.target.owner, reports)
    .filter((item) => item.id !== report.id)
    .sort((a, b) => a.hoursAgo - b.hoursAgo);
}

// How many reports a person has filed. A reporter at REPEAT_REPORTS or more is shown to staff even if they asked to stay anonymous,
// as Pixl does for serial reporters.
export function reportsFiledBy(handle: string, reports: readonly Report[] = REPORTS): number {
  return reports.filter((report) => report.reporter === handle).length;
}

export function revealsReporter(report: Pick<Report, "anonymous" | "reporter">, reports: readonly Report[] = REPORTS): boolean {
  return !report.anonymous || reportsFiledBy(report.reporter, reports) >= REPEAT_REPORTS;
}

// The line under the reporter on the report page, or null when there is nothing to add.
export function reporterNote(report: Pick<Report, "anonymous" | "reporter">, reports: readonly Report[] = REPORTS): string | null {
  const filed = reportsFiledBy(report.reporter, reports);
  if (report.anonymous && filed >= REPEAT_REPORTS) return `Asked to stay anonymous, shown because they have filed ${filed} reports.`;
  if (report.anonymous) return "Name hidden by the reporter.";
  if (filed >= REPEAT_REPORTS) return `${filed} reports filed.`;
  return null;
}

export type ReportsQuery = { status: ReportFilter; page: number };

export function parseReportsQuery(raw: { status?: string | string[]; page?: string | string[] }): ReportsQuery {
  const text = first(raw.status).trim().toLowerCase();
  return { status: REPORT_FILTERS.find((filter) => filter === text) ?? "open", page: pageOf(raw.page) };
}

// The default view (open reports, page 1) has no query at all.
export function reportsHref(query: ReportsQuery): string {
  const params = new URLSearchParams();
  if (query.status !== "open") params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/reports?${text}` : "/reports";
}

// Open reports come first, oldest first, because the oldest waiting is the next to read. Closed reports follow, most recently
// filed first. Ties fall back to the id so the order never shifts.
export function sortReports(reports: readonly Report[]): Report[] {
  const rank = (report: Report) => (report.status === "open" ? 0 : 1);
  return [...reports].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (a.status === "open") return b.hoursAgo - a.hoursAgo || a.id.localeCompare(b.id);
    return a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id);
  });
}

export function filterReports(reports: readonly Report[], status: ReportFilter): Report[] {
  return sortReports(status === "all" ? reports : reports.filter((report) => report.status === status));
}

export function reportCounts(reports: readonly Report[] = REPORTS): Record<ReportFilter, number> {
  const count = (status: ReportStatus) => reports.filter((report) => report.status === status).length;
  return { open: count("open"), resolved: count("resolved"), dismissed: count("dismissed"), all: reports.length };
}

// ---- Violations ----

export type ViolationAction = "note" | "warning" | "removal" | "ban";
export const VIOLATION_ACTION_LABELS: Record<ViolationAction, string> = { note: "Noted", warning: "Warning", removal: "Item removed", ban: "Ban" };

export type Violation = {
  id: string;
  handle: string;
  rule: RuleId;
  action: ViolationAction;
  hoursAgo: number;
  by: string;
  detail: string;
  reportId?: string;
};

// Newest first.
export const VIOLATIONS: readonly Violation[] = [
  { id: "v-115", handle: "wick", rule: "spam", action: "removal", hoursAgo: 44, by: "tamsin", detail: "Posted a link that promised free Ore. The post was removed.", reportId: "rp-307" },
  { id: "v-114", handle: "marlin_k", rule: "honest", action: "warning", hoursAgo: 66, by: "saltmarsh", detail: "A third journal with hours logged while the timer was idle. Second warning." },
  { id: "v-113", handle: "wick", rule: "kind", action: "removal", hoursAgo: 90, by: "lintel", detail: "A comment about another builder's age was removed.", reportId: "rp-304" },
  { id: "v-112", handle: "halyard", rule: "private", action: "note", hoursAgo: 120, by: "fenwick", detail: "A home address in a README. The owner edited it at once.", reportId: "rp-306" },
  { id: "v-111", handle: "nib", rule: "private", action: "ban", hoursAgo: 216, by: "bellwether", detail: "Posted another builder's address after an earlier warning. Fourteen day ban." },
  { id: "v-110", handle: "wick", rule: "kind", action: "warning", hoursAgo: 230, by: "lintel", detail: "Told another builder their idea was stupid. First warning.", reportId: "rp-302" },
  { id: "v-109", handle: "ostler", rule: "own-work", action: "ban", hoursAgo: 288, by: "bellwether", detail: "A third project copied from another builder's repository after two warnings." },
  { id: "v-108", handle: "marlin_k", rule: "honest", action: "warning", hoursAgo: 300, by: "saltmarsh", detail: "Hours logged while the timer was idle on two journals. First warning." },
  { id: "v-107", handle: "nib", rule: "private", action: "warning", hoursAgo: 400, by: "bellwether", detail: "Named another builder's school in a reply." },
  { id: "v-106", handle: "marlin_k", rule: "honest", action: "note", hoursAgo: 500, by: "tamsin", detail: "A journal that did not match the tracked time. Asked to fix it, and it was fixed." },
  { id: "v-105", handle: "tessel", rule: "kind", action: "ban", hoursAgo: 504, by: "lintel", detail: "Repeated mocking replies to one builder after a warning. Seven day ban." },
  { id: "v-104", handle: "tessel", rule: "kind", action: "warning", hoursAgo: 700, by: "lintel", detail: "Mocking replies on three posts." },
  { id: "v-103", handle: "quill", rule: "honest", action: "ban", hoursAgo: 720, by: "orrery", detail: "Hours were logged from another builder's account. Thirty day ban." },
  { id: "v-102", handle: "ostler", rule: "own-work", action: "warning", hoursAgo: 800, by: "saltmarsh", detail: "A second project with copied files and no credit." },
  { id: "v-101", handle: "ostler", rule: "own-work", action: "warning", hoursAgo: 900, by: "saltmarsh", detail: "A project that matched another builder's repository. First warning." },
];

export function violationsFor(handle: string, violations: readonly Violation[] = VIOLATIONS): Violation[] {
  return violations.filter((item) => item.handle === handle).sort((a, b) => a.hoursAgo - b.hoursAgo);
}

// How many are on record for a player.
export function violationCount(handle: string, violations: readonly Violation[] = VIOLATIONS): number {
  return violationsFor(handle, violations).length;
}

export const VIOLATIONS_PAGE_SIZE = 20;

export type ViolationsQuery = { rule: RuleId | null; q: string; page: number };
export const SEARCH_MAX = 40;

export function parseViolationsQuery(raw: { rule?: string | string[]; q?: string | string[]; page?: string | string[] }): ViolationsQuery {
  const rule = first(raw.rule).trim().toLowerCase();
  return {
    rule: isRuleId(rule) ? rule : null,
    q: first(raw.q).trim().slice(0, SEARCH_MAX),
    page: pageOf(raw.page),
  };
}

export function violationsHref(query: ViolationsQuery): string {
  const params = new URLSearchParams();
  if (query.rule) params.set("rule", query.rule);
  if (query.q) params.set("q", query.q);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/violations?${text}` : "/violations";
}

// The search matches the player's handle or the words of the note, in any case. Newest first.
export function filterViolations(violations: readonly Violation[], query: Pick<ViolationsQuery, "rule" | "q">): Violation[] {
  const needle = query.q.trim().toLowerCase().replace(/^@/, "");
  return violations
    .filter((item) => (!query.rule || item.rule === query.rule) && (!needle || item.handle.toLowerCase().includes(needle) || item.detail.toLowerCase().includes(needle)))
    .sort((a, b) => a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id));
}

export function violationRuleCounts(violations: readonly Violation[] = VIOLATIONS): Record<RuleId, number> {
  const counts = Object.fromEntries(RULES.map((rule) => [rule.id, 0])) as Record<RuleId, number>;
  for (const item of violations) counts[item.rule] += 1;
  return counts;
}

// ---- Proposed bans ----

export type BanProposal = {
  id: string;
  handle: string;
  reason: string;
  proposedBy: string;
  hoursAgo: number;
  // null: no end date is proposed.
  days: number | null;
  reportIds: readonly string[];
  violationIds: readonly string[];
};

export const BAN_PROPOSALS: readonly BanProposal[] = [
  {
    id: "pb-12",
    handle: "wick",
    reason: "Three violations in ten days after a first warning: an unkind reply, a comment about another builder's age, and a spam link.",
    proposedBy: "tamsin",
    hoursAgo: 30,
    days: 14,
    reportIds: ["rp-302", "rp-304", "rp-307"],
    violationIds: ["v-110", "v-113", "v-115"],
  },
  {
    id: "pb-11",
    handle: "marlin_k",
    reason: "Hours logged while the timer was idle on three journals, after two warnings and a note.",
    proposedBy: "saltmarsh",
    hoursAgo: 70,
    days: 7,
    reportIds: [],
    violationIds: ["v-106", "v-108", "v-114"],
  },
];

// Oldest first: the proposal that has waited longest is the next to decide.
export function pendingProposals(proposals: readonly BanProposal[] = BAN_PROPOSALS): BanProposal[] {
  return [...proposals].sort((a, b) => b.hoursAgo - a.hoursAgo || a.id.localeCompare(b.id));
}

// A ban needs a second staff member: the person who proposed it cannot also approve or decline it.
export function canDecide(proposal: Pick<BanProposal, "proposedBy">, staff: string): boolean {
  return staff.trim().toLowerCase() !== proposal.proposedBy.toLowerCase();
}

// The lengths the ban forms offer. "0" is no end date.
export const BAN_LENGTH_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "0", label: "No end date" },
];

export function lengthLabel(days: number | null): string {
  if (days === null) return "No end date";
  return days === 1 ? "1 day" : `${days} days`;
}

// ---- Bans ----

export type Ban = {
  id: string;
  handle: string;
  reason: string;
  hoursAgo: number;
  days: number | null;
  proposedBy: string;
  approvedBy: string;
  lifted?: { by: string; hoursAgo: number; note: string };
};

// Newest first.
export const BANS: readonly Ban[] = [
  { id: "ban-104", handle: "ostler", reason: "A third project copied from another builder's repository after two warnings.", hoursAgo: 288, days: null, proposedBy: "saltmarsh", approvedBy: "bellwether" },
  { id: "ban-103", handle: "nib", reason: "Posted another builder's address after an earlier warning.", hoursAgo: 216, days: 14, proposedBy: "lintel", approvedBy: "bellwether" },
  { id: "ban-101", handle: "tessel", reason: "Repeated mocking replies to one builder after a warning.", hoursAgo: 504, days: 7, proposedBy: "lintel", approvedBy: "orrery" },
  {
    id: "ban-102",
    handle: "quill",
    reason: "Hours were logged from another builder's account.",
    hoursAgo: 720,
    days: 30,
    proposedBy: "orrery",
    approvedBy: "bellwether",
    lifted: { by: "bellwether", hoursAgo: 480, note: "Appeal accepted. The account had been shared by mistake and the hours were corrected." },
  },
];

export type BanState = "active" | "lifted" | "expired";
export const BAN_FILTERS = ["active", "lifted", "expired", "all"] as const;
export type BanFilter = (typeof BAN_FILTERS)[number];
export const BAN_FILTER_LABELS: Record<BanFilter, string> = { active: "Active", lifted: "Lifted", expired: "Expired", all: "All" };
export const BAN_STATE_LABELS: Record<BanState, string> = { active: "Active", lifted: "Lifted", expired: "Expired" };

// A lifted ban is lifted, even if its time has also run out. Otherwise it has expired once its days are over.
export function banState(ban: Ban): BanState {
  if (ban.lifted) return "lifted";
  if (ban.days !== null && ban.hoursAgo >= ban.days * 24) return "expired";
  return "active";
}

// The hours ago at which a ban ends, or null when it has no end date. Negative means it ends in the future.
export function banEndHoursAgo(ban: Ban): number | null {
  return ban.days === null ? null : ban.hoursAgo - ban.days * 24;
}

// "Banned 28 Oct 2026 for 14 days" or, with no end date, "Banned 25 Oct 2026".
export function banStartText(ban: Ban): string {
  return ban.days === null ? `Banned ${sampleDate(ban.hoursAgo)}` : `Banned ${sampleDate(ban.hoursAgo)} for ${lengthLabel(ban.days)}`;
}

// "Ends 20 Nov 2026", "Ended 30 Oct 2026", "Lifted 17 Oct 2026" or "No end date set".
export function banEndText(ban: Ban): string {
  const state = banState(ban);
  if (state === "lifted" && ban.lifted) return `Lifted ${sampleDate(ban.lifted.hoursAgo)}`;
  const end = banEndHoursAgo(ban);
  if (end === null) return "No end date set";
  return state === "expired" ? `Ended ${sampleDate(end)}` : `Ends ${sampleDate(end)}`;
}

// The three views of the Bans page, as in Pixl: every ban, the proposals waiting for an owner, and the ban log.
export const BAN_TABS = ["bans", "proposed", "log"] as const;
export type BanTab = (typeof BAN_TABS)[number];
export const BAN_TAB_LABELS: Record<BanTab, string> = { bans: "Bans", proposed: "Proposed", log: "Ban log" };
export const BAN_TAB_LEAD: Record<BanTab, string> = {
  bans: "Every ban that two staff members decided, newest first. A ban stops the player using the site until it ends or a staff member lifts it.",
  proposed: "Ban proposals waiting for an owner to confirm or reject. The person who proposed one cannot decide it.",
  log: "Every ban and lift with who did it, newest first.",
};

export type BansQuery = { tab: BanTab; status: BanFilter; page: number };

export function parseBansQuery(raw: { tab?: string | string[]; status?: string | string[]; page?: string | string[] }): BansQuery {
  const tab = first(raw.tab).trim().toLowerCase();
  const text = first(raw.status).trim().toLowerCase();
  return {
    tab: BAN_TABS.find((item) => item === tab) ?? "bans",
    status: BAN_FILTERS.find((filter) => filter === text) ?? "all",
    page: pageOf(raw.page),
  };
}

// The default view (the Bans tab, every ban, page 1) has no query at all.
export function bansHref(query: BansQuery): string {
  const params = new URLSearchParams();
  if (query.tab !== "bans") params.set("tab", query.tab);
  if (query.tab === "bans" && query.status !== "all") params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `/bans?${text}` : "/bans";
}

export type BanLogEntry = { id: string; action: "ban" | "lift"; handle: string; by: string; hoursAgo: number; detail: string };

// One entry for each ban and each lift, newest first. A ban is logged against the staff member who approved it.
export function banLog(bans: readonly Ban[] = BANS): BanLogEntry[] {
  const entries: BanLogEntry[] = [];
  for (const ban of bans) {
    entries.push({
      id: `${ban.id}-ban`,
      action: "ban",
      handle: ban.handle,
      by: ban.approvedBy,
      hoursAgo: ban.hoursAgo,
      detail: `${lengthLabel(ban.days)}. Proposed by @${ban.proposedBy}. ${ban.reason}`,
    });
    if (ban.lifted) entries.push({ id: `${ban.id}-lift`, action: "lift", handle: ban.handle, by: ban.lifted.by, hoursAgo: ban.lifted.hoursAgo, detail: ban.lifted.note });
  }
  return entries.sort((a, b) => a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id));
}

export function bansFor(handle: string, bans: readonly Ban[] = BANS): Ban[] {
  return bans.filter((ban) => ban.handle === handle).sort((a, b) => a.hoursAgo - b.hoursAgo);
}

// Newest first.
export function filterBans(bans: readonly Ban[], status: BanFilter): Ban[] {
  return bans.filter((ban) => status === "all" || banState(ban) === status).sort((a, b) => a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id));
}

export function banCounts(bans: readonly Ban[] = BANS): Record<BanFilter, number> {
  const count = (state: BanState) => bans.filter((ban) => banState(ban) === state).length;
  return { active: count("active"), lifted: count("lifted"), expired: count("expired"), all: bans.length };
}

// ---- Removed ----

export type RemovedItem = {
  id: string;
  kind: "project" | "post";
  title: string;
  where: string;
  owner: string;
  rule: RuleId;
  by: string;
  hoursAgo: number;
  note: string;
  reportId?: string;
};

// Newest first.
export const REMOVED: readonly RemovedItem[] = [
  { id: "rm-6", kind: "post", title: "Free Ore generator link", where: "Ideas", owner: "wick", rule: "spam", by: "tamsin", hoursAgo: 44, note: "A link that promised free Ore.", reportId: "rp-307" },
  { id: "rm-5", kind: "post", title: "Comment on \"Bench label printer script\"", where: "Show & Tell", owner: "wick", rule: "kind", by: "lintel", hoursAgo: 90, note: "A comment that made fun of the builder's age.", reportId: "rp-304" },
  { id: "rm-4", kind: "post", title: "Photo of the workshop door", where: "Show & Tell", owner: "brasskettle", rule: "private", by: "fenwick", hoursAgo: 150, note: "A house number was visible. The owner can post again without it." },
  { id: "rm-3", kind: "project", title: "Wi-Fi password tester", where: "Explore", owner: "tessel", rule: "safe", by: "bellwether", hoursAgo: 300, note: "Built to test other people's networks, not the builder's own." },
  { id: "rm-2", kind: "post", title: "Reply on \"Pin one project to your profile\"", where: "Ideas", owner: "tessel", rule: "kind", by: "lintel", hoursAgo: 560, note: "Mocking replies aimed at one builder." },
  { id: "rm-1", kind: "project", title: "Copy of a classic game's levels", where: "Explore", owner: "ostler", rule: "own-work", by: "saltmarsh", hoursAgo: 820, note: "Level files taken from another builder's repository." },
];

export const KIND_WORD: Record<RemovedItem["kind"], string> = { project: "Project", post: "Post" };

// Removed projects show in the Projects archive and removed posts in Ideas; each is also an entry in the person's moderation log.
export function removedProjects(items: readonly RemovedItem[] = REMOVED): RemovedItem[] {
  return items.filter((item) => item.kind === "project").sort((a, b) => a.hoursAgo - b.hoursAgo);
}

// ---- The moderation log on a player page ----

export type ModActionKind = "note" | "warn" | "remove" | "ban" | "lift";
export const MOD_ACTION_LABELS: Record<ModActionKind, string> = { note: "Noted", warn: "Warned", remove: "Item removed", ban: "Banned", lift: "Ban lifted" };
export type ModAction = { id: string; kind: ModActionKind; by: string; hoursAgo: number; detail: string };

const VIOLATION_TO_MOD: Record<ViolationAction, ModActionKind> = { note: "note", warning: "warn", removal: "remove", ban: "ban" };

// Everything staff did about one player, newest first: each recorded violation by the step taken, plus bans lifted. Derived from the
// other fixtures so the player page, the Violations page and the Bans page cannot disagree.
export function moderationLogFor(handle: string, violations: readonly Violation[] = VIOLATIONS, bans: readonly Ban[] = BANS): ModAction[] {
  const actions: ModAction[] = violationsFor(handle, violations).map((item) => ({
    id: item.id,
    kind: VIOLATION_TO_MOD[item.action],
    by: item.by,
    hoursAgo: item.hoursAgo,
    detail: item.detail,
  }));
  for (const ban of bansFor(handle, bans)) {
    if (ban.lifted) actions.push({ id: `${ban.id}-lift`, kind: "lift", by: ban.lifted.by, hoursAgo: ban.lifted.hoursAgo, detail: ban.lifted.note });
  }
  return actions.sort((a, b) => a.hoursAgo - b.hoursAgo || a.id.localeCompare(b.id));
}
