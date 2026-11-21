import { sumByTrack } from "@/lib/platform/hackatime/hours";
import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { ownHackatimeTracks, ownHoursWindow } from "@/lib/platform/api-v1/queries-data";
import { parseDayWindow } from "@/lib/platform/api-v1/query";
import { hourSeries, sumSecondsByName } from "@/lib/platform/api-v1/views";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 366;

// The signed-in person's coded hours from Hackatime, by day or week, with the per-project and per-track totals of the window.
// Hackatime hours are coded time, not approved hours. With no Hackatime link the arrays are empty and source is "none".
export const GET = apiRoute({ scope: "hours" }, async (call) => {
  const { searchParams } = call.url;
  const window = parseDayWindow(searchParams.get("from"), searchParams.get("to"), { defaultDays: DEFAULT_DAYS, maxDays: MAX_DAYS }, new Date());
  if (!window.ok) return apiError(400, "bad_request", window.message);
  const bucket = searchParams.get("bucket") ?? "day";
  if (bucket !== "day" && bucket !== "week") return apiError(400, "bad_request", "bucket has to be day or week.");

  const data = await ownHoursWindow(personOf(call), window.from, window.to);
  const totalSeconds = data.rows.reduce((sum, r) => sum + r.seconds, 0);
  const perDay = data.rows.map((r) => ({ day: r.day, seconds: r.seconds }));
  const byProject = sumSecondsByName(data.rows.map((r) => ({ name: r.name, seconds: r.seconds })));
  const trackOf = data.linked ? await ownHackatimeTracks(personOf(call)) : new Map<string, string | null>();
  const byTrack = sumByTrack(
    data.rows.map((r) => ({ name: r.name, seconds: r.seconds })),
    trackOf,
  );

  return Response.json({
    source: data.linked ? "hackatime" : "none",
    from: window.from,
    to: window.to,
    bucket,
    totalSeconds,
    series: data.linked ? hourSeries(perDay, bucket) : [],
    byProject: data.linked ? byProject.map((p) => ({ name: p.name === "" ? null : p.name, seconds: p.seconds })) : [],
    byTrack: data.linked ? byTrack : [],
    lastSyncAt: data.lastSyncAt?.toISOString() ?? null,
    lastStatus: data.lastStatus,
  });
});
