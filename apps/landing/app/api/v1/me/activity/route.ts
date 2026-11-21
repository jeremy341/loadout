import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { parseDayWindow } from "@/lib/platform/api-v1/query";
import { ownJournalWindow } from "@/lib/platform/api-v1/queries-data";
import { activityDays } from "@/lib/platform/api-v1/views";

const DEFAULT_DAYS = 90;
const MAX_DAYS = 366;

// Daily logged hours (self-reported journal time, never approved hours) for the signed-in person. Every day in the window is
// listed, zero where nothing was logged. Days use the same grace rule as the profile heatmap, in UTC.
export const GET = apiRoute({ scope: "activity" }, async (call) => {
  const window = parseDayWindow(call.url.searchParams.get("from"), call.url.searchParams.get("to"), { defaultDays: DEFAULT_DAYS, maxDays: MAX_DAYS }, new Date());
  if (!window.ok) return apiError(400, "bad_request", window.message);
  const entries = await ownJournalWindow(personOf(call), window.from, window.to);
  const days = activityDays(entries, window.from, window.to).map((d) => ({ day: d.day, loggedHours: d.hours }));
  return Response.json({ from: window.from, to: window.to, timezone: "UTC", days });
});
