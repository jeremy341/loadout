import { findItem } from "../../shell/nav-data";

/** The one-sentence purpose for a tab, straight from the navigation data so the page and the nav never disagree. */
export function navLead(slug: string): string {
  return findItem(slug)?.purpose ?? "";
}
