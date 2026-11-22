// A read-only status line for Fraudy (the AI-usage check). The check itself lives in lib/platform/fraud/fraudy.ts. This file only
// says whether it is switched on, so the screen can show "not connected" rather than a result that was never fetched.
// "Configured" means a key is set. It does not mean the service answered, so the wording never claims it did.
import { fraudyConfig, type Env } from "../fraud/config";

export type FraudyStatusLine =
  | { state: "not_connected"; live: false; message: string }
  | { state: "configured_unverified"; live: false; message: string };

export function fraudyStatus(env: Env = process.env): FraudyStatusLine {
  if (!fraudyConfig(env)) {
    return { state: "not_connected", live: false, message: "Fraudy is not connected: no key is set, so no AI-usage check has run." };
  }
  return {
    state: "configured_unverified",
    live: false,
    message: "Fraudy has a key set. Staging has not confirmed a live answer, so treat any split as provisional.",
  };
}
