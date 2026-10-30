import { db } from "./db";
const STAFF_ROLE = "staff"; // the same role name session.ts uses

// Local test accounts for development only. They exist until Hack Club Auth is connected (gate G1).
// The values are fixed test addresses on the reserved .test domain.
export const LOCAL_TEST_ACCOUNTS = [
  { email: "builder@loadout.test", displayName: "Test builder", staff: false },
  { email: "staff@loadout.test", displayName: "Test staff", staff: true },
] as const;

export function localTestAccountsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.LOADOUT_LOCAL_TEST_ACCOUNTS === "true" && env.NODE_ENV !== "production";
}

export async function seedLocalTestAccounts(): Promise<number> {
  const prisma = db();
  for (const account of LOCAL_TEST_ACCOUNTS) {
    const person = await prisma.person.upsert({
      where: { email: account.email },
      create: { email: account.email, displayName: account.displayName },
      update: { displayName: account.displayName },
    });
    if (account.staff) {
      await prisma.roleGrant.upsert({
        where: { personId_role: { personId: person.id, role: STAFF_ROLE } },
        create: { personId: person.id, role: STAFF_ROLE },
        update: {},
      });
    }
  }
  return LOCAL_TEST_ACCOUNTS.length;
}
