import { notFoundJson, reviewApi } from "@/reviewer-dash/lib/apiGuard";
import { fetchReadme } from "@/reviewer-dash/lib/commits";
import { getProject } from "@/reviewer-dash/lib/db";
import { renderMarkdown } from "@/reviewer-dash/lib/markdown";
import { canReadReviewEvidence } from "@/reviewer-dash/lib/reviewAccess";

// The README panel: the sample README, rendered by Pixl's safe markdown renderer. Nothing is fetched. A ship of the other queue answers 404.
export const GET = reviewApi<{ params: Promise<{ id: string }> }>("api.projects.readme", "reviewer", async (access, _request, { params }) => {
  const data = await getProject(Number((await params).id));
  if (!data || !canReadReviewEvidence(access, data.project)) return notFoundJson();
  const readme = await fetchReadme(data.project.repo_url);
  if (readme.error || !readme.content) return Response.json({ error: readme.error ?? "no_readme" });
  return Response.json({ html: renderMarkdown(readme.content), baseHref: readme.baseHref });
});
