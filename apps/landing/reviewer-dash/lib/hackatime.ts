// Pixl reads Hackatime (coding time) and Lapse (timelapses) over the network. LOADOUT sends no request: the report is built from
// the sample ship's evidence (lib/platform/review.ts), so the Hackatime tab is filled with sample numbers and nothing is fetched.
// The types are Pixl's, copied from lib/hackatime.ts.
import { REVIEW_SHIPS, type ReviewShip } from "@/lib/platform/review";
import { slackIdFor } from "./sample/index";
import type { Commit } from "./commits";
import type { ShippedProject } from "./db";

export interface Span {
  start: number;
  end: number;
}

export interface TrustFactor {
  level: string;
  value: number;
}

export interface HackatimeBreakdown {
  name: string;
  seconds: number;
  text: string;
  percent: number;
  color?: string;
}

export interface LapseTimelapse {
  id: string;
  name: string;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
}

export interface HackatimeProjectReport {
  name: string;
  seconds: number;
  text: string;
  percent: number;
  linked: boolean;
  sessions: number;
  firstActivity: number | null;
  lastActivity: number | null;
  /** Lapse timelapse videos of this project's coding sessions, if any. */
  lapses: LapseTimelapse[];
}

export interface HackatimeReport {
  ok: boolean;
  /** Hackatime's own numeric user id. Empty when unavailable. */
  hackatimeUserId: string;
  totalSeconds: number;
  humanReadableTotal: string;
  dailyAverageSeconds: number;
  rangeStart: string | null;
  rangeEnd: string | null;
  languages: HackatimeBreakdown[];
  languagesScoped: boolean;
  editors: HackatimeBreakdown[];
  operatingSystems: HackatimeBreakdown[];
  machines: HackatimeBreakdown[];
  projects: HackatimeProjectReport[];
}

/** One contributor's Hackatime report. Collaborators track on their own account, so a multi-person ship has one per person. */
export interface HackatimePersonReport {
  userId: string;
  report: HackatimeReport;
}

function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const unavailable: HackatimeReport = {
  ok: false,
  hackatimeUserId: "",
  totalSeconds: 0,
  humanReadableTotal: "0m",
  dailyAverageSeconds: 0,
  rangeStart: null,
  rangeEnd: null,
  languages: [],
  languagesScoped: false,
  editors: [],
  operatingSystems: [],
  machines: [],
  projects: [],
};

// The sample ship this builder's linked projects belong to.
function shipFor(slackId: string | null | undefined, projects: string[]): ReviewShip | null {
  if (!slackId) return null;
  return (
    REVIEW_SHIPS.find((ship) => {
      const mine = slackIdFor(ship.builder) === slackId || (ship.collaborators ?? []).some((mate) => slackIdFor(mate.handle) === slackId);
      if (!mine) return false;
      if (ship.evidence.source !== "hackatime") return ship.evidence.source === "lapse" && projects.length === 0;
      return projects.length === 0 || ship.evidence.projects.some((item) => projects.includes(item.name));
    }) ?? null
  );
}

export async function fetchUserSpans(slackId: string | null | undefined, token: string | null, projects: string[]): Promise<Span[] | null> {
  void slackId;
  void token;
  void projects;
  return null;
}

export async function fetchTrackedSecondsSince(): Promise<number> {
  return 0;
}

export async function fetchTrustFactor(slackId: string | null | undefined): Promise<TrustFactor | null> {
  if (!slackId) return null;
  const ship = REVIEW_SHIPS.find((item) => slackIdFor(item.builder) === slackId && item.evidence.source === "hackatime");
  if (!ship || ship.evidence.source !== "hackatime") return null;
  return { level: ship.evidence.trust, value: ship.evidence.trust === "green" ? 0 : 1 };
}

export async function fetchLapsesForProject(): Promise<LapseTimelapse[]> {
  return [];
}

export async function fetchHackatimeReport(
  slackId: string | null | undefined,
  token: string | null,
  linkedProjects: string[],
): Promise<HackatimeReport> {
  void token;
  const ship = shipFor(slackId, linkedProjects);
  if (!ship) return unavailable;
  const evidence = ship.evidence;
  if (evidence.source === "hackatime") {
    const total = evidence.projects.reduce((sum, item) => sum + item.minutes * 60, 0);
    return {
      ok: true,
      hackatimeUserId: String(10_000 + (ship.id.length * 37 + ship.builder.length)),
      totalSeconds: total,
      humanReadableTotal: fmtSeconds(total),
      dailyAverageSeconds: Math.round(total / 30),
      rangeStart: null,
      rangeEnd: null,
      languages: evidence.languages.map((item) => ({ name: item.name, seconds: Math.round((total * item.percent) / 100), text: fmtSeconds(Math.round((total * item.percent) / 100)), percent: item.percent })),
      languagesScoped: true,
      editors: [],
      operatingSystems: [],
      machines: [],
      projects: evidence.projects.map((item) => ({
        name: item.name,
        seconds: item.minutes * 60,
        text: fmtSeconds(item.minutes * 60),
        percent: total > 0 ? Math.round(((item.minutes * 60) / total) * 100) : 0,
        linked: linkedProjects.length === 0 || linkedProjects.includes(item.name),
        sessions: item.sessions,
        firstActivity: null,
        lastActivity: null,
        lapses: [],
      })),
    };
  }
  // Hardware: Lapse recordings stand in for the tracked time. No video is attached.
  const total = evidence.recordings.reduce((sum, item) => sum + item.minutes * 60, 0);
  return {
    ...unavailable,
    ok: true,
    hackatimeUserId: "20001",
    totalSeconds: total,
    humanReadableTotal: fmtSeconds(total),
    projects: [
      {
        name: ship.title,
        seconds: total,
        text: fmtSeconds(total),
        percent: 100,
        linked: true,
        sessions: evidence.recordings.length,
        firstActivity: null,
        lastActivity: null,
        lapses: evidence.recordings.map((item, index) => ({ id: `${ship.id}-lapse-${index}`, name: `${item.day} recording`, playbackUrl: null, thumbnailUrl: null, duration: item.minutes * 60 })),
      },
    ],
  };
}

export async function fetchHackatimeUserId(slackId: string | null | undefined, token: string | null): Promise<string | null> {
  void token;
  return slackId ? "10000" : null;
}

export async function hackatimeUserIdsFor(rows: ShippedProject[]): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  for (const row of rows) if (row.hackatime_projects.length > 0) out.set(row.id, "10000");
  return out;
}

// The sample commits already carry their tracked time (see ./commits.ts), so there is nothing to attach.
export function attachTrackedTime(commits: Commit[], spans: Span[]): void {
  void commits;
  void spans;
}
