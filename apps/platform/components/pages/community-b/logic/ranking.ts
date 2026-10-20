// Ranking, sorting and paging for the leaderboard table. Pure functions only.
//
// Ranking is "competition ranking" (1, 2, 2, 4): builders with the same value share a rank and the next rank
// skips the tied places. Sorting is stable: rows with the same sort key keep their input order.

export interface Ranked<T> {
  row: T;
  value: number;
  rank: number;
  /** Position in the input, used as the stable tie-break. */
  order: number;
}

/** Highest value first. Rows with equal values share a rank. */
export function rankByValue<T>(rows: readonly T[], valueOf: (row: T) => number): Ranked<T>[] {
  const withValue = rows.map((row, order) => ({ row, value: valueOf(row), order }));
  withValue.sort((a, b) => b.value - a.value || a.order - b.order);
  const ranked: Ranked<T>[] = [];
  withValue.forEach((entry, position) => {
    const prev = ranked[position - 1];
    const rank = prev && prev.value === entry.value ? prev.rank : position + 1;
    ranked.push({ ...entry, rank });
  });
  return ranked;
}

export type SortKey = "rank" | "name" | "track" | "value";
export type SortDir = "asc" | "desc";

/** Re-orders ranked rows for the table header buttons. The ranks themselves never change. */
export function sortRanked<T extends { name: string; track: string }>(rows: readonly Ranked<T>[], key: SortKey, dir: SortDir): Ranked<T>[] {
  const sign = dir === "asc" ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    let cmp = 0;
    if (key === "rank") cmp = a.rank - b.rank;
    else if (key === "value") cmp = a.value - b.value;
    else cmp = a.row[key].localeCompare(b.row[key], "en", { sensitivity: "base" });
    if (cmp !== 0) return cmp * sign;
    // Equal keys keep their input order, so repeated sorts never shuffle rows (stable).
    return a.order - b.order;
  });
  return copy;
}

export interface Page<T> {
  items: T[];
  /** 1-based, clamped into range. */
  page: number;
  pageCount: number;
  total: number;
  /** 1-based index of the first and last item shown, 0 when empty. */
  from: number;
  to: number;
}

export function paginate<T>(items: readonly T[], page: number, size: number): Page<T> {
  const safeSize = Math.max(1, Math.floor(size));
  const pageCount = Math.max(1, Math.ceil(items.length / safeSize));
  const current = Math.min(pageCount, Math.max(1, Math.floor(page) || 1));
  const start = (current - 1) * safeSize;
  const slice = items.slice(start, start + safeSize);
  return {
    items: slice,
    page: current,
    pageCount,
    total: items.length,
    from: slice.length ? start + 1 : 0,
    to: slice.length ? start + slice.length : 0,
  };
}

/** The row to pin under the table when `isYou` matches something that is not on the visible page. */
export function pinnedRow<T>(all: readonly Ranked<T>[], visible: readonly Ranked<T>[], isYou: (row: T) => boolean): Ranked<T> | null {
  const mine = all.find((entry) => isYou(entry.row));
  if (!mine) return null;
  return visible.some((entry) => entry === mine) ? null : mine;
}

/** The first `count` entries by rank order, used for the podium. */
export function podium<T>(ranked: readonly Ranked<T>[], count = 3): Ranked<T>[] {
  return ranked.filter((entry) => entry.rank <= count).slice(0, count);
}
