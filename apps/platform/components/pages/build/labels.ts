import { RULES } from "./logic/constants";
import { countableReviews } from "./logic/scoring";
import type { Ship, ShipState } from "./logic/types";

export const SHIP_STATE_LABEL: Record<ShipState, string> = {
  submitted: "Submitted",
  team_check: "Team check",
  peer_review: "Peer review",
  flag_window: "Flag window",
  paid: "Paid",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

export type Tone = "plain" | "accent" | "ok" | "warn" | "bad";

export function shipTone(state: ShipState): Tone {
  switch (state) {
    case "paid":
      return "ok";
    case "changes_requested":
      return "warn";
    case "rejected":
      return "bad";
    default:
      return "accent";
  }
}

/** A short status for a project: its newest ship's state, or "Draft" when it has not been shipped. */
export function projectStatus(ships: readonly Ship[]): string {
  const latest = ships[ships.length - 1];
  if (!latest) return "Draft";
  if (latest.state === "peer_review") return `Peer review ${Math.min(countableReviews(latest.reviews).length, RULES.reviewsPerShip)}/${RULES.reviewsPerShip}`;
  return SHIP_STATE_LABEL[latest.state];
}
