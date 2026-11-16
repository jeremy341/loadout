// Pure helpers for the search and Save UI (SaveButton, ProjectResultRow, the Toolbelt finder, Explore search). No hooks, no I/O.
// Tests: search-view.test.ts.
//   repoHost(url)               -> "github.com/owner/repo" (host and path only) for an https address, otherwise null.
//                                  Drops credentials, port, query, hash, a trailing slash and a ".git" suffix. Lower-cases the host.
//   resultCountText(n, q, kind) -> status line text: "6 projects." / "1 project." / `No projects match "x".`; with an empty
//                                  query: "Saved and most used projects." (n > 0) or "No projects yet." kind "tool" says tools.
//   groupRows(rows)             -> [{ key: "saved" | "popular", label, rows }] for the empty query: the viewer's saved projects
//                                  first (up to 5), then the most used others (up to 5, usedBy > 0), no row twice, empty groups dropped.
//   trackSlugOf(track)          -> lower-case track slug for data-track, or undefined.
import type { SearchRow } from "./discover-data";
import { TRACKS } from "./progress";

export const GROUP_SIZE = 5;

export function repoHost(url: string | null | undefined): string | null {
  if (typeof url !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.hostname === "") return null;
  const path = parsed.pathname.replace(/\/+$/, "").replace(/\.git$/i, "");
  return `${parsed.hostname.toLowerCase()}${path === "/" ? "" : path}`;
}

export function resultCountText(count: number, query: string, kind: "project" | "tool" = "project"): string {
  const q = query.trim();
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const plural = `${kind}s`;
  if (q === "") return n > 0 ? `Saved and most used ${plural}.` : `No ${plural} yet.`;
  if (n === 0) return `No ${plural} match "${q}".`;
  return `${n} ${n === 1 ? kind : plural}.`;
}

export type RowGroup<T> = { key: "saved" | "popular"; label: string; rows: T[] };

export function groupRows<T extends Pick<SearchRow, "id" | "saved" | "usedBy">>(rows: readonly T[]): RowGroup<T>[] {
  const saved = rows.filter((row) => row.saved).slice(0, GROUP_SIZE);
  const taken = new Set(saved.map((row) => row.id));
  const popular = rows
    .filter((row) => !taken.has(row.id) && row.usedBy > 0)
    .sort((a, b) => b.usedBy - a.usedBy)
    .filter((row, index, all) => all.findIndex((other) => other.id === row.id) === index)
    .slice(0, GROUP_SIZE);
  const groups: RowGroup<T>[] = [
    { key: "saved", label: "Saved", rows: saved },
    { key: "popular", label: "Used most", rows: popular },
  ];
  return groups.filter((group) => group.rows.length > 0);
}

export function trackSlugOf(track: string | null | undefined): string | undefined {
  const found = TRACKS.find((t) => t.toLowerCase() === (track ?? "").toLowerCase());
  return found ? found.toLowerCase() : undefined;
}
