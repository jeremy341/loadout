"use client";

import { getPreview, setPreview, uid, usePreviewState } from "./preview-store";

// The preview Ore ledger. It is append-only like the real one will be: balances are always the sum of
// entries, nothing edits an entry, and a correction is a new entry. Opening entries are sample data.

export const ORE_LEDGER_KEY = "ore-ledger";

export interface OreEntry {
  id: string;
  /** Positive earns, negative spends. Whole Ore. */
  amount: number;
  reason: string;
  /** Which module wrote it, e.g. "shop", "award", "referral", "preview". */
  source: string;
  at: string;
}

export const SEED_ORE_LEDGER: OreEntry[] = [
  { id: "seed_1", amount: 120, reason: "Sample opening balance", source: "preview", at: "2026-10-01T09:00:00.000Z" },
];

export function oreBalance(entries: readonly OreEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

export function useOre() {
  const [entries, setEntries] = usePreviewState<OreEntry[]>(ORE_LEDGER_KEY, SEED_ORE_LEDGER);
  const balance = oreBalance(entries);
  return {
    entries,
    balance,
    canAfford: (cost: number) => balance >= cost,
    earn: (amount: number, reason: string, source: string) => addOreEntry(amount, reason, source),
    spend: (amount: number, reason: string, source: string) => addOreEntry(-amount, reason, source),
    /** Test and demo helper. */
    setEntries,
  };
}

/** Appends an entry from anywhere. Refuses to take the balance below zero. Returns the entry or null. */
export function addOreEntry(amount: number, reason: string, source: string): OreEntry | null {
  const whole = Math.trunc(amount);
  if (!Number.isFinite(whole) || whole === 0) return null;
  const entries = getPreview<OreEntry[]>(ORE_LEDGER_KEY, SEED_ORE_LEDGER);
  if (oreBalance(entries) + whole < 0) return null;
  const entry: OreEntry = { id: uid("ore"), amount: whole, reason, source, at: new Date().toISOString() };
  setPreview(ORE_LEDGER_KEY, [...entries, entry]);
  return entry;
}
