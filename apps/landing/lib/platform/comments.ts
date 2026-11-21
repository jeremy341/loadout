// Pure rules for builder comments on a project. No database; tests in comments.test.ts.
//
// API:
//   COMMENT_MAX = 2000            the most characters a comment may carry
//   COMMENTS_SHOWN = 100          the most comments a project page lists (the page says so when it cuts)
//   checkComment(raw) -> { ok: true, value } | { ok: false, message }
//       plain text in, plain text out: trimmed, line breaks kept, other control characters and runs of whitespace collapsed.
//       An empty comment is refused, a too-long one is refused, so nothing blank or unbounded is stored.
//   commentCountLabel(count) -> "No comments yet" | "1 comment" | "N comments"

export const COMMENT_MAX = 2000;
export const COMMENTS_SHOWN = 100;

export type CommentCheck = { ok: true; value: string } | { ok: false; message: string };

// Turns whatever a textarea sends into the comment that is stored and shown. A comment keeps its line breaks; staged
// control characters (a typed tab, stray zero-width characters) go and runs of spaces collapse, so two people cannot
// make the same comment read differently with invisible characters.
function plainComment(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function checkComment(raw: unknown): CommentCheck {
  const body = plainComment(raw);
  if (body.length === 0) return { ok: false, message: "Write the comment first." };
  if (body.length > COMMENT_MAX) return { ok: false, message: `Keep the comment under ${COMMENT_MAX.toLocaleString("en-GB")} characters.` };
  return { ok: true, value: body };
}

// The label the project page carries in its heading: honest at zero, plain at any number.
export function commentCountLabel(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (n === 0) return "No comments yet";
  return n === 1 ? "1 comment" : `${n.toLocaleString("en-GB")} comments`;
}

// The writer's handle may be missing (a builder without one) or banned; the comment stays and the handle reads as none,
// the same way kudos and journal lines treat a handle-less builder.
export function commentAuthor(handle: string | null | undefined): string | null {
  return typeof handle === "string" && handle.trim() !== "" ? handle : null;
}

// What the list shows in place of a handle when the writer has none: no invented name, no "someone".
export const ANON_AUTHOR = "a builder";
