// How the owner's team changes reach the viewer's own access. The Admins and Reviewer pages change the in-memory team roster
// (lib/sample/people-data.ts, which keeps Pixl's permission strings and writes a log row for each change). The viewer's real
// grants live in the database (RoleGrant) and are read by readViewer. getAccess in guard.ts lays the changes made since the
// server started over those grants, so a switch made on the Admins page changes what that person may open on the next request
// (for instance: allow submission editing, move a reviewer to the hardware queue, remove a reviewer). Gone after a restart.
// Pure functions, no Next, no database, so the rules can be tested.
import { AI_DRAFT, EDIT_SUBMISSION, FRAUD_REVIEW, FULFILLER, FULL_QUEUE, HARDWARE_ONLY, HELPER, NO_REVIEW, REVIEWER, SECOND_PASS, SOFTWARE_ONLY, staffRolesOnly } from "@/lib/reviewer/access";

// Pixl keeps these in an admins row as permission strings; LOADOUT names them as grants. The Pixl-shaped pages read and write
// Pixl's strings, so the two are translated here and nowhere else.
const PIXL_PERMISSION: Record<string, string> = {
  [REVIEWER]: "review",
  [SECOND_PASS]: "second_pass",
  [HARDWARE_ONLY]: "review_hardware_only",
  [SOFTWARE_ONLY]: "review_software_only",
  [EDIT_SUBMISSION]: "edit_submission",
  [AI_DRAFT]: "ai_draft",
  [FULL_QUEUE]: "full_queue",
  [NO_REVIEW]: "no_review",
  [FRAUD_REVIEW]: "fraud_review",
};

export function toPixlPermissions(roles: readonly string[]): string[] {
  return staffRolesOnly(roles)
    .map((role) => PIXL_PERMISSION[role])
    .filter((permission): permission is string => Boolean(permission));
}

export function fromPixlPermission(permission: string): string | null {
  return Object.entries(PIXL_PERMISSION).find(([, value]) => value === permission)?.[0] ?? null;
}

const ADMIN_ROLES = Object.keys(PIXL_PERMISSION);

export type TeamLogEntry = { slack_id: string | null; action: string; before: string[]; after: string[]; created_at: string };

// The viewer's grants after the team changes made since `since` (a time in ms; seeded history is older). `entries` may be in any
// order. A change to the admins row replaces the reviewer grants and markers; a helper or fulfiller change flips that grant.
export function rolesAfterTeamLog(handle: string, base: readonly string[], entries: readonly TeamLogEntry[], since: number): string[] {
  const mine = entries
    .filter((entry) => entry.slack_id === handle && Date.parse(entry.created_at) >= since)
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  let roles = staffRolesOnly(base);
  for (const entry of mine) {
    const tokens = new Set([...entry.before, ...entry.after]);
    const listRole = tokens.has("helper") ? HELPER : tokens.has("fulfiller") ? FULFILLER : null;
    if (listRole) {
      roles = roles.filter((role) => role !== listRole);
      if (entry.after.includes(listRole === HELPER ? "helper" : "fulfiller")) roles.push(listRole);
      continue;
    }
    roles = roles.filter((role) => !ADMIN_ROLES.includes(role));
    for (const permission of entry.after) {
      const role = fromPixlPermission(permission);
      if (role) roles.push(role as (typeof roles)[number]);
    }
  }
  return [...new Set(roles)];
}

// Sample handles of the local test accounts (lib/platform/review.ts SAMPLE_PEOPLE), by email, so the owner list in Pixl's shape
// (ownerSlackIds) can be built from LOADOUT_OWNER_EMAILS plus the local owners.
export const HANDLE_BY_EMAIL: Record<string, string> = {
  "staff@loadout.test": "bellwether",
  "owner-norev@loadout.test": "ashdown",
  "reviewer@loadout.test": "tamsin",
  "final@loadout.test": "lintel",
  "hardware@loadout.test": "fenwick",
  "software@loadout.test": "marlowe",
  "markers@loadout.test": "hartley",
  "integrity@loadout.test": "quill",
};

export function handleForEmail(email: string): string {
  const key = email.trim().toLowerCase();
  return HANDLE_BY_EMAIL[key] ?? key.split("@")[0].replace(/[^a-z0-9]+/g, "_");
}
