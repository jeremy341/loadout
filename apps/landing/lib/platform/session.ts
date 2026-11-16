import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "./db";
import { LOCAL_OWNER_EMAILS, PREVIEW_ACCOUNTS, localTestAccountsEnabled } from "./local-accounts";
import {
  idsFromEnv,
  landingFor,
  resolveAccess,
  satisfies,
  type Requirement,
  type ReviewerAccess,
} from "@/lib/reviewer/access";

export const SESSION_COOKIE = "loadout_session";
export const SESSION_DAYS = 30;
export const PREVIEW_COOKIE = "loadout_preview_role";

export type Viewer = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  // What the person may do on the reviewer site, or null for a builder. Owners come from LOADOUT_OWNER_EMAILS only.
  access: ReviewerAccess | null;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sessionExpiry(now: Date): Date {
  return new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

// Creates a session for a person and returns the raw token for the cookie. Only its hash is stored.
export async function createSession(personId: string, now = new Date()): Promise<{ token: string; expires: Date }> {
  const token = newToken();
  const expires = sessionExpiry(now);
  await db().session.create({
    data: { personId, tokenHash: hashToken(token), expiresAt: expires },
  });
  return { token, expires };
}

export async function destroySession(token: string): Promise<void> {
  await db().session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

// Local development opens without sign-in: the platform shows the builder test account, or a staff test account chosen with
// LOADOUT_PREVIEW_ROLE (see PREVIEW_ACCOUNTS in local-accounts.ts: owner, owner-no-review, reviewer, final-reviewer,
// hardware-reviewer, software-reviewer, senior-reviewer, integrity-reviewer, helper, fulfiller, builder, none; "staff" is the owner).
// This only runs when local test accounts are on, which never happens in production. Otherwise the signed-in person comes
// from the session cookie, and no sign-in exists yet, so it is null.
export const PREVIEW_EMAILS: Record<string, string> = {
  staff: "staff@loadout.test",
  ...Object.fromEntries(PREVIEW_ACCOUNTS.map((account) => [account.key, account.email])),
};

export function ownerEmails(env: NodeJS.ProcessEnv = process.env): string[] {
  const listed = idsFromEnv(env.LOADOUT_OWNER_EMAILS);
  return localTestAccountsEnabled(env) ? [...listed, ...LOCAL_OWNER_EMAILS] : listed;
}

function toViewer(person: { id: string; email: string; displayName: string; bannedAt: Date | null; roles: { role: string }[] }): Viewer | null {
  if (person.bannedAt) return null;
  const roles = person.roles.map((grant) => grant.role);
  const access = resolveAccess({ id: person.id, email: person.email }, { ownerEmails: ownerEmails(), roles });
  return { id: person.id, email: person.email, displayName: person.displayName, roles, access };
}

export async function readViewer(now = new Date()): Promise<Viewer | null> {
  if (localTestAccountsEnabled()) {
    // A loadout_preview_role cookie switches the test account without restarting the server (tests and screenshots use it).
    const chosen = (await cookies()).get(PREVIEW_COOKIE)?.value ?? process.env.LOADOUT_PREVIEW_ROLE ?? "builder";
    const email = PREVIEW_EMAILS[chosen] ?? PREVIEW_EMAILS.builder;
    const person = await db().person.findUnique({ where: { email }, include: { roles: true } });
    return person ? toViewer(person) : null;
  }
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db().session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { person: { include: { roles: true } } },
  });
  if (!session || session.expiresAt <= now) return null;
  return toViewer(session.person);
}

// Pages behind the shell only render when a viewer exists; the shell layout shows the closed notice otherwise.
export async function requireViewer(): Promise<Viewer> {
  const viewer = await readViewer();
  if (!viewer) notFound();
  return viewer;
}

// Reviewer-site pages. Not signed in, or no role at all: the plain 404, so the site does not advertise itself. A person who
// holds some role but not this one lands on their own queue instead (as Pixl does). Each page and action calls this with what
// it needs; the nav only decides what is worth showing.
export async function requireAccess(requirement: Requirement = "staff"): Promise<Viewer & { access: ReviewerAccess }> {
  const viewer = await requireViewer();
  const access = viewer.access;
  if (!access) notFound();
  if (!satisfies(access, requirement)) redirect(landingFor(access));
  return { ...viewer, access };
}
