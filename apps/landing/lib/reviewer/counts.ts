import { REVIEW_SHIPS, tabCounts } from "../platform/review";
import { queueAllows, type ReviewerAccess } from "./access";
import { FULFILMENT_ORDERS, TICKETS } from "./fulfilment";
import { reportCounts } from "./moderation";

// The count badges in the top bar, as Pixl shows them: the review queue, open reports, open tickets and orders still to
// fulfil. Each is best effort and shows only to a role that can open the page: a failing count must never take the bar down
// with it (Pixl wraps each in a safe call for the same reason). These come from the sample fixtures, so they are not live counts.
function safe(read: () => number): number {
  try {
    const value = read();
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function navCounts(access: ReviewerAccess): Record<string, number> {
  const reviewer = access.isOwner || access.isReviewer;
  return {
    "/review": reviewer ? safe(() => tabCounts(REVIEW_SHIPS.filter((ship) => queueAllows(access.reviewQueues, ship.kind))).pending) : 0,
    "/reports": access.isOwner ? safe(() => reportCounts().open) : 0,
    "/tickets": access.isHelper ? safe(() => TICKETS.filter((ticket) => (ticket.status as string) === "open").length) : 0,
    "/fulfilment": access.isFulfiller ? safe(() => FULFILMENT_ORDERS.filter((order) => (order.status as string) === "new").length) : 0,
  };
}
