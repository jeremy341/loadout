// Pure poll helpers: the message text, the reaction names for options 1 to 9, and vote counting.
// API: pollText, NUMBER_REACTIONS, countVotes(reaction, botUserId), formatResults(question, options, votes).
// Why: Slack reactions are named ("one", "two"), so the mapping from option to reaction is kept in one place.

export const NUMBER_REACTIONS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"] as const;

export type SlackReaction = { name?: string; count?: number; users?: string[] };

export function pollText(question: string, options: readonly string[]): string {
  const lines = options.map((o, i) => `${i + 1}. ${o}`);
  return [`Poll: ${question}`, ...lines, "React with the number you pick."].join("\n");
}

// Counts humans only. The bot's own seed reaction is excluded by id; when Slack omits the user list the bot's
// reaction is removed from the count instead.
export function countVotes(reaction: SlackReaction | undefined, botUserId: string): number {
  if (!reaction) return 0;
  if (reaction.users) return reaction.users.filter((u) => u !== botUserId).length;
  return Math.max(0, (reaction.count ?? 0) - 1);
}

export function formatResults(question: string, options: readonly string[], votes: readonly number[]): string {
  const lines = options.map((o, i) => {
    const n = votes[i] ?? 0;
    return `${i + 1}. ${o}: ${n} ${n === 1 ? "vote" : "votes"}`;
  });
  return [`Poll closed: ${question}`, ...lines].join("\n");
}
