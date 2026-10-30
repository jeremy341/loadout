import type { Prisma } from "../generated/prisma/client";
import { db } from "./db";

// Flags the platform knows about. A flag with no stored row is off. Milestones add entries here.
export const KNOWN_FLAGS = {
  shop_voting: "Shop voting (M3)",
  limited_drops: "Limited drops (M3)",
  workshops: "Online workshops (M4)",
} as const;

export type FlagName = keyof typeof KNOWN_FLAGS;

export const FLAG_CACHE_MS = 30_000;

type Loader = (name: string) => Promise<boolean>;

// Reads a flag through a short in-process cache, so pages do not query the table on every request.
export function createFlagReader(load: Loader, ttlMs = FLAG_CACHE_MS, now: () => number = Date.now) {
  const cache = new Map<string, { value: boolean; at: number }>();
  return {
    async isOn(name: string): Promise<boolean> {
      const hit = cache.get(name);
      if (hit && now() - hit.at < ttlMs) return hit.value;
      const value = await load(name);
      cache.set(name, { value, at: now() });
      return value;
    },
    forget(name: string) {
      cache.delete(name);
    },
  };
}

const reader = createFlagReader(async (name) => {
  const row = await db().featureFlag.findUnique({ where: { name } });
  return row?.enabled ?? false;
});

export function isFlagOn(name: FlagName): Promise<boolean> {
  return reader.isOn(name);
}

// Called inside the staff write transaction.
export function writeFlag(name: FlagName, enabled: boolean, tx: Prisma.TransactionClient) {
  return tx.featureFlag.upsert({
    where: { name },
    create: { name, enabled, description: KNOWN_FLAGS[name] },
    update: { enabled },
  });
}

// Called after the transaction commits, so the next read sees the new value.
export function forgetFlag(name: FlagName): void {
  reader.forget(name);
}
