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

// True for a host a developer reaches their own machine by: localhost, 127.x, ::1, anything under .localhost (review.localhost), and
// the private LAN ranges (10.x, 192.168.x, 172.16-31.x, 169.254.x) used to open the dev server from a phone. The port is ignored.
// A public name (staging.example.com) is false, so a forged or real public Host never gets the preview accounts.
export function isLoopbackHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.trim().toLowerCase();
  // "[::1]:3000" and "[::1]" lose their brackets and port; a bare "::1" has several colons and no port to strip.
  const name = bare.replace(/^\[([^\]]+)\](:\d+)?$/, "$1").replace(/^([^:]*):\d+$/, "$1");
  if (name === "localhost" || name.endsWith(".localhost") || name === "::1") return true;
  const octets = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(name);
  if (!octets) return false;
  const [a, b, c, d] = octets.slice(1).map(Number);
  if ([a, b, c, d].some((n) => n > 255)) return false;
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

let warned = false;

// The preview roles (owner, reviewer, ...) sign anyone in as a test account without a password, so they are development only:
// the flag must be on, NODE_ENV must be development or test (a production or unset environment never qualifies), and, when the
// caller knows the request's Host header, it must be a local one. Pass the host wherever a request is at hand (lib/platform/session.ts
// readViewer); with no host (scripts, build time) only the first two checks apply. A loud one-time warning marks the mode.
export function localTestAccountsEnabled(env: NodeJS.ProcessEnv = process.env, host?: string | null): boolean {
  if (env.LOADOUT_LOCAL_TEST_ACCOUNTS !== "true") return false;
  if (env.NODE_ENV !== "development" && env.NODE_ENV !== "test") return false;
  if (host !== undefined && host !== null && !isLoopbackHost(host)) return false;
  if (!warned && env.NODE_ENV !== "test") {
    warned = true;
    console.warn(
      "[loadout] LOADOUT_LOCAL_TEST_ACCOUNTS is ON: preview roles sign in without a password. Development only; never enable this on a shared or public host.",
    );
  }
  return true;
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
