import { NAV_GROUPS, findItem } from "../components/shell/nav-data";

/** The first path segment, which is the section slug ("/projects/new" gives "projects"). Null at the root. */
export function activeSlugFromPathname(pathname: string | null | undefined): string | null {
  const segment = (pathname ?? "").split("/").find((part) => part.length > 0);
  return segment ? segment.toLowerCase() : null;
}

/** The label of the section a pathname belongs to, or null when it is not a known section. */
export function sectionLabelFromPathname(pathname: string | null | undefined): string | null {
  const slug = activeSlugFromPathname(pathname);
  return slug ? (findItem(slug)?.label ?? null) : null;
}

/** The label of the nav group a slug sits in (Build, Community, Gear or You). */
export function groupLabelForSlug(slug: string): string | null {
  return NAV_GROUPS.find((group) => group.items.some((item) => item.slug === slug))?.label ?? null;
}

/** A DOM-safe id fragment for a group label. */
export function groupId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
