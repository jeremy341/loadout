// Pixl gathers each buyer's evidence (approved projects, Airtable and Unified records, Ships matches, the commitment ledger, reviewer
// earnings) from its database and two APIs, then runs the pure rules in ./engine.ts. LOADOUT has none of those sources, so this
// stand-in builds the evidence from the sample: a buyer's approved hours (lib/reviewer/fulfilment.ts) become one confirmed
// project, their orders come from the in-memory store, and the same engine decides. No database, no network. The exported names
// and shapes are Pixl's lib/eligibility/evidence.ts.
import { config } from "@/reviewer-dash/app/_generated/config";
import { approvedHoursFor, totalApproved } from "@/lib/reviewer/fulfilment";
import { ORE_PER_HOUR } from "@/lib/platform/review";
import type { SubmissionLookup } from "../airtable";
import { opsStore } from "../sample/ops";
import {
  evaluateEligibility,
  type EligibilityResult,
  type EvidenceMeta,
  type LedgerEntry,
  type OrderInput,
  type PriorGrant,
  type ProjectEvidence,
  type ReviewerEarningsEvidence,
  type UnifiedState,
} from "./engine";
import type { ShipsProvider, ShipsView } from "./ships";
import { currentPolicy, type EligibilityPolicy } from "./policy";

export interface UnifiedVerifier {
  available: boolean;
  verify(refs: { projectId: number; userId: string; airtableRecordId: string | null }[]): Promise<Map<string, { state: UnifiedState; ref: string | null }>>;
}

export const unavailableUnifiedVerifier: UnifiedVerifier = {
  available: false,
  verify: async () => new Map(),
};

export type AirtableLookup = (ids: string[]) => Promise<Map<string, SubmissionLookup>>;

export function clearAirtableCache(): void {}

// A project mid-update or re-ship keeps its earlier approval: shipping freezes
// those hours in prior_approved_hours and clears the Airtable record id.
export function effectiveHours(
  status: string,
  approved: number,
  prior: number,
  recordId: string | null,
): { status: string; hours: number; prior: number; recordId: string | null } {
  if (status !== "approved" && status !== "rejected" && prior > 0) {
    return { status: "approved", hours: prior, prior: 0, recordId: null };
  }
  return { status, hours: approved, prior, recordId };
}

export type SqlLike = unknown;

export interface PlayerEvidence {
  userId: string;
  projects: ProjectEvidence[];
  priorGrants: PriorGrant[];
  reviewerEarnings: ReviewerEarningsEvidence;
  orders: OrderInput[];
  ledger: LedgerEntry[];
  meta: EvidenceMeta;
}

const hashOf = (text: string): number => [...text].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 100_000, 7);

export async function loadPlayerEvidence(
  userIds: string[],
  opts: { liveAirtable: boolean; verifier?: UnifiedVerifier; sql?: SqlLike; now?: number; ships?: ShipsProvider | ShipsView; airtable?: AirtableLookup } = { liveAirtable: false },
): Promise<Map<string, PlayerEvidence>> {
  const out = new Map<string, PlayerEvidence>();
  const loadedAt = opts.now ?? Date.now();
  for (const userId of new Set(userIds)) {
    const handle = userId.replace(/^u-/, "");
    const hours = totalApproved(approvedHoursFor(handle));
    const projects: ProjectEvidence[] =
      hours > 0
        ? [
            {
              projectId: 5000 + hashOf(userId),
              userId,
              name: "Approved work",
              role: "owner",
              approvedHours: hours,
              originalHours: null,
              deflated: false,
              status: "approved",
              banned: false,
              repoKey: null,
              airtable: "present",
              airtableRecordId: null,
              unified: "confirmed",
              unifiedRef: null,
              disputed: false,
              // Pixl reads the pixels actually paid for the project. Here a builder earns 10 Ore per approved hour (the one rate), so an
              // order is covered while the Ore they have not yet spent are enough, and a few buyers are short.
              payout: { netPx: Math.round(hours * ORE_PER_HOUR), withheldPx: 0, trialPrizePx: 0, creditedHours: hours, rows: 1 },
              ships: { state: "approved", recordId: null, matchedBy: "record_id", hours, approvedAt: loadedAt - 30 * 86_400_000, note: "Sample approval" },
            },
          ]
        : [];
    const orders: OrderInput[] = [...opsStore.orders.values()].filter((order) => order.user_id === userId).map(toOrderInput);
    out.set(userId, {
      userId,
      projects,
      priorGrants: [],
      reviewerEarnings: { creditedPixels: 0, correctionPixels: 0, rows: 0, state: "verified" },
      orders,
      ledger: [],
      meta: {
        loadedAt,
        commitmentsKnown: true,
        airtableAvailable: true,
        unifiedAvailable: true,
        restrictions: [],
        shipsAvailable: true,
        shipsFetchedAt: loadedAt,
        shipsError: null,
      },
    });
  }
  return out;
}

export function withGrantLink(ev: PlayerEvidence, order: OrderInput): OrderInput {
  const known = ev.orders.find((o) => o.id === order.id);
  return known
    ? { ...order, grantFaceUsd: known.grantFaceUsd, grantProjectId: known.grantProjectId, duplicateGrant: known.duplicateGrant }
    : order;
}

export function evaluateFromEvidence(
  ev: PlayerEvidence,
  order: OrderInput,
  policy: EligibilityPolicy = currentPolicy(),
  now: number = Date.now(),
): EligibilityResult {
  const linked = withGrantLink(ev, order);
  return evaluateEligibility({
    policy,
    pixelValueUsd: config.economy.pixelValueUsd,
    now,
    order: linked,
    playerOrders: ev.orders,
    ledger: ev.ledger,
    projects: ev.projects,
    reviewerEarnings: ev.reviewerEarnings,
    priorGrants: ev.priorGrants,
    meta: ev.meta,
  });
}

export function toOrderInput(o: {
  id: number;
  user_id: string;
  item_name: string;
  quantity: number;
  price: number;
  status: string;
  actual_cost_usd: number | null;
  flagged_at: string | null;
}): OrderInput {
  return {
    id: Number(o.id),
    userId: o.user_id,
    itemName: o.item_name,
    quantity: Number(o.quantity) || 1,
    pricePx: Number(o.price) || 0,
    status: o.status,
    actualCostUsd: o.actual_cost_usd == null ? null : Number(o.actual_cost_usd),
    flagged: !!o.flagged_at,
  };
}

export async function evaluateOrders(
  orders: Parameters<typeof toOrderInput>[0][],
  opts: { liveAirtable: boolean; verifier?: UnifiedVerifier; sql?: SqlLike; ships?: ShipsProvider | ShipsView; airtable?: AirtableLookup },
): Promise<Map<number, EligibilityResult>> {
  const evidence = await loadPlayerEvidence([...new Set(orders.map((o) => o.user_id))], opts);
  const results = new Map<number, EligibilityResult>();
  for (const o of orders) {
    const ev = evidence.get(o.user_id);
    if (ev) results.set(Number(o.id), evaluateFromEvidence(ev, toOrderInput(o)));
  }
  return results;
}
