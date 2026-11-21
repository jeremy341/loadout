// GET /platform-search : project search for the signed-in builder (Explore and the Toolbelt equip dialog).
//
// Query parameters
//   q          search text (see lib/platform/search.ts: words, track:tools, by:handle), max 80 characters
//   scope      "explore" (default) or "toolbelt"
//   projectId  required for scope=toolbelt: the viewer's own project that would equip a tool
//   track      tools | systems | compute | hardware (explore only)
//   saved      "1" or "true": only projects the viewer saved (explore only)
//   limit      1 to 30, default 8
//   offset     default 0
//   blocked    "1": toolbelt only, also return tools that can't be equipped, each with equip.reason
// Response 200: { rows: SearchRow[] (EquipRow[] for toolbelt), total: number, unavailable?: string | null }  Cache-Control: no-store
// Errors (plain text): 404 no signed-in viewer (the platform's usual closed answer), 400 toolbelt without projectId,
// 429 more than 30 requests in 10 seconds (Retry-After set).
import { NextResponse } from "next/server";
import { searchEquippableTools, searchProjects } from "@/lib/platform/discover-data";
import { searchLimiter } from "@/lib/platform/rate-limit";
import { readViewer } from "@/lib/platform/session";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };
const plain = (status: number, text: string, extra: Record<string, string> = {}) =>
  new Response(text, { status, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", ...extra } });

const number = (value: string | null): number | undefined => {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};
const on = (value: string | null) => value === "1" || value === "true";

export async function GET(request: Request) {
  const viewer = await readViewer();
  if (!viewer) return plain(404, "Not found");

  const limited = searchLimiter.check(viewer.id);
  if (!limited.ok) return plain(429, "Too many searches. Wait a moment.", { "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)) });

  const params = new URL(request.url).searchParams;
  const q = params.get("q") ?? "";
  const limit = number(params.get("limit"));
  const offset = number(params.get("offset"));

  if (params.get("scope") === "toolbelt") {
    const projectId = params.get("projectId");
    if (!projectId) return plain(400, "Missing projectId.");
    const result = await searchEquippableTools(viewer.id, projectId, q, { includeBlocked: on(params.get("blocked")), limit, offset });
    return NextResponse.json(result, { headers });
  }

  const result = await searchProjects(viewer.id, {
    q,
    track: params.get("track"),
    savedOnly: on(params.get("saved")),
    limit,
    offset,
  });
  return NextResponse.json(result, { headers });
}
