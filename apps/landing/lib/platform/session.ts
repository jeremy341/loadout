import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "./db";
import { releaseExpiredBan } from "./moderation-data";
import { LOCAL_OWNER_EMAILS, PREVIEW_ACCOUNTS, localTestAccountsEnabled } from "./local-accounts";
import {
  idsFromEnv,
  landingFor,
  resolvePersonAccess,
  satisfies,
  secondPassFromEnv,
  type Requirement,
  type ReviewerAccess,
} from "@/lib/reviewer/access";
import { getPublicSuffix } from "tldts";
import { isReviewHost } from "@/lib/reviewer/host";

export const SESSION_COOKIE = "loadout_session";
export const SESSION_DAYS = 30;
export const PREVIEW_COOKIE = "loadout_preview_role";
// The cookie of a staff impersonation (lib/platform/impersonation.ts). Separate from the staff member's own session cookie.
export const IMPERSONATION_COOKIE = "loadout_impersonation";

export type Viewer = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  // What the person may do on the reviewer site, or null for a builder. Owners come from LOADOUT_OWNER_EMAILS only.
  access: ReviewerAccess | null;
  // Set only while a staff member is acting as this person (see readImpersonatedViewer). The banner reads it.
  impersonation?: { id: string; actorId: string; actorName: string };
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

// Secure is explicit: production always, or development when LOADOUT_SECURE_COOKIES is exactly "true" (for a local HTTPS
// tunnel). A Domain is only ever set over a secure cookie, and only from SESSION_COOKIE_DOMAIN; otherwise the cookie stays
// host-only, which is the safe default.
export function sessionCookieOptions(expires: Date, env: NodeJS.ProcessEnv = process.env) {
  const secure = env.NODE_ENV === "production" || env.LOADOUT_SECURE_COOKIES === "true";
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    expires,
  };
  const domain = env.SESSION_COOKIE_DOMAIN?.trim();
  return secure && domain ? { ...options, domain } : options;
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

// Ends every session a person holds. With keepToken, the caller's own session survives (sign out everywhere else). Returns the
// count only. A stolen token then stops working at once, not after its 30 days (L5).
export async function signOutEverywhere(personId: string, keepToken?: string | null): Promise<number> {
  const keep = keepToken ? hashToken(keepToken) : null;
  const removed = await db().session.deleteMany({ where: { personId, ...(keep ? { tokenHash: { not: keep } } : {}) } });
  return removed.count;
}

// Called by the registered "session-cleanup" cron job (lib/platform/jobs/jobs/session-cleanup.ts). A session past its expiry can
// no longer sign anyone in, so it is safe to delete. Only a count is returned — never a token hash or a person id.
export async function purgeExpiredSessions(now: Date = new Date()): Promise<number> {
  const removed = await db().session.deleteMany({ where: { expiresAt: { lte: now } } });
  return removed.count;
}

// Local development opens without sign-in: the platform shows the builder test account, or a staff test account chosen with
// LOADOUT_PREVIEW_ROLE (see PREVIEW_ACCOUNTS in local-accounts.ts: owner, owner-no-review, reviewer, final-reviewer,
// hardware-reviewer, software-reviewer, senior-reviewer, integrity-reviewer, helper, fulfiller, builder, none; "staff" is the owner).
// This only runs when local test accounts are on, which never happens in production. Otherwise the signed-in person comes
// from the session cookie, and no sign-in exists yet, so it is null.
// A null prototype keeps a cookie value such as "__proto__" or "constructor" from resolving to an inherited object; that would
// otherwise be handed to Prisma as an email address. Only declared role keys resolve.
export const PREVIEW_EMAILS: Record<string, string> = Object.assign(Object.create(null) as Record<string, string>, {
  staff: "staff@loadout.test",
  ...Object.fromEntries(PREVIEW_ACCOUNTS.map((account) => [account.key, account.email])),
});

export function ownerEmails(env: NodeJS.ProcessEnv = process.env): string[] {
  const listed = idsFromEnv(env.LOADOUT_OWNER_EMAILS);
  return localTestAccountsEnabled(env) ? [...listed, ...LOCAL_OWNER_EMAILS] : listed;
}

// The optional final-reviewer override (LOADOUT_SECOND_PASS_EMAILS). It adds to the second_pass grant and never makes a reviewer.
export function secondPassEmails(env: NodeJS.ProcessEnv = process.env): string[] {
  return secondPassFromEnv(env.LOADOUT_SECOND_PASS_EMAILS);
}

// An unknown loadout_preview_role is a signed-out request, not a builder. The default only applies when nothing was chosen at
// all. The "View as" menu uses the same key check so its label cannot claim a role the reader does not grant.
export function previewRoleEmail(chosen: string | null | undefined): string | null {
  if (chosen === null || chosen === undefined || chosen === "") return PREVIEW_EMAILS.builder;
  return Object.hasOwn(PREVIEW_EMAILS, chosen) ? PREVIEW_EMAILS[chosen] : null;
}

export function viewAsRoleKey(chosen: string | null | undefined): string {
  return chosen && Object.hasOwn(PREVIEW_EMAILS, chosen) ? chosen : "signed-out";
}

function toViewer(person: { id: string; email: string; displayName: string; bannedAt: Date | null; roles: { role: string }[] }): Viewer | null {
  if (person.bannedAt) return null;
  const roles = person.roles.map((grant) => grant.role);
  const access = resolvePersonAccess({ id: person.id, email: person.email, roles }, ownerEmails(), secondPassEmails());
  return { id: person.id, email: person.email, displayName: person.displayName, roles, access };
}

// A temporary ban that has run out stops blocking the person here: the flags are cleared (releaseExpiredBan, audited) before the
// person is checked. A ban still running, or a ban with no end, is left as it is.
async function withExpiredBanCleared<T extends { id: string; bannedAt: Date | null }>(person: T, now: Date): Promise<T> {
  if (!person.bannedAt) return person;
  const cleared = await releaseExpiredBan(person.id, now);
  return cleared ? { ...person, bannedAt: null } : person;
}

// A cookie Domain may only be a parent of the host that receives it. ".com" would be accepted by the browser's suffix rule as
// a parent of every .com host, so a bare public suffix is refused here as well. Anything invalid is ignored and the cookie stays
// host-only, which is safe and still works when both sites share one host.

const plainHost = (value: string | null | undefined): string => {
  const raw = (value ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!raw || /[\s/@]/.test(raw)) return "";
  // A Host header may carry a port; a Domain attribute may not.
  return raw.replace(/^\[([^\]]+)\](:\d+)?$/, "$1").replace(/^([^:]+):\d+$/, "$1");
};

export function validCookieDomain(domain: string | null | undefined, host: string | null | undefined): string | null {
  const clean = plainHost(domain)?.replace(/^\.+/, "") ?? "";
  const current = plainHost(host);
  if (!clean || !current || !clean.includes(".")) return null;
  // The Public Suffix List (tldts), private section included: github.io, vercel.app and the like are suffixes a cookie may not span.
  if (getPublicSuffix(clean, { allowPrivateDomains: true }) === clean) return null;
  const labels = clean.split(".");
  if (labels.some((label) => !label || label.startsWith("-") || label.endsWith("-") || !/^[a-z0-9-]+$/.test(label))) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(clean) || clean.includes(":")) return null;
  return current === clean || current.endsWith(`.${clean}`) ? clean : null;
}

// The impersonation cookie has the same shape as the session cookie (httpOnly, lax, a random token whose SHA-256 is stored) and
// differs in two ways: it lasts the hour of the impersonation, and it may be scoped to a parent domain. The reviewer site (where
// the action runs) and the participant dashboard (where the banner shows) are different hosts, and a host-only cookie set on the
// first would never reach the second. LOADOUT_IMPERSONATION_COOKIE_DOMAIN (for example ".example.com") sets the Domain
// attribute; unset, the cookie is host-only, which is right when both run on one host. A value that is not a parent of the
// current host (or is a bare public suffix) is ignored rather than widening anyone else's cookie.
export function impersonationCookieOptions(expires: Date, env: NodeJS.ProcessEnv = process.env, host?: string | null) {
  const base = sessionCookieOptions(expires, env);
  const domain = validCookieDomain(env.LOADOUT_IMPERSONATION_COOKIE_DOMAIN, host);
  if (domain) return { ...base, domain };
  // An invalid impersonation domain must not inherit the session cookie's domain either: stay strictly host-only.
  return { httpOnly: true, sameSite: "lax" as const, secure: base.secure, path: "/", expires };
}

export async function setImpersonationCookie(token: string, expires: Date): Promise<void> {
  const host = (await headers()).get("host");
  (await cookies()).set(IMPERSONATION_COOKIE, token, impersonationCookieOptions(expires, process.env, host));
}

export async function clearImpersonationCookie(): Promise<void> {
  const host = (await headers()).get("host");
  (await cookies()).set(IMPERSONATION_COOKIE, "", impersonationCookieOptions(new Date(0), process.env, host));
}

// While a staff member impersonates, the participant site sees the subject. The reviewer site never does: it keeps seeing the
// staff member, so they can open a player page and end the impersonation. Stale, ended or expired tokens fall through to the
// normal session. The impersonation module is loaded on demand only when the cookie exists, which also keeps session.ts and
// impersonation.ts (which imports the token helpers from here) from importing each other at load time.
async function readImpersonatedViewer(now: Date): Promise<Viewer | null> {
  const token = (await cookies()).get(IMPERSONATION_COOKIE)?.value;
  if (!token) return null;
  if (isReviewHost((await headers()).get("host"))) return null;
  const { readImpersonation } = await import("./impersonation");
  const active = await readImpersonation(token, now);
  if (!active) return null;
  const viewer = toViewer({ ...active.subject });
  if (!viewer) return null;
  return { ...viewer, impersonation: { id: active.id, actorId: active.actor.id, actorName: active.actor.displayName } };
}

export async function readViewer(now = new Date()): Promise<Viewer | null> {
  const acting = await readImpersonatedViewer(now);
  if (acting) return acting;
  // The preview roles sign people in without a password, so they only work when the request itself came from this machine.
  const requestHost = (await headers()).get("host");
  if (localTestAccountsEnabled(undefined, requestHost)) {
    // A loadout_preview_role cookie switches the test account without restarting the server (tests and screenshots use it).
    const chosen = (await cookies()).get(PREVIEW_COOKIE)?.value ?? process.env.LOADOUT_PREVIEW_ROLE;
    const email = previewRoleEmail(chosen);
    if (!email) return null;
    const person = await db().person.findUnique({ where: { email }, include: { roles: true } });
    return person ? toViewer(await withExpiredBanCleared(person, now)) : null;
  }
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db().session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { person: { include: { roles: true } } },
  });
  if (!session || session.expiresAt <= now) return null;
  return toViewer(await withExpiredBanCleared(session.person, now));
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
