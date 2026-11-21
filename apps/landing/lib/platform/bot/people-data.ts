// Reads for the bot's person and ship routes. Server only. Never returns an email, birthday, address or age. A banned person is
// reported as not linked.
//
// API:
//   personBySlackId(slackId) -> PersonView        { linked: false } for no person, or a banned one; otherwise handle, track levels
//                                                 (trackLevelRows over approved minutes), total approved hours and ore (spendable balance)
//   lastApprovedShip(slackId) -> ShipView | null  the newest approved project
//   approvedShips(slackId) -> ShipView[]          every approved project, newest first, at most 50
//   The shapes match PersonView, ShipView in apps/bot/src/types.ts.
import { db } from "../db";
import { trackLevelRows } from "../api-v1/views";
import { ownTrackProjects } from "../api-v1/queries-data";
import { ledgerBalances } from "../ledger-data";
import { siteBase } from "./outbox";

export type PersonView = {
  linked: boolean;
  handle?: string;
  levels?: { track: string; level: number; approvedHours: number }[];
  approvedHours?: number;
  ore?: number;
};
export type ShipView = { projectId: string; title: string; url: string; approvedAt: string };

const SHIP_LIST_MAX = 50;

async function activePerson(slackId: string) {
  const person = await db().person.findUnique({ where: { slackId }, select: { id: true, handle: true, bannedAt: true } });
  return person && !person.bannedAt ? person : null;
}

export async function personBySlackId(slackId: string): Promise<PersonView> {
  const person = await activePerson(slackId);
  if (!person) return { linked: false };
  const [projects, balance] = await Promise.all([ownTrackProjects(person.id), ledgerBalances(person.id)]);
  const levels = trackLevelRows(projects).map((row) => ({ track: row.track, level: row.level, approvedHours: row.approvedHours }));
  const minutes = projects.reduce((sum, project) => sum + Math.max(0, project.approvedMinutes), 0);
  return {
    linked: true,
    ...(person.handle ? { handle: person.handle } : {}),
    levels,
    approvedHours: Math.round((minutes / 60) * 100) / 100,
    ore: balance.available,
  };
}

async function shipsFor(slackId: string, take: number): Promise<ShipView[]> {
  const person = await activePerson(slackId);
  if (!person) return [];
  const base = siteBase();
  const rows = await db().project.findMany({
    where: { ownerId: person.id, status: "approved" },
    orderBy: [{ statusChangedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take,
    select: { id: true, title: true, statusChangedAt: true, createdAt: true },
  });
  return rows.map((row) => ({
    projectId: row.id,
    title: row.title,
    url: `${base}/dashboard/explore/${row.id}`,
    approvedAt: (row.statusChangedAt ?? row.createdAt).toISOString(),
  }));
}

export async function lastApprovedShip(slackId: string): Promise<ShipView | null> {
  const [ship] = await shipsFor(slackId, 1);
  return ship ?? null;
}

export async function approvedShips(slackId: string): Promise<ShipView[]> {
  return shipsFor(slackId, SHIP_LIST_MAX);
}
