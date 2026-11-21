// Pure view rules for the Toolbelt screens (.ulpi/design/profile-and-toolbelt.md, sections 3.14 to 3.16). No database, no React.
//
// API:
//   slotsView(uses, projectStatus)   -> { active, declined, emptySlots, closed, full }   what the two slots on a project page draw
//   filterTools(tools, query)        -> the tools whose title, description or maker handle contain the query (case-blind)
//   toolsCountText(total, shown, q)  -> the polite result line of the equip dialog
//   meterPercents(approved, pending) -> { done, pending } widths (0 to 100) of the gate meter against TOOLBELT_MIN_HOURS
//   handleLabel(handle)              -> "ferrite" or "a builder"
import { activeUses, EQUIP_STATUSES, TOOLBELT_MAX_PER_PROJECT, TOOLBELT_MIN_HOURS } from "./toolbelt";
import { normalizeStatus } from "./profile";

// The maker's Toolbelt users list stops here (no pagination in v1).
export const TOOLBELT_USERS_MAX = 100;
export const SLOTS_CLOSED_TEXT = "Equips are closed once a project is submitted. They open again if a reviewer asks for changes.";
export const SLOTS_FULL_TEXT = "Both slots are in use. Remove one to equip another.";

export type SlotUse = { id: string; status: string };

export function slotsView<T extends SlotUse>(uses: readonly T[], projectStatus: string) {
  const active = activeUses(uses);
  const declined = uses.filter((use) => use.status === "declined");
  const closed = !EQUIP_STATUSES.includes(normalizeStatus(projectStatus));
  return {
    active,
    declined,
    emptySlots: Math.max(0, TOOLBELT_MAX_PER_PROJECT - active.length),
    closed,
    full: active.length >= TOOLBELT_MAX_PER_PROJECT,
  };
}

export type SearchableTool = { title: string; description: string | null; ownerHandle: string | null };

export function filterTools<T extends SearchableTool>(tools: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...tools];
  return tools.filter((tool) => [tool.title, tool.description ?? "", tool.ownerHandle ?? ""].some((part) => part.toLowerCase().includes(q)));
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function toolsCountText(total: number, shown: number, query: string): string {
  if (query.trim() === "") return `${total} ${plural(total, "tool", "tools")}.`;
  if (shown === 0) return "No tools match. Clear the search.";
  return `${shown} ${plural(shown, "tool matches", "tools match")}.`;
}

export function meterPercents(approved: number, pending: number): { done: number; pending: number } {
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  const done = clamp((Math.max(0, approved) / TOOLBELT_MIN_HOURS) * 100);
  const wait = clamp((Math.max(0, pending) / TOOLBELT_MIN_HOURS) * 100);
  return { done, pending: Math.min(wait, 100 - done) };
}

export const handleLabel = (handle: string | null | undefined): string => (handle ? handle : "a builder");

// ---- Find a tool combobox (stardance-layout.md, F.3 and F.4) ----
//
//   finderReduce(state, action)     list open/closed and the active option index (-1 = none) as the keys move it
//       open        opens the list, no option active          close   closes it, no option active
//       next / prev with the option count: Down and Up. Closed: opens, Down lands on the first option, Up on the last.
//                   Open: moves one and wraps at both ends. With no options nothing moves.
//       results     the option count changed; `auto` makes a lone result active (typed query only), otherwise none is active
//   finderEscape({ open, text })    Escape once closes the list and keeps the text; Escape again clears the text
//   finderStatusText(view)          the polite status line under the field
export type FinderState = { open: boolean; active: number };
export type FinderAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "next"; count: number }
  | { type: "prev"; count: number }
  | { type: "results"; count: number; auto: boolean };

export const FINDER_CLOSED: FinderState = { open: false, active: -1 };

export function finderReduce(state: FinderState, action: FinderAction): FinderState {
  switch (action.type) {
    case "open":
      return state.open ? state : { open: true, active: -1 };
    case "close":
      return FINDER_CLOSED;
    case "next":
      if (action.count <= 0) return state.open ? state : { open: true, active: -1 };
      if (!state.open) return { open: true, active: 0 };
      return { open: true, active: (state.active + 1) % action.count };
    case "prev":
      if (action.count <= 0) return state.open ? state : { open: true, active: -1 };
      if (!state.open) return { open: true, active: action.count - 1 };
      return { open: true, active: state.active <= 0 ? action.count - 1 : state.active - 1 };
    case "results":
      return { open: state.open, active: action.auto && action.count === 1 ? 0 : -1 };
  }
}

export function finderEscape(input: { open: boolean; text: string }): { open: boolean; text: string } {
  return input.open ? { open: false, text: input.text } : { open: false, text: "" };
}

export const FINDER_EMPTY_TEXT = "No tools to equip yet. Tools show up here once other builders have an approved, open-source project.";

export type FinderView =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "results"; count: number; query: string }
  | { phase: "error" }
  | { phase: "limited" };

export function finderStatusText(view: FinderView): string {
  switch (view.phase) {
    case "idle":
      return "";
    case "loading":
      return "Searching.";
    case "error":
      return "Search is not available. Try again.";
    case "limited":
      return "Searching too fast. Wait a moment.";
    case "results":
      if (view.query.trim() === "") return view.count > 0 ? "Saved and most used tools." : "No tools to equip yet.";
      if (view.count === 0) return "No tools match. Clear the search.";
      return `${view.count} ${view.count === 1 ? "tool matches" : "tools match"}.`;
  }
}
