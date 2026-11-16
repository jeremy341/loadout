// Pixl caches Hack Club's Airbridge answers in its own database. LOADOUT has no Airbridge, so there is no cache: the reads answer
// with the sample sync from ./ships.ts and nothing is fetched or stored.
import type { SubmissionLookup } from "../airtable";
import { shipsProvider, type ShipsProvider, type ShipsView } from "./ships";

export async function readCachedStaging(ids: string[]): Promise<Map<string, SubmissionLookup>> {
  return new Map(ids.map((id) => [id, { kind: "missing" } as SubmissionLookup]));
}

export async function readAirbridgeCache(): Promise<ShipsView> {
  return shipsProvider().get();
}

export type SyncResult = { checked: number; errors: number };

export async function refreshAirbridgeCache(limit = 30): Promise<SyncResult> {
  void limit;
  return { checked: 0, errors: 0 };
}

export function createAirbridgeProvider(): ShipsProvider {
  return shipsProvider();
}
