// Local development data for the Ore ledger and the journal, so those pages are not empty. Dev only: called from
// scripts/seed-local-accounts.ts, which refuses to run unless local test accounts are on. Idempotent (upserts on fixed ids).
// Every ledger row is kind "dev_seed" and says "Sample" in its reason. Real approved hours do not exist yet, so these are not them.
import { db } from "./db";
import { localTestAccountsEnabled } from "./local-accounts";

const BUILDER_EMAIL = "builder@loadout.test";
const DAY = 24 * 60 * 60 * 1000;

export const SEED_LEDGER = [
  { id: "seed-ledger-1", amountOre: 240, status: "confirmed", daysAgo: 9, reason: "Ore for 24 approved hours." },
  { id: "seed-ledger-2", amountOre: -120, status: "confirmed", daysAgo: 6, reason: "Spent on a shop item." },
  { id: "seed-ledger-3", amountOre: 50, status: "confirmed", daysAgo: 3, reason: "A Toolbelt reward." },
  { id: "seed-ledger-4", amountOre: 80, status: "pending", daysAgo: 1, reason: "8 hours waiting for review." },
] as const;

export const SEED_JOURNAL = [
  { id: "seed-journal-1", projectId: "seed-mini-router", title: "Packet parser", body: "Wrote the first packet parser and a table of test frames.", hours: 3.5, daysAgo: 4 },
  { id: "seed-journal-2", projectId: "seed-mini-router", title: "Routing table", body: "Added longest prefix match to the routing table.", hours: 2.25, daysAgo: 1 },
] as const;

export async function seedLocalLedger(): Promise<{ ledger: number; journal: number }> {
  if (!localTestAccountsEnabled()) throw new Error("Local test accounts are off; not seeding the ledger.");
  const prisma = db();
  const person = await prisma.person.findUnique({ where: { email: BUILDER_EMAIL }, select: { id: true } });
  if (!person) throw new Error("Seed the local test accounts first.");
  const now = Date.now();

  for (const row of SEED_LEDGER) {
    const createdAt = new Date(now - row.daysAgo * DAY);
    const confirmedAt = row.status === "confirmed" ? createdAt : null;
    // Only the reason and amount are refreshed on a rerun; createdAt stays put so the order is stable.
    await prisma.ledgerEntry.upsert({
      where: { id: row.id },
      create: { id: row.id, personId: person.id, amountOre: row.amountOre, status: row.status, kind: "dev_seed", reason: row.reason, createdAt, confirmedAt },
      update: { amountOre: row.amountOre, status: row.status, reason: row.reason },
    });
  }
  for (const row of SEED_JOURNAL) {
    const project = await prisma.project.findUnique({ where: { id: row.projectId }, select: { id: true } });
    if (!project) continue;
    await prisma.journalEntry.upsert({
      where: { id: row.id },
      create: { id: row.id, projectId: row.projectId, authorId: person.id, title: row.title, body: row.body, hours: row.hours, createdAt: new Date(now - row.daysAgo * DAY) },
      update: { title: row.title, body: row.body, hours: row.hours },
    });
  }
  return { ledger: SEED_LEDGER.length, journal: SEED_JOURNAL.length };
}
