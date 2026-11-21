// Outbox delivery (spec section 5). The site decides what to send; this module polls, delivers and acknowledges.
// API: routeItem(item), composeText(text, href, siteBaseUrl), deliverItem(item, deps), createOutboxPoller(opts).
// Why: routing and text composition are pure and tested. The poller never overlaps: the next poll is scheduled only
// after the current one finishes, with 0 to 5 seconds of jitter so several bot instances do not poll in lockstep.
import type { Ctx, OutboxItem, SiteClient } from "../../types";

export const POLL_INTERVAL_MS = 30_000;
export const POLL_JITTER_MS = 5_000;
export const MAX_NOTICE_TEXT = 600;

export type Route =
  | { type: "dm" }
  | { type: "thread"; channel: string; threadTs: string | null }
  | { type: "announcement" };

// ticket-reply items are posted into a ticket thread: slackId holds the channel, href the thread's message ts.
// announcement items go to the community channel. Everything else is a DM.
export function routeItem(item: Pick<OutboxItem, "kind" | "slackId" | "href">): Route {
  if (item.kind.startsWith("ticket-reply:")) return { type: "thread", channel: item.slackId, threadTs: item.href };
  if (item.kind === "announcement") return { type: "announcement" };
  return { type: "dm" };
}

// A link that starts with "/" is a site path, so it gets the site's base URL. Anything else is used as it is.
export function composeText(text: string, href: string | null, siteBaseUrl: string): string {
  if (!href) return text;
  const link = href.startsWith("/") ? `${siteBaseUrl.replace(/\/+$/, "")}${href}` : href;
  return `${text}\n${link}`;
}

export type DeliverDeps = {
  ctx: Ctx;
  site: Pick<SiteClient, "ackOutbox" | "failOutbox">;
};

// Delivers one item and acknowledges or fails it. Returns the outcome, which is also what the tests assert on.
export async function deliverItem(item: OutboxItem, deps: DeliverDeps): Promise<"sent" | "failed"> {
  const { ctx, site } = deps;
  const route = routeItem(item);

  if (route.type === "thread") {
    if (!route.threadTs) {
      await site.failOutbox(item.id, "bad_item", true);
      return "failed";
    }
    const posted = await ctx.say({ channel: route.channel, text: item.text.slice(0, MAX_NOTICE_TEXT), threadTs: route.threadTs });
    if (!posted) {
      await site.failOutbox(item.id, "say_failed", false);
      return "failed";
    }
    await site.ackOutbox(item.id);
    return "sent";
  }

  if (route.type === "announcement") {
    if (!ctx.config.communityChannelId) {
      await site.failOutbox(item.id, "no_channel", true);
      return "failed";
    }
    const posted = await ctx.say({
      channel: ctx.config.communityChannelId,
      text: composeText(item.text.slice(0, MAX_NOTICE_TEXT), item.href, ctx.config.siteBaseUrl),
    });
    if (!posted) {
      await site.failOutbox(item.id, "say_failed", false);
      return "failed";
    }
    await site.ackOutbox(item.id);
    return "sent";
  }

  const res = await ctx.dm(item.slackId, composeText(item.text.slice(0, MAX_NOTICE_TEXT), item.href, ctx.config.siteBaseUrl));
  if (res.ok) {
    await site.ackOutbox(item.id);
    return "sent";
  }
  await site.failOutbox(item.id, res.code, res.final);
  return "failed";
}

export type Poller = { tick(): Promise<void>; start(): void; stop(): void };

export function createOutboxPoller(opts: {
  ctx: Ctx;
  random: () => number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
}): Poller {
  const { ctx } = opts;
  let running = false;
  let stopped = false;
  let handle: unknown = null;

  // Never throws: a bad item or a failed fetch is logged and the next poll still happens.
  const tick = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      let items: OutboxItem[];
      try {
        items = await ctx.site.outbox();
      } catch {
        ctx.log.warn("outbox.fetch_failed");
        return;
      }
      for (const item of items) {
        try {
          await deliverItem(item, { ctx, site: ctx.site });
        } catch {
          ctx.log.warn("outbox.item_failed", { kind: item.kind });
          await ctx.site.failOutbox(item.id, "exception", false).catch(() => ctx.log.warn("outbox.fail_failed"));
        }
      }
    } finally {
      running = false;
    }
  };

  const schedule = (): void => {
    if (stopped) return;
    const delay = POLL_INTERVAL_MS + Math.floor(opts.random() * POLL_JITTER_MS);
    handle = opts.setTimer(() => {
      void tick().then(schedule);
    }, delay);
  };

  return {
    tick,
    start() {
      stopped = false;
      schedule();
    },
    stop() {
      stopped = true;
      if (handle !== null) opts.clearTimer(handle);
    },
  };
}
