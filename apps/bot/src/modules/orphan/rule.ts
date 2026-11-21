// The "thx" rule decision (spec section 8). Pure: it reads the last-thanked times and says whether to reply.
// API: shouldThank(event, lastThanked, now, config, botUserId?) -> boolean, THANK_COOLDOWN_MS.
// Why the whole help channel is skipped: the bot cannot tell a ticket thread from other help-channel posts
// without a site call, so it never thanks inside the help channel at all. That is the safe side of the spec.
export const THANK_COOLDOWN_MS = 10 * 60 * 1000;

export type OrphanEvent = {
  channel: string;
  ts: string;
  thread_ts?: string;
  subtype?: string;
  bot_id?: string;
  user?: string;
};

export type ThankConfig = { orphanBotId: string; helpChannelId: string };

export function shouldThank(
  event: OrphanEvent,
  lastThanked: ReadonlyMap<string, number>,
  now: number,
  config: ThankConfig,
  botUserId = "",
): boolean {
  // Empty id switches the rule off entirely.
  if (!config.orphanBotId) return false;
  // Only plain bot posts. Edits, deletes and joins are not new messages from the other bot.
  if (event.subtype && event.subtype !== "bot_message") return false;
  const fromOrphan = event.bot_id === config.orphanBotId || event.user === config.orphanBotId;
  if (!fromOrphan) return false;
  // Never answer our own messages.
  if (botUserId && event.user === botUserId) return false;
  if (config.helpChannelId && event.channel === config.helpChannelId) return false;
  const last = lastThanked.get(event.channel);
  if (last !== undefined && now - last < THANK_COOLDOWN_MS) return false;
  return true;
}
