import { config } from "@/reviewer-dash/app/_generated/config";
import { isSafeUrl } from "@/reviewer-dash/lib/safeUrl";
import { TextLink, type Tone } from "@/reviewer-dash/app/_ui/ui";
import type { OrderStatus } from "@/reviewer-dash/lib/db";

// LOADOUT's stages are New, Claimed, Packed, Shipped, Delivered and Cancelled. The stored keys are Pixl's: Ordered and Credited are one stage
// here (Packed, and no action sets Ordered any more) and Done is Delivered.
export const STAGE_LABEL: Record<OrderStatus, string> = {
  pending: "New",
  claimed: "Claimed",
  ordered: "Packed",
  credited: "Packed",
  shipped: "Shipped",
  done: "Delivered",
  cancelled: "Cancelled",
};

export const STAGE_TONE: Record<OrderStatus, Tone> = {
  pending: "warning",
  claimed: "info",
  ordered: "purple",
  credited: "purple",
  shipped: "cyan",
  done: "success",
  cancelled: "neutral",
};

export const STAGE_HINT: Record<OrderStatus, string> = {
  pending: "Request received",
  claimed: "Assigned to a fulfiller",
  ordered: "Sourced and packed",
  credited: "Sourced and packed",
  shipped: "Tracking added",
  done: "Received by the builder",
  cancelled: "Ore refunded",
};

// What the order's Ore are worth in dollars at the one internal rate, i.e. the ceiling a fulfiller has to source the item under.
export function usdBudget(priceOre: number): string {
  return (priceOre * config.economy.oreValueUsd).toFixed(2);
}

export function SafeLink({ url }: { url: string }) {
  return isSafeUrl(url) ? (
    <TextLink href={url} external className="break-all">
      {url}
    </TextLink>
  ) : (
    <span className="break-all">{url}</span>
  );
}

export { ageLabel, lastUpdated } from "@/reviewer-dash/lib/fulfillmentView";
