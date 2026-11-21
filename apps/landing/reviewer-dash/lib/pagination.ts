// Which page buttons a pager shows: always the first and last page, a window
// around the current one, and "gap" markers where pages are skipped. Pure so
// it can be tested without rendering anything.
export type PageItem = number | "gap";

export function pageWindow(page: number, totalPages: number, around = 2): PageItem[] {
  if (totalPages <= 1) return [1];
  const cur = Math.min(Math.max(page, 1), totalPages);
  const keep = new Set<number>([1, totalPages]);
  for (let p = cur - around; p <= cur + around; p++) {
    if (p >= 1 && p <= totalPages) keep.add(p);
  }
  const sorted = [...keep].sort((a, b) => a - b);
  const out: PageItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) out.push("gap");
    out.push(p);
  }
  return out;
}
