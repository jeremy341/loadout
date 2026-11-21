import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { buildExport } from "@/lib/platform/privacy-data";

// Everything held about the signed-in person, as one JSON bundle. Limited to two a day per person (EXPORT_DAY), and audited
// through the key that asked. Deletion is not an API action: it is requested in Settings with a session.
export const GET = apiRoute({ scope: "export", exportLimit: true }, async (call) => {
  const bundle = await buildExport(personOf(call));
  if (!bundle) return apiError(404, "not_found", "No account was found for this key.");
  return Response.json(bundle, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="loadout-export.json"',
    },
  });
});
