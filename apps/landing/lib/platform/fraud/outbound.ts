// Telescreen (Robert) write-back: sends a desk decision for a project back to Robert. This is an outward-facing write, so it is OFF
// unless the owner turns it on for this environment. robert.ts keeps recordOutcome out on purpose ("until the desk is wired to do it
// deliberately"); this file is that deliberate wiring, and it is still gated.
//
// Gate, all of which must hold before anything is sent:
//   - LOADOUT_TELESCREEN_WRITEBACK is exactly "on"        (unset: disabled, nothing sent)
//   - LOADOUT_TELESCREEN_URL and LOADOUT_TELESCREEN_KEY set (config.ts; both or neither)
//   - the Robert project id is a plain token, and the reason is short
//
// Nothing here changes a ship. A 409 from Robert means it already holds a final outcome (for example a fraud rejection), which is
// reported as "final" and is not an error. The key is never logged or returned.
import { robertConfig, type Env } from "./config";

export const WRITEBACK_FLAG = "LOADOUT_TELESCREEN_WRITEBACK";
export const OUTCOME_REASON_MAX = 300;
const TIMEOUT_MS = 10_000;

export type RobertOutcomeStatus = "approved" | "rejected";
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type OutcomeInput = { robertProjectId: string; status: RobertOutcomeStatus; reason?: string };

export type OutcomeResult =
  | { ok: true }
  | { ok: false; state: "disabled" | "not_configured" | "invalid" | "final" | "failed"; message: string };

export function writebackEnabled(env: Env = process.env): boolean {
  return (env[WRITEBACK_FLAG] ?? "").trim() === "on" && robertConfig(env) !== null;
}

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

// Pure: the URL and body for one outcome, or a reason it cannot be built. Used by recordRobertOutcome and by the tests.
export function buildOutcomeRequest(input: OutcomeInput, env: Env = process.env): { url: string; init: RequestInit } | { error: string } {
  const config = robertConfig(env);
  if (!config) return { error: "Telescreen is not configured." };
  if (!SAFE_ID.test(input.robertProjectId)) return { error: "That Telescreen project id is not valid." };
  if (input.status !== "approved" && input.status !== "rejected") return { error: "Outcome must be approved or rejected." };
  const reason = (input.reason ?? "").trim().slice(0, OUTCOME_REASON_MAX);
  return {
    url: `${config.base}/projects/${encodeURIComponent(input.robertProjectId)}/outcome`,
    init: {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: input.status, ...(reason ? { reason } : {}) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    },
  };
}

// Never throws. Disabled by default: with the flag off this answers without touching the network.
export async function recordRobertOutcome(input: OutcomeInput, deps: { env?: Env; fetch?: FetchLike } = {}): Promise<OutcomeResult> {
  const env = deps.env ?? process.env;
  if ((env[WRITEBACK_FLAG] ?? "").trim() !== "on") {
    return { ok: false, state: "disabled", message: "Telescreen write-back is off in this environment, so the decision was not sent." };
  }
  if (!robertConfig(env)) return { ok: false, state: "not_configured", message: "Telescreen is not configured, so the decision was not sent." };
  const built = buildOutcomeRequest(input, env);
  if ("error" in built) return { ok: false, state: "invalid", message: built.error };
  try {
    const response = await (deps.fetch ?? ((url, init) => fetch(url, init)))(built.url, built.init);
    if (response.status === 409) return { ok: false, state: "final", message: "Telescreen already holds a final outcome for this project." };
    if (!response.ok) return { ok: false, state: "failed", message: `Telescreen answered ${response.status}; the decision was not recorded there.` };
    return { ok: true };
  } catch {
    return { ok: false, state: "failed", message: "Telescreen could not be reached; the decision was not recorded there." };
  }
}
