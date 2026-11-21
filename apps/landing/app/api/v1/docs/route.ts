import { apiRoute } from "@/lib/platform/api-v1/guard";
import { renderDocsHtml } from "@/lib/platform/api-v1/docs-html";

// The reference page. No key needed; it has no scripts and no external files.
export const GET = apiRoute({ anonymous: true }, async () => {
  return new Response(renderDocsHtml(), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" } });
});
