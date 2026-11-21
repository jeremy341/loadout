// Pure rules for the tab row on an owner's project page: the tabs, which one an address opens, and the line about ship checks.
// No database, no framework; every function has a bun test (project-tabs.test.ts).
//
// API:
//   PROJECT_TABS          the four tabs in order: Journal (default), Ship, Toolbelt, Settings
//   parseProjectTab(raw)  -> the tab key an address opens; unknown or missing falls back to Journal.
//   projectTabHref(base, tab) -> address of a tab; the default tab has no query
//   shipChecksLeft(items) -> how many checks are failing (waiting ones never block, so they are not counted)
//   shipChecksLine(left)  -> the one short line the Journal tab shows, or null when nothing is left
export const PROJECT_TABS = [
  { key: "journal", label: "Journal" },
  { key: "ship", label: "Ship" },
  { key: "toolbelt", label: "Toolbelt" },
  { key: "settings", label: "Settings" },
] as const;
export type ProjectTabKey = (typeof PROJECT_TABS)[number]["key"];
export const DEFAULT_PROJECT_TAB: ProjectTabKey = "journal";

const first = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));

export function parseProjectTab(raw: string | string[] | undefined): ProjectTabKey {
  const tab = first(raw).trim().toLowerCase();
  return PROJECT_TABS.find((item) => item.key === tab)?.key ?? DEFAULT_PROJECT_TAB;
}

export const projectTabHref = (base: string, tab: ProjectTabKey): string => (tab === DEFAULT_PROJECT_TAB ? base : `${base}?tab=${tab}`);

export function shipChecksLeft(items: readonly { state: "pass" | "fail" | "waiting" }[]): number {
  return items.filter((item) => item.state === "fail").length;
}

export function shipChecksLine(left: number): string | null {
  if (!Number.isFinite(left) || left <= 0) return null;
  return left === 1 ? "1 ship check left." : `${left} ship checks left.`;
}
