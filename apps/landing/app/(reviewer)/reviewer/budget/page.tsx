import { requirePage } from "@/reviewer-dash/lib/guard";
import { BudgetView } from "./BudgetView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Budget" };

// LOADOUT's figures come from lib/reviewer/budget.ts (platform $300 for the 80-day run, the Ore builders hold, open orders), not from
// a ledger: they are planning figures and none is live.
export default async function BudgetPage() {
  await requirePage("owner");
  return <BudgetView />;
}
