import { apiRoute } from "@/lib/platform/api-v1/guard";
import { latestSnapshot } from "@/lib/platform/api-v1/queries-data";
import { serializeSnapshot } from "@/lib/platform/api-v1/serializers";

// The latest tracks snapshot: hours and builders per track. Counts only.
export const GET = apiRoute({ scope: "stats" }, async () => {
  const row = await latestSnapshot("tracks");
  if (!row) return Response.json({ day: null, kind: "tracks", data: null });
  return Response.json(serializeSnapshot(row.day, "tracks", row.data));
});
