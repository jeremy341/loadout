import { isRecord } from "./text";

// Account state that the preview has to simulate: Hack Club teen verification and the connected services.
// Nothing here talks to Hack Club, Hackatime, Lapse or Slack. The pages say so.

// ---- Verification ----------------------------------------------------------------------------------------

export type VerificationStatus = "not_started" | "pending" | "verified" | "needs_attention";

export interface VerificationState {
  status: VerificationStatus;
  updatedAt: string | null;
  /** Newest last, at most MAX_HISTORY entries. */
  history: { status: VerificationStatus; at: string }[];
}

export const INITIAL_VERIFICATION: VerificationState = { status: "not_started", updatedAt: null, history: [] };
export const MAX_HISTORY = 10;

export type VerificationAction = "start" | "verify" | "flag" | "retry" | "reset";

const TRANSITIONS: Record<VerificationAction, { from: VerificationStatus[]; to: VerificationStatus }> = {
  start: { from: ["not_started"], to: "pending" },
  verify: { from: ["pending"], to: "verified" },
  flag: { from: ["pending", "verified"], to: "needs_attention" },
  retry: { from: ["needs_attention"], to: "pending" },
  reset: { from: ["pending", "verified", "needs_attention"], to: "not_started" },
};

export type Transition = { ok: true; state: VerificationState } | { ok: false; error: string };

export function transition(state: VerificationState, action: VerificationAction, at: string): Transition {
  const rule = TRANSITIONS[action];
  if (!rule.from.includes(state.status)) return { ok: false, error: `That step is not available while verification is ${STATUS_TEXT[state.status].label.toLowerCase()}.` };
  if (action === "reset") return { ok: true, state: INITIAL_VERIFICATION };
  const history = [...state.history, { status: rule.to, at }].slice(-MAX_HISTORY);
  return { ok: true, state: { status: rule.to, updatedAt: at, history } };
}

export const STATUS_TEXT: Record<VerificationStatus, { label: string; detail: string; tone: "plain" | "ok" | "warn" | "accent" }> = {
  not_started: {
    label: "Not started",
    detail: "Teen verification through Hack Club is required before you can join the program. Start it when the sign-in is connected.",
    tone: "plain",
  },
  pending: { label: "Pending", detail: "Hack Club is checking your details. Nothing else is needed from you while this is pending.", tone: "accent" },
  verified: { label: "Verified", detail: "Hack Club has confirmed your teen verification.", tone: "ok" },
  needs_attention: {
    label: "Needs attention",
    detail: "Hack Club could not confirm your details. Read what it asked for, fix it, then try again.",
    tone: "warn",
  },
};

export const VERIFICATION_STEPS: { status: VerificationStatus; label: string }[] = [
  { status: "not_started", label: "Not started" },
  { status: "pending", label: "Pending" },
  { status: "verified", label: "Verified" },
];

const VERIFICATION_STATUSES: readonly VerificationStatus[] = ["not_started", "pending", "verified", "needs_attention"];

function isVerificationStatus(v: unknown): v is VerificationStatus {
  return VERIFICATION_STATUSES.includes(v as VerificationStatus);
}

function normalizeHistoryItem(h: unknown): { status: VerificationStatus; at: string }[] {
  if (!isRecord(h) || !isVerificationStatus(h.status) || typeof h.at !== "string") return [];
  return [{ status: h.status, at: h.at }];
}

function normalizeHistory(raw: unknown) {
  return Array.isArray(raw) ? raw.flatMap(normalizeHistoryItem).slice(-MAX_HISTORY) : [];
}

export function normalizeVerification(raw: unknown): VerificationState {
  if (!isRecord(raw)) return INITIAL_VERIFICATION;
  if (!isVerificationStatus(raw.status)) return INITIAL_VERIFICATION;
  return { status: raw.status, updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null, history: normalizeHistory(raw.history) };
}

// ---- Connections -----------------------------------------------------------------------------------------

export type ConnectionId = "hackclub" | "hackatime" | "lapse" | "slack";

export const CONNECTION_IDS: ConnectionId[] = ["hackclub", "hackatime", "lapse", "slack"];

/** id -> when it was connected, or null. */
export type ConnectionsState = Record<ConnectionId, string | null>;

export const INITIAL_CONNECTIONS: ConnectionsState = { hackclub: null, hackatime: null, lapse: null, slack: null };

export function connect(state: ConnectionsState, id: ConnectionId, consented: boolean, at: string): { ok: true; state: ConnectionsState } | { ok: false; error: string } {
  if (!consented) return { ok: false, error: "Tick the consent box to connect." };
  if (state[id] !== null) return { ok: false, error: "Already connected." };
  return { ok: true, state: { ...state, [id]: at } };
}

export function disconnect(state: ConnectionsState, id: ConnectionId): ConnectionsState {
  if (state[id] === null) return state;
  return { ...state, [id]: null };
}

export function normalizeConnections(raw: unknown): ConnectionsState {
  if (!isRecord(raw)) return INITIAL_CONNECTIONS;
  const out: ConnectionsState = { ...INITIAL_CONNECTIONS };
  for (const id of CONNECTION_IDS) if (typeof raw[id] === "string") out[id] = raw[id] as string;
  return out;
}

export function connectedCount(state: ConnectionsState): number {
  return CONNECTION_IDS.filter((id) => state[id] !== null).length;
}
