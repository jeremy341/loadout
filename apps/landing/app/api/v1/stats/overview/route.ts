import { apiRoute } from "@/lib/platform/api-v1/guard";
import { latestSnapshot } from "@/lib/platform/api-v1/queries-data";
import { serializeSnapshot } from "@/lib/platform/api-v1/serializers";

// The latest overview snapshot: builders, active builders, hours logged, projects shipped. Counts only.
export const GET = apiRoute({ scope: "stats" }, async () => {
  const row = await latestSnapshot("overview");
  if (!row) return Response.json({ day: null, kind: "overview", data: null });
  return Response.json(serializeSnapshot(row.day, "overview", row.data));
});
