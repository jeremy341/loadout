import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { pageOf, pagingFrom } from "@/lib/platform/api-v1/query";
import { publicJournal, publicProject } from "@/lib/platform/api-v1/queries-data";
import { iso, serializePublicJournal } from "@/lib/platform/api-v1/serializers";

// The journal of one public project, newest first. Entries are the builder's own words and logged hours, never reviewer notes.
export const GET = apiRoute({ scope: "journal" }, async (call) => {
  const viewer = personOf(call);
  const id = call.params.id ?? "";
  const paging = pagingFrom(call.url);
  if (!paging.ok) return apiError(400, "bad_request", paging.message);
  const project = await publicProject(viewer, id);
  if (!project) return apiError(404, "not_found", "No public project has that id.");
  const rows = await publicJournal(viewer, id, paging.cursor, paging.limit);
  const page = pageOf(rows, paging.limit, (r) => ({ k: iso(r.createdAt) ?? "", id: r.id }));
  return Response.json({ items: page.items.map(serializePublicJournal), nextCursor: page.nextCursor });
});
