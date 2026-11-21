import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { pageOf, pagingFrom } from "@/lib/platform/api-v1/query";
import { publicProjects } from "@/lib/platform/api-v1/queries-data";
import { iso, serializePublicProject } from "@/lib/platform/api-v1/serializers";
import { TRACKS } from "@/lib/platform/progress";

const SEARCH_MAX = 80;

// Public projects, newest first. `q` searches titles, descriptions and owner handles (search words, plus track:tools and
// by:handle). Banned projects and anyone blocked either way with the key's person are left out.
export const GET = apiRoute({ scope: "projects" }, async (call) => {
  const paging = pagingFrom(call.url);
  if (!paging.ok) return apiError(400, "bad_request", paging.message);
  const { searchParams } = call.url;
  const track = searchParams.get("track");
  if (track !== null && !(TRACKS as readonly string[]).includes(track)) {
    return apiError(400, "bad_request", `track has to be one of ${TRACKS.join(", ")}.`);
  }
  const owner = searchParams.get("owner")?.trim().toLowerCase() ?? null;
  if (owner !== null && !/^[a-z][a-z0-9_-]{2,23}$/.test(owner)) return apiError(400, "bad_request", "owner has to be a handle.");
  const q = (searchParams.get("q") ?? "").slice(0, SEARCH_MAX);

  const rows = await publicProjects(personOf(call), { q, track, ownerHandle: owner }, paging.cursor, paging.limit);
  const page = pageOf(rows, paging.limit, (r) => ({ k: iso(r.createdAt) ?? "", id: r.id }));
  return Response.json({ items: page.items.map(serializePublicProject), nextCursor: page.nextCursor });
});
