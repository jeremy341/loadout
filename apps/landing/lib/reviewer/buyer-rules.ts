// The one rule for buyer details on the review desk. lib/reviewer/access.ts (the platform desk) and reviewer-dash/lib/
// fulfillmentAccess.ts (the fulfilment desk) both call these, so the two copies cannot drift apart (L7). Pure; the callers
// supply the identity they compare (a person id or a Slack id) and whether the viewer has claimed the order.
//
// Buyer details (legal name, email, phone, mailing address) are visible to owners and to the fulfiller who claimed the order.
// Nobody may claim or ship their own purchase, owners included.

export function buyerDetailsVisible(viewer: { isOwner: boolean; claimedByViewer: boolean }): boolean {
  return viewer.isOwner || viewer.claimedByViewer;
}

export function isOwnPurchase(buyer: string | null | undefined, viewer: string): boolean {
  const who = (buyer ?? "").trim();
  return who !== "" && who === viewer.trim();
}
