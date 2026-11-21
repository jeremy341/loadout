import { notFoundJson, reviewApi } from "@/reviewer-dash/lib/apiGuard";
import { fetchCommits } from "@/reviewer-dash/lib/commits";
import { getProject } from "@/reviewer-dash/lib/db";
import { canReadReviewEvidence } from "@/reviewer-dash/lib/reviewAccess";

// "Load more commits". The sample commits all arrive on the first page, so every later page is empty. A ship of the other queue answers 404.
export const GET = reviewApi<{ params: Promise<{ id: string }> }>("api.projects.commits", "reviewer", async (access, request, { params }) => {
  const data = await getProject(Number((await params).id));
  if (!data || !canReadReviewEvidence(access, data.project)) return notFoundJson();
  const page = Number(new URL(request.url).searchParams.get("page")) || 1;
  const result = await fetchCommits(data.project.repo_url);
  return Response.json(page > 1 ? { ...result, commits: [], hasMore: false } : result);
});
