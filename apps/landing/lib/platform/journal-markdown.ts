// The address rules for journal Markdown. Pure, no framework. A link may be https, http or mailto; an image must be https. Anything
// else (javascript:, data:, file:, a relative path) is dropped, so the element renders without an address.
export function safeLinkUrl(url: string, kind: "link" | "image"): string {
  const value = url.trim();
  try {
    const parsed = new URL(value);
    if (kind === "image") return parsed.protocol === "https:" ? value : "";
    return parsed.protocol === "https:" || parsed.protocol === "http:" || parsed.protocol === "mailto:" ? value : "";
  } catch {
    return "";
  }
}
