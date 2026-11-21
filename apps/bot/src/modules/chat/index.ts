// Optional AI chat (spec section 10). Registers nothing unless config.chatEnabled and config.anthropicApiKey are set.
// API: default BotModule { name: "chat" } (no mute check); createChatModule({ isMuted?, fetchImpl?, timers?, now?,
//      dailyTokenBudget? }) -> BotModule, used by the composer to pass the thread-mute check in.
// Flow: a message is batched when it names the bot (or is a DM, or chime mode is on). A flushed batch is checked for
// mute, per-user and daily limits, then answered with the thread's recent lines as context. No memory per person.
import type { BotModule, Ctx } from "../../types";
import { isAddressed, isMuteWord } from "./addressing";
import { createBatcher, type BatchTimers } from "./batcher";
import { cleanReply } from "./clean";
import { buildSystemPrompt } from "./prompt";
import { buildTranscript, createModelCaller, type ContextLine } from "./model";
import { DEFAULT_DAILY_TOKEN_BUDGET, HOUR_MS, REPLIES_PER_USER_PER_HOUR, createDailyBudget, createWindowLimiter } from "./limits";

export type ChatOptions = {
  // Thread-mute check, supplied by whoever owns the mute state. Absent means no mute check.
  isMuted?: (channel: string, threadTs: string) => boolean;
  fetchImpl?: typeof fetch;
  timers?: BatchTimers;
  now?: () => number;
  dailyTokenBudget?: number;
};

type ChatEvent = {
  channel: string;
  channel_type?: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  subtype?: string;
  bot_id?: string;
};

type Pending = { channel: string; user: string; text: string; ts: string; threadRoot: string; dm: boolean; addressed: boolean };

type RepliesClient = {
  conversations: {
    replies(args: { channel: string; ts: string; limit: number }): Promise<{ messages?: { ts?: string; user?: string; text?: string }[] }>;
  };
};

const realTimers: BatchTimers = {
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export function createChatModule(options: ChatOptions = {}): BotModule {
  return {
    name: "chat",
    register(app, ctx: Ctx) {
      const { config } = ctx;
      if (!config.chatEnabled || !config.anthropicApiKey) return;

      const now = options.now ?? (() => ctx.now().getTime());
      const callModel = createModelCaller({ apiKey: config.anthropicApiKey, fetchImpl: options.fetchImpl });
      const userLimiter = createWindowLimiter({ limit: REPLIES_PER_USER_PER_HOUR, windowMs: HOUR_MS });
      const chimeLimiter = createWindowLimiter({ limit: 1, windowMs: HOUR_MS });
      const budget = createDailyBudget(options.dailyTokenBudget ?? DEFAULT_DAILY_TOKEN_BUDGET);
      const client = app.client as unknown as RepliesClient;

      // Recent lines of the thread, without the batch itself. Failure means no context, not no reply.
      async function threadContext(channel: string, root: string, batchTs: Set<string>): Promise<ContextLine[]> {
        try {
          const res = await client.conversations.replies({ channel, ts: root, limit: 10 });
          return (res.messages ?? [])
            .filter((m) => typeof m.text === "string" && m.ts !== undefined && !batchTs.has(m.ts) && !isMuteWord(m.text, config.botName))
            .map((m) => ({ from: m.user === ctx.botUserId ? ("you" as const) : ("person" as const), text: m.text ?? "" }));
        } catch {
          ctx.log.warn("chat.context_failed");
          return [];
        }
      }

      async function answer(items: Pending[], mentioned: boolean): Promise<void> {
        const last = items[items.length - 1];
        if (!last) return;
        const { channel, threadRoot: root } = last;
        const usable = items.filter((i) => !isMuteWord(i.text, config.botName));
        if (usable.length === 0) return;

        const addressed = items.some((i) => i.addressed);
        if (!addressed && !config.chatChime) return;
        // A muted thread stays quiet unless someone names the bot.
        if (!mentioned && options.isMuted?.(channel, root)) return;

        const t = now();
        if (!budget.canSpend(new Date(t))) {
          ctx.log.info("chat.budget_spent");
          return;
        }
        const asker = [...usable].reverse().find((i) => i.addressed)?.user ?? last.user;
        if (!userLimiter.take(asker, t)) {
          ctx.log.debug("chat.user_limited");
          return;
        }
        // Chime replies are capped at one per channel per hour. The slot is taken when the model is asked.
        if (!addressed && !chimeLimiter.take(channel, t)) return;

        const batchTs = new Set(items.map((i) => i.ts));
        const context = last.dm ? [] : await threadContext(channel, root, batchTs);
        const transcript = buildTranscript(
          context,
          usable.map((i) => ({ from: "person" as const, text: i.text })),
        );

        let reply: { text: string; tokens: number };
        try {
          reply = await callModel({ system: buildSystemPrompt(config, { chime: !addressed }), transcript });
        } catch (err) {
          ctx.log.warn("chat.model_failed", { error: err instanceof Error ? err.message : "unknown" });
          return;
        }
        budget.spend(new Date(now()), reply.tokens);

        const text = cleanReply(reply.text);
        if (!text) return;
        await ctx.say({ channel, text, threadTs: last.dm ? undefined : root });
      }

      const batcher = createBatcher<Pending>({
        timers: options.timers ?? realTimers,
        now,
        onFlush: (_key, items, mentioned) =>
          answer(items, mentioned).catch(() => {
            ctx.log.warn("chat.flush_failed");
          }),
      });

      app.event("message", async ({ event }) => {
        const e = event as unknown as ChatEvent;
        // Humans only, no edits or deletes, and never the bot's own posts.
        if (e.subtype || e.bot_id || !e.user || e.user === ctx.botUserId) return;
        const text = e.text ?? "";
        if (text.trim().length === 0) return;
        const dm = e.channel_type === "im";
        const addressed = dm || isAddressed(text, config.triggerWords, ctx.botUserId);
        if (!addressed && !config.chatChime) return;
        const root = e.thread_ts ?? e.ts;
        batcher.push(`${e.channel}:${root}`, { channel: e.channel, user: e.user, text, ts: e.ts, threadRoot: root, dm, addressed }, addressed);
      });
    },
  };
}

const mod = createChatModule();
export default mod;
