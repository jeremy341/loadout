// GET /platform-explore : the next page of the Explore feed for the signed-in builder.
//
// Query parameters
//   q       search text (words, track:tools, by:handle), max 80 characters
//   track   tools | systems | compute | hardware
//   saved   "1" or "true": only projects the viewer saved
//   cursor  from the previous response's `next` ("c21"); anything else is the first page
// Response 200: { cards: FeedCard[] (21 at most), total: number, next: string | null }  Cache-Control: no-store
//   Same visibility as searchProjects (approved, not hidden, owner not banned). Cards carry handles only: no email, no name.
// Errors (plain text): 404 no signed-in viewer (the platform's usual closed answer), 429 more than 30 requests in 10 seconds
// (shared with /platform-search; Retry-After set).
import { NextResponse } from "next/server";
import { decodeCursor } from "@/lib/platform/explore-feed";
import { loadFeedPage } from "@/lib/platform/explore-feed-data";
import { parseExploreParams } from "@/lib/platform/explore";
import { searchLimiter } from "@/lib/platform/rate-limit";
import { readViewer } from "@/lib/platform/session";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };
const plain = (status: number, text: string, extra: Record<string, string> = {}) =>
  new Response(text, { status, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", ...extra } });

export async function GET(request: Request) {
  const viewer = await readViewer();
  if (!viewer) return plain(404, "Not found");

  const limited = searchLimiter.check(viewer.id);
  if (!limited.ok) return plain(429, "Too many requests. Wait a moment.", { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) });

  const params = new URL(request.url).searchParams;
  const { q, track, saved } = parseExploreParams({
    q: params.get("q") ?? undefined,
    track: params.get("track") ?? undefined,
    saved: params.get("saved") ?? undefined,
  });
  const result = await loadFeedPage(viewer.id, { q, track, saved }, decodeCursor(params.get("cursor")));
  return NextResponse.json(result, { headers });
}
