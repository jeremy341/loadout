// Pixl records a Blackout decision with the review verdict. LOADOUT has no such event, so nothing is ever reviewable as one.
import type { BlackoutEntry } from "./operations";

export function isBlackoutReviewable(entry: BlackoutEntry | null): entry is BlackoutEntry {
  return (
    !!entry &&
    entry.firstQualifiedShipAt !== null &&
    entry.decidedBy !== "system" &&
    (entry.status === "shipped" || entry.status === "eligible" || entry.status === "ineligible")
  );
}
