import { db } from "@/lib/platform/db";
import { KNOWN_FLAGS } from "@/lib/platform/flags";

// The rows of the Flags section on the settings page: every flag the platform knows (KNOWN_FLAGS) joined with its stored
// FeatureFlag row. A known flag with no row has never been switched, so it is off with no update time (lib/platform/flags.ts: "a
// flag with no stored row is off"). A stored row the code no longer lists is still shown, read-only, so it can be seen and cleaned
// up; the toggle action (setFlagState in lib/platform/actions.ts) refuses names outside KNOWN_FLAGS.
export type FlagRow = {
  name: string;
  description: string;
  enabled: boolean;
  // ISO time of the last write, or null when no row exists yet.
  updatedAt: string | null;
  // False for a stored row that KNOWN_FLAGS no longer lists. Those cannot be toggled.
  known: boolean;
};

type StoredFlag = { name: string; description: string; enabled: boolean; updatedAt: Date };

export function mergeFlagRows(stored: readonly StoredFlag[], known: Record<string, string> = KNOWN_FLAGS): FlagRow[] {
  const byName = new Map(stored.map((row) => [row.name, row]));
  const rows: FlagRow[] = Object.entries(known).map(([name, label]) => {
    const row = byName.get(name);
    return {
      name,
      description: row?.description ?? label,
      enabled: row?.enabled ?? false,
      updatedAt: row ? row.updatedAt.toISOString() : null,
      known: true,
    };
  });
  const extra = stored
    .filter((row) => !Object.hasOwn(known, row.name))
    .map((row): FlagRow => ({ name: row.name, description: row.description, enabled: row.enabled, updatedAt: row.updatedAt.toISOString(), known: false }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...rows, ...extra];
}

export async function listFlagRows(): Promise<FlagRow[]> {
  return mergeFlagRows(await db().featureFlag.findMany({ orderBy: { name: "asc" } }));
}
