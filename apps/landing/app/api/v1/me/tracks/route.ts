import { apiRoute, personOf } from "@/lib/platform/api-v1/guard";
import { ownTrackProjects } from "@/lib/platform/api-v1/queries-data";
import { serializeTrackLevel } from "@/lib/platform/api-v1/serializers";
import { trackLevelRows } from "@/lib/platform/api-v1/views";

// The signed-in person's level and discount on each track. Levels come from APPROVED hours (project time the reviewers kept),
// the same numbers the site shows. Hackatime coded hours do not move a level. It needs the profile scope, not hours: the hours scope
// is for coded hours (/me/hours), and a level is a fact about the person.
export const GET = apiRoute({ scope: "profile" }, async (call) => {
  const projects = await ownTrackProjects(personOf(call));
  return Response.json({ tracks: trackLevelRows(projects).map(serializeTrackLevel) });
});
