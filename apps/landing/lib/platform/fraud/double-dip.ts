// Double-dip detection, pure. Ported from Pixl's apps/server/src/ysws/doubleDip.ts (buildDoubleDip and its helpers) and
// apps/server/src/ysws/archive.ts (normalizeProjectUrl and the URL index), at upstream 1468ba6942b13add1ac50e1319541a033ee1df38.
// Nothing here touches the database or the network: double-dip-data.ts gathers the inputs, this file decides what they mean, so the
// whole matching rule is testable with fixtures.
//
// The question: does a ship's repo or demo link already appear on credited work somewhere else? Two places are searched.
//   1. LOADOUT's own earlier ships. A different project that was approved in any cycle (its status is approved, or it banked
//      approvedMinutes from an earlier cycle and is open again as an update) and carries the same link.
//   2. The Hack Club YSWS archive (ships.hackclub.com), when LOADOUT_YSWS_ARCHIVE_URL is set. One archive row per credited person,
//      so a team's earlier submission shows up as several rows, which the per-person breakdown below keeps apart.
// The same project's own earlier approval is NOT a match: that is an update ship, and the review desk already carries the prior hours
// for it (Project.approvedMinutes, review-rules.md section 6). Pixl treats "approved in this very program before" as a re-ship; here
// that case is excluded by project id before it reaches this file.
//
// What is "flagged". Pixl flags one situation only: the link is in somebody else's program and the player did not say so. LOADOUT
// has no disclosure column yet (a schema request in the report), so every match outside LOADOUT counts as undisclosed. A match on
// another approved LOADOUT ship is flagged too, because the same work would be paid twice. Everything else stays a note.
// A flag is evidence for the reviewer; nothing here changes the project.
//
// The SYSTEM note keeps the phrases reviewer-dash/lib/doubleDip.ts (doubleDipView) already reads: "did NOT disclose",
// "disclosed", "another LOADOUT ship". Keep them in step.

export function normalizeProjectUrl(raw: string): string {
  let s = String(raw ?? "").trim().toLowerCase();
  if (s === "" || s === "null" || s === "undefined") return "";
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  // Trailing slashes go first, then ".git", so "repo.git/" and "repo/.git" style spellings both reduce to "repo". (Pixl strips them
  // in the other order, which leaves "repo.git/" unmatched.)
  s = s.replace(/\/+$/, "");
  s = s.replace(/\.git$/, "");
  s = s.replace(/\/+$/, "");
  return s;
}

// One earlier credit for a link. `program` is "LOADOUT" for an earlier LOADOUT ship, else the archive's own program name.
export type PriorEntry = {
  url: string;
  program: string;
  hours: number;
  // Unix seconds, as the archive reports them.
  approvedAt: number | null;
  // Whoever the entry credits. "" when the source does not say.
  slackId: string;
  // Set for an earlier LOADOUT ship so the note can name it.
  title?: string;
};

export const OWN_PROGRAM = "LOADOUT";
const isOwnProgram = (entry: PriorEntry): boolean => entry.program.trim().toLowerCase() === OWN_PROGRAM.toLowerCase();

// ---- The archive index (archive.ts) ----

export type ArchiveRow = { program: string; hours: number; approvedAt: number | null; slackId: string };

// approved_at comes from an outside service. A huge or malformed value must not become Infinity/NaN and then throw when the note
// formats a date. A sane value is a finite whole second between the epoch and 2100-01-01 UTC.
export const MIN_APPROVED_UNIX = 1;
export const MAX_APPROVED_UNIX = 4_102_444_800; // 2100-01-01T00:00:00Z

export function saneUnixSeconds(raw: unknown): number | null {
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value) || value < MIN_APPROVED_UNIX || value > MAX_APPROVED_UNIX) return null;
  return Math.floor(value);
}

function cleanField(raw: unknown): string {
  const s = String(raw ?? "").trim();
  return s === "" || s === "null" || s === "undefined" ? "" : s;
}

// The archive answers with a bare array, or an object holding the list under entries or data. Anything else is an empty archive.
export function archiveRows(json: unknown): Record<string, unknown>[] {
  const list = Array.isArray(json) ? json : Array.isArray((json as { entries?: unknown })?.entries) ? (json as { entries: unknown[] }).entries : Array.isArray((json as { data?: unknown })?.data) ? (json as { data: unknown[] }).data : [];
  return list.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
}

// Every row filed under its normalized code_url and demo_url. A list per URL because a team's submission is one row per person.
export function indexArchive(json: unknown): Map<string, ArchiveRow[]> {
  const byUrl = new Map<string, ArchiveRow[]>();
  for (const entry of archiveRows(json)) {
    const row: ArchiveRow = {
      program: String(entry.ysws ?? "another YSWS"),
      hours: Number(entry.hours) || 0,
      approvedAt: saneUnixSeconds(entry.approved_at),
      slackId: cleanField(entry.slack_id),
    };
    for (const key of ["code_url", "demo_url"]) {
      const url = normalizeProjectUrl(String(entry[key] ?? ""));
      if (url === "") continue;
      const list = byUrl.get(url);
      if (list) list.push(row);
      else byUrl.set(url, [row]);
    }
  }
  return byUrl;
}

// Pixl's findAllInYswsArchive: the repo link is tried first and, if it has any rows, the demo link is not looked at.
export function findInArchive(index: Map<string, ArchiveRow[]>, repoUrl: string, demoUrl: string): PriorEntry[] {
  for (const url of [repoUrl, demoUrl]) {
    const rows = index.get(normalizeProjectUrl(url));
    if (rows?.length) return rows.map((row) => ({ url, ...row }));
  }
  return [];
}

// ---- Earlier LOADOUT ships ----

export type OtherShip = {
  id: string;
  title: string;
  status: string;
  repoUrl: string | null;
  demoUrl: string | null;
  approvedMinutes: number;
  approvedAt: Date | null;
  ownerSlackId: string | null;
};

// "Approved in any cycle". An approved ship counts, and so does one that is open again as an update: requestUpdate flips it back to
// draft but keeps its approvedMinutes, so the banked minutes are the proof. Status spellings vary (second_pass, second-pass), hence
// the canonical form; only the word "approved" is compared, so an unknown status never counts as approved by accident.
const canonical = (status: string): string => status.trim().toLowerCase().replace(/_/g, "-");
export const hasBeenApproved = (ship: Pick<OtherShip, "status" | "approvedMinutes">): boolean => canonical(ship.status) === "approved" || ship.approvedMinutes > 0;

export function findInLoadout(self: { id: string; repoUrl: string; demoUrl: string }, others: readonly OtherShip[]): PriorEntry[] {
  const selfUrls = [self.repoUrl, self.demoUrl].map(normalizeProjectUrl);
  const out: PriorEntry[] = [];
  for (const ship of others) {
    if (ship.id === self.id || !hasBeenApproved(ship)) continue;
    // Same rule as the archive: the repo link decides, and the demo link only when no repo link matched at all.
    const repoHit = selfUrls[0] !== "" && normalizeProjectUrl(ship.repoUrl ?? "") === selfUrls[0];
    const demoHit = selfUrls[1] !== "" && normalizeProjectUrl(ship.demoUrl ?? "") === selfUrls[1];
    if (!repoHit && !demoHit) continue;
    out.push({
      url: repoHit ? self.repoUrl : self.demoUrl,
      program: OWN_PROGRAM,
      hours: Math.round((ship.approvedMinutes / 60) * 10) / 10,
      approvedAt: saneUnixSeconds(ship.approvedAt ? ship.approvedAt.getTime() / 1000 : null),
      slackId: ship.ownerSlackId ?? "",
      title: ship.title,
    });
  }
  return out;
}

// ---- The decision (doubleDip.ts) ----

// One person on the current ship (the owner or an accepted collaborator) with their own independently tracked hours, never a team
// total. label is a display name when there is one, otherwise the Slack id.
export type TeamMember = { slackId: string; label: string; claimedHours: number };

export type DoubleDipInput = {
  project: { name: string };
  // Every earlier credit sharing the repo or demo link: LOADOUT ships first, then archive rows.
  matches: PriorEntry[];
  // The owner's claimed time in seconds, kept apart from `collaborators` since the owner is always on the ship.
  trackedSeconds: number;
  // Accepted collaborators only (not the owner).
  collaborators: TeamMember[];
  ownerLabel: string;
  ownerSlackId: string | null;
  // Whether the builder said they also submitted this elsewhere. LOADOUT has no such field yet, so callers pass false.
  otherYsws?: boolean;
};

export type DoubleDipResult = {
  // "" when there is nothing to say.
  systemNote: string;
  // Present only for a clear-cut match; the one line a reviewer reads first.
  flagDetail?: string;
};

const hoursOf = (seconds: number): number => Math.round((seconds / 3600) * 10) / 10;

// A prior entry can also be built by hand, so formatting never assumes the value passed the ingestion bounds above: an Invalid
// Date is reported as unknown instead of throwing out of toISOString.
export function fmtDate(unixSeconds: number | null): string {
  if (!Number.isFinite(unixSeconds ?? NaN)) return "unknown date";
  const date = new Date((unixSeconds as number) * 1000);
  return Number.isNaN(date.getTime()) ? "unknown date" : date.toISOString().slice(0, 10);
}

function suggestedCapLine(label: string, claimed: number, prior: number): string {
  const cap = Math.max(0, Math.round((claimed - prior) * 10) / 10);
  return `${label}: claims ${claimed}h here, got ${prior}h before, suggest crediting at most ${cap}h unless the new work is clearly separate.`;
}

// The per-person block shared by every "matches found" case: every earlier entry (who got what, when), then every current team
// member (owner plus collaborators) matched against those entries by Slack id, so a reviewer never has to guess who on the team was
// already credited for how much of this repo elsewhere.
//
// Many archive rows carry no Slack id. When the ship has a single person on it, a row without a Slack id on the same repo can only
// be theirs, so it is attributed to them (with a team, an anonymous row stays "someone").
function teamBreakdown(matches: PriorEntry[], team: TeamMember[]): string {
  const solo = team.length === 1 ? team[0] : null;
  const isTheirs = (m: PriorEntry, t: TeamMember) => (m.slackId !== "" && m.slackId === t.slackId) || (solo === t && m.slackId === "");
  const priorLines = matches
    .map((m) => {
      const known = team.find((t) => isTheirs(m, t));
      const who = known ? known.label : m.slackId ? `Slack user ${m.slackId}` : "someone";
      return `${who} got ${m.hours}h (approved ${fmtDate(m.approvedAt)})`;
    })
    .join("; ");
  const teamLines = team
    .map((t) => {
      // Every earlier entry for this person counts: a project approved twice has two rows, and only the sum is credited time.
      const priors = matches.filter((m) => isTheirs(m, t));
      const prior = Math.round(priors.reduce((s, m) => s + m.hours, 0) * 10) / 10;
      return priors.length > 0 ? suggestedCapLine(t.label, t.claimedHours, prior) : `${t.label}: claims ${t.claimedHours}h here, no prior entry found for them specifically, no overlap to deflate.`;
    })
    .join(" ");
  return `Prior entries for this repo: ${priorLines}. Per person on this ship: ${teamLines}`;
}

export function buildDoubleDip(input: DoubleDipInput): DoubleDipResult {
  const { project, matches, trackedSeconds, collaborators, ownerLabel, ownerSlackId } = input;
  if (matches.length === 0) return { systemNote: "" };

  const team: TeamMember[] = [{ slackId: ownerSlackId ?? "", label: ownerLabel, claimedHours: hoursOf(trackedSeconds) }, ...collaborators];
  const breakdown = teamBreakdown(matches, team);
  const outside = matches.filter((m) => !isOwnProgram(m));

  if (outside.length === 0) {
    const first = matches[0];
    const named = first.title ? ` ("${first.title}")` : "";
    return {
      systemNote: `SYSTEM: ${first.url} was already approved on another LOADOUT ship${named}, so the same work may be paid twice: only work that is not already credited should count. ${breakdown}`,
      flagDetail: `"${project.name}" shares ${first.url} with another approved LOADOUT ship${named} (${matches.map((m) => `${m.hours}h`).join("+")})`,
    };
  }

  const first = outside[0];
  if (input.otherYsws) return { systemNote: `SYSTEM: Builder disclosed this was submitted to "${first.program}" (${first.url}). ${breakdown}` };
  return {
    systemNote: `SYSTEM: ${first.url} already appears in the Hack Club YSWS archive under "${first.program}" but the builder did NOT disclose it. Possible double dip. ${breakdown}`,
    flagDetail: `"${project.name}" shipped without disclosure: ${first.url} found in the YSWS archive (${first.program}, ${outside.map((m) => `${m.hours}h`).join("+")})`,
  };
}

// The line the review desk shows, from the fixed set. Built from counts and program names we looked up ourselves, never from free
// text the builder wrote.
export function doubleDipSummary(result: DoubleDipResult, matches: PriorEntry[], skipped: readonly string[]): string {
  if (result.flagDetail) return result.flagDetail;
  if (matches.length > 0) return `Shares a link with earlier work (${[...new Set(matches.map((m) => m.program))].join(", ")}); see the note.`;
  return skipped.length > 0 ? `No earlier ship found (${skipped.join("; ")}).` : "No earlier ship found for these links.";
}
