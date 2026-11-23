// Shared text clean-up for reviewer-desk input. Control characters go, runs of spaces collapse, and the ends are trimmed.
// Line breaks are kept only when `keepLines` is set (notes and reasons are single paragraphs unless the caller says otherwise).

export function cleanPlainText(raw: unknown, keepLines = false): string {
  if (typeof raw !== "string") return "";
  const normalised = raw.replace(/\r\n?/g, "\n");
  if (keepLines) {
    return normalised
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return normalised.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}
