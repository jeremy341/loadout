// Pure Toolbelt rules (plans/proposals/toolbelt.md, 14 Nov 2026). No database; every function has a bun test.
//
// API:
//   canEquip({ equipper, project, tool, existingUses, blocks }) -> { ok: true } | { ok: false, code, reason }
//   checkUseNote(raw)     -> { ok, note } | { ok: false, message }   10 to 500 characters naming a file or feature
//   gateConditions(project, hours, uses?) -> GateView                the four significant-use conditions for the gate card
//   usedByCount(uses)     -> number                                   confirmed uses only
//   activeUses(uses)      -> pending and confirmed uses
//   pendingToDecline(uses) -> ids of pending uses a block marks declined
//   canRemoveUse(status), checkBlockTarget(makerId, blockedId), publicToolUses(rows)
//
// The reward numbers are PROVISIONAL (the owner has not confirmed them in Plan 02). Show them as provisional and never as a
// promise: nothing is paid by the platform yet.
import { isPublicProject, normalizeStatus } from "./profile";

export const TOOLBELT_MAX_PER_PROJECT = 2;
export const TOOLBELT_MIN_HOURS = 25;
// PROVISIONAL reward values (Ore). Display only, with a provisional label.
export const TOOLBELT_USER_ORE = 50;
export const TOOLBELT_MAKER_ORE = 10;
export const TOOLBELT_MAKER_CAP_ORE = 500;
export const USE_NOTE_MIN = 10;
export const USE_NOTE_MAX = 500;
// A project can equip tools only in these states; once submitted the equipping is part of what is reviewed.
export const EQUIP_STATUSES: readonly string[] = ["draft", "logging", "needs-changes"];

export type UseStatus = "pending" | "confirmed" | "declined";
export type ToolbeltUseLike = { projectId: string; toolId: string; status: string };
export type ToolbeltBlockLike = { makerId: string; blockedId: string };

export type EquipInput = {
  // The signed-in builder.
  equipper: { id: string };
  // The builder's own project that would equip the tool.
  project: { id: string; ownerId: string; status: string };
  // The approved project that would be equipped.
  tool: { id: string; ownerId: string; status: string; hidden: boolean; repoUrl: string | null };
  existingUses: readonly ToolbeltUseLike[];
  blocks: readonly ToolbeltBlockLike[];
};

export type EquipCode =
  | "not-your-project"
  | "project-status"
  | "own-tool"
  | "not-approved"
  | "hidden"
  | "not-open-source"
  | "blocked"
  | "duplicate"
  | "limit";

export type EquipResult = { ok: true } | { ok: false; code: EquipCode; reason: string };

export const activeUses = <T extends Pick<ToolbeltUseLike, "status">>(uses: readonly T[]): T[] =>
  uses.filter((use) => use.status === "pending" || use.status === "confirmed");

const no = (code: EquipCode, reason: string): EquipResult => ({ ok: false, code, reason });

export function canEquip(input: EquipInput): EquipResult {
  const { equipper, project, tool, existingUses, blocks } = input;
  if (project.ownerId !== equipper.id) return no("not-your-project", "You can only equip tools into your own projects.");
  if (!EQUIP_STATUSES.includes(normalizeStatus(project.status))) {
    return no("project-status", "Tools can be equipped while a project is a draft, being logged, or sent back for changes.");
  }
  if (tool.ownerId === equipper.id || tool.id === project.id) return no("own-tool", "You can't equip your own project.");
  if (normalizeStatus(tool.status) !== "approved") return no("not-approved", "Only an approved project can be equipped.");
  if (tool.hidden) return no("hidden", "That project is not available to equip.");
  if (!tool.repoUrl) return no("not-open-source", "Only open-source projects with a public source link can be equipped.");
  if (blocks.some((block) => block.makerId === tool.ownerId && block.blockedId === equipper.id)) {
    return no("blocked", "The maker of that project is not accepting new users.");
  }
  const mine = activeUses(existingUses.filter((use) => use.projectId === project.id));
  if (mine.some((use) => use.toolId === tool.id)) return no("duplicate", "That tool is already equipped in this project.");
  if (mine.length >= TOOLBELT_MAX_PER_PROJECT) {
    return no("limit", `A project can equip up to ${TOOLBELT_MAX_PER_PROJECT} tools. Remove one first.`);
  }
  return { ok: true };
}

// ---- Use note ----

export const NOTE_HINT = 'Say where it is used, for example "the export feature calls parse() in src/render.ts".';

// A path with a slash, or a file name with a known extension.
const FILE_OR_PATH =
  /(?:[\w.-]+\/[\w./-]+|\b[\w-]+\.(?:[cm]?[jt]sx?|py|rs|go|c|cc|cpp|h|hpp|cs|java|kt|swift|rb|php|lua|ino|md|json|toml|ya?ml|html|css|scss|sh|sql|v|vhd|scad|stl|kicad_pcb|sch)\b)/i;
// A word that names a part of a program.
const FEATURE_WORD =
  /\b(?:feature|module|function|component|library|command|endpoint|api|parser|renderer|script|class|page|screen|plugin|cli|build|pipeline|loader|server|client|driver|firmware|shader|backend|frontend|menu|export|import|input|output|simulation|tests?)\b/i;

export type NoteResult = { ok: true; note: string } | { ok: false; message: string };

export function checkUseNote(raw: unknown): NoteResult {
  const note = (typeof raw === "string" ? raw : "").replace(/\s+/g, " ").trim();
  if (note.length < USE_NOTE_MIN) return { ok: false, message: `Write at least ${USE_NOTE_MIN} characters. ${NOTE_HINT}` };
  if (note.length > USE_NOTE_MAX) return { ok: false, message: `Keep the note to ${USE_NOTE_MAX} characters or fewer.` };
  if (!FILE_OR_PATH.test(note) && !FEATURE_WORD.test(note)) return { ok: false, message: `Name the file or feature that uses it. ${NOTE_HINT}` };
  return { ok: true, note };
}

// ---- Gate card ----

export type GateState = "met" | "unmet" | "review";
export type GateCondition = { key: "hours" | "core-use" | "journal" | "review"; label: string; state: GateState; detail: string };
export type GateView = {
  hoursNeeded: number;
  hoursApproved: number;
  conditions: GateCondition[];
  // Always false here: a reviewer confirms the gate, which is not built yet.
  confirmed: false;
};

// The four conditions of the significant-use gate for one equipping project. hours are the project's approved hours (the
// platform still shows sample hours until the ledger exists, so the caller labels them). uses are that project's uses.
export function gateConditions(project: { id: string }, hours: { approved: number }, uses: readonly Pick<ToolbeltUseLike, "status">[] = []): GateView {
  void project;
  const approved = Math.max(0, hours.approved);
  const named = activeUses(uses).length > 0;
  return {
    hoursNeeded: TOOLBELT_MIN_HOURS,
    hoursApproved: approved,
    confirmed: false,
    conditions: [
      {
        key: "hours",
        label: `${TOOLBELT_MIN_HOURS} approved hours`,
        state: approved >= TOOLBELT_MIN_HOURS ? "met" : "unmet",
        detail: `${approved} of ${TOOLBELT_MIN_HOURS} approved hours on this project.`,
      },
      {
        key: "core-use",
        label: "Used in a core part",
        state: named ? "met" : "unmet",
        detail: named ? "Your use note names where the tool is used." : "Equip a tool and name the file or feature that uses it.",
      },
      { key: "journal", label: "Journal shows real use", state: "review", detail: "Say what the tool did in your journal entries, not only that you used it." },
      { key: "review", label: "A reviewer confirms", state: "review", detail: "A reviewer checks the journal at review. Nothing counts before then." },
    ],
  };
}

// Confirmed uses only: pending and declined do not count.
export function usedByCount(uses: readonly Pick<ToolbeltUseLike, "status">[]): number {
  return uses.filter((use) => use.status === "confirmed").length;
}

// A maker blocking a builder declines that builder's pending uses of the maker's tools. Confirmed ones stay (they passed review).
export function pendingToDecline<T extends { id: string; status: string }>(uses: readonly T[]): string[] {
  return uses.filter((use) => use.status === "pending").map((use) => use.id);
}

// A builder can remove a pending or declined use. A confirmed one passed review and stays on the record.
export function canRemoveUse(status: string): { ok: true } | { ok: false; reason: string } {
  return status === "confirmed"
    ? { ok: false, reason: "A confirmed use has been reviewed, so it can't be removed here." }
    : { ok: true };
}

export function checkBlockTarget(makerId: string, blockedId: string): { ok: true } | { ok: false; reason: string } {
  if (!blockedId) return { ok: false, reason: "Choose a builder to block." };
  if (makerId === blockedId) return { ok: false, reason: "You can't block yourself." };
  return { ok: true };
}

type Visible = { status: string; hidden: boolean; showBuilding: boolean };
// Public Toolbelt rows (the "Toolbelt" section of a profile and the "used by" list on Explore): confirmed uses where the equipping
// project and the tool are both public. A hidden project or a draft never leaks through a use.
export function publicToolUses<T extends { status: string; project: Visible; tool: Visible }>(uses: readonly T[]): T[] {
  return uses.filter((use) => use.status === "confirmed" && isPublicProject(use.project) && isPublicProject(use.tool));
}
