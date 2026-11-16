// Sample data for the Records area. Side tables keyed by real ship and reviewer ids; records-fixtures.test.ts checks every key.
// Handles only. No real names, emails, addresses or repositories.
import type { AgeException } from "./records-age";
import type { AnnounceKind } from "./records-announce";

// Which sample ship each announcement preview describes.
export const ANNOUNCE_SAMPLES: readonly { kind: AnnounceKind; ship: string; hours: string | null }[] = [
  { kind: "approved", ship: "sh-2041", hours: "12h" },
  { kind: "needs-changes", ship: "sh-2054", hours: null },
  { kind: "banned", ship: "sh-2056", hours: null },
];

// Owner-listed age exceptions. The handle is the ship's builder; the ship is the one the exception came up on.
export const AGE_EXCEPTIONS: readonly AgeException[] = [
  { id: "age-1", handle: "ostler", ship: "sh-2049", justification: "Turned 19 after the ship was sent. Their age at shipping is on the profile and was within 13 to 18." },
  { id: "age-2", handle: "cobble", ship: "sh-2055", justification: "Turned 19 during the run, in the week the ship was reviewed. The owner counted the ship date, not the review date." },
];

// Reviewers whose perk progress the owner page shows. Review counts come from their verdict counts, not from here.
export const PERK_REVIEWERS: readonly string[] = ["bellwether", "lintel", "tamsin", "saltmarsh"];
