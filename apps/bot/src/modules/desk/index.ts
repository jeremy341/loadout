// The desk module: connects the flow to Bolt. Routes messages (mute commands in any thread; questions and thread
// replies in the help channel), the Resolve, Reopen and title buttons, and the title modal submission. Starts the
// auto-close run at startup and every 24 hours.
// API: createDeskModule({ emoji, sleep?, now?, autoCloseEveryMs? }) -> BotModule;
//      wireDesk(app, ctx, opts) -> { flow } (no timers; used by the smoke script and tests).
import type { App } from "@slack/bolt";
import type { BotModule, Ctx } from "../../types";
import { getSlackWeb, type SlackWeb } from "../../slack/app";
import { threadMutes } from "./mute";
import { createDeskFlow, type DeskFlow, TITLE_CALLBACK } from "./flow";
import { eligible, parseMuteCommand, type MessageLike } from "./rules";

export type DeskOptions = {
  emoji: { open: string; resolved: string };
  sleep?: (ms: number) => Promise<void>;
  now?: () => Date;
  autoCloseEveryMs?: number;
  // Overrides the shared Slack helper (the smoke script uses one without the real 1 s pacing).
  web?: SlackWeb;
};

const DAY_MS = 24 * 60 * 60 * 1000;

type RawMessage = MessageLike & { channel?: string; ts?: string };
type ActionBody = { user: { id: string }; channel?: { id: string }; trigger_id?: string };

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function wireDesk(app: App, ctx: Ctx, opts: DeskOptions): { flow: DeskFlow } {
  const web = opts.web ?? getSlackWeb(app.client, ctx.log);
  const flow = createDeskFlow({
    helpChannel: ctx.config.helpChannelId,
    siteBaseUrl: ctx.config.siteBaseUrl,
    botUserId: ctx.botUserId,
    emoji: opts.emoji,
    site: ctx.site,
    web,
    log: ctx.log,
    stats: ctx.stats,
    now: opts.now ?? ctx.now,
    sleep: opts.sleep ?? defaultSleep,
    isHelper: ctx.isHelper,
    answer: ctx.answer,
  });

  const guard = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      ctx.log.error("handler_failed", { handler: name, error: err });
    }
  };

  // Mute commands work in any thread. The rest is for the help channel only.
  async function route(raw: unknown): Promise<void> {
    const m = raw as RawMessage;
    if (!m.channel || !m.ts) return;
    if (m.subtype || m.bot_id || !m.user || m.user === ctx.botUserId) return;
    const text = m.text ?? "";
    const threadTs = m.thread_ts && m.thread_ts !== m.ts ? m.thread_ts : undefined;

    if (threadTs) {
      const mute = parseMuteCommand(text, ctx.config.botName);
      if (mute === "stop") {
        threadMutes.mute(m.channel, threadTs);
        await web.post({ channel: m.channel, threadTs, text: `Muted here. Say ${ctx.config.botName}START to bring me back.` });
        return;
      }
      if (mute === "start") {
        threadMutes.unmute(m.channel, threadTs);
        await web.post({ channel: m.channel, threadTs, text: "Back in this thread." });
        return;
      }
    }

    if (m.channel !== ctx.config.helpChannelId) return;
    if (!threadTs) {
      if (eligible(m)) await flow.handleQuestion({ channel: m.channel, ts: m.ts, user: m.user, text });
      return;
    }
    await flow.handleThreadMessage({ channel: m.channel, ts: m.ts, thread_ts: threadTs, user: m.user, text });
  }

  app.event("message", async ({ event }) => {
    await guard("message", () => route(event));
  });

  app.action("desk_resolve", async ({ ack, body, action }) => {
    await ack();
    const b = body as ActionBody;
    await guard("desk_resolve", () => flow.resolveByButton(valueOf(action), b.user.id, b.channel?.id));
  });

  app.action("desk_reopen", async ({ ack, body, action }) => {
    await ack();
    const b = body as ActionBody;
    await guard("desk_reopen", () => flow.reopenByButton(valueOf(action), b.user.id, b.channel?.id));
  });

  app.action("desk_title_open", async ({ ack, body, action }) => {
    await ack();
    const b = body as ActionBody;
    if (!b.trigger_id) return;
    await guard("desk_title_open", () =>
      flow.openTitle({ ticketId: valueOf(action), triggerId: b.trigger_id ?? "", channel: b.channel?.id, user: b.user.id }),
    );
  });

  app.action("desk_title_skip", async ({ ack, action }) => {
    await ack();
    flow.skipTitle(valueOf(action));
  });

  app.view(TITLE_CALLBACK, async ({ ack, view }) => {
    await ack();
    const values = view.state.values as unknown as Record<string, Record<string, { value?: string } | undefined> | undefined>;
    const raw = values.title?.value?.value ?? "";
    await guard("desk_title_submit", () => flow.saveTitle(view.private_metadata, raw));
  });

  return { flow };
}

function valueOf(action: unknown): string {
  const value = (action as { value?: unknown }).value;
  return typeof value === "string" ? value : "";
}

export function createDeskModule(opts: DeskOptions): BotModule {
  return {
    name: "desk",
    register(app, ctx) {
      const { flow } = wireDesk(app, ctx, opts);
      const runAutoClose = () =>
        flow.runAutoClose().catch((err: unknown) => ctx.log.error("auto_close_failed", { error: err }));
      void runAutoClose();
      // Unref'd so the timer never keeps the process alive on shutdown.
      const timer = setInterval(() => void runAutoClose(), opts.autoCloseEveryMs ?? DAY_MS);
      timer.unref();
    },
  };
}
