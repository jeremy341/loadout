import { createHash, randomBytes } from "node:crypto";

// Hack Club Auth sign-in, the pure parts: configuration, the authorize URL, state checks, identity parsing and the rules
// for binding an identity to a Person. Network calls and database writes live in hca-actions.ts.
export const HCA_BASE_URL = "https://auth.hackclub.com";
// What the product needs: the birthday and verification status decide eligibility (lib/platform/eligibility.ts), the Slack id gives the
// profile picture. HCA rejects the whole sign-in when a scope is not ticked on the app page, so HCA_SCOPES in the environment can name a
// smaller set while the app registration is being fixed. Sign-in then works, and eligibility stays "missing birthday" until birthdate is allowed.
export const HCA_SCOPES = "openid profile birthdate basic_info slack_id verification_status";
export const DEFAULT_REDIRECT_URI = "http://localhost:3010/api/auth/hackclub/callback";
export const LOGIN_ATTEMPT_MINUTES = 10;
export const NONCE_COOKIE = "loadout_login_nonce";
export const SIGN_IN_PATH = "/dashboard/sign-in";

export type HcaConfig = { clientId: string; clientSecret: string; redirectUri: string; baseUrl: string; scopes: string };

// Space separated scope names from HCA_SCOPES, or the default. Anything outside [a-z_ ] is dropped so a stray character cannot reach the URL.
export function hcaScopes(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.HCA_SCOPES?.trim();
  if (!raw) return HCA_SCOPES;
  const names = raw.split(/[\s,]+/).filter((name) => /^[a-z_]+$/.test(name));
  return names.includes("openid") && names.length > 0 ? names.join(" ") : HCA_SCOPES;
}

// Null when the app is not set up. Only the client id decides whether sign-in is offered; the secret is checked where it is used.
export function hcaConfig(env: NodeJS.ProcessEnv = process.env): HcaConfig | null {
  const clientId = env.HCA_CLIENT_ID?.trim();
  if (!clientId) return null;
  return {
    clientId,
    clientSecret: env.HCA_CLIENT_SECRET?.trim() ?? "",
    redirectUri: env.HCA_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI,
    baseUrl: HCA_BASE_URL,
    scopes: hcaScopes(env),
  };
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// 32 random bytes, base64url. Only the hash of the state is stored.
export function newRandom(): string {
  return randomBytes(32).toString("base64url");
}

export function attemptExpiry(now: Date): Date {
  return new Date(now.getTime() + LOGIN_ATTEMPT_MINUTES * 60 * 1000);
}

export function buildAuthorizeUrl(config: Pick<HcaConfig, "clientId" | "redirectUri" | "baseUrl"> & { scopes?: string }, state: string): string {
  const url = new URL("/oauth/authorize", config.baseUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes ?? HCA_SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}

export type SignInError =
  | "not_configured"
  | "invalid_state"
  | "expired_state"
  | "denied"
  | "token_failed"
  | "throttled"
  | "identity_failed"
  | "identity_conflict"
  | "account_closed"
  | "gate_failed"
  | "server_error";

export const SIGN_IN_ERROR_MESSAGES: Record<SignInError, string> = {
  not_configured: "Sign-in is not set up on this server yet.",
  invalid_state: "That sign-in link was not valid. Start again.",
  expired_state: "Sign-in took too long. Start again.",
  denied: "Hack Club Auth did not give access, so you are not signed in.",
  token_failed: "Hack Club Auth would not complete the sign-in. Try again in a moment.",
  throttled: "Too many tries in a row. Wait a minute, then try again.",
  identity_failed: "We could not read your details from Hack Club Auth. Try again in a moment.",
  identity_conflict: "That Hack Club Auth account does not match the account on this email. Ask the team for help.",
  account_closed: "This account cannot sign in. Contact the team.",
  gate_failed: "That access password was not right. Ask an admin for the shared password and try again.",
  server_error: "Something went wrong on our side. Try again in a moment.",
};

export function isSignInError(value: unknown): value is SignInError {
  return typeof value === "string" && Object.hasOwn(SIGN_IN_ERROR_MESSAGES, value);
}

// Errors go back to the sign-in page as a short code only; the page maps it to a plain message.
export function signInErrorPath(code: SignInError): string {
  return `${SIGN_IN_PATH}?error=${code}`;
}

export type StoredAttempt = { stateHash: string; nonceHash: string; expiresAt: Date };

// The callback must find an attempt for this state, inside its window, started by this same browser (nonce cookie).
export function checkAttempt(
  attempt: StoredAttempt | null,
  nonce: string | null | undefined,
  now: Date,
): { ok: true } | { ok: false; error: SignInError } {
  if (!attempt) return { ok: false, error: "invalid_state" };
  if (attempt.expiresAt.getTime() <= now.getTime()) return { ok: false, error: "expired_state" };
  if (!nonce || sha256(nonce) !== attempt.nonceHash) return { ok: false, error: "invalid_state" };
  return { ok: true };
}

export type HcaIdentity = {
  id: string;
  email: string | null;
  displayName: string;
  birthday: Date | null;
  verificationStatus: string | null;
  slackId: string | null;
};

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

// Strict YYYY-MM-DD that is a real calendar date; anything else is no birthday. A trailing timestamp or stray text is not a
// date-only claim, so it must not make someone eligible.
export function parseBirthday(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

// A Slack member id such as U0A2SJ7B739. Anything else is no id, so it is never put in a Slack API address.
export function parseSlackId(value: unknown): string | null {
  return typeof value === "string" && /^[UW][A-Z0-9]{6,20}$/.test(value.trim()) ? value.trim() : null;
}

// Reads the /api/v1/me body without trusting its shape. Returns null when there is no usable id.
export function parseIdentity(body: unknown): HcaIdentity | null {
  if (!body || typeof body !== "object") return null;
  const identity = (body as { identity?: unknown }).identity;
  if (!identity || typeof identity !== "object") return null;
  const raw = identity as Record<string, unknown>;
  const id = text(raw.id, 200);
  if (!id) return null;
  const email = text(raw.primary_email, 320)?.toLowerCase() ?? null;
  const name = [text(raw.first_name, 100), text(raw.last_name, 100)].filter(Boolean).join(" ");
  return {
    id,
    email: email && /^[^\s@]+@[^\s@]+$/.test(email) ? email : null,
    displayName: name || `Builder ${id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6)}`,
    birthday: parseBirthday(raw.birthday),
    verificationStatus: text(raw.verification_status, 60),
    slackId: parseSlackId(raw.slack_id),
  };
}

// An identity with no email still needs a unique address for the Person row; this one can never receive mail. A hash of the raw
// id keeps two identities apart even when their ids sanitize to the same text (for example "!!!" and "???").
export function placeholderEmail(hcaId: string): string {
  const safe = hcaId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 24) || "id";
  return `hca-${safe}-${sha256(hcaId).slice(0, 12)}@users.invalid`;
}

export type BindingPerson = { id: string; hcaId: string | null };
export type BindingDecision =
  | { action: "use"; personId: string }
  | { action: "link"; personId: string }
  | { action: "create" }
  | { action: "conflict" };

// One HCA identity belongs to one Person, and one Person to one identity. Order: a Person already bound to this id; else a
// Person with the same email, but only if that Person is not bound to a different identity; else a new Person. Reserved .test
// addresses belong to the local test accounts, so an HCA identity never links to or creates one (including an owner address).
export function decideBinding(input: {
  hcaId: string;
  email: string | null;
  byHcaId: BindingPerson | null;
  byEmail: BindingPerson | null;
}): BindingDecision {
  const { hcaId, email, byHcaId, byEmail } = input;
  if (byHcaId) return { action: "use", personId: byHcaId.id };
  if (email?.trim().toLowerCase().endsWith(".test")) return { action: "conflict" };
  if (email && byEmail) {
    if (byEmail.hcaId && byEmail.hcaId !== hcaId) return { action: "conflict" };
    return { action: "link", personId: byEmail.id };
  }
  return { action: "create" };
}
