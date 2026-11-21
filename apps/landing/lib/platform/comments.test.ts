import { describe, expect, test } from "bun:test";
import { ANON_AUTHOR, commentAuthor, commentCountLabel, COMMENT_MAX, COMMENTS_SHOWN, checkComment } from "./comments";

// A wall long enough to be over the cap, and a body with the control characters and staging a pasted comment can carry.
const wall = "x".repeat(COMMENT_MAX + 1);

describe("checkComment", () => {
  test("trims and keeps an ordinary comment as written", () => {
    expect(checkComment("  Nice build — the log shipper idea is great.  ")).toEqual({ ok: true, value: "Nice build — the log shipper idea is great." });
  });

  test("line breaks are kept, and treats, carriage returns and staged control characters do not survive", () => {
    const checked = checkComment("One line.\r\n\r\nTwo lines.\tTabbed.");
    expect(checked).toEqual({ ok: true, value: "One line.\n\nTwo lines. Tabbed." });
  });

  test("three line breaks collapse to a paragraph gap", () => {
    expect(checkComment("a\n\n\n\nb")).toEqual({ ok: true, value: "a\n\nb" });
  });

  test("an empty comment is refused, whatever the whitespace in it", () => {
    expect(checkComment("").ok).toBe(false);
    expect(checkComment("   \n\t  ")).toEqual({ ok: false, message: "Write the comment first." });
    expect(checkComment(undefined).ok).toBe(false);
    expect(checkComment(42).ok).toBe(false);
  });

  test("a comment over the cap is refused, and one at the cap is kept", () => {
    expect(checkComment(wall)).toEqual({ ok: false, message: `Keep the comment under ${COMMENT_MAX.toLocaleString("en-GB")} characters.` });
    expect(checkComment("x".repeat(COMMENT_MAX))).toEqual({ ok: true, value: "x".repeat(COMMENT_MAX) });
  });

  test("the page keeps at most COMMENTS_SHOWN comments, so the cap is a sane size", () => {
    expect(COMMENTS_SHOWN).toBe(100);
    expect(COMMENT_MAX).toBe(2000);
  });
});

describe("the words around a comment", () => {
  test("the count label is honest at zero and plain after that", () => {
    expect(commentCountLabel(0)).toBe("No comments yet");
    expect(commentCountLabel(1)).toBe("1 comment");
    expect(commentCountLabel(3)).toBe("3 comments");
    expect(commentCountLabel(-2)).toBe("No comments yet");
    expect(commentCountLabel(Number.NaN)).toBe("No comments yet");
  });

  test("an author is a handle or nobody in particular", () => {
    expect(commentAuthor("kestrel")).toBe("kestrel");
    expect(commentAuthor(null)).toBeNull();
    expect(commentAuthor(undefined)).toBeNull();
    expect(commentAuthor("   ")).toBeNull();

    expect(ANON_AUTHOR).toBe("a builder");
  });
});
