import { permanentRedirect } from "next/navigation";
import { legacyTarget } from "@/lib/platform/nav";

// The Overview page is gone (owner, 16 Nov 2026). Its Next up strip and the four track levels live at the top of Projects, so the
// dashboard address goes there with a permanent redirect. The Ore card and the latest lists were copies of Projects and the Ledger
// and were dropped; the Ore chip in the top bar still opens the Ledger.
export default function DashboardHome() {
  permanentRedirect(legacyTarget("/dashboard") ?? "/dashboard/projects");
}
