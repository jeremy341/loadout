import { notFoundJson, reviewApi } from "@/reviewer-dash/lib/apiGuard";
import { fetchCommitDiff } from "@/reviewer-dash/lib/commits";
import { getProject } from "@/reviewer-dash/lib/db";
import { canReadReviewEvidence } from "@/reviewer-dash/lib/reviewAccess";

// One commit's diff. The samples have no diffs, so the panel says the host does not expose them. A ship of the other queue answers 404.
export const GET = reviewApi<{ params: Promise<{ id: string; sha: string }> }>("api.projects.commitDiff", "reviewer", async (access, _request, { params }) => {
  const { id, sha } = await params;
  const data = await getProject(Number(id));
  if (!data || !canReadReviewEvidence(access, data.project)) return notFoundJson();
  return Response.json(await fetchCommitDiff(data.project.repo_url, sha));
});
