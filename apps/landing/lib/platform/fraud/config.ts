// Which fraud features are switched on, read from the environment. House pattern: a feature's presence is decided by its env keys,
// and a missing key means "off", never a crash and never an error row. Every reader takes the env as a parameter (default
// process.env) so a test hands in a plain object instead of mutating the process.
//
// Keys (all optional; see .env.example):
//   CRON_SECRET                     bearer for the /api/cron/fraud-* endpoints (job.ts); unset: they answer 403
//   LOADOUT_TELESCREEN_URL          Robert's API base, e.g. https://telescreen.hackclub.com/api/v1/ysws   } both, or Robert is off
//   LOADOUT_TELESCREEN_KEY          Robert's bearer key (server only; never logged or returned)            }
//   LOADOUT_FRAUDY_KEY              Fraudy bearer key; unset: Fraudy is off
//   LOADOUT_FRAUDY_URL              Fraudy check-ai endpoint (default https://fraudy.hackclub.com/api/v1/check-ai)
//   LOADOUT_YSWS_ARCHIVE_URL        Hack Club Ships archive list, e.g. https://ships.hackclub.com/api/v1/ysws_entries; unset: the
//                                   double-dip check compares against LOADOUT's own approved ships only
//   LOADOUT_PRECHECK                "off" is the kill switch (Pixl's AI_PRECHECK=off); anything else leaves the pre-check on
//   LOADOUT_PRECHECK_AI_KEY         OpenRouter key for the README read; unset: the pre-check runs its fixed rules only
//   LOADOUT_PRECHECK_MODEL          OpenRouter model id (default anthropic/claude-sonnet-5.5, Pixl's default)
//   LOADOUT_GITHUB_TOKEN            GitHub token for the repo file listing; unset: unauthenticated (60 calls an hour)
export type Env = Record<string, string | undefined>;

const clean = (value: string | undefined): string => (value ?? "").trim();

// An address from the environment is trusted (an operator set it) but still has to be https, with plain http only for a machine's
// own loopback so a local stand-in server works in development. Anything else is treated as unset.
export function trustedBase(value: string | undefined): string | null {
  const raw = clean(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) return null;
    return raw.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export type RobertConfig = { base: string; apiKey: string };
// Both keys or neither. A key with no address would otherwise send the key to a default host nobody chose.
export function robertConfig(env: Env = process.env): RobertConfig | null {
  const base = trustedBase(env.LOADOUT_TELESCREEN_URL);
  const apiKey = clean(env.LOADOUT_TELESCREEN_KEY);
  return base && apiKey ? { base, apiKey } : null;
}

export const FRAUDY_DEFAULT_URL = "https://fraudy.hackclub.com/api/v1/check-ai";
export type FraudyConfig = { url: string; apiKey: string };
export function fraudyConfig(env: Env = process.env): FraudyConfig | null {
  const apiKey = clean(env.LOADOUT_FRAUDY_KEY);
  if (!apiKey) return null;
  const url = clean(env.LOADOUT_FRAUDY_URL) ? trustedBase(env.LOADOUT_FRAUDY_URL) : FRAUDY_DEFAULT_URL;
  return url ? { url, apiKey } : null;
}

export function archiveUrl(env: Env = process.env): string | null {
  return trustedBase(env.LOADOUT_YSWS_ARCHIVE_URL);
}

export const PRECHECK_DEFAULT_MODEL = "anthropic/claude-sonnet-5.5";
export type PrecheckConfig = { model: string; aiKey: string | null; githubToken: string | null };
export function precheckConfig(env: Env = process.env): PrecheckConfig | null {
  if (clean(env.LOADOUT_PRECHECK).toLowerCase() === "off") return null;
  return {
    model: clean(env.LOADOUT_PRECHECK_MODEL) || PRECHECK_DEFAULT_MODEL,
    aiKey: clean(env.LOADOUT_PRECHECK_AI_KEY) || null,
    githubToken: clean(env.LOADOUT_GITHUB_TOKEN) || null,
  };
}
