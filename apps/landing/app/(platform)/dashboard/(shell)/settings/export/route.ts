import { exportLimitKey } from "@/lib/platform/api-v1/guard";
import { recordAudit } from "@/lib/platform/audit";
import { db } from "@/lib/platform/db";
import { buildExport, dataExportAudit } from "@/lib/platform/privacy-data";
import { checkLimit, RATE_LIMIT_PRESETS, rateLimitHeaders } from "@/lib/platform/rate-limit-db";
import { readViewer } from "@/lib/platform/session";

export const dynamic = "force-dynamic";

// "Download my data" on the Settings page. A signed-in session only (no API key), two downloads a day across the site and the
// API together, never cached. Every download is audited.
export async function GET() {
  const viewer = await readViewer();
  if (!viewer) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const limit = await checkLimit({ key: exportLimitKey(viewer.id), ...RATE_LIMIT_PRESETS.EXPORT_DAY });
  if (!limit.ok) {
    return new Response("You can download your data twice a day. Try again tomorrow.", {
      status: 429,
      headers: { ...rateLimitHeaders(limit), "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const bundle = await buildExport(viewer.id);
  if (!bundle) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  await recordAudit(db(), dataExportAudit(viewer.id, "settings", viewer.impersonation?.actorId ?? viewer.id));

  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      ...rateLimitHeaders(limit),
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="loadout-data-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
