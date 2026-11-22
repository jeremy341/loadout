// Reviewer macros: a short `/trigger` typed in a note to a builder expands to canned text. Pure rules, no database.
// Owners edit the saved list; the built-in list is the fallback so the desk never has an empty set.
//
// API:
//   MACRO_TRIGGER_PATTERN               /^\/[a-z][a-z0-9-]{1,23}$/
//   MACRO_BODY_MAX = 1000
//   BUILT_IN_MACROS                     the starting set (includes "/track", "does not fit the track")
//   validateMacro(raw, existing)        -> { ok: true, macro } | { ok: false, message }; triggers are unique, case-insensitive
//   expandMacros(text, macros)          -> string; replaces only known triggers that stand alone, leaves the rest alone
//   insertMacro(text, caret, macro)     -> { text, caret }; a partly typed trigger before the caret is replaced by the body
import { cleanPlainText } from "./text";

export const MACRO_TRIGGER_PATTERN = /^\/[a-z][a-z0-9-]{1,23}$/;
export const MACRO_BODY_MAX = 1000;

export type Macro = { trigger: string; body: string };

export const BUILT_IN_MACROS: readonly Macro[] = [
  { trigger: "/readme", body: "The README is too short to explain what the project does. Add what it does, how to run it, and what it needs." },
  { trigger: "/ai", body: "The notes say AI helped build this. Tell us which parts it wrote and how you checked them." },
  { trigger: "/track", body: "This does not fit the track it was shipped in. Add more work in that track, or change the track and ship again." },
  { trigger: "/journal", body: "A journal entry is missing for part of the logged time. Add an entry that covers it." },
  { trigger: "/time", body: "We cannot verify the time for this part. Add a commit, screenshot or session log that shows it." },
];

export type MacroCheck = { ok: true; macro: Macro } | { ok: false; message: string };

export function validateMacro(raw: { trigger?: unknown; body?: unknown }, existing: readonly Macro[]): MacroCheck {
  const trigger = typeof raw.trigger === "string" ? raw.trigger.trim().toLowerCase() : "";
  const body = cleanPlainText(raw.body);
  if (!MACRO_TRIGGER_PATTERN.test(trigger)) {
    return { ok: false, message: "A trigger starts with / and uses 2 to 24 lowercase letters, numbers or dashes." };
  }
  if (existing.some((macro) => macro.trigger === trigger)) {
    return { ok: false, message: `${trigger} already exists.` };
  }
  if (body.length === 0) return { ok: false, message: "The macro needs some text." };
  if (body.length > MACRO_BODY_MAX) return { ok: false, message: `Keep the macro under ${MACRO_BODY_MAX} characters.` };
  return { ok: true, macro: { trigger, body } };
}

// A trigger counts only when it stands alone: at the start, or after a space, and followed by a space, punctuation or the end.
const TRIGGER_IN_TEXT = /(^|\s)(\/[a-z][a-z0-9-]{1,23})(?=$|[\s.,;:!?)])/g;

export function expandMacros(text: string, macros: readonly Macro[]): string {
  const byTrigger = new Map(macros.map((macro) => [macro.trigger, macro.body] as const));
  return text.replace(TRIGGER_IN_TEXT, (whole, lead: string, trigger: string) => {
    const body = byTrigger.get(trigger);
    return body === undefined ? whole : `${lead}${body}`;
  });
}

// The partly typed word right before the caret, if it looks like a trigger (for example "/tr" or "/track").
const PARTIAL_BEFORE_CARET = /(^|\s)(\/[a-z0-9-]*)$/;

export function insertMacro(text: string, caret: number, macro: Macro): { text: string; caret: number } {
  const safeCaret = Math.max(0, Math.min(caret, text.length));
  const before = text.slice(0, safeCaret);
  const after = text.slice(safeCaret);
  const partial = PARTIAL_BEFORE_CARET.exec(before);
  const start = partial ? safeCaret - partial[2].length : safeCaret;
  const head = text.slice(0, start);
  const next = `${head}${macro.body}${after}`;
  return { text: next, caret: head.length + macro.body.length };
}
