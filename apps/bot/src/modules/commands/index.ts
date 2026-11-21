// Slash commands (spec section 7). Registers the /loadout-* commands except the tools ones (reminders, countdowns, polls).
// API: default BotModule { name: "commands", register(app, ctx) }.
// Every command acks first (Slack wants 3 seconds), is limited to 10 uses a minute per person, and answers ephemerally
// unless it says otherwise. A failure in one command is logged and answered politely; it never reaches the process.
import type { BotModule, Ctx } from "../../types";
import {
  COMMANDS_PER_MINUTE,
  createRateLimiter,
  helpText,
  helpersText,
  latestShip,
  meText,
  parseAsk,
  parseMentionId,
  shipMessage,
  statsText,
  validateShipText,
} from "./rules";

type Respond = (message: { text: string; response_type?: "ephemeral" | "in_channel" }) => Promise<unknown>;
type CommandInput = { text: string; user_id: string; channel_id: string };
type Handler = (input: { command: CommandInput; respond: Respond; ctx: Ctx; ackMs: number }) => Promise<void>;

const EPHEMERAL = "ephemeral" as const;

const SOMETHING_WRONG = "Something went wrong on my side. Try again in a moment.";

const mod: BotModule = {
  name: "commands",
  register(app, ctx) {
    const limiter = createRateLimiter({ limit: COMMANDS_PER_MINUTE, windowMs: 60_000 });

    const define = (name: string, handler: Handler) => {
      app.command(name, async ({ ack, command, respond }) => {
        const t0 = Date.now();
        await ack();
        const ackMs = Date.now() - t0;
        ctx.stats.commandsRun += 1;
        const reply: Respond = (m) => respond({ text: m.text, response_type: m.response_type ?? EPHEMERAL });
        if (!limiter.take(command.user_id, ctx.now().getTime())) {
          await reply({ text: "Too many commands in a minute. Wait a moment and try again." });
          return;
        }
        try {
          await handler({ command, respond: reply, ctx, ackMs });
        } catch (err) {
          ctx.log.error("command.failed", { name, error: err instanceof Error ? err.name : "unknown" });
          await reply({ text: SOMETHING_WRONG });
        }
      });
    };

    define("/loadout-help", async ({ respond }) => {
      await respond({ text: helpText() });
    });

    define("/loadout-ping", async ({ respond, ctx: c, ackMs }) => {
      // The site call is the cheapest read the site offers; its timing is the site round trip.
      const t0 = Date.now();
      let site = "unreachable";
      try {
        await c.site.listHelpers();
        site = `${Date.now() - t0} ms`;
      } catch {
        c.log.warn("ping.site_failed");
      }
      await respond({ text: `Slack acknowledged in ${ackMs} ms. Site: ${site}.` });
    });

    define("/loadout-me", async ({ command, respond, ctx: c }) => {
      const person = await c.site.person(command.user_id);
      await respond({ text: meText(person) });
    });

    define("/loadout-ship", async ({ command, respond, ctx: c }) => {
      const valid = validateShipText(command.text);
      if (!valid.ok) {
        await respond({ text: valid.error });
        return;
      }
      const ship = latestShip(await c.site.approvedShips(command.user_id));
      if (!ship) {
        await respond({ text: "You need an approved ship before you can post one." });
        return;
      }
      const posted = await c.say({ channel: command.channel_id, text: shipMessage(command.user_id, ship, valid.text) });
      await respond({ text: posted ? "Posted." : "I could not post that. Try again in a moment." });
    });

    define("/loadout-lastship", async ({ command, respond, ctx: c }) => {
      const ship = await c.site.lastShip(command.user_id);
      await respond({ text: ship ? `Your latest approved ship: ${ship.title} ${ship.url}` : "You have no approved ships yet." });
    });

    define("/loadout-ask", async ({ command, respond, ctx: c }) => {
      const parsed = parseAsk(command.text);
      if (!parsed) {
        await respond({ text: "Use: /loadout-ask <question>, or /loadout-ask public <question> to post it in the channel." });
        return;
      }
      const answer = await c.answer(parsed.question);
      if (!answer) {
        const where = c.config.helpChannelId ? `A helper can help in <#${c.config.helpChannelId}>. Post your question there.` : "A helper can answer that.";
        await respond({ text: `I could not find that in the docs. ${where}` });
        return;
      }
      const body = answer.links.length > 0 ? `${answer.text}\n${answer.links.join("\n")}` : answer.text;
      if (parsed.isPublic) {
        const posted = await c.say({ channel: command.channel_id, text: `<@${command.user_id}> asked: ${parsed.question}\n${body}` });
        await respond({ text: posted ? "Posted." : "I could not post that. Try again in a moment." });
        return;
      }
      await respond({ text: body });
    });

    define("/loadout-stats", async ({ respond, ctx: c }) => {
      await respond({ text: statsText(c.stats) });
    });

    define("/loadout-helpers", async ({ command, respond, ctx: c }) => {
      if (!(await c.isHelper(command.user_id))) {
        await respond({ text: "Only helpers can see the helper list." });
        return;
      }
      await respond({ text: helpersText(await c.site.listHelpers()) });
    });

    define("/loadout-addhelper", async ({ command, respond, ctx: c }) => {
      if (!c.isAdmin(command.user_id)) {
        await respond({ text: "Only admins can change the helper list." });
        return;
      }
      const target = parseMentionId(command.text);
      if (!target) {
        await respond({ text: "Mention one person, like /loadout-addhelper @name." });
        return;
      }
      await c.site.addHelper(command.user_id, target);
      await respond({ text: `Added <@${target}> as a helper.` });
    });

    define("/loadout-removehelper", async ({ command, respond, ctx: c }) => {
      if (!c.isAdmin(command.user_id)) {
        await respond({ text: "Only admins can change the helper list." });
        return;
      }
      const target = parseMentionId(command.text);
      if (!target) {
        await respond({ text: "Mention one person, like /loadout-removehelper @name." });
        return;
      }
      await c.site.removeHelper(command.user_id, target);
      await respond({ text: `Removed <@${target}> as a helper.` });
    });
  },
};

export default mod;
