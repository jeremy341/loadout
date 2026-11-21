import { checkAvatarUrl, type Avatar } from "./avatar";
import { parseSlackId } from "./hca";

// Reads a member's profile picture from Slack (users.info, bot token with users:read), the way Stasis does. Biggest size first.
// Slack's Gravatar placeholders are skipped: they are default pictures, not the person's. Every URL goes through checkAvatarUrl,
// so only https pictures on a known host are kept. Returns null on any problem; the caller treats that as "no picture".
export function pickSlackImage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = body as { ok?: unknown; user?: { profile?: Record<string, unknown> } };
  if (data.ok !== true) return null;
  const profile = data.user?.profile;
  if (!profile) return null;
  for (const key of ["image_original", "image_512", "image_192", "image_72"]) {
    const url = checkAvatarUrl(profile[key]);
    if (url && !url.includes("gravatar.com")) return url;
  }
  return null;
}

export async function fetchSlackAvatar(slackId: string, token = process.env.SLACK_BOT_TOKEN?.trim()): Promise<Avatar | null> {
  const id = parseSlackId(slackId);
  if (!id || !token) return null;
  try {
    const response = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    const url = pickSlackImage(await response.json());
    return url ? { url, alt: "" } : null;
  } catch {
    return null;
  }
}
