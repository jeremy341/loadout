import type { GlyphName } from "@hackclub/icons";
import type { NavModel } from "./nav";
import { searchIsAbsent } from "./searchProbe";

// Pure pieces of the command palette: turning the nav and the /api/search answer into result rows, and moving the cursor.
export interface BuilderHit {
  id: string;
  label: string;
  sub: string;
}
export interface ProjectHit {
  id: number;
  label: string;
  sub?: string;
}
export interface Hit {
  href: string;
  label: string;
  sub?: string;
  group: string;
  glyph: GlyphName;
}

export const MIN_TERM_LENGTH = 2;

/** The nav pages whose label contains the term (all of them for an empty term), as result rows. */
export function pageHits(nav: NavModel, term: string): Hit[] {
  const ql = term.trim().toLowerCase();
  return [
    ...nav.primary.map((item) => ({ ...item, group: "Pages" })),
    ...nav.groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label }))),
  ]
    .filter((item) => !ql || item.label.toLowerCase().includes(ql))
    .map(({ href, label, group, glyph }) => ({ href, label, group, glyph }));
}

export function builderHit(p: BuilderHit): Hit {
  return { href: `/players/${p.id}`, label: p.label, sub: p.sub, group: "Builders", glyph: "person" };
}

export function projectHit(p: ProjectHit): Hit {
  return { href: `/projects/${p.id}`, label: p.label, sub: p.sub, group: "Projects", glyph: "rep" };
}

export function combineHits(pages: Hit[], builders: BuilderHit[], projects: ProjectHit[]): Hit[] {
  return [...pages, ...builders.map(builderHit), ...projects.map(projectHit)];
}

/** The cursor after an arrow key; any other key leaves it where it is. */
export function moveCursor(key: string, cursor: number, count: number): number {
  if (key === "ArrowDown") return Math.min(cursor + 1, count - 1);
  if (key === "ArrowUp") return Math.max(cursor - 1, 0);
  return cursor;
}

export function isArrowKey(key: string): boolean {
  return key === "ArrowDown" || key === "ArrowUp";
}

/** True when the group heading should be drawn above the row at `index`. */
export function startsGroup(hits: Hit[], index: number): boolean {
  return index === 0 || hits[index - 1].group !== hits[index].group;
}

interface SearchBody {
  builders?: BuilderHit[];
  players?: BuilderHit[];
  projects?: ProjectHit[];
}

export interface RemoteHits {
  builders: BuilderHit[];
  projects: ProjectHit[];
}

export type RemoteResult =
  | { kind: "hits"; hits: RemoteHits }
  | { kind: "absent" } // the endpoint is not there: stop asking
  | { kind: "skip" }; // a bad moment (500, rate limit): keep the old rows and try on the next keystroke

export const NO_REMOTE_HITS: RemoteHits = { builders: [], projects: [] };

// The endpoint's key is still "players" (Pixl's name); "builders" is read first so the endpoint can be renamed.
export function parseSearchBody(d: SearchBody): RemoteHits {
  return { builders: d.builders ?? d.players ?? [], projects: d.projects ?? [] };
}

export function isAbortError(err: unknown): boolean {
  return (err as { name?: string } | null)?.name === "AbortError";
}

// 401, 403 and 404 all mean this desk cannot answer; so does a body that is not JSON (the 404 page is HTML).
async function readResult(res: Response): Promise<RemoteResult> {
  const contentType = res.headers.get("content-type");
  const isJson = (contentType ?? "").includes("json");
  if (res.ok && isJson) return { kind: "hits", hits: parseSearchBody((await res.json()) as SearchBody) };
  return searchIsAbsent({ ok: res.ok, status: res.status, contentType }) ? { kind: "absent" } : { kind: "skip" };
}

/** Asks /api/search for builders and projects. A failure that is not an abort counts as the endpoint being absent. */
export async function fetchRemoteHits(term: string, signal: AbortSignal): Promise<RemoteResult | null> {
  try {
    return await readResult(await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal }));
  } catch (err) {
    return isAbortError(err) ? null : { kind: "absent" };
  }
}
