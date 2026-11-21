import { db } from "./db";
import { releaseExpiredBan } from "./moderation-data";
import {
  attemptExpiry,
  checkAttempt,
  decideBinding,
  newRandom,
  parseIdentity,
  placeholderEmail,
  sha256,
  type HcaConfig,
  type HcaIdentity,
  type SignInError,
} from "./hca";
import { fetchSlackAvatar } from "./slack-avatar";

// Database and network side of Hack Club Auth sign-in. The rules it applies live in hca.ts.

// db() caches its client on globalThis. Reading that cache here as well keeps the fake client
// installed by the sign-in tests in charge even when another test file has replaced the db module.
const globalForDb = globalThis as unknown as { loadoutDbClientReview?: ReturnType<typeof db> };
const client = () => globalForDb.loadoutDbClientReview ?? db();

// Starts one sign-in: stores the hash of the state and of a browser nonce, and returns the raw values for the redirect and cookie.
export async function startAttempt(now = new Date()): Promise<{ state: string; nonce: string; expiresAt: Date }> {
  const prisma = client();
  await prisma.loginAttempt.deleteMany({ where: { expiresAt: { lt: now } } });
  const state = newRandom();
  const nonce = newRandom();
  const expiresAt = attemptExpiry(now);
  await prisma.loginAttempt.create({
    data: { id: newRandom().slice(0, 24), state: sha256(state), nonceHash: sha256(nonce), expiresAt },
  });
  return { state, nonce, expiresAt };
}

// An attempt is single use. The delete, the browser-nonce check and the return of the row happen in ONE statement: a leaked state
// with the wrong nonce matches nothing, so it cannot delete anybody's attempt (no DoS), and two callbacks racing on the same
// state+nonce cannot both consume it, because Postgres only returns the row to the DELETE that wins.
export async function consumeAttempt(
  state: string | null,
  nonce: string | null,
  now = new Date(),
): Promise<{ ok: true } | { ok: false; error: SignInError }> {
  if (!state || state.length > 200) return { ok: false, error: "invalid_state" };
  const stateHash = sha256(state);
  const nonceHash = nonce ? sha256(nonce) : null;
  const rows = await client().$queryRaw<Array<{ state: string; nonceHash: string; expiresAt: Date }>>`
    DELETE FROM "LoginAttempt"
    WHERE "state" = ${stateHash} AND "nonceHash" = ${nonceHash}
    RETURNING "state", "nonceHash", "expiresAt"`;
  const row = rows[0];
  return checkAttempt(
    row ? { stateHash: row.state, nonceHash: row.nonceHash, expiresAt: row.expiresAt } : null,
    nonce,
    now,
  );
}

const FETCH_TIMEOUT_MS = 10_000;

export async function exchangeCode(config: HcaConfig, code: string): Promise<{ accessToken: string } | { error: SignInError }> {
  try {
    const response = await fetch(`${config.baseUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
        grant_type: "authorization_code",
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      const throttled = response.status === 429 || body.includes("slow your roll");
      return { error: throttled ? "throttled" : "token_failed" };
    }
    const json = (await response.json()) as { access_token?: unknown };
    return typeof json.access_token === "string" && json.access_token
      ? { accessToken: json.access_token }
      : { error: "token_failed" };
  } catch {
    return { error: "token_failed" };
  }
}

export async function fetchIdentity(config: HcaConfig, accessToken: string): Promise<{ identity: HcaIdentity } | { error: SignInError }> {
  try {
    const response = await fetch(`${config.baseUrl}/api/v1/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return { error: "identity_failed" };
    const identity = parseIdentity(await response.json());
    return identity ? { identity } : { error: "identity_failed" };
  } catch {
    return { error: "identity_failed" };
  }
}

// Copies the builder's Slack picture into Person.avatar on every sign-in, as Stasis does. Best effort: with no Slack id, no bot token
// or no usable picture, sign-in goes on and the profile keeps whatever picture (or letter plate) it had.
async function refreshAvatar(personId: string, slackId: string | null): Promise<void> {
  if (!slackId) return;
  // The Slack id is kept on the person for the bot and DMs (unique; if another account already holds it, this one is left without).
  try {
    await client().person.update({ where: { id: personId }, data: { slackId } });
  } catch {
    // A unique clash or a failed write never blocks sign-in.
  }
  const avatar = await fetchSlackAvatar(slackId);
  if (!avatar) return;
  try {
    await client().person.update({ where: { id: personId }, data: { avatar } });
  } catch {
    // The picture is a nicety; a failed write never blocks sign-in.
  }
}

// Finds, links or creates the Person for an identity and stores birthday and verification status as HCA gave them.
// Returns the person id, or an error code. A banned person is refused here, as everywhere else. The read, the decision, the
// conditional write and the final ban check all run in one transaction, so a concurrent sign-in or a ban cannot slip between them.
export async function bindIdentity(identity: HcaIdentity, now = new Date()): Promise<{ personId: string } | { error: SignInError }> {
  const prisma = client();
  let bound: { personId: string } | { error: SignInError };
  try {
    bound = await prisma.$transaction(async (tx) => {
      const [byHcaId, byEmail] = await Promise.all([
        tx.person.findUnique({ where: { hcaId: identity.id }, select: { id: true, hcaId: true, bannedAt: true } }),
        identity.email
          ? tx.person.findUnique({ where: { email: identity.email }, select: { id: true, hcaId: true, bannedAt: true } })
          : Promise.resolve(null),
      ]);
      const decision = decideBinding({ hcaId: identity.id, email: identity.email, byHcaId, byEmail });
      if (decision.action === "conflict") return { error: "identity_conflict" };
      const synced = {
        birthday: identity.birthday,
        verificationStatus: identity.verificationStatus,
        hcaSyncedAt: now,
      };
      if (decision.action === "create") {
        const person = await tx.person.create({
          data: {
            email: identity.email ?? placeholderEmail(identity.id),
            displayName: identity.displayName,
            hcaId: identity.id,
            ...synced,
          },
          select: { id: true },
        });
        return { personId: person.id };
      }
      // A temporary ban that has run out opens the account again (releaseExpiredBan clears it, audited). Any other ban refuses sign-in.
      const existing = decision.action === "use" ? byHcaId : byEmail;
      if (existing?.bannedAt && !(await releaseExpiredBan(existing.id, now))) return { error: "account_closed" };
      if (decision.action === "link") {
        if (!identity.email) return { error: "server_error" };
        // Only claim a person who is still unbound, unbanned and on this email. If another callback or a reviewer changed any of
        // that after the read, zero rows match and the caller retries instead of overwriting the newer state.
        const updated = await tx.person.updateMany({
          where: { id: decision.personId, hcaId: null, bannedAt: null, email: identity.email },
          data: { hcaId: identity.id, ...synced },
        });
        if (updated.count !== 1) return { error: "server_error" };
      } else {
        await tx.person.update({ where: { id: decision.personId }, data: synced });
      }
      // Re-check inside the transaction: a ban applied while we were binding must not hand back an id for a closed account.
      const current = await tx.person.findUnique({ where: { id: decision.personId }, select: { bannedAt: true } });
      if (current?.bannedAt) return { error: "account_closed" };
      return { personId: decision.personId };
    });
  } catch {
    // A concurrent sign-in can win the unique hcaId or email; the person tries again.
    return { error: "server_error" };
  }
  if ("error" in bound) return bound;
  // Network and avatar writes stay outside the transaction: they are best effort and must not hold a database connection open.
  await refreshAvatar(bound.personId, identity.slackId);
  return bound;
}
