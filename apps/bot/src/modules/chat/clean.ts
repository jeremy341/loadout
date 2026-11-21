// Cleans a model reply before it is posted (spec section 10).
// API: cleanReply(raw) -> string | null (null means "say nothing"), REPLY_MAX_CHARS, REPLY_MAX_SENTENCES, PASS_TOKEN.
// Rules: trim; remove broadcast mentions (@here, @channel, @everyone and Slack's <!here> forms); empty or PASS is silence;
// at most 3 sentences; never more than 400 characters, cut at a word boundary when possible.
export const REPLY_MAX_CHARS = 400;
export const REPLY_MAX_SENTENCES = 3;
export const PASS_TOKEN = "PASS";

// The leading spaces go too, so "Sure @here." becomes "Sure." and not "Sure .".
const BROADCAST_RE = /\s*(?:@(?:here|channel|everyone)\b|<!(?:here|channel|everyone)>)/gi;

export function cleanReply(raw: string): string | null {
  let text = raw.replace(BROADCAST_RE, "").replace(/[ \t]{2,}/g, " ").trim();
  if (text.length === 0) return null;
  if (/^pass[.!]?$/i.test(text)) return null;

  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [text];
  text = sentences
    .slice(0, REPLY_MAX_SENTENCES)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(" ");

  if (text.length > REPLY_MAX_CHARS) {
    const cut = text.slice(0, REPLY_MAX_CHARS);
    const space = cut.lastIndexOf(" ");
    text = (space > REPLY_MAX_CHARS / 2 ? cut.slice(0, space) : cut).trimEnd();
  }
  return text.length > 0 ? text : null;
}
