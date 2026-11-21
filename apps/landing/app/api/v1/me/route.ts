import { apiError, apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { ownPerson } from "@/lib/platform/api-v1/queries-data";
import { serializeSelf } from "@/lib/platform/api-v1/serializers";

// The signed-in person's own profile. Read only.
export const GET = apiRoute({ scope: "profile" }, async (call) => {
  const person = await ownPerson(personOf(call));
  if (!person) return apiError(404, "not_found", "No account was found for this key.");
  return Response.json(serializeSelf(person));
});
