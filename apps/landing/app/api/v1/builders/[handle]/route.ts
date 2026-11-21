import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { publicBuilder } from "@/lib/platform/api-v1/queries-data";
import { serializeBuilder } from "@/lib/platform/api-v1/serializers";

// One builder's public profile and how many public projects they have. Blocked either way with the key's person is a 404.
export const GET = apiRoute({ scope: "profile" }, async (call) => {
  const handle = (call.params.handle ?? "").toLowerCase();
  const found = await publicBuilder(personOf(call), handle);
  if (!found) return apiError(404, "not_found", "No builder has that handle.");
  return Response.json({ ...serializeBuilder(found.person), projectCount: found.projectCount });
});
