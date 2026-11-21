// How the owner's team changes reach the viewer's own access. The Admins and Reviewer pages change the in-memory team roster
// (lib/sample/people-data.ts, which keeps Pixl's permission strings and writes a log row for each change) AND persist the same
// change to the database (RoleGrant, the source readViewer reads) with an audit row. getAccess in guard.ts lays the changes made
// since the server started over those grants, keyed by the person's stable email, so a switch made on the Admins page changes what
// that person may open on the next request (allow submission editing, move a reviewer to the hardware queue, remove a reviewer).
// The overlay is immediate; the database row is what survives a restart and what the superadmin/impersonation gates read.
// Pure functions, no Next, no database, so the rules can be tested.
import { AI_DRAFT, EDIT_SUBMISSION, FRAUD_REVIEW, FULFILLER, FULL_QUEUE, HARDWARE_ONLY, HELPER, NO_REVIEW, REVIEWER, SECOND_PASS, SOFTWARE_ONLY, STAFF_ROLES, staffRolesOnly } from "@/lib/reviewer/access";

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

export type TeamLogEntry = {
  slack_id: string | null;
  // Stable person key (the person's email) written by the actions. Seeded/legacy rows have only the display handle.
  person_key?: string | null;
  action: string;
  before: string[];
  after: string[];
  created_at: string;
};

// The viewer's grants after the team changes made since `since` (a time in ms; seeded history is older). `entries` may be in any
// order. personKey is the stable Person id (with the email accepted too for older rows), never a display-name slug: two people
// with the same name keep separate roles. A change to the admins row replaces the reviewer grants and markers; a helper or
// fulfiller change flips that grant.
//
// Entries are applied newest-first and each dimension (the admins row, helper, fulfiller) is decided by the newest entry that
// touches it. An older grant can therefore never resurrect a role a newer change revoked, even when two writes land with the
// same timestamp (the actions stamp each write separately, but an equal stamp must still revoke).
export function rolesAfterTeamLog(
  personKey: string | readonly string[],
  base: readonly string[],
  entries: readonly TeamLogEntry[],
  since: number,
): string[] {
  const keys = typeof personKey === "string" ? [personKey] : personKey;
  const mine = entries
    .filter((entry) => keys.includes((entry.person_key ?? entry.slack_id) ?? "") && Date.parse(entry.created_at) >= since)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)); // newest first
  let roles = staffRolesOnly(base);
  let adminsDecided = false;
  let helperDecided = false;
  let fulfillerDecided = false;
  for (const entry of mine) {
    const tokens = new Set([...entry.before, ...entry.after]);
    if (tokens.has("helper")) {
      if (helperDecided) continue;
      helperDecided = true;
      roles = roles.filter((role) => role !== HELPER);
      if (entry.after.includes("helper")) roles.push(HELPER);
      continue;
    }
    if (tokens.has("fulfiller")) {
      if (fulfillerDecided) continue;
      fulfillerDecided = true;
      roles = roles.filter((role) => role !== FULFILLER);
      if (entry.after.includes("fulfiller")) roles.push(FULFILLER);
      continue;
    }
    if (adminsDecided) continue;
    adminsDecided = true;
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

// The reverse of handleForEmail for the local test accounts. Real handles and person ids are their own keys.
export function emailForHandle(handle: string): string | null {
  const key = handle.trim().toLowerCase();
  return Object.entries(HANDLE_BY_EMAIL).find(([, value]) => value === key)?.[0] ?? null;
}

// The stable key the overlay is keyed by. An action receives a sample handle, an email or a person id from its form; the viewer
// side always has an email. Both resolve to the same email here, so a display name never decides a role.
export function personKeyFor(idOrHandle: string): string {
  const key = idOrHandle.trim();
  return emailForHandle(key) ?? (key.includes("@") ? key.toLowerCase() : key);
}

// Pixl permission strings (the team store) to the RoleGrant values readViewer uses. Values already in STAFF_ROLES, such as
// helper and fulfiller, pass through; unknown values are dropped.
export function roleKeysForLog(tokens: readonly string[]): string[] {
  const roles: string[] = [];
  for (const token of tokens) {
    const role = fromPixlPermission(token) ?? ((STAFF_ROLES as readonly string[]).includes(token) ? token : null);
    if (role && !roles.includes(role)) roles.push(role);
  }
  return roles;
}

// Only the grants that actually changed are written. Keeping the delta means a reviewer change never wipes an unrelated
// helper/fulfiller or superadmin grant on the same person.
export function roleDelta(before: readonly string[], after: readonly string[]): { add: string[]; remove: string[] } {
  const oldRoles = roleKeysForLog(before);
  const newRoles = roleKeysForLog(after);
  return {
    add: newRoles.filter((role) => !oldRoles.includes(role)),
    remove: oldRoles.filter((role) => !newRoles.includes(role)),
  };
}
