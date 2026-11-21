// Local development data for Explore: enough approved projects to fill more than one page of the feed, journal entries on a few
// approved projects, and kudos from the sample builders. Dev only: run with `bun run scripts/seed-local-explore.ts` after
// `bun run db:seed:local`, which refuses to run unless local test accounts are on. Idempotent (every row is an upsert on a fixed id).
// No real people. The extra projects belong to one sample builder (atlas_bay) so the other builders' project counts do not change,
// and they have no source address, so the Toolbelt finder does not list them.
import { db } from "./db";
import { localTestAccountsEnabled } from "./local-accounts";

const DAY = 24 * 60 * 60 * 1000;
export const EXTRA_PROJECTS = 24;
const TRACKS = ["Tools", "Systems", "Compute", "Hardware"] as const;
const ATLAS = { email: "atlas@loadout.test", displayName: "Sample Atlas", handle: "atlas_bay", bio: "Many small experiments. Sample builder." };

// Journal entries by the project's own builder (by email).
const JOURNAL = [
  { id: "seed-xj-tinyparse-1", projectId: "seed-tinyparse", owner: "juniper@loadout.test", title: "First parser pass", body: "Wrote the tokenizer and a table of sample files.\nErrors now point at the line and the column.", hours: 3.5, daysAgo: 21 },
  { id: "seed-xj-tinyparse-2", projectId: "seed-tinyparse", owner: "juniper@loadout.test", title: "Readable error messages", body: "Rewrote the error text so it says what was expected. Added twelve failing examples to the test list.", hours: 2.25, daysAgo: 9 },
  { id: "seed-xj-tinyparse-3", projectId: "seed-tinyparse", owner: "juniper@loadout.test", title: "Release notes and a README", body: "Cleaned up the public API, wrote the README and tagged the first release.", hours: 1.5, daysAgo: 2 },
  { id: "seed-xj-orbit-1", projectId: "seed-orbit-sim", owner: "kestrel@loadout.test", title: "Two bodies, one timeline", body: "The integrator is stable for a full year of simulated time. Replays read from a saved list of states.", hours: 4, daysAgo: 12 },
  { id: "seed-xj-orbit-2", projectId: "seed-orbit-sim", owner: "kestrel@loadout.test", title: "Scenario files", body: "Scenarios load through the config parser now, so a new orbit is a text file.", hours: 2.75, daysAgo: 5 },
  { id: "seed-xj-lamp-1", projectId: "seed-lamp-bus", owner: "pixelfox@loadout.test", title: "Bus timing on the scope", body: "Measured the lamp bus at 9600 baud and fixed the idle gap between frames.", hours: 2, daysAgo: 7 },
] as const;

// Who gave kudos to what. The builder test account gives none, so its own toggle test starts from zero.
const KUDOS = [
  { projectId: "seed-tinyparse", from: ["kestrel@loadout.test", "pixelfox@loadout.test", "bolt@loadout.test"] },
  { projectId: "seed-orbit-sim", from: ["juniper@loadout.test", "bolt@loadout.test"] },
  { projectId: "seed-pocket-synth", from: ["kestrel@loadout.test"] },
  { projectId: "seed-cable-tidy", from: ["juniper@loadout.test", "pixelfox@loadout.test"] },
] as const;

export async function seedLocalExplore(): Promise<{ projects: number; journal: number; kudos: number }> {
  if (!localTestAccountsEnabled()) throw new Error("Local test accounts are off; not seeding Explore.");
  const prisma = db();
  const now = Date.now();

  const atlas = await prisma.person.upsert({
    where: { email: ATLAS.email },
    create: ATLAS,
    update: { displayName: ATLAS.displayName, handle: ATLAS.handle, bio: ATLAS.bio },
    select: { id: true },
  });
  for (let i = 1; i <= EXTRA_PROJECTS; i += 1) {
    const n = String(i).padStart(2, "0");
    const data = {
      ownerId: atlas.id,
      title: `Atlas Log ${n}`,
      description: i % 3 === 0 ? null : `Experiment ${n} from the Atlas notebook: a small build with a short write-up and a list of what to try next.`,
      track: TRACKS[i % TRACKS.length],
      status: "approved",
      repoUrl: null,
      createdAt: new Date(now - (60 + i) * DAY),
    };
    await prisma.project.upsert({ where: { id: `seed-atlas-${n}` }, create: { id: `seed-atlas-${n}`, ...data }, update: { title: data.title, description: data.description, track: data.track, status: data.status } });
  }

  const people = new Map((await prisma.person.findMany({ select: { id: true, email: true } })).map((p) => [p.email, p.id]));
  let journal = 0;
  for (const row of JOURNAL) {
    const authorId = people.get(row.owner);
    const project = await prisma.project.findUnique({ where: { id: row.projectId }, select: { id: true } });
    if (!authorId || !project) continue;
    await prisma.journalEntry.upsert({
      where: { id: row.id },
      create: { id: row.id, projectId: row.projectId, authorId, title: row.title, body: row.body, hours: row.hours, createdAt: new Date(now - row.daysAgo * DAY) },
      update: { title: row.title, body: row.body, hours: row.hours },
    });
    journal += 1;
  }

  let kudos = 0;
  for (const row of KUDOS) {
    const project = await prisma.project.findUnique({ where: { id: row.projectId }, select: { id: true } });
    if (!project) continue;
    for (const email of row.from) {
      const personId = people.get(email);
      if (!personId) continue;
      await prisma.projectKudos.upsert({
        where: { personId_projectId: { personId, projectId: row.projectId } },
        create: { personId, projectId: row.projectId },
        update: {},
      });
      kudos += 1;
    }
  }
  return { projects: EXTRA_PROJECTS, journal, kudos };
}
