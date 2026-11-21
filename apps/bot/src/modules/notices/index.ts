// Notices: delivers the site's outbox to people's DMs, ticket threads and the community channel (spec section 5),
// and answers the fulfiller "orders on/off/status" DMs.
// API: default BotModule { name: "notices", register(app, ctx) }.
import type { BotModule } from "../../types";
import { createOrderAlerts, parseOrdersCommand } from "./orders";
import { createOutboxPoller } from "./outbox";

type DmEvent = { channel: string; channel_type?: string; subtype?: string; bot_id?: string; text?: string };

const mod: BotModule = {
  name: "notices",
  register(app, ctx) {
    const poller = createOutboxPoller({
      ctx,
      random: Math.random,
      setTimer: (fn, ms) => setTimeout(fn, ms),
      clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    });
    poller.start();

    const orders = createOrderAlerts();
    app.event("message", async ({ event }) => {
      const e = event as unknown as DmEvent & { user?: string };
      // Only plain DMs from people. Bot messages, edits and channel posts are ignored.
      if (e.channel_type !== "im" || e.subtype || e.bot_id || !e.user) return;
      const cmd = parseOrdersCommand(e.text ?? "");
      if (!cmd) return;
      if (cmd === "status") {
        await ctx.say({ channel: e.channel, text: orders.get(e.user) ? "Order alerts are on." : "Order alerts are off." });
        return;
      }
      orders.set(e.user, cmd === "on");
      await ctx.say({ channel: e.channel, text: cmd === "on" ? "Order alerts are on. Send orders off to stop." : "Order alerts are off." });
    });
  },
};

export default mod;
