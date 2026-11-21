// Ship state rules. Pure: no database, no clock. A leaf module: projects.ts and journal.ts import it, so it imports nothing local.
// Statuses (Pixl's and plans/proposals/review-rules.md): draft, logging, submitted, in-review, second-pass, needs-changes,
// approved, banned. A hold is a flag (Project.heldAt), not a status. This file covers the builder's moves only; the reviewer's
// moves are listed as reserved and belong to the review desk batch.
//
// API:
//   SHIP_STATUSES                    the eight status names
//   canonicalStatus(status)          lower case, "_" turned into "-"
//   OPEN_STATUSES                    the three states a project can change in (for query filters)
//   isLocked(status)                 true when the track, links, description and journal are frozen (fail closed: unknown is locked)
//   nextStatuses(status, actor)      -> the statuses the actor may move the project to
//   builderMove(status, to)          -> "submit" | "resubmit" | "unsubmit" | "update" | null, the builder move that makes this change
//   canUnsubmit(status)              true only while plain submitted
//   RESERVED_REVIEWER_MOVES          the moves the review batch will own

export const SHIP_STATUSES = ["draft", "logging", "submitted", "in-review", "second-pass", "needs-changes", "approved", "banned"] as const;
export type ShipStatus = (typeof SHIP_STATUSES)[number];
export type ShipActor = "builder" | "reviewer";
export type BuilderMove = "submit" | "resubmit" | "unsubmit" | "update";

export function canonicalStatus(status: string): string {
  return status.trim().toLowerCase().replace(/_/g, "-");
}

// The states where the project can still change. Everything else is frozen, including a status nobody knows (fail closed).
export const OPEN_STATUSES = ["draft", "logging", "needs-changes"] as const;
const OPEN: readonly string[] = OPEN_STATUSES;

export function isLocked(status: string): boolean {
  return !OPEN.includes(canonicalStatus(status));
}

// Moves the review desk will own in the next batch. Listed here so the builder side never grows them by accident.
export const RESERVED_REVIEWER_MOVES: readonly { from: ShipStatus; to: ShipStatus }[] = [
  { from: "submitted", to: "in-review" },
  { from: "in-review", to: "second-pass" },
  { from: "in-review", to: "needs-changes" },
  { from: "in-review", to: "approved" },
  { from: "in-review", to: "banned" },
  { from: "second-pass", to: "approved" },
  { from: "second-pass", to: "needs-changes" },
  { from: "second-pass", to: "banned" },
];

// The builder may send a draft or a logging project, and a sent-back one, to submitted. A plain submitted project can go back to
// draft (unsubmit) because nobody has picked it up. An approved project reopens as a draft for an update ship. Nothing else.
// The reviewer's moves are not granted here: nextStatuses(status, "reviewer") is empty until the review batch fills it in.
export function nextStatuses(status: string, actor: ShipActor): ShipStatus[] {
  if (actor === "reviewer") return [];
  switch (canonicalStatus(status)) {
    case "draft":
    case "logging":
    case "needs-changes":
      return ["submitted"];
    case "submitted":
      return ["draft"];
    case "approved":
      return ["draft"];
    default:
      return [];
  }
}

export function builderMove(from: string, to: string): BuilderMove | null {
  const current = canonicalStatus(from);
  if (!nextStatuses(current, "builder").includes(to as ShipStatus)) return null;
  if (to === "submitted") return current === "needs-changes" ? "resubmit" : "submit";
  if (current === "submitted") return "unsubmit";
  if (current === "approved") return "update";
  return null;
}

export function canUnsubmit(status: string): boolean {
  return canonicalStatus(status) === "submitted";
}

// Plain words for a status, used by the stage text and the locked messages.
export function lockedReason(status: string): string | null {
  switch (canonicalStatus(status)) {
    case "submitted":
      return "This project is submitted, so it can't change. Take it back to edit it, or wait for a reviewer.";
    case "in-review":
    case "second-pass":
      return "A reviewer is looking at this project, so it can't change right now.";
    case "approved":
      return "This project is approved. Request an update to change it.";
    case "banned":
      return "This project was banned. Ask support.";
    default:
      return isLocked(status) ? "This project can't change right now." : null;
  }
}
