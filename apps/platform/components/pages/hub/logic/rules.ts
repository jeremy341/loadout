// Every number the Hub tabs use that a plan does not fix. One place, so a page, a test and SOURCES.md agree.
// "plan" entries are quoted from a plan; "draft" entries are working choices the pages label "Draft preview rule".

export const HUB_RULES = {
  /** Plan 02 section 20: the first meaningful external contribution is worth +50 Ore, once. */
  contributorOre: 50,
  /** Task brief for the Profile tab. */
  bioMax: 280,
  /** Task brief for the Notifications tab. */
  pageSize: 15,

  // Draft preview rules (no plan sets these).
  displayName: { min: 2, max: 40 },
  handle: { min: 3, max: 24 },
  pronounsMax: 24,
  maxLinks: 3,
  linkLabelMax: 30,
  linkMax: 200,
  maxPinned: 3,
  claimNoteMax: 300,
  recentActivity: 8,
  nextActions: 8,
  importMaxChars: 2_000_000,
  importMaxEntries: 200,
  /** Handles nobody may take in the preview. The real reserved list is for the program to set. */
  reservedHandles: ["admin", "staff", "support", "loadout", "orry", "goose-lee", "hackclub", "mod", "moderator", "system"],
} as const;

/** The exact text a person types to reset all preview data. */
export const RESET_PHRASE = "RESET";

/** Marks an export file so an import can tell it from any other JSON. */
export const EXPORT_FORMAT = "loadout-platform-preview";
export const EXPORT_VERSION = 1;
