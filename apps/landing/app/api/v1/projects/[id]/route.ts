import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { publicProject } from "@/lib/platform/api-v1/queries-data";
import { serializePublicProject } from "@/lib/platform/api-v1/serializers";

// One public project. A project the key's person may not see answers 404, the same as a project that does not exist.
export const GET = apiRoute({ scope: "projects" }, async (call) => {
  const id = call.params.id ?? "";
  const project = await publicProject(personOf(call), id);
  if (!project) return apiError(404, "not_found", "No public project has that id.");
  return Response.json(serializePublicProject(project));
});
