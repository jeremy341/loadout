// Bolt app and the shared Slack helper.
// API:
//   createSlackApp(config, { log, customRoutes? }) -> App (HTTP receiver on /slack/events, no Socket Mode;
//     drops repeated event ids; logs handler errors as one line).
//   resolveBotUserId(client) -> the bot's own user id (auth.test).
//   getSlackWeb(client, log) -> SlackWeb, one shared instance per client so every module shares the limiter.
//     Every call goes through a 1 message per second limiter per channel and retries rate limits up to 3 times.
//     Failures come back as { ok: false, code, final } (see pure.ts), never as thrown errors.
import { App, LogLevel } from "@slack/bolt";
import type { Config, Logger } from "../types";
import { createRateLimiter, createSeenSet, describeSlackError, retryDelayMs, toFailure, type Failure } from "./pure";

export type SlackClient = App["client"];
type PostArgs = Parameters<SlackClient["chat"]["postMessage"]>[0];
// Blocks exist only on the union member of postMessage args that declares them, hence the Extract.
export type SlackBlock = NonNullable<Extract<PostArgs, { blocks: unknown }>["blocks"]>[number];
export type SlackModal = Parameters<SlackClient["views"]["open"]>[0]["view"];
export type CustomRoute = NonNullable<NonNullable<ConstructorParameters<typeof App>[0]>["customRoutes"]>[number];
type CustomRoutes = CustomRoute[];

export type Result<T> = { ok: true; value: T } | Failure;

export type SlackWeb = {
  // Posts as the bot and returns the timestamp, or null when Slack refused (already logged).
  say(args: { channel: string; text: string; threadTs?: string }): Promise<{ ts: string } | null>;
  post(args: { channel: string; text: string; threadTs?: string; blocks?: SlackBlock[] }): Promise<Result<{ ts: string }>>;
  update(args: { channel: string; ts: string; text: string; blocks?: SlackBlock[] }): Promise<Result<{ ts: string }>>;
  remove(channel: string, ts: string): Promise<Result<null>>;
  react(channel: string, ts: string, name: string): Promise<Result<null>>;
  unreact(channel: string, ts: string, name: string): Promise<Result<null>>;
  ephemeral(args: { channel: string; user: string; text: string; blocks?: SlackBlock[] }): Promise<Result<null>>;
  openModal(triggerId: string, view: SlackModal): Promise<Result<null>>;
  dm(slackId: string, text: string): Promise<{ ok: true } | Failure>;
};

export type SlackWebDeps = { log: Logger; now?: () => number; sleep?: (ms: number) => Promise<void> };

const MAX_ATTEMPTS = 3;

export function createSlackWeb(client: SlackClient, deps: SlackWebDeps): SlackWeb {
  const now = deps.now ?? (() => Date.now());
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const limiter = createRateLimiter({ intervalMs: 1000, now, sleep });

  async function call<T>(op: string, key: string, fn: () => Promise<T>): Promise<Result<T>> {
    for (let attempt = 0; ; attempt++) {
      await limiter.acquire(key);
      try {
        return { ok: true, value: await fn() };
      } catch (err) {
        const described = describeSlackError(err);
        if (described.code === "ratelimited" && attempt + 1 < MAX_ATTEMPTS) {
          await sleep(retryDelayMs(attempt, described.retryAfterSec));
          continue;
        }
        deps.log.warn("slack_call_failed", { op, code: described.code });
        return toFailure(described.code);
      }
    }
  }

  const post: SlackWeb["post"] = async (args) => {
    const r = await call("chat.postMessage", args.channel, () =>
      client.chat.postMessage({
        channel: args.channel,
        text: args.text,
        thread_ts: args.threadTs,
        blocks: args.blocks,
        unfurl_links: false,
        unfurl_media: false,
      }),
    );
    return r.ok ? { ok: true, value: { ts: r.value.ts ?? "" } } : r;
  };

  return {
    async say(args) {
      const r = await post(args);
      return r.ok ? { ts: r.value.ts } : null;
    },

    post,

    async update(args) {
      const r = await call("chat.update", args.channel, () =>
        client.chat.update({ channel: args.channel, ts: args.ts, text: args.text, blocks: args.blocks }),
      );
      return r.ok ? { ok: true, value: { ts: r.value.ts ?? args.ts } } : r;
    },

    async remove(channel, ts) {
      const r = await call("chat.delete", channel, () => client.chat.delete({ channel, ts }));
      return r.ok ? { ok: true, value: null } : r;
    },

    async react(channel, ts, name) {
      const r = await call("reactions.add", channel, () => client.reactions.add({ channel, timestamp: ts, name }));
      if (r.ok || r.code === "already_reacted") return { ok: true, value: null };
      return r;
    },

    async unreact(channel, ts, name) {
      const r = await call("reactions.remove", channel, () => client.reactions.remove({ channel, timestamp: ts, name }));
      if (r.ok || r.code === "no_reaction") return { ok: true, value: null };
      return r;
    },

    async ephemeral(args) {
      const r = await call("chat.postEphemeral", args.channel, () =>
        client.chat.postEphemeral({ channel: args.channel, user: args.user, text: args.text, blocks: args.blocks }),
      );
      return r.ok ? { ok: true, value: null } : r;
    },

    async openModal(triggerId, view) {
      const r = await call("views.open", triggerId, () => client.views.open({ trigger_id: triggerId, view }));
      return r.ok ? { ok: true, value: null } : r;
    },

    async dm(slackId, text) {
      const opened = await call("conversations.open", `dm:${slackId}`, () => client.conversations.open({ users: slackId }));
      if (!opened.ok) return opened;
      const channel = opened.value.channel?.id;
      if (!channel) return toFailure("no_channel");
      const sent = await call("chat.postMessage", channel, () =>
        client.chat.postMessage({ channel, text, unfurl_links: false, unfurl_media: false }),
      );
      return sent.ok ? { ok: true } : sent;
    },
  };
}

// One SlackWeb per client, so every module shares the same per-channel limiter.
const webs = new WeakMap<SlackClient, SlackWeb>();
export function getSlackWeb(client: SlackClient, log: Logger): SlackWeb {
  let web = webs.get(client);
  if (!web) {
    web = createSlackWeb(client, { log });
    webs.set(client, web);
  }
  return web;
}

export function createSlackApp(config: Config, opts: { log: Logger; customRoutes?: CustomRoutes }): App {
  const app = new App({
    token: config.slackBotToken,
    signingSecret: config.slackSigningSecret,
    endpoints: "/slack/events",
    customRoutes: opts.customRoutes,
    logLevel: LogLevel.ERROR,
  });

  // Slack retries an event it thinks was lost; the retry keeps the same event_id, so one copy is enough.
  const seen = createSeenSet(1000);
  app.use(async ({ body, next }) => {
    const id = eventIdOf(body);
    if (id !== undefined && !seen.add(id)) {
      opts.log.debug("duplicate_event_ignored");
      return;
    }
    await next();
  });

  app.error(async (err) => {
    opts.log.error("bolt_error", { error: err });
  });

  return app;
}

export function eventIdOf(body: unknown): string | undefined {
  if (typeof body === "object" && body !== null && "event_id" in body) {
    const id = (body as { event_id?: unknown }).event_id;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

export async function resolveBotUserId(client: SlackClient): Promise<string> {
  const res = await client.auth.test();
  if (!res.user_id) throw new Error("auth.test returned no user id");
  return res.user_id;
}
