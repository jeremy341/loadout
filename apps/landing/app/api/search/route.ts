import { reviewApi } from "@/reviewer-dash/lib/apiGuard";
import { can } from "@/reviewer-dash/lib/guard";
import { canReadReviewEvidence } from "@/reviewer-dash/lib/reviewAccess";
import { USERS, PROJECTS } from "@/reviewer-dash/lib/sample/index";

// The command palette's search, as Pixl's: any role may ask, builders only for the owner, ships only for a reviewer, and never a ship
// the review desk would hide (the other queue, the integrity and second-pass stages).
export const GET = reviewApi("api.search", "staff", async (access, request) => {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  if (q.length < 2) return Response.json({ players: [], projects: [] });
  const players = can(access, "owner")
    ? USERS()
        .filter((user) => user.display_name.toLowerCase().includes(q))
        .slice(0, 6)
        .map((user) => ({ id: user.id, label: user.display_name, sub: user.slack_id ?? "" }))
    : [];
  const projects = can(access, "reviewer")
    ? PROJECTS.filter((project) => (project.name.toLowerCase().includes(q) || String(project.id).includes(q)) && canReadReviewEvidence(access, project))
        .slice(0, 6)
        .map((project) => ({ id: project.id, label: project.name, sub: `#${project.id}` }))
    : [];
  return Response.json({ players, projects });
});
