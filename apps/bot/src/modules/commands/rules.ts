// Pure rules for the slash commands (spec section 7): the command list, the per-user limiter, argument parsing and
// the message texts. No Slack or site calls here, so every rule is tested alone.
// API: COMMANDS, createRateLimiter, validateShipText, shipMessage, latestShip, parseAsk, parseMentionId, meText,
// helpersText, statsText, helpText.
import type { PersonView, ShipView, Stats } from "../../types";

export const SHIP_TEXT_MAX = 200;
export const COMMANDS_PER_MINUTE = 10;

export type CommandInfo = { name: string; usage: string; summary: string; audience: "everyone" | "helper" | "admin" };

// One list for /loadout-help. The tools commands are listed here too so help is complete from one place.
export const COMMANDS: readonly CommandInfo[] = [
  { name: "/loadout-help", usage: "/loadout-help", summary: "List the commands.", audience: "everyone" },
  { name: "/loadout-ping", usage: "/loadout-ping", summary: "Check the round trip to Slack and the site.", audience: "everyone" },
  { name: "/loadout-me", usage: "/loadout-me", summary: "Your handle, track levels, approved hours and Ore.", audience: "everyone" },
  { name: "/loadout-ship", usage: "/loadout-ship <text>", summary: "Announce your latest approved ship in this channel.", audience: "everyone" },
  { name: "/loadout-lastship", usage: "/loadout-lastship", summary: "Your most recent approved ship.", audience: "everyone" },
  { name: "/loadout-ask", usage: "/loadout-ask [public] <question>", summary: "Answer from the docs. Add public to post it.", audience: "everyone" },
  { name: "/loadout-remind", usage: "/loadout-remind <time> <text>", summary: "DM yourself a reminder, for example 10min.", audience: "everyone" },
  { name: "/loadout-countdown", usage: "/loadout-countdown <time> <label>", summary: "Post to this channel when the time is up.", audience: "everyone" },
  { name: "/loadout-poll", usage: "/loadout-poll Question; A, B, C [, 10min]", summary: "Start a poll with number reactions.", audience: "everyone" },
  { name: "/loadout-stats", usage: "/loadout-stats", summary: "Counts since the last restart.", audience: "everyone" },
  { name: "/loadout-helpers", usage: "/loadout-helpers", summary: "List the helpers.", audience: "helper" },
  { name: "/loadout-addhelper", usage: "/loadout-addhelper @user", summary: "Add a helper.", audience: "admin" },
  { name: "/loadout-removehelper", usage: "/loadout-removehelper @user", summary: "Remove a helper.", audience: "admin" },
];

export function helpText(): string {
  return COMMANDS.map((c) => {
    const tag = c.audience === "everyone" ? "" : c.audience === "helper" ? " (helpers)" : " (admins)";
    return `${c.usage}${tag}: ${c.summary}`;
  }).join("\n");
}

// Sliding-window limiter. take() records a use and returns true when the key is under the limit.
export function createRateLimiter(opts: { limit: number; windowMs: number }) {
  const uses = new Map<string, number[]>();
  return {
    take(key: string, nowMs: number): boolean {
      const recent = (uses.get(key) ?? []).filter((t) => nowMs - t < opts.windowMs);
      if (recent.length >= opts.limit) {
        uses.set(key, recent);
        return false;
      }
      recent.push(nowMs);
      uses.set(key, recent);
      return true;
    },
    // Test and debug aid: how many keys are tracked.
    size: () => uses.size,
  };
}

export function validateShipText(raw: string): { ok: true; text: string } | { ok: false; error: string } {
  const text = raw.trim();
  if (text.length === 0) return { ok: false, error: "Add a few words about your ship, like /loadout-ship my first synth is working." };
  if (text.length > SHIP_TEXT_MAX) return { ok: false, error: `Keep the ship text to ${SHIP_TEXT_MAX} characters or fewer.` };
  return { ok: true, text };
}

// The most recent approved ship, judged by approvedAt, so the result does not depend on the site's ordering.
export function latestShip(ships: readonly ShipView[]): ShipView | null {
  let best: ShipView | null = null;
  for (const s of ships) {
    if (!best || Date.parse(s.approvedAt) > Date.parse(best.approvedAt)) best = s;
  }
  return best;
}

export function shipMessage(userId: string, ship: ShipView, text: string): string {
  return `<@${userId}> shipped ${ship.title}: ${text} ${ship.url}`;
}

export function parseAsk(raw: string): { isPublic: boolean; question: string } | null {
  const text = raw.trim();
  const m = /^(public)(?:\s+|$)/i.exec(text);
  const isPublic = m !== null;
  const question = m ? text.slice(m[0].length).trim() : text;
  if (question.length === 0) return null;
  return { isPublic, question };
}

// A Slack user mention as Slack sends it: <@U123ABC> or <@U123ABC|name>. Returns the id or null.
const SLACK_ID_RE = /^[CGUBW][A-Z0-9]{8,20}$/;
export function parseMentionId(raw: string): string | null {
  const m = /<@([A-Z0-9]+)(?:\|[^>]*)?>/.exec(raw);
  const id = m?.[1];
  if (!id || !SLACK_ID_RE.test(id)) return null;
  return id;
}

export function meText(person: PersonView): string {
  if (!person.linked) return "Link your Hack Club account on the site (Settings) so I can find you.";
  const lines = [`Handle: ${person.handle ?? "unknown"}`];
  for (const l of person.levels ?? []) lines.push(`${l.track}: level ${l.level}, ${l.approvedHours} approved hours`);
  lines.push(`Total approved hours: ${person.approvedHours ?? 0}`);
  lines.push(`Ore: ${person.ore ?? 0}`);
  return lines.join("\n");
}

export function helpersText(ids: readonly string[]): string {
  if (ids.length === 0) return "No helpers yet.";
  return `Helpers: ${ids.map((id) => `<@${id}>`).join(", ")}`;
}

export function statsText(stats: Stats): string {
  return [
    "Since the last restart:",
    `Tickets opened: ${stats.ticketsOpened}`,
    `Answered from docs: ${stats.answeredFromDocs}`,
    `Auto-closed: ${stats.autoClosed}`,
    `Reminders sent: ${stats.remindersSent}`,
    `Commands run: ${stats.commandsRun}`,
  ].join("\n");
}
