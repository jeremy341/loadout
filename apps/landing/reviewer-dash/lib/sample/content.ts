// The Content group's data functions for the reviewer site: same names and return shapes as Pixl's lib/db.ts, answering from the
// sample rows and the in-memory store in ./content-data.ts. Re-exported at the end of lib/db.ts. No network, nothing saved.
import type { IdeaWithUser } from "../db";
import { content, shippableProjects, type DashEventRow } from "./content-data";
import { databaseConfigured } from "@/lib/platform/db";
import * as platform from "@/lib/platform/content-data";
import { sampleFallbackAllowed } from "@/lib/platform/records-data";

// Reads the real table when a database is configured. The sample rows answer only when the table is empty and the server runs in
// development (sampleFallbackAllowed). Production shows the real list, even when it is empty, and without a database it is empty.
async function fromDb<T>(load: () => Promise<T[]>, sample: () => T[]): Promise<T[]> {
  const rows = databaseConfigured() ? await load() : [];
  return sampleFallbackAllowed({ nodeEnv: process.env.NODE_ENV, rowCount: rows.length }) ? sample() : rows;
}

export {
  EVENT_TYPES,
  SHOP_CATEGORIES,
  SHOP_CATEGORY_LABELS,
  requisitionNote,
  type DashEventRow,
  type FormConfigRow,
  type FormQuestion,
  type FormSubmissionRow,
  type PersonalShopItem,
  type ReferralRow,
  type ReferrerLeaderboardRow,
  type ShopCategory,
  type ShopItemRow,
  type ShopOptionStockRow,
  type ShowNTellEntry,
  type ShowNTellRound,
  type VaultLevelRow,
  type VaultReward,
} from "./content-data";

import type {
  FormConfigRow,
  FormSubmissionRow,
  PersonalShopItem,
  ReferralRow,
  ReferrerLeaderboardRow,
  ShopItemRow,
  ShopOptionStockRow,
  ShowNTellEntry,
  ShowNTellRound,
  VaultLevelRow,
} from "./content-data";

const norm = (value: string): string => value.toLowerCase();

// ---- Shop ----

// Every catalogue item, one row each: an Ore price is the same everywhere. Personal items never appear here.
export async function listShopItems(): Promise<ShopItemRow[]> {
  return [...content.shop].sort((a, b) => a.position - b.position || a.id - b.id);
}

export async function listShopOptionStock(itemIds: number[]): Promise<Map<number, ShopOptionStockRow[]>> {
  const map = new Map<number, ShopOptionStockRow[]>();
  for (const id of itemIds) {
    const stock = content.stock.get(id);
    if (stock) map.set(id, stock);
  }
  return map;
}

export async function listPersonalShopItems(): Promise<PersonalShopItem[]> {
  return [...content.personal].sort((a, b) => b.id - a.id);
}

// ---- Events ----

export async function listEvents(limit = 100): Promise<DashEventRow[]> {
  return fromDb(
    () => platform.listDbEvents(limit),
    () => [...content.events].sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, limit),
  );
}

// ---- Forms ----

const sampleSubmissions = (formKey?: string): FormSubmissionRow[] =>
  content.submissions.filter((s) => !formKey || s.form_key === formKey).sort((a, b) => b.created_at.localeCompare(a.created_at));

export async function listFormSubmissions(formKey?: string): Promise<FormSubmissionRow[]> {
  return fromDb(() => platform.listDbFormSubmissions(formKey), () => sampleSubmissions(formKey));
}

export async function countPendingFormSubmissions(): Promise<number> {
  const rows = databaseConfigured() ? await platform.listDbFormSubmissions() : [];
  if (!sampleFallbackAllowed({ nodeEnv: process.env.NODE_ENV, rowCount: rows.length })) return rows.filter((s) => s.status === "pending").length;
  return content.submissions.filter((s) => s.status === "pending").length;
}

export async function listFormConfigs(): Promise<FormConfigRow[]> {
  return fromDb(
    () => platform.listDbFormConfigs(),
    () => [...content.configs].sort((a, b) => a.form_key.localeCompare(b.form_key)),
  );
}

// ---- Show & Tell ----

export async function listShowNTellRounds(): Promise<ShowNTellRound[]> {
  return [...content.rounds].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listShowNTellEntries(roundId: number): Promise<ShowNTellEntry[]> {
  return content.entries.filter((e) => e.round_id === roundId);
}

export async function searchShippableProjects(query: string): Promise<{ id: number; name: string; owner: string }[]> {
  const q = norm(query.trim());
  if (!q) return [];
  return shippableProjects()
    .filter((p) => norm(p.name).includes(q) || norm(p.owner).includes(q))
    .slice(0, 15);
}

// ---- Referrals ----
// LOADOUT has no referral reward (plans/02 section 16): a referral counts once the invited builder has a first approved ship, and
// the reward values are still open. The page is a read-only list of who invited whom, so nothing here is paid or computed in Ore.

export async function listReferrals(limit = 500): Promise<ReferralRow[]> {
  return [...content.referrals].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

export async function referrerLeaderboard(rows: ReferralRow[]): Promise<ReferrerLeaderboardRow[]> {
  const out = new Map<string, ReferrerLeaderboardRow>();
  for (const r of rows) {
    const row = out.get(r.referrer_id) ?? { referrerId: r.referrer_id, name: r.referrer_name, total: 0, qualified: 0 };
    row.total += 1;
    if (r.qualified_at) row.qualified += 1;
    out.set(r.referrer_id, row);
  }
  return [...out.values()].sort((a, b) => b.qualified - a.qualified || b.total - a.total);
}

// ---- Vault levels (community goals) ----

export async function listVaultLevels(): Promise<VaultLevelRow[]> {
  return [...content.vault].sort((a, b) => a.position - b.position || a.level - b.level);
}

// ---- Ideas ----

export async function listIdeas(query?: string): Promise<IdeaWithUser[]> {
  const q = norm((query ?? "").trim());
  return content.ideas.filter((idea) => !q || norm(idea.title).includes(q)).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
