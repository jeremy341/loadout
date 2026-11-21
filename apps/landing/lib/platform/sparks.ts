// Starter ideas for the New project wizard (plans/proposals/participant-redesign-plan.md 3.3a; owner approved the wording on
// 16 Nov 2026). Pure data and pure rotation, so it has a bun test. Every line is a technical project, so the list never
// invites a portfolio site or a game. Software covers Tools, Systems and Compute; hardware is the Hardware track.

export const SPARK_MAX = 90;
export const SPARKS_PER_PAGE = 3;

export type SparkGroup = "software" | "hardware";

export const SPARKS: Record<SparkGroup, readonly string[]> = {
  software: [
    "a command line tool that removes a step I keep repeating",
    "a log viewer that colours lines by how new they are",
    "a tiny key value store that survives a power cut",
    "a chat server other programs can connect to",
    "a script that trains a small model on my own notes",
    "a benchmark that compares two ways of doing the same job",
    "a build cache that shares results across my machines",
    "a linter for one annoying mistake",
    "a file watcher that reruns tests",
    "a plain text database with a query language",
    "a job queue for my home server",
    "a tool that checks my config files for mistakes",
  ],
  hardware: [
    "a custom keyboard with one odd feature",
    "a sensor board that logs temperature to a card",
    "a small robot that follows a line",
    "a power supply with a live current display",
    "a motor driver board",
    "a handheld that plays one tiny game",
    "a radio receiver module",
    "a plant monitor that texts me",
    "a logic analyser",
    "a clock that shows something other than time",
    "a board that talks to my laptop over USB",
    "a rig that tests one part again and again",
  ],
};

export function sparkGroup(track: string | null | undefined): SparkGroup {
  return track === "Hardware" ? "hardware" : "software";
}

// A small seeded generator, so the same cycle always gives the same order (no Math.random during render).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The order of the whole pool in one cycle. Cycle 0 is the written order; later cycles are shuffled by cycle number.
export function sparkOrder(pool: readonly string[], cycle: number): string[] {
  const order = [...pool];
  if (cycle <= 0) return order;
  const random = mulberry32(cycle * 7919 + pool.length);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  return order;
}

// How many pages a full cycle has. A short last page is topped up from the start of the same cycle's order, so a page is
// always full; the top-up is the only place a line repeats, and only on the last page of a cycle.
export function pagesPerCycle(pool: readonly string[], perPage = SPARKS_PER_PAGE): number {
  return Math.ceil(pool.length / perPage);
}

// Page number 0, 1, 2... gives the lines to show. Within one cycle no line shows twice, except that a short last page borrows.
export function sparkPage(pool: readonly string[], page: number, perPage = SPARKS_PER_PAGE): string[] {
  if (pool.length === 0) return [];
  const pages = pagesPerCycle(pool, perPage);
  const safe = Math.max(0, Math.floor(page));
  const cycle = Math.floor(safe / pages);
  const index = safe % pages;
  const order = sparkOrder(pool, cycle);
  const start = index * perPage;
  const lines = order.slice(start, start + perPage);
  for (let fill = 0; lines.length < Math.min(perPage, pool.length); fill += 1) lines.push(order[fill]);
  return lines;
}

// What a spark writes into the idea box: the line with a capital letter.
export function sparkText(line: string): string {
  return line.charAt(0).toUpperCase() + line.slice(1);
}
