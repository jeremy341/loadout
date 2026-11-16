import { db } from "./db";
// Local test accounts for development only. They exist until Hack Club Auth is connected (gate G1).
// The values are fixed test addresses on the reserved .test domain.
// Roles are role-grant values (lib/reviewer/access.ts). The staff account is an owner through LOCAL_OWNER_EMAILS, not a grant.
export const LOCAL_TEST_ACCOUNTS = [
  { email: "builder@loadout.test", displayName: "Test builder", roles: [] },
  { email: "staff@loadout.test", displayName: "Test owner", roles: [] },
  { email: "reviewer@loadout.test", displayName: "Test reviewer", roles: ["reviewer"] },
  { email: "final@loadout.test", displayName: "Test final reviewer", roles: ["reviewer", "second_pass"] },
  { email: "hardware@loadout.test", displayName: "Test hardware reviewer", roles: ["reviewer", "reviewer_hardware_only"] },
  { email: "software@loadout.test", displayName: "Test software reviewer", roles: ["reviewer", "reviewer_software_only"] },
  { email: "markers@loadout.test", displayName: "Test senior reviewer", roles: ["reviewer", "edit_submission", "ai_draft", "full_queue"] },
  { email: "integrity@loadout.test", displayName: "Test integrity reviewer", roles: ["fraud_review"] },
  { email: "helper@loadout.test", displayName: "Test helper", roles: ["helper"] },
  { email: "fulfiller@loadout.test", displayName: "Test fulfiller", roles: ["fulfiller"] },
  { email: "owner-norev@loadout.test", displayName: "Test owner, no review", roles: ["no_review"] },
  // Signed in, holds no role: the reviewer site answers 404 for them, as for a builder.
  { email: "none@loadout.test", displayName: "Test no role", roles: [] },
] as const;

// The accounts the "View as" menu and loadout_preview_role / LOADOUT_PREVIEW_ROLE can switch to (development only).
export const PREVIEW_ACCOUNTS = [
  { key: "owner", label: "Owner", email: "staff@loadout.test" },
  { key: "owner-no-review", label: "Owner, no review", email: "owner-norev@loadout.test" },
  { key: "reviewer", label: "Reviewer", email: "reviewer@loadout.test" },
  { key: "final-reviewer", label: "Final reviewer", email: "final@loadout.test" },
  { key: "hardware-reviewer", label: "Hardware-only reviewer", email: "hardware@loadout.test" },
  { key: "software-reviewer", label: "Software-only reviewer", email: "software@loadout.test" },
  { key: "senior-reviewer", label: "Reviewer with edit, draft, full queue", email: "markers@loadout.test" },
  { key: "integrity-reviewer", label: "Integrity reviewer", email: "integrity@loadout.test" },
  { key: "helper", label: "Helper", email: "helper@loadout.test" },
  { key: "fulfiller", label: "Fulfiller", email: "fulfiller@loadout.test" },
  { key: "builder", label: "Builder (participant)", email: "builder@loadout.test" },
  { key: "none", label: "Signed in, no role", email: "none@loadout.test" },
] as const;

// Owners are never granted in the database. Locally the staff test account counts as one, in addition to LOADOUT_OWNER_EMAILS.
export const LOCAL_OWNER_EMAILS: string[] = ["staff@loadout.test", "owner-norev@loadout.test"];

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
    for (const role of account.roles) {
      await prisma.roleGrant.upsert({
        where: { personId_role: { personId: person.id, role } },
        create: { personId: person.id, role },
        update: {},
      });
    }
  }
  return LOCAL_TEST_ACCOUNTS.length;
}
