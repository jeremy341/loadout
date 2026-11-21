import { apiError, apiRoute } from "@/lib/platform/api-v1/guard";
import { latestSnapshot, visibleStatsPeople } from "@/lib/platform/api-v1/queries-data";
import { LEADERBOARD_SIZE } from "@/lib/platform/stats";

// Hours leaderboard, handle and hours only, at most 50. Only people who turned statsVisible on are listed. The snapshot is
// written nightly, but visibility is checked on every read, so turning it off takes effect at once.
export const GET = apiRoute({ scope: "stats" }, async (call) => {
  const window = call.url.searchParams.get("window") ?? "week";
  if (window !== "week" && window !== "all") return apiError(400, "bad_request", "window has to be week or all.");

  const row = await latestSnapshot(`leaderboard-${window}`);
  const stored = (row?.data as { rows?: { personId: string; hours: number }[] } | undefined)?.rows ?? [];
  const visible = await visibleStatsPeople(stored.map((r) => r.personId));
  const items = stored
    .filter((r) => visible.has(r.personId))
    .slice(0, LEADERBOARD_SIZE)
    .map((r, index) => ({ rank: index + 1, handle: visible.get(r.personId) ?? "", hours: r.hours }));
  return Response.json({ window, asOf: row ? row.day.toISOString().slice(0, 10) : null, items });
});
