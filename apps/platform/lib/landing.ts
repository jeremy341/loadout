// The public site (homepage, Docs, accessibility settings) is a separate app. Set
// NEXT_PUBLIC_LANDING_URL to its origin (no path) so links leave the platform correctly; when it is
// unset the links stay relative to this host.
export function normalizeOrigin(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/+$/, "");
}

export const LANDING_URL = normalizeOrigin(process.env.NEXT_PUBLIC_LANDING_URL);

/** Absolute (or host-relative) address of a page on the public site. `path` starts with "/". */
export function landingHref(path: string, origin: string = LANDING_URL): string {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
