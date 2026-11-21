// A builder's picture, stored in Person.avatar as { url, alt }. Only an https URL on a known picture host is kept, so the
// profile never loads a picture from an arbitrary site and never renders a script or data URL.
export const AVATAR_HOSTS = ["avatars.slack-edge.com", "ca.slack-edge.com", "secure.gravatar.com", "avatars.githubusercontent.com"] as const;

export type Avatar = { url: string; alt: string };

// Returns the cleaned URL when it is https, has no credentials or odd port and sits on a known host; otherwise null.
export function checkAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  if (!(AVATAR_HOSTS as readonly string[]).includes(url.hostname)) return null;
  return url.toString();
}

// Reads the Json column without trusting its shape.
export function parseAvatar(value: unknown): Avatar | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { url?: unknown; alt?: unknown };
  const url = checkAvatarUrl(raw.url);
  if (!url) return null;
  return { url, alt: typeof raw.alt === "string" ? raw.alt.slice(0, 120) : "" };
}
