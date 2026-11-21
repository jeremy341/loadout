// The "thx" reply to the other bot's messages (spec section 8).
// API: default BotModule { name: "orphan", register(app, ctx) }. Registers nothing when config.orphanBotId is empty.
// State: the last time per channel, in memory only. A restart may thank once more, which the spec allows.
import type { BotModule } from "../../types";
import { shouldThank, type OrphanEvent } from "./rule";

const mod: BotModule = {
  name: "orphan",
  register(app, ctx) {
    if (!ctx.config.orphanBotId) return;
    const lastThanked = new Map<string, number>();

    app.event("message", async ({ event }) => {
      const e = event as unknown as OrphanEvent;
      const now = ctx.now().getTime();
      if (!shouldThank(e, lastThanked, now, ctx.config, ctx.botUserId)) return;
      if (!ctx.config.orphanReply) return;
      lastThanked.set(e.channel, now);
      await ctx.say({ channel: e.channel, text: ctx.config.orphanReply, threadTs: e.thread_ts ?? e.ts });
    });
  },
};

export default mod;
