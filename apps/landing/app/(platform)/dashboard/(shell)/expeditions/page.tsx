import { permanentRedirect } from "next/navigation";
import { legacyTarget } from "@/lib/platform/nav";

// Expeditions moved inside the Shop. The old address keeps working, and the filters in the query string go with it.
export default async function ExpeditionsMoved({ searchParams }: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>): Promise<never> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  }
  const text = query.toString();
  permanentRedirect((legacyTarget("/dashboard/expeditions") ?? "/dashboard/shop/expeditions") + (text ? `?${text}` : ""));
}
