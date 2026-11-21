// Referral reads and writes. Server only (uses the database). Pure rules are in referral-rules.ts; the step list is referrals.ts.
// A referral is recorded when a new builder arrives through a referrer's handle. It qualifies when that builder's first project is
// approved (firstShippedAt set by the review desk). Qualifying is called by the review code, through qualifyReferralFor.
//
// API:
//   recordReferral(referredId, rawReferrerHandle)    -> WriteResult   once per referred builder; a bad or unknown handle is refused
//   qualifyReferralFor(personId)                     -> boolean       true when this call made the referral count; safe to call twice
//   listOwnReferrals(referrerId)                     -> ReferredBuilder[]   shaped like REFERRED_BUILDERS in referrals.ts; hides banned
//                                                                    builders, anyone blocked either way, and referred builders with no
//                                                                    handle yet (their name is not known to the referrer)
//   WriteResult = { ok: true } | { ok: false, message }
import { notBlockedWith } from "./blocks-data";
import { db } from "./db";
import { canQualify, canRecordReferral, qualifiedTitle, stepsFromFacts } from "./referral-rules";
import type { ReferredBuilder } from "./referrals";
import { notify } from "./notifications-data";
import { createRateLimiter } from "./rate-limit";

export type WriteResult = { ok: true } | { ok: false; message: string };

const writeLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function recordReferral(referredId: string, rawReferrerHandle: unknown): Promise<WriteResult> {
  if (!writeLimiter.check(`referral:${referredId}`).ok) return { ok: false, message: "Slow down a little and try again." };
  const handle = typeof rawReferrerHandle === "string" ? rawReferrerHandle.trim().toLowerCase() : "";
  if (handle === "") return { ok: false, message: "That referrer was not found." };
  const referrer = await db().person.findUnique({ where: { handle }, select: { id: true, bannedAt: true } });
  if (!referrer) return { ok: false, message: "That referrer was not found." };

  const existing = await db().referral.findUnique({ where: { referredId }, select: { id: true } });
  const verdict = canRecordReferral({
    referredId,
    referrerId: referrer.id,
    referrerBanned: referrer.bannedAt !== null,
    referredAlreadyReferred: existing !== null,
  });
  if (!verdict.ok) return { ok: false, message: verdict.reason };
  // A parallel sign-up can race the check: the unique referredId column makes the second insert fail, which is the answer already.
  try {
    await db().referral.create({ data: { referrerId: referrer.id, referredId } });
  } catch {
    return { ok: false, message: "This builder already has a referrer." };
  }
  return { ok: true };
}

export async function qualifyReferralFor(personId: string): Promise<boolean> {
  if (!writeLimiter.check(`qualify:${personId}`).ok) return false;
  const referral = await db().referral.findUnique({
    where: { referredId: personId },
    select: {
      id: true,
      referrerId: true,
      qualifiedAt: true,
      referred: { select: { handle: true, bannedAt: true } },
    },
  });
  if (!referral) return false;
  const shipped = await db().project.count({ where: { ownerId: personId, firstShippedAt: { not: null } } });
  const verdict = canQualify({
    referredBanned: referral.referred.bannedAt !== null,
    alreadyQualified: referral.qualifiedAt !== null,
    hasApprovedShip: shipped > 0,
  });
  if (!verdict.ok) return false;

  // The null check in the where clause is the race guard: only one call sets qualifiedAt.
  const moved = await db().referral.updateMany({ where: { id: referral.id, qualifiedAt: null }, data: { qualifiedAt: new Date() } });
  if (moved.count === 0) return false;
  await notify(referral.referrerId, "referral-qualified", {
    title: qualifiedTitle(referral.referred.handle),
    href: "/dashboard/referrals",
  });
  return true;
}

export async function listOwnReferrals(referrerId: string): Promise<ReferredBuilder[]> {
  const rows = await db().referral.findMany({
    where: {
      referrerId,
      referred: { handle: { not: null }, bannedAt: null, ...notBlockedWith(referrerId) },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      qualifiedAt: true,
      referred: {
        select: {
          handle: true,
          verificationStatus: true,
          hoursDays: { where: { seconds: { gt: 0 } }, select: { id: true }, take: 1 },
          journal: { select: { id: true }, take: 1 },
        },
      },
    },
  });
  return rows.flatMap((row) => {
    const handle = row.referred.handle;
    if (!handle) return [];
    const completed = stepsFromFacts({
      verified: row.referred.verificationStatus === "verified",
      tracked: row.referred.hoursDays.length > 0,
      journaled: row.referred.journal.length > 0,
      shipped: row.qualifiedAt !== null,
    });
    return [{ handle, completed }];
  });
}
