// The public origin of this deployment, such as https://loadout.dino.icu. Behind a reverse proxy, request.url reflects the
// address Next.js binds to (http://localhost:3001 on the Nest host), not the host the person typed. Any redirect built from
// request.url therefore sends people to localhost. This helper prefers the configured origin and falls back to the request
// only when nothing is configured (local development).

function originOf(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

export function publicOrigin(request: Request, env: NodeJS.ProcessEnv = process.env): string {
  return originOf(env.NEXT_PUBLIC_LOADOUT_SITE_URL) ?? originOf(env.HCA_REDIRECT_URI) ?? new URL(request.url).origin;
}

export function publicUrl(request: Request, path: string, env: NodeJS.ProcessEnv = process.env): URL {
  return new URL(path, publicOrigin(request, env));
}
