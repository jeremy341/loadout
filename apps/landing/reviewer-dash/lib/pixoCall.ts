// Pixl makes every dashboard-to-Pixo call through callPixo so a stopped bot can never fail a staff action. LOADOUT has no such
// bot: callPixo here makes no network call and answers as if the service were not configured. Types and messages are Pixl's.

export const PIXO_TIMEOUT_MS = 5000;
export const PIXO_OFFLINE_MESSAGE = "Pixo is offline right now.";

export type PixoCallResult =
  | { readonly ok: true; readonly status: number; readonly res: Response }
  | { readonly ok: false; readonly offline: boolean; readonly status: number | null; readonly res: Response | null; readonly reason: string };

export interface PixoCallDeps {
  readonly fetchImpl?: (input: string, init: RequestInit) => Promise<Response>;
  readonly report?: (label: string, reason: string, status: number | null) => void | Promise<void>;
  readonly timeoutMs?: number;
}

/** Never throws, never calls out. */
export async function callPixo(label: string, url: string, init: RequestInit, deps: PixoCallDeps = {}): Promise<PixoCallResult> {
  void label;
  void url;
  void init;
  void deps;
  return { ok: false, offline: true, status: null, res: null, reason: "not_configured" };
}

/** There is no bot to probe: pages show no "offline" banner. */
export async function pixoStatus(baseUrl: string, deps: PixoCallDeps = {}): Promise<"online" | "offline" | "not_configured"> {
  void baseUrl;
  void deps;
  return "not_configured";
}
