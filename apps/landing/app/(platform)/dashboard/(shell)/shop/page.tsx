import type { Metadata } from "next";
import { EmptyState } from "@/app/_components/platform/PlatformNotice";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Shop - LOADOUT" };

export default async function ShopPage() {
  await requireViewer();
  return (
    <>
      <h1 className="pf-sr">Shop</h1>
      <p className="pf-lead">Requisitions, your Ore and your orders.</p>
      <EmptyState title="Opens in a later release">
        The shop opens once the catalog and Ore are connected. Nothing is for sale yet.
      </EmptyState>
    </>
  );
}
