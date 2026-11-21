import { permanentRedirect } from "next/navigation";
import { legacyTarget } from "@/lib/platform/nav";

// A mission page moved inside the Shop with its id.
export default async function MissionMoved({ params }: Readonly<{ params: Promise<{ id: string }> }>): Promise<never> {
  const { id } = await params;
  permanentRedirect(legacyTarget(`/dashboard/expeditions/${encodeURIComponent(id)}`) ?? "/dashboard/shop/expeditions");
}
