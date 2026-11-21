import { apiError, apiRoute } from "@/lib/platform/api-v1/guard";
import { parseDayWindow } from "@/lib/platform/api-v1/query";
import { snapshotsBetween } from "@/lib/platform/api-v1/queries-data";
import { serializeSnapshot } from "@/lib/platform/api-v1/serializers";

const KINDS = ["overview", "tracks"] as const;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 366;

// The history of a snapshot kind, one row per day that was written. Leaderboards are not here: they carry handles and have their
// own route.
export const GET = apiRoute({ scope: "stats" }, async (call) => {
  const { searchParams } = call.url;
  const kind = searchParams.get("kind") ?? "overview";
  if (!(KINDS as readonly string[]).includes(kind)) return apiError(400, "bad_request", "kind has to be overview or tracks.");
  const window = parseDayWindow(searchParams.get("from"), searchParams.get("to"), { defaultDays: DEFAULT_DAYS, maxDays: MAX_DAYS }, new Date());
  if (!window.ok) return apiError(400, "bad_request", window.message);
  const rows = await snapshotsBetween(kind, window.from, window.to);
  return Response.json({
    kind,
    from: window.from,
    to: window.to,
    days: rows.map((row) => serializeSnapshot(row.day, kind, row.data)),
  });
});
