// Pixl checks each order's funding against a read of the Hack Club Ships and Airbridge APIs, cached in its database. LOADOUT has
// neither, so this stand-in keeps Pixl's types and helpers and answers the provider from invented sample figures, with no network
// call, no database and no key. The sync bar on the fulfilment page shows these figures and the refresh only moves the clock.

export interface ShipsEntry {
  /** Cache verification instant (milliseconds), required for Airbridge sources. */
  checkedAt?: number;
  id: string;
  approvedAt: number | null;
  hours: number;
  codeUrl: string;
  repoKey: string | null;
  githubUsername: string;
  slackId: string | null;
  /** A previously known Otter identity became unverified: manual review required. */
  identityBlocked?: boolean;
}

export interface ShipsSnapshot {
  /** The selected source; never merge data from different approval sources. */
  source?: "ships" | "airbridge";
  fetchedAt: number;
  byId: Map<string, ShipsEntry>;
  ambiguousIds: Set<string>;
  invalidIds: Set<string>;
  byRepo: Map<string, ShipsEntry[]>;
  byGithub: Map<string, ShipsEntry[]>;
  totalReturned: number;
  pixlCount: number;
  invalidCount: number;
  duplicateCount: number;
  bytes: number;
  /** Airbridge-only state of the entire active Pixl staging cohort. */
  syncHealth?: { total: number; current: number; unsynced: number; stale: number; errors: number; identityReview: number };
}

export interface ShipsView {
  snapshot: ShipsSnapshot | null;
  fetchedAt: number | null;
  ageMs: number | null;
  fresh: boolean;
  error: string | null;
  lastAttemptAt: number | null;
  nextRetryAt: number | null;
}

export type ShipsRefreshOutcome = "refreshed" | "not_modified" | "skipped_fresh" | "skipped_busy" | "skipped_backoff" | "failed";

export interface ShipsRefreshResult {
  outcome: ShipsRefreshOutcome;
  view: ShipsView;
  error: string | null;
}

export interface ShipsProvider {
  get(): Promise<ShipsView>;
  refresh(force?: boolean): Promise<void>;
  view(): ShipsView;
  ttlMs: number;
}

export function repoKeyOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const parts = u.pathname.replace(/\.git$/i, "").split("/").filter(Boolean).slice(0, 2);
    return parts.length === 2 ? `${u.hostname.toLowerCase()}/${parts.join("/").toLowerCase()}` : null;
  } catch {
    return null;
  }
}

export function normalizeGithub(name: string | null | undefined): string | null {
  const n = (name ?? "").trim().toLowerCase().replace(/^@/, "");
  return n && n !== "null" ? n : null;
}

const TTL_MS = 5 * 60_000;

// One fake sync, kept per server process. The figures are invented.
const KEY = "__loadoutShipsSampleSync";
const root = globalThis as unknown as Record<string, { at: number } | undefined>;
const state = (root[KEY] ??= { at: Date.now() - 4 * 60_000 });

function currentView(): ShipsView {
  const now = Date.now();
  const snapshot: ShipsSnapshot = {
    source: "airbridge",
    fetchedAt: state.at,
    byId: new Map(),
    ambiguousIds: new Set(),
    invalidIds: new Set(),
    byRepo: new Map(),
    byGithub: new Map(),
    totalReturned: 48,
    pixlCount: 44,
    invalidCount: 1,
    duplicateCount: 0,
    bytes: 0,
    syncHealth: { total: 48, current: 41, unsynced: 3, stale: 2, errors: 1, identityReview: 1 },
  };
  return { snapshot, fetchedAt: state.at, ageMs: now - state.at, fresh: now - state.at < TTL_MS, error: null, lastAttemptAt: state.at, nextRetryAt: null };
}

export function shipsProvider(): ShipsProvider {
  return {
    ttlMs: TTL_MS,
    get: async () => currentView(),
    view: () => currentView(),
    refresh: async () => {
      state.at = Date.now();
    },
  };
}

export async function refreshShipsSnapshotForJob(): Promise<ShipsRefreshResult> {
  state.at = Date.now();
  return { outcome: "refreshed", view: currentView(), error: null };
}

export type ManualRefresh =
  | { ok: true; view: ShipsView }
  | { ok: false; reason: "rate_limited"; retryInMs: number }
  | { ok: false; reason: "failed"; error: string };

const REFRESH_COOLDOWN_MS = 60_000;
const lastManual = new Map<string, number>();

export async function manualShipsRefresh(
  actor: string,
  provider: ShipsProvider = shipsProvider(),
  now: number = Date.now(),
): Promise<ManualRefresh> {
  const last = Math.max(lastManual.get(actor) ?? 0, lastManual.get("*") ?? 0);
  if (now - last < REFRESH_COOLDOWN_MS) return { ok: false, reason: "rate_limited", retryInMs: REFRESH_COOLDOWN_MS - (now - last) };
  lastManual.set(actor, now);
  lastManual.set("*", now);
  await provider.refresh(true);
  return { ok: true, view: provider.view() };
}

export function resetManualRefreshLimits(): void {
  lastManual.clear();
}
