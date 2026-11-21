import { bomGaps, shipById, type ReviewCommit, type ReviewShip } from "@/lib/platform/review";
import { summariseHistory, type CommitHistoryModel, type CommitHost, type PageOutcome } from "./evidence-commits";
import { daysFromJournals, findDoubleDips, type DipRecord, type DipResult } from "./evidence-doubledip";
import type { AiCheckResult } from "./evidence-ai";
import { newPreCheck, PRECHECK_TIMEOUT_MS, reducePreCheck, type PreCheckRun } from "./evidence-precheck";

// Sample data for the evidence blocks. Everything is invented: handles, programmes and addresses on .example hosts. Responses are
// built here in the shape each host sends, so the parsers are exercised on realistic JSON and nothing is ever fetched. Side tables
// are keyed by real ship ids, and a test checks that.

const DAY_NUMBER = /^(\d{1,2}) ([A-Za-z]{3})/;
const MONTH = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function isoFor(label: string, index: number): string {
  const match = DAY_NUMBER.exec(label);
  const month = match ? MONTH.indexOf(match[2].toLowerCase()) + 1 : 1;
  const day = match ? Number(match[1]) : 1;
  const hour = 9 + (index % 9);
  return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:12:00Z`;
}

const fullSha = (short: string): string => short.padEnd(40, "0");

// Response bodies in each host's shape. GitHub's list has no line counts, so the sample reads as if the single-commit calls had been
// made and `stats` merged in; Gitea-style hosts return `stats` on the list when asked.
function githubBody(commits: readonly ReviewCommit[], from: number): unknown[] {
  return commits.map((commit, offset) => ({
    sha: fullSha(commit.sha),
    commit: { message: commit.message, author: { name: commit.author, email: `${commit.author}@users.invalid`, date: isoFor(commit.day, from + offset) } },
    author: { login: commit.author },
    parents: [],
    stats: { additions: commit.additions, deletions: commit.deletions, total: commit.additions + commit.deletions },
  }));
}

function giteaBody(commits: readonly ReviewCommit[], from: number): unknown[] {
  return commits.map((commit, offset) => ({
    sha: fullSha(commit.sha),
    created: isoFor(commit.day, from + offset),
    commit: { message: `${commit.message}\n`, author: { name: commit.author, email: `${commit.author}@noreply.invalid`, date: isoFor(commit.day, from + offset) } },
    author: { login: commit.author, username: commit.author },
    stats: { additions: commit.additions, deletions: commit.deletions, total: commit.additions + commit.deletions },
  }));
}

type HistorySetup = { host: CommitHost; perPage: number; failPages?: readonly number[] };

// Which host each sample ship's commits came from, and the page size the sample used.
export const COMMIT_HOSTS: Readonly<Record<string, HistorySetup>> = {
  "sh-2041": { host: "github", perPage: 100 },
  "sh-2043": { host: "codeberg", perPage: 50 },
  // Two pages of three, and the second page does not answer: the partial state.
  "sh-2045": { host: "forgejo", perPage: 3, failPages: [2] },
};

export function commitHistoryFor(shipId: string): CommitHistoryModel | null {
  const setup = COMMIT_HOSTS[shipId];
  const ship = shipById(shipId);
  if (!setup || !ship) return null;
  const pages = Math.max(1, Math.ceil(ship.commits.length / setup.perPage));
  const outcomes: PageOutcome[] = [];
  for (let page = 1; page <= pages; page += 1) {
    if (setup.failPages?.includes(page)) {
      outcomes.push({ page, ok: false, reason: "The host did not answer in time." });
      continue;
    }
    const slice = ship.commits.slice((page - 1) * setup.perPage, page * setup.perPage);
    const from = (page - 1) * setup.perPage;
    outcomes.push({ page, ok: true, body: setup.host === "github" ? githubBody(slice, from) : giteaBody(slice, from) });
  }
  const coded = new Map(ship.commits.map((commit) => [commit.sha.slice(0, 7), commit.codedMinutes] as const));
  return summariseHistory({ host: setup.host, outcomes, pagesPlanned: pages, coded });
}

// ---- Double dip ----

const record = (ship: ReviewShip): DipRecord => ({
  id: ship.id,
  projectKey: ship.id,
  program: "another-loadout",
  label: `the LOADOUT ship ${ship.id}`,
  source: ship.source,
  demo: ship.demo,
  days: daysFromJournals(ship.journals),
});

// Ships counted somewhere else, as the matcher sees them. The sample ships share many days, so each sample ship is compared with
// the records listed for it rather than with every record, which keeps the sample screens to the two matches the brief assigns.
const OTHER_YSWS: DipRecord = {
  id: "ysws-0412",
  projectKey: "ysws-0412",
  program: "another-ysws",
  label: "a project in another YSWS programme (sample)",
  source: "git.example/ploughshare/tinyvm",
  demo: "ploughshare.example/tinyvm",
  days: [{ day: "2026-10-20", minutes: 420 }],
};

const OTHER_LOADOUT: DipRecord = {
  id: "sh-1987",
  projectKey: "sh-1987",
  program: "another-loadout",
  label: "an earlier LOADOUT ship, sh-1987 (approved)",
  source: "git.example/nullwisp/retro-term",
  demo: null,
  days: [{ day: "2026-10-12", minutes: 480 }],
};

export const DOUBLE_DIP_CANDIDATES: Readonly<Record<string, readonly DipRecord[]>> = {
  "sh-2043": [OTHER_YSWS, OTHER_LOADOUT],
  "sh-2056": [OTHER_YSWS, OTHER_LOADOUT],
};

export const DOUBLE_DIP_SHIPS: readonly string[] = Object.keys(DOUBLE_DIP_CANDIDATES);

// The matcher run against the records listed for the ship. Ships with no list are compared with nothing and match nothing.
export function doubleDipFor(shipId: string): DipResult | null {
  const ship = shipById(shipId);
  if (!ship) return null;
  return findDoubleDips(record(ship), DOUBLE_DIP_CANDIDATES[shipId] ?? []);
}

// ---- Collaborators ----

export const COLLABORATOR_SHIPS: readonly string[] = ["sh-2048"];

// ---- README: the word count of the whole README, where the host reported it (the samples carry only an excerpt) ----

export const README_FULL_WORDS: Readonly<Record<string, number>> = {
  "sh-2041": 412,
  "sh-2043": 358,
  "sh-2045": 187,
};

// ---- AI usage ----

export const AI_CHECKS: Readonly<Record<string, AiCheckResult>> = {
  "sh-2041": { state: "ok", checkedMinutesAgo: 4, commitsChecked: 6, commitsFlagged: 1, estimatedPercent: 12, signals: ["One commit message reads like generated text."] },
  "sh-2049": {
    state: "ok",
    checkedMinutesAgo: 4,
    commitsChecked: 5,
    commitsFlagged: 2,
    estimatedPercent: 58,
    signals: ["One 3,140-line commit with 2 minutes of tracked time.", "Chart components share one generated style."],
  },
};

// A sample of the failure state, for the integrator to show next to the ship when the check does not answer.
export const AI_CHECK_FAILED: AiCheckResult = { state: "unavailable", reason: "The check did not answer in time." };

// ---- Pre-check ----

// Fixed clock for the samples, so the strip reads the same on every load.
export const PRECHECK_NOW = 1_000_000_000;

function run(steps: (current: PreCheckRun) => PreCheckRun, queuedAgoMs: number): PreCheckRun {
  return steps(newPreCheck(PRECHECK_NOW - queuedAgoMs));
}

export const PRECHECK_RUNS: Readonly<Record<string, PreCheckRun>> = {
  "sh-2041": run((r) => reducePreCheck(reducePreCheck(r, { type: "start", at: PRECHECK_NOW - 3_600_000 }), { type: "pass", at: PRECHECK_NOW - 3_540_000 }), 3_700_000),
  "sh-2043": run((r) => reducePreCheck(r, { type: "start", at: PRECHECK_NOW - 95_000 }), 120_000),
  "sh-2045": run((r) => r, 45_000),
  "sh-2049": run((r) => reducePreCheck(r, { type: "start", at: PRECHECK_NOW - (PRECHECK_TIMEOUT_MS + 60_000) }), PRECHECK_TIMEOUT_MS + 120_000),
  "sh-2054": run((r) => reducePreCheck(reducePreCheck(r, { type: "start", at: PRECHECK_NOW - 400_000 }), { type: "fail", at: PRECHECK_NOW - 380_000, reason: "The README could not be found at the source address." }), 450_000),
};

// ---- Keys ----

// Every side table above by name, so a test can check each key is a real ship.
export function evidenceSideTableKeys(): Record<string, string[]> {
  return {
    COMMIT_HOSTS: Object.keys(COMMIT_HOSTS),
    DOUBLE_DIP_SHIPS: [...DOUBLE_DIP_SHIPS],
    COLLABORATOR_SHIPS: [...COLLABORATOR_SHIPS],
    README_FULL_WORDS: Object.keys(README_FULL_WORDS),
    AI_CHECKS: Object.keys(AI_CHECKS),
    PRECHECK_RUNS: Object.keys(PRECHECK_RUNS),
  };
}

// For the hardware ships: the samples' bills have no gaps, so this builds one sample bill that does, for the empty-versus-gap look.
export const SAMPLE_BOM_WITH_GAPS = [
  { part: "RP2040 module", qty: 1, source: "Online electronics distributor" },
  { part: "Hot-swap sockets", qty: 12, source: "" },
  { part: "Key switches", qty: 0, source: "Local hardware shop" },
] as const;

export const SAMPLE_BOM_GAP_COUNT = bomGaps([...SAMPLE_BOM_WITH_GAPS]).length;
