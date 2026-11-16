// Local development data for Profile, Explore and the Toolbelt: four sample builders plus handles and projects for the builder test
// account. No real people; sample addresses use github.com/example-handle and .example hosts. Idempotent (every row is an upsert
// on a fixed id or a unique key). Called from scripts/seed-local-accounts.ts, which refuses to run unless local test accounts are on.
import { db } from "./db";

type SeedProject = {
  id: string;
  owner: string;
  title: string;
  description: string;
  track: "Tools" | "Systems" | "Compute" | "Hardware";
  status: string;
  repoUrl: string | null;
  demoUrl?: string;
  pinned?: boolean;
  showBuilding?: boolean;
  hidden?: boolean;
};

export const SEED_BUILDERS = [
  { email: "juniper@loadout.test", displayName: "Sample Juniper", handle: "juniper_dev", bio: "Parsers, small CLIs and tidy config. Sample builder." },
  { email: "kestrel@loadout.test", displayName: "Sample Kestrel", handle: "kestrel", bio: "Simulations and graphics. I like orbits. Sample builder." },
  { email: "pixelfox@loadout.test", displayName: "Sample Pixel Fox", handle: "pixel-fox", bio: "Boards, firmware and things with LEDs. Sample builder." },
  { email: "bolt@loadout.test", displayName: "Sample Bolt", handle: "bolt_nine", bio: "Storage and file systems. Sample builder." },
] as const;

// The builder test account gets a handle and a spread of projects, so the signed-in local view is not empty.
export const SEED_TEST_BUILDER = { email: "builder@loadout.test", handle: "test_builder", bio: "The local test builder. Not a real person." };

const EXAMPLE = "https://github.com/example-handle";

export const SEED_PROJECTS: SeedProject[] = [
  { id: "seed-tinyparse", owner: "juniper@loadout.test", title: "Tinyparse", description: "A tiny config file parser with readable errors.", track: "Tools", status: "approved", repoUrl: `${EXAMPLE}/tinyparse`, pinned: true },
  { id: "seed-palette-forge", owner: "juniper@loadout.test", title: "Palette Forge", description: "Builds accessible colour palettes from one seed colour.", track: "Tools", status: "approved", repoUrl: `${EXAMPLE}/palette-forge`, demoUrl: "https://palette-forge.example/demo" },
  { id: "seed-notebook-sync", owner: "juniper@loadout.test", title: "Notebook Sync", description: "Draft: sync notes between two machines.", track: "Tools", status: "draft", repoUrl: null },
  { id: "seed-orbit-sim", owner: "kestrel@loadout.test", title: "Orbit Sim", description: "A two-body orbit simulator with a replayable timeline.", track: "Compute", status: "approved", repoUrl: `${EXAMPLE}/orbit-sim`, pinned: true },
  { id: "seed-gridlock", owner: "kestrel@loadout.test", title: "Gridlock", description: "A tiny job scheduler that never double-runs a task.", track: "Systems", status: "approved", repoUrl: `${EXAMPLE}/gridlock` },
  { id: "seed-ray-marcher", owner: "kestrel@loadout.test", title: "Ray Marcher", description: "Currently building: a software ray marcher.", track: "Compute", status: "logging", repoUrl: `${EXAMPLE}/ray-marcher`, showBuilding: true },
  { id: "seed-pocket-synth", owner: "pixelfox@loadout.test", title: "Pocket Synth", description: "A battery-powered synth with a handmade keyboard.", track: "Hardware", status: "approved", repoUrl: "https://git.example/pixel-fox/pocket-synth", pinned: true },
  { id: "seed-lamp-bus", owner: "pixelfox@loadout.test", title: "Lamp Bus", description: "A closed-source lamp controller. Approved, but no source link.", track: "Hardware", status: "approved", repoUrl: null },
  { id: "seed-tape-deck", owner: "bolt@loadout.test", title: "Tape Deck", description: "An append-only log store with a command line viewer.", track: "Systems", status: "approved", repoUrl: `${EXAMPLE}/tape-deck` },
  { id: "seed-fan-curve", owner: "bolt@loadout.test", title: "Fan Curve", description: "In review: a quiet fan controller.", track: "Hardware", status: "in-review", repoUrl: `${EXAMPLE}/fan-curve` },
  { id: "seed-cable-tidy", owner: "builder@loadout.test", title: "Cable Tidy", description: "A cable label maker that prints from a text list.", track: "Tools", status: "approved", repoUrl: `${EXAMPLE}/cable-tidy`, pinned: true },
  { id: "seed-draft-radio", owner: "builder@loadout.test", title: "Draft Radio", description: "A draft: a small radio receiver.", track: "Hardware", status: "draft", repoUrl: null },
  { id: "seed-mini-router", owner: "builder@loadout.test", title: "Mini Router", description: "Currently building: a small packet router.", track: "Systems", status: "logging", repoUrl: `${EXAMPLE}/mini-router`, showBuilding: true },
  { id: "seed-private-wiki", owner: "builder@loadout.test", title: "Private Wiki", description: "A logging project kept off the public profile.", track: "Tools", status: "logging", repoUrl: null },
];

export const SEED_USES = [
  // Confirmed: Orbit Sim uses Tinyparse.
  { id: "seed-use-orbit-tinyparse", projectId: "seed-orbit-sim", toolId: "seed-tinyparse", status: "confirmed", note: "Orbit Sim loads every scenario through src/config/load.ts, which calls Tinyparse." },
  // Pending: the test builder's Mini Router uses Tinyparse (logging, so equipping is allowed).
  { id: "seed-use-router-tinyparse", projectId: "seed-mini-router", toolId: "seed-tinyparse", status: "pending", note: "The router config feature reads its rules file with Tinyparse in src/rules.ts." },
] as const;

// Juniper stops Bolt from equipping their tools.
export const SEED_BLOCKS = [{ maker: "juniper@loadout.test", blocked: "bolt@loadout.test" }] as const;

export async function seedLocalProfiles(): Promise<{ builders: number; projects: number; uses: number; blocks: number }> {
  const prisma = db();
  const ids = new Map<string, string>();

  for (const b of SEED_BUILDERS) {
    const person = await prisma.person.upsert({
      where: { email: b.email },
      create: { email: b.email, displayName: b.displayName, handle: b.handle, bio: b.bio },
      update: { displayName: b.displayName, handle: b.handle, bio: b.bio },
    });
    ids.set(b.email, person.id);
  }
  const tester = await prisma.person.upsert({
    where: { email: SEED_TEST_BUILDER.email },
    create: { email: SEED_TEST_BUILDER.email, displayName: "Test builder", handle: SEED_TEST_BUILDER.handle, bio: SEED_TEST_BUILDER.bio },
    update: { handle: SEED_TEST_BUILDER.handle, bio: SEED_TEST_BUILDER.bio },
  });
  ids.set(SEED_TEST_BUILDER.email, tester.id);

  for (const p of SEED_PROJECTS) {
    const data = {
      ownerId: ids.get(p.owner) as string,
      title: p.title,
      description: p.description,
      track: p.track,
      status: p.status,
      repoUrl: p.repoUrl,
      demoUrl: p.demoUrl ?? null,
      pinned: p.pinned ?? false,
      showBuilding: p.showBuilding ?? false,
      hidden: p.hidden ?? false,
    };
    await prisma.project.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }
  for (const u of SEED_USES) {
    const data = { projectId: u.projectId, toolId: u.toolId, status: u.status, note: u.note, decidedAt: u.status === "pending" ? null : new Date() };
    await prisma.toolbeltUse.upsert({ where: { projectId_toolId: { projectId: u.projectId, toolId: u.toolId } }, create: { id: u.id, ...data }, update: data });
  }
  for (const b of SEED_BLOCKS) {
    const makerId = ids.get(b.maker) as string;
    const blockedId = ids.get(b.blocked) as string;
    await prisma.toolbeltBlock.upsert({ where: { makerId_blockedId: { makerId, blockedId } }, create: { makerId, blockedId }, update: {} });
  }
  return { builders: SEED_BUILDERS.length + 1, projects: SEED_PROJECTS.length, uses: SEED_USES.length, blocks: SEED_BLOCKS.length };
}
