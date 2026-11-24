// Where each reviewer page's data lives, so a page can say so beside its own data. The layout used to carry one line claiming that only
// ship reviews are saved, which was wrong for the pages that write to the database (Operations, bans and reports, events and forms,
// feature flags). A page is "saved" when its writes reach the database, "mixed" when some of them do, and "sample" when changes are
// kept in memory and are gone when the server restarts. A page with its own notice, or one that only reads, returns null.
//
// The sources: lib/real.ts (ships), lib/platform/moderation-data.ts (bans, proposals, reports), lib/platform/content-data.ts (events,
// forms, news), lib/platform/flags.ts (flags), lib/tickets.ts (tickets), operations/actions.ts and superadmin/actions.ts. Several of
// those fall back to sample rows only in development with an empty table, which is why the text says "shown only in development".
// The team, project, shop, fulfilment, show-and-tell and community-goal changes (actions-people, actions-content, actions-ops) go to the
// in-memory sample store. The fixture pages under /review (pay, age exceptions, erasure, macros, hardware) have no form at all.

export type DataScopeKind = "saved" | "mixed" | "sample";
export type DataScope = { kind: DataScopeKind; label: string; text: string };

const SAMPLE_TEXT = "Changes on this page are kept in memory and are gone when the server restarts.";

const SAVED: DataScope = { kind: "saved", label: "Saved", text: "Changes are saved to the database." };

const SHIPS: DataScope = {
  kind: "mixed",
  label: "Saved and sample",
  text: "Ship reviews, verdicts and notes are saved to the database. Sample ships, shown only in development, are kept in memory.",
};

const MODERATION: DataScope = {
  kind: "mixed",
  label: "Saved and sample",
  text: "Ban proposals, reports and decisions are saved to the database. Sample rows, shown only in development, are kept in memory.",
};

const SAMPLE: DataScope = { kind: "sample", label: "Sample data", text: SAMPLE_TEXT };

const READ_ONLY_SAMPLE: DataScope = { kind: "sample", label: "Sample data", text: "Read only. The rows on this page are sample records and nothing here is a live record." };

// Most specific first. Each pattern is tested against the address as the visitor sees it (no /reviewer prefix).
const SCOPES: readonly (readonly [RegExp, DataScope | null])[] = [
  [/^\/operations(\/|$)/, { ...SAVED, text: "Operations are saved to the database. Every change is recorded in the audit history." }],
  [/^\/superadmin(\/|$)/, { ...SAVED, text: "The grant is saved to the database and every attempt is recorded." }],
  [/^\/fulfil{1,2}ment\/airbridge-preview(\/|$)/, null],
  // One notice for the whole fulfilment area: the order list is fixtures, and the actions on it are recorded in the database.
  [
    /^\/fulfil{1,2}ment(\/|$)/,
    {
      kind: "sample",
      label: "Sample data",
      text: "The order list comes from fixtures. Claim, pack, ship, grant, flag and cancel are recorded in the database; the list will show those rows when its read side is switched over.",
    },
  ],
  [/^\/notify(\/|$)/, null],
  [/^\/settings(\/|$)/, { kind: "mixed", label: "Saved and sample", text: "Feature flags are saved to the database. Display preferences are kept in memory and are gone when the server restarts." }],
  [/^\/review\/(pay|macros|erasure|age-exceptions|hardware)(\/|$)/, READ_ONLY_SAMPLE],
  [/^\/tickets(\/|$)/, { kind: "mixed", label: "Saved and sample", text: "Replies and resolutions are saved to the database. Sample tickets, shown only in development, are kept in memory." }],
  [/^\/news(\/|$)/, { kind: "mixed", label: "Saved and sample", text: "News posts are saved to the database. Sample posts, shown only in development, are kept in memory." }],
  [/^\/review\/guidelines(\/|$)/, null],
  [/^\/review(\/|$)/, SHIPS],
  [/^\/(bans|reports|violations)(\/|$)/, MODERATION],
  [/^\/(events|forms)(\/|$)/, { kind: "mixed", label: "Saved and sample", text: "Events, form settings and submission decisions are saved to the database. Sample rows, shown only in development, are kept in memory." }],
  [/^\/players(\/|$)/, { kind: "mixed", label: "Saved and sample", text: "Bans, lifts and warnings for real builders are saved to the database. Team, project and profile changes are kept in memory and are gone when the server restarts." }],
];

/** The notice for a page address, or null when the page carries its own or has nothing to say. */
export function dataScopeFor(path: string): DataScope | null {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  // The Overview only reads, and counts whatever ships and builders the site holds (sample ones only in development).
  if (clean === "/") return { kind: "mixed", label: "Read only", text: "Figures count the ships and builders this site holds. Sample records, shown only in development, are included." };
  for (const [pattern, scope] of SCOPES) if (pattern.test(clean)) return scope;
  return SAMPLE;
}
