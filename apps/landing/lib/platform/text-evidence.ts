// Count the visible writing in journal bodies and change notes. Length checks that use String.length can be satisfied with
// zero-width characters or emoji, which are not text a reader can learn from, so those are removed first. Image markdown and
// raw HTML are evidence/markup rather than prose, and a Markdown link's URL is not prose either: only its label remains.
const MARKDOWN_IMAGE = /!\[[^\]]*\]\([^)]+\)/g;
const MARKDOWN_LINK = /\[([^\]]+)\]\([^)]+\)/g;
const HTML_TAG = /<[^>]*>/g;
const NON_TEXT = /[\p{Cf}\p{Extended_Pictographic}\uFE0F]/gu;

export function visibleTextLength(raw: string): number {
  return raw
    .replace(MARKDOWN_IMAGE, "")
    .replace(HTML_TAG, "")
    .replace(MARKDOWN_LINK, "$1")
    .replace(NON_TEXT, "")
    .trim().length;
}
