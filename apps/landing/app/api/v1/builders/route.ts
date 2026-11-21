import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { decodeCursor, pageOf, parseLimit } from "@/lib/platform/api-v1/query";
import { publicBuilders } from "@/lib/platform/api-v1/queries-data";
import { serializeBuilder } from "@/lib/platform/api-v1/serializers";

// Builders with a handle, by handle. Banned builders and anyone blocked either way with the key's person are left out.
// The cursor is the last handle on the previous page.
export const GET = apiRoute({ scope: "profile" }, async (call) => {
  const { searchParams } = call.url;
  const limit = parseLimit(searchParams.get("limit"));
  if (!limit.ok) return apiError(400, "bad_request", limit.message);
  const cursor = decodeCursor(searchParams.get("cursor"));
  if (!cursor.ok) return apiError(400, "bad_request", cursor.message);
  const q = (searchParams.get("q") ?? "").slice(0, 24);

  const rows = await publicBuilders(personOf(call), q, cursor.value?.k ?? null, limit.value);
  const page = pageOf(rows, limit.value, (r) => ({ k: r.handle, id: r.handle }));
  return Response.json({
    items: page.items.map(serializeBuilder),
    nextCursor: page.nextCursor,
  });
});
