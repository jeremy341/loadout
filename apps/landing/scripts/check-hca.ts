// Checks the Hack Club Auth setup without signing anyone in: `bun run scripts/check-hca.ts [https://your.host]`.
// It reads the same env as the app (HCA_CLIENT_ID, HCA_CLIENT_SECRET, HCA_REDIRECT_URI, DATABASE_URL, SLACK_BOT_TOKEN), prints one line per
// check and exits 1 when something blocks sign-in. It never prints a secret, only whether one is set and how long it is.
import { DEFAULT_REDIRECT_URI, HCA_BASE_URL, hcaScopes } from "../lib/platform/hca";

type Line = { ok: boolean; warn?: boolean; text: string };
const lines: Line[] = [];
const ok = (text: string) => lines.push({ ok: true, text });
const warn = (text: string) => lines.push({ ok: true, warn: true, text });
const bad = (text: string) => lines.push({ ok: false, text });

const host = process.argv[2]?.replace(/\/$/, "");
const env = process.env;

const clientId = env.HCA_CLIENT_ID?.trim();
const secret = env.HCA_CLIENT_SECRET?.trim();
const redirect = env.HCA_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI;

if (!clientId) bad("HCA_CLIENT_ID is not set, so the sign-in button stays off.");
else ok(`HCA_CLIENT_ID is set (${clientId.length} characters).`);

if (!secret) bad("HCA_CLIENT_SECRET is not set, so the code exchange will fail.");
else if (secret.length < 24) warn(`HCA_CLIENT_SECRET looks short (${secret.length} characters). Copy it again from the HCA app page.`);
else ok(`HCA_CLIENT_SECRET is set (${secret.length} characters).`);

try {
  const url = new URL(redirect);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.pathname !== "/api/auth/hackclub/callback") bad(`Redirect path is ${url.pathname}, the app answers on /api/auth/hackclub/callback.`);
  else ok(`Redirect URI is ${redirect}.`);
  if (!local && url.protocol !== "https:") bad("A non-local redirect URI must be https.");
  if (host && new URL(host).origin !== url.origin) warn(`HCA_REDIRECT_URI origin (${url.origin}) differs from the host you passed (${new URL(host).origin}).`);
  console.log(`Register this exact redirect URI on the HCA app page: ${redirect}`);
} catch {
  bad(`HCA_REDIRECT_URI is not a valid URL: ${redirect}`);
}

if (!env.DATABASE_URL) bad("DATABASE_URL is not set: sign-in stores the login attempt and the session in the database.");
else ok("DATABASE_URL is set.");

if (!env.SLACK_BOT_TOKEN) warn("SLACK_BOT_TOKEN is not set: sign-in works, builders just keep the letter plate instead of their Slack picture.");
else ok("SLACK_BOT_TOKEN is set.");

try {
  const response = await fetch(new URL("/.well-known/openid-configuration", HCA_BASE_URL), { signal: AbortSignal.timeout(10000) });
  if (!response.ok) bad(`Hack Club Auth discovery answered ${response.status}.`);
  else {
    const doc = (await response.json()) as { authorization_endpoint?: string; token_endpoint?: string; claims_supported?: string[] };
    ok(`Hack Club Auth is reachable (${doc.authorization_endpoint ?? "no authorization endpoint"}).`);
    const claims = new Set(doc.claims_supported ?? []);
    for (const claim of ["birthdate", "slack_id", "verification_status", "ysws_eligible"]) {
      if (claims.has(claim)) ok(`HCA offers the ${claim} claim.`);
      else warn(`HCA discovery does not list the ${claim} claim.`);
    }
  }
} catch {
  bad("Could not reach Hack Club Auth (network or timeout).");
}

console.log(`Scopes the app asks for: ${hcaScopes(env)}`);
console.log("Make sure the HCA app page allows exactly these scopes; a scope the app is not registered for makes HCA reject the sign-in.");
console.log("");
for (const line of lines) console.log(`${line.ok ? (line.warn ? "WARN" : "ok  ") : "FAIL"}  ${line.text}`);
const failed = lines.filter((line) => !line.ok).length;
console.log(failed === 0 ? "\nNothing blocks sign-in." : `\n${failed} problem${failed === 1 ? "" : "s"} block sign-in.`);
process.exit(failed === 0 ? 0 : 1);
