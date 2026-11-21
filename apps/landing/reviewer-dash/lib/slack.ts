// Pixl resolves Slack ids to handles over the Slack API. LOADOUT has no Slack link: an id here already is the handle, so these
// answer from the id itself, with no network call. Direct messages and channel posts do nothing.
export interface SlackUserProfile {
  id: string;
  handle: string | null;
  displayName: string | null;
  realName: string | null;
  avatarUrl: string | null;
}

export async function slackAvatars(): Promise<Map<string, string>> {
  return new Map();
}

export async function slackAvatarsFor(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  void ids;
  return new Map();
}

export async function slackHandle(id: string | null | undefined): Promise<string | null> {
  return id ? id : null;
}

export async function slackHandles(
  ids: (string | null | undefined)[],
  opts?: { maxWaitMs?: number },
): Promise<Map<string, string>> {
  void opts;
  const map = new Map<string, string>();
  for (const id of ids) if (id) map.set(id, id);
  return map;
}

export function warmSlackHandles(ids: (string | null | undefined)[]): void {
  void ids;
}

export async function getSlackUserProfile(id: string): Promise<SlackUserProfile | null> {
  void id;
  return null;
}

export async function postToChannel(channel: string, text: string): Promise<void> {
  void channel;
  void text;
}

export type PixoDmOutcome = "sent" | "offline" | "rejected";

export async function dmViaPixorpheus(slackUserId: string, text: string): Promise<PixoDmOutcome> {
  void slackUserId;
  void text;
  return "offline";
}

export const DM_EXCLUDED_SLACK_IDS = new Set<string>();

export async function dmUser(slackUserId: string, text: string): Promise<boolean> {
  void slackUserId;
  void text;
  return false;
}
