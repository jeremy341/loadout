import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { pageOf, pagingFrom } from "@/lib/platform/api-v1/query";
import { ownProjects } from "@/lib/platform/api-v1/queries-data";
import { iso, serializeOwnProject } from "@/lib/platform/api-v1/serializers";

// The signed-in person's own projects, newest first. Read only.
export const GET = apiRoute({ scope: "projects" }, async (call) => {
  const paging = pagingFrom(call.url);
  if (!paging.ok) return apiError(400, "bad_request", paging.message);
  const rows = await ownProjects(personOf(call), paging.cursor, paging.limit);
  const page = pageOf(rows, paging.limit, (r) => ({ k: iso(r.createdAt) ?? "", id: r.id }));
  return Response.json({ items: page.items.map(serializeOwnProject), nextCursor: page.nextCursor });
});
