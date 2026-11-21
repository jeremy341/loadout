import { REVIEW_SHIPS } from "../platform/review";
import { queueAllows, type ReviewerAccess } from "./access";
import { FULFILMENT_ORDERS, TICKETS } from "./fulfilment";
import { pageEntries } from "./nav";
import { PLAYERS, STAFF_PROJECTS } from "./people";

// The command palette's index and its search. The server builds the index for the signed-in role (so a client never
// receives a page or a record the role may not open) and the palette filters it in the browser. Pages come from the nav;
// the people, projects, ships, orders and tickets are the sample fixtures, linked the way the pages link them. Pixl does the
// same against its database through /api/search; there is no database for these yet.

export type PaletteEntry = {
  href: string;
  label: string;
  /** A second, quieter line: whose it is, or what it is. */
  sub?: string;
  /** The heading it is listed under. */
  group: string;
  /** Extra words the search matches. */
  words: string;
  /** A record (player, project, ship, order, ticket) and not a page. Records need two typed letters before they appear. */
  record: boolean;
};

export const PALETTE_RECORD_MIN = 2;
export const PALETTE_RECORD_CAP = 5;
export const PALETTE_LIMIT = 40;
export const PALETTE_QUERY_MAX = 60;

// Roles see only their own records: players are the owner's; projects and ships belong to reviewers (and a one-queue reviewer
// sees only that queue's ships); orders to fulfillers; tickets to helpers.
export function paletteEntries(access: ReviewerAccess): PaletteEntry[] {
  const entries: PaletteEntry[] = pageEntries(access).map((page) => ({ ...page, record: false }));
  if (access.isOwner) {
    for (const player of PLAYERS) {
      entries.push({ href: `/players/${player.id}`, label: player.handle, sub: "Builder", group: "Builders", words: player.standing, record: true });
    }
  }
  if (access.isReviewer || access.isOwner) {
    for (const project of STAFF_PROJECTS) {
      entries.push({ href: `/projects/${project.id}`, label: project.title, sub: `Project by ${project.owner}`, group: "Projects", words: `${project.id} ${project.kind}`, record: true });
    }
    for (const ship of REVIEW_SHIPS) {
      if (!queueAllows(access.reviewQueues, ship.kind)) continue;
      entries.push({ href: `/review/${ship.id}`, label: ship.title, sub: `Ship ${ship.id} by ${ship.builder}`, group: "Ships", words: `${ship.id} ${ship.kind} ${ship.status}`, record: true });
    }
  }
  if (access.isFulfiller) {
    for (const order of FULFILMENT_ORDERS) {
      entries.push({ href: `/fulfilment/label/${order.id}`, label: `Order ${order.number}`, sub: `${order.buyer}, ${order.country}`, group: "Orders", words: `${order.id} ${order.buyer}`, record: true });
    }
  }
  if (access.isHelper) {
    for (const ticket of TICKETS) {
      entries.push({ href: `/tickets/${ticket.id}`, label: ticket.subject, sub: `Ticket from ${ticket.builder}`, group: "Tickets", words: `${ticket.id} ${ticket.builder}`, record: true });
    }
  }
  return entries;
}

const normalise = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

// How well an entry matches: 0 the label starts with the query, 1 a word in the label does, 2 the label contains it, 3 only the
// other text does. null when some typed word is nowhere in the entry. A short word (under three letters) must start a word of
// the entry, so "ke" finds kestrel42 and not "Tickets"; longer words may sit anywhere in a word.
export function matchRank(entry: PaletteEntry, query: string): number | null {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return 0;
  const label = normalise(entry.label);
  const haystack = normalise(`${entry.label} ${entry.sub ?? ""} ${entry.group} ${entry.words}`);
  const haystackWords = haystack.split(/[^a-z0-9]+/).filter(Boolean);
  const found = (word: string) => haystackWords.some((part) => part.startsWith(word)) || (word.length >= 3 && haystack.includes(word));
  if (!words.every(found)) return null;
  const whole = words.join(" ");
  if (label.startsWith(whole)) return 0;
  const labelWords = label.split(/[^a-z0-9]+/).filter(Boolean);
  if (words.every((word) => labelWords.some((part) => part.startsWith(word)))) return 1;
  if (words.every((word) => label.includes(word))) return 2;
  return 3;
}

// The results for a typed query. No query lists every page. A query matches pages at any length and records from two letters,
// at most PALETTE_RECORD_CAP of each kind, so a common word does not bury the pages. Results keep their headings together: pages
// first, in the nav's order of sections, then each kind of record.
export function searchPalette(entries: readonly PaletteEntry[], rawQuery: string, limit = PALETTE_LIMIT): PaletteEntry[] {
  const query = normalise(rawQuery).slice(0, PALETTE_QUERY_MAX);
  const ranked: { entry: PaletteEntry; rank: number; order: number }[] = [];
  entries.forEach((entry, order) => {
    if (entry.record && query.length < PALETTE_RECORD_MIN) return;
    const rank = matchRank(entry, query);
    if (rank !== null) ranked.push({ entry, rank, order });
  });

  const groups: string[] = [];
  for (const { entry } of ranked) if (!groups.includes(entry.group)) groups.push(entry.group);
  const kept: typeof ranked = [];
  for (const group of groups) {
    const inGroup = ranked.filter((item) => item.entry.group === group).sort((a, b) => a.rank - b.rank || a.order - b.order);
    kept.push(...(inGroup[0]?.entry.record ? inGroup.slice(0, PALETTE_RECORD_CAP) : inGroup));
  }
  return kept.slice(0, limit).map((item) => item.entry);
}

// The headings that start a run in a result list, for drawing: the index of each entry that begins a new group.
export function groupStarts(results: readonly PaletteEntry[]): Set<number> {
  const starts = new Set<number>();
  results.forEach((entry, index) => {
    if (index === 0 || results[index - 1].group !== entry.group) starts.add(index);
  });
  return starts;
}
