import { apiRoute } from "@/lib/platform/api-v1/guard";
import { OPENAPI_YAML } from "@/lib/platform/api-v1/openapi";

// The OpenAPI document as YAML. No key needed: it describes the API and holds nothing about anyone.
export const GET = apiRoute({ anonymous: true }, async () => {
  return new Response(OPENAPI_YAML, { headers: { "Content-Type": "text/yaml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
});
