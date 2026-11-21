// Turns internal rows into the public /api/v1 JSON. Pure: no database. Every shape is an explicit field list, so a column added
// to a table later never reaches the API by accident. serializers.test.ts checks that the forbidden fields stay out.
//
// Never in any output here: email, birthday, age, Slack id, Hack Club Auth id, address, bannedAt, banReason, other people's review
// notes, other people's Ore balances. Dates are ISO 8601 UTC. IDs are the same strings the site uses.
//
// API:
//   iso(date) -> string | null
//   hoursFromMinutes(minutes) -> number                    two decimals
//   serializeSelf(person)                                  the signed-in person (own fields only)
//   serializeOwnProject(project)                           own project, including its own review reason
//   serializePublicProject(project)                        what a visitor sees; no review fields
//   serializePublicJournal(entry)                          journal entry without reviewer fields
//   serializeBuilder(person)                               public profile: handle, bio, joined date
//   serializeLedgerEntry(entry)                            own Ore entry
//   serializeHoursDay(row) / serializeTrackLevel(row)      hours series and track progress
//   serializeKey(view)                                     a key with no hash and no plaintext
//   serializeSnapshot(day, kind, data)                     one StatSnapshot row
//   serializeLeaderboardRow(row)                           handle and hours only
import type { KeyView } from "../api-keys";
import { cleanReason } from "../ledger-view";
import { normalizeStatus } from "../profile";

export function iso(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function hoursFromMinutes(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Math.round((minutes / 60) * 100) / 100;
}

export type SelfPerson = {
  id: string;
  handle: string | null;
  displayName: string;
  bio: string | null;
  createdAt: Date;
  statsVisible: boolean;
};

export function serializeSelf(person: SelfPerson) {
  return {
    id: person.id,
    handle: person.handle,
    displayName: person.displayName,
    bio: person.bio,
    joinedAt: iso(person.createdAt),
    statsVisible: person.statsVisible,
  };
}

export type OwnProjectRow = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  status: string;
  isUpdate: boolean;
  approvedMinutes: number;
  reviewNote: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  createdAt: Date;
  submittedAt: Date | null;
  firstShippedAt: Date | null;
};

export function serializeOwnProject(project: OwnProjectRow) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    track: project.track,
    status: normalizeStatus(project.status),
    isUpdate: project.isUpdate,
    approvedHours: hoursFromMinutes(project.approvedMinutes),
    // The reviewer's reason for this builder's own ship. Other people's review notes are never serialized.
    reviewNote: project.reviewNote,
    repoUrl: project.repoUrl,
    demoUrl: project.demoUrl,
    createdAt: iso(project.createdAt),
    submittedAt: iso(project.submittedAt),
    firstShippedAt: iso(project.firstShippedAt),
  };
}

export type PublicProjectRow = {
  id: string;
  title: string;
  description: string | null;
  track: string | null;
  status: string;
  approvedMinutes: number;
  repoUrl: string | null;
  demoUrl: string | null;
  createdAt: Date;
  owner: { handle: string | null };
};

export function serializePublicProject(project: PublicProjectRow) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    track: project.track,
    status: normalizeStatus(project.status),
    ownerHandle: project.owner.handle,
    approvedHours: hoursFromMinutes(project.approvedMinutes),
    repoUrl: project.repoUrl,
    demoUrl: project.demoUrl,
    createdAt: iso(project.createdAt),
  };
}

export type JournalRowLike = {
  id: string;
  title: string;
  body: string;
  hours: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function serializePublicJournal(entry: JournalRowLike) {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    hours: entry.hours,
    status: entry.status,
    createdAt: iso(entry.createdAt),
    updatedAt: iso(entry.updatedAt),
  };
}

export type BuilderRow = { handle: string; bio: string | null; createdAt: Date };

export function serializeBuilder(person: BuilderRow) {
  return { handle: person.handle, bio: person.bio, joinedAt: iso(person.createdAt) };
}

export type LedgerRowLike = {
  id: string;
  amountOre: number;
  status: string;
  kind: string;
  reason: string;
  projectId: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
};

export function serializeLedgerEntry(entry: LedgerRowLike) {
  return {
    id: entry.id,
    amountOre: entry.amountOre,
    status: entry.status,
    kind: entry.kind,
    // Internal Desk ids in a reason are not for the builder, the same as on the site's ledger list.
    reason: cleanReason(entry.reason),
    projectId: entry.projectId,
    createdAt: iso(entry.createdAt),
    confirmedAt: iso(entry.confirmedAt),
  };
}

export function serializeHoursDay(row: { start: string; seconds: number }) {
  return { start: row.start, seconds: row.seconds };
}

export type TrackLevelRow = {
  track: string;
  approvedHours: number;
  level: number;
  levelCap: number;
  discountPercent: number;
  hoursToNextLevel: number | null;
};

export function serializeTrackLevel(row: TrackLevelRow) {
  return {
    track: row.track,
    approvedHours: row.approvedHours,
    level: row.level,
    levelCap: row.levelCap,
    discountPercent: row.discountPercent,
    hoursToNextLevel: row.hoursToNextLevel,
  };
}

// Takes a KeyView (built by keyView in api-keys.ts, which copies named fields only), so no hash can reach this function.
export function serializeKey(view: KeyView) {
  return {
    id: view.id,
    name: view.name,
    prefix: view.prefix,
    scopes: [...view.scopes],
    createdAt: iso(view.createdAt),
    lastUsedAt: iso(view.lastUsedAt),
    expiresAt: iso(view.expiresAt),
    revokedAt: iso(view.revokedAt),
    status: view.status,
  };
}

export function serializeSnapshot(day: Date, kind: string, data: unknown) {
  return { day: day.toISOString().slice(0, 10), kind, data };
}

export function serializeLeaderboardRow(row: { handle: string; seconds: number }) {
  return { handle: row.handle, hours: hoursFromMinutes(row.seconds / 60) };
}
