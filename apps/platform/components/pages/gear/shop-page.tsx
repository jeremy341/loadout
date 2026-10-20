"use client";

import { useState } from "react";
import { useOre } from "../../../lib/ore-ledger";
import { PageHeader, PreviewNote, Stat, Status } from "../../ui/ui";
import { navLead } from "./gear-nav";
import { addSampleOreNow, useGearProfile, useTickets, useWishlist } from "./gear-store";
import { GearTabs, PreviewTools, ProfilePanel, useAnnounce, formatOre } from "./gear-ui";
import { CatalogTab } from "./shop-catalog";
import { CustomOrderTab } from "./shop-custom";
import { RequisitionsTab } from "./shop-requisitions";
import { SHOP_ITEMS } from "./data";

// Plans/02 sections 26 to 28 own the rules. Every item, price and Requisition value here is sample data; the
// constants are in data.ts and the pure pricing rules in logic/pricing.ts.

export function ShopPage() {
  const ore = useOre();
  const { track } = useGearProfile();
  const { available } = useTickets();
  const wishlist = useWishlist();
  const [tab, setTab] = useState("catalog");
  const [message, announce] = useAnnounce();

  return (
    <>
      <PageHeader eyebrow="Gear" title="Shop" lead={navLead("shop")} />
      <PreviewNote>
        Every item and price here is a sample, and orders are preview orders saved in this browser. Ore is spent for real in the preview ledger, so the balance, Orders and Wishlist stay consistent. Nothing is sent to LOADOUT.
      </PreviewNote>

      <div className="gr-stack">
        <div className="gr-bar">
          <Stat label="Your Ore" value={ore.balance.toLocaleString("en-GB")} hint="Balance in the Ore ledger" />
          <Stat label="Main track" value={track} hint={`${available.length} Requisition${available.length === 1 ? "" : "s"} available`} />
          <Stat label="Wishlist" value={wishlist.list.length} hint="Saved sample items" />
        </div>
        <ProfilePanel />
        <PreviewTools level={2} hint="Nothing earns Ore in the preview yet. Add sample Ore through the shared ledger to try buying, then cancel an order to see the refund.">
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              const entry = addSampleOreNow(250);
              announce(entry ? `Added ${formatOre(250)} of sample Ore.` : "Could not add sample Ore.");
            }}
          >
            Add 250 sample Ore
          </button>
        </PreviewTools>
        <Status message={message} />
        <GearTabs
          label="Shop sections"
          value={tab}
          onChange={setTab}
          tabs={[
            {
              id: "catalog",
              label: "Catalog",
              count: SHOP_ITEMS.length,
              panel: (
                <>
                  <h2 className="sr-only">Catalog</h2>
                  <CatalogTab balance={ore.balance} announce={announce} />
                </>
              ),
            },
            { id: "requisitions", label: "Requisitions", count: available.length, panel: <RequisitionsTab announce={announce} /> },
            { id: "custom", label: "Custom Order", panel: <CustomOrderTab announce={announce} /> },
          ]}
        />
      </div>
    </>
  );
}
