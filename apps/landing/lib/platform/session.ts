import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "./db";
import { localTestAccountsEnabled } from "./local-accounts";

export const SESSION_COOKIE = "loadout_session";
export const SESSION_DAYS = 30;
export const STAFF_ROLE = "staff";

export type Viewer = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  isStaff: boolean;
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

// Local development opens without sign-in: the platform shows the builder test account, or the staff test account
// when LOADOUT_PREVIEW_ROLE=staff. This only runs when local test accounts are on, which never happens in production.
// Otherwise the signed-in person comes from the session cookie, and no sign-in exists yet, so it is null.
const PREVIEW_EMAILS = { builder: "builder@loadout.test", staff: "staff@loadout.test" } as const;

function toViewer(person: { id: string; email: string; displayName: string; bannedAt: Date | null; roles: { role: string }[] }): Viewer | null {
  if (person.bannedAt) return null;
  const roles = person.roles.map((grant) => grant.role);
  return { id: person.id, email: person.email, displayName: person.displayName, roles, isStaff: roles.includes(STAFF_ROLE) };
}

export async function readViewer(now = new Date()): Promise<Viewer | null> {
  if (localTestAccountsEnabled()) {
    const role = process.env.LOADOUT_PREVIEW_ROLE === "staff" ? "staff" : "builder";
    const person = await db().person.findUnique({ where: { email: PREVIEW_EMAILS[role] }, include: { roles: true } });
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

// Staff pages answer with 404 for everyone else, so their existence is not advertised.
export async function requireStaff(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.isStaff) notFound();
  return viewer;
}
