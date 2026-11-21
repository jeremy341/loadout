// Is a message aimed at the bot, and is it the thread-mute word? (spec sections 6 and 10)
// API: isAddressed(text, triggerWords, botUserId), isMuteWord(text, botName).
// A trigger word must be a whole word, so "rigging" does not address the bot but "rig, help" does.
const NOT_WORD = "[^\\p{L}\\p{N}_]";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isAddressed(text: string, triggerWords: readonly string[], botUserId: string): boolean {
  if (botUserId && text.includes(`<@${botUserId}>`)) return true;
  for (const word of triggerWords) {
    const w = word.trim();
    if (!w) continue;
    const re = new RegExp(`(^|${NOT_WORD})${escapeRegex(w)}($|${NOT_WORD})`, "iu");
    if (re.test(text)) return true;
  }
  return false;
}

// The mute word is the bot's name followed by STOP, sent by itself (for example "Rig STOP").
export function isMuteWord(text: string, botName: string): boolean {
  return text.trim().toLowerCase() === `${botName}stop`.toLowerCase();
}
