import { db } from "../lib/platform/db";
import { localTestAccountsEnabled } from "../lib/platform/local-accounts";
import { seedLocalExplore } from "../lib/platform/local-explore";

// Local development only, after `bun run db:seed:local`. Adds enough approved projects for a second page of the Explore feed,
// journal entries on a few approved projects and kudos from the sample builders.
if (!localTestAccountsEnabled()) {
  console.error("Set LOADOUT_LOCAL_TEST_ACCOUNTS=true (and not NODE_ENV=production) to seed local Explore data.");
  process.exit(1);
}

const result = await seedLocalExplore();
console.log(`Seeded ${result.projects} approved sample projects, ${result.journal} journal entries and ${result.kudos} kudos.`);
await db().$disconnect();
