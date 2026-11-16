import { db } from "../lib/platform/db";
import { localTestAccountsEnabled, seedLocalTestAccounts } from "../lib/platform/local-accounts";
import { seedLocalProfiles } from "../lib/platform/local-profiles";

// Local development only. Refuses to run unless the test-account flag is set and NODE_ENV is not production.
if (!localTestAccountsEnabled()) {
  console.error("Set LOADOUT_LOCAL_TEST_ACCOUNTS=true (and not NODE_ENV=production) to seed local test accounts.");
  process.exit(1);
}

const count = await seedLocalTestAccounts();
console.log(`Seeded ${count} local test accounts.`);
const profiles = await seedLocalProfiles();
console.log(`Seeded ${profiles.builders} builders with handles, ${profiles.projects} projects, ${profiles.uses} Toolbelt uses, ${profiles.blocks} block and ${profiles.bookmarks} saved projects.`);
await db().$disconnect();
