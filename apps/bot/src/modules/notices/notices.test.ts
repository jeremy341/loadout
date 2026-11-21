import { describe, expect, test } from "bun:test";
import { COMMUNITY_CHANNEL, fakeCtx, fakeSite } from "../_testkit";
import { nextDelayMs } from "./backoff";
import { createOrderAlerts, parseOrdersCommand } from "./orders";
import { POLL_INTERVAL_MS, POLL_JITTER_MS, composeText, createOutboxPoller, deliverItem, routeItem } from "./outbox";

const item = (partial: Partial<{ id: string; kind: string; slackId: string; text: string; href: string | null }> = {}) => ({
  id: "o1",
  kind: "dm",
  slackId: "U0000000004",
  text: "Your ship was approved.",
  href: null,
  ...partial,
});

describe("backoff", () => {
  test("1 minute, 5 minutes, 30 minutes, then stop", () => {
    expect(nextDelayMs(1)).toBe(60_000);
    expect(nextDelayMs(2)).toBe(300_000);
    expect(nextDelayMs(3)).toBe(1_800_000);
    expect(nextDelayMs(4)).toBeNull();
    expect(nextDelayMs(0)).toBe(60_000);
  });
});

describe("routing and text", () => {
  test("ticket replies go to threads, announcements to the community, the rest to DMs", () => {
    expect(routeItem({ kind: "ticket-reply:helper", slackId: "C1", href: "1700.1" })).toEqual({ type: "thread", channel: "C1", threadTs: "1700.1" });
    expect(routeItem({ kind: "announcement", slackId: "", href: null })).toEqual({ type: "announcement" });
    expect(routeItem({ kind: "ship", slackId: "U1", href: null })).toEqual({ type: "dm" });
  });

  test("site paths get the base URL, full links stay as they are", () => {
    expect(composeText("Hi", "/dashboard", "https://site.test/")).toBe("Hi\nhttps://site.test/dashboard");
    expect(composeText("Hi", "https://other.test/x", "https://site.test")).toBe("Hi\nhttps://other.test/x");
    expect(composeText("Hi", null, "https://site.test")).toBe("Hi");
  });
});

describe("deliverItem", () => {
  test("a DM is sent with its link and acknowledged", async () => {
    const ctx = fakeCtx({ dmResult: { ok: true } });
    const outcome = await deliverItem(item({ href: "/dashboard" }), { ctx, site: ctx.site });
    expect(outcome).toBe("sent");
    expect(ctx.dms[0]).toEqual({ slackId: "U0000000004", text: "Your ship was approved.\nhttps://site.test/dashboard" });
    expect(ctx.site.acked).toEqual(["o1"]);
  });

  test("a failed DM is reported with the final flag from the DM result", async () => {
    const ctx = fakeCtx({ dmResult: { ok: false, code: "user_not_found", final: true } });
    await deliverItem(item(), { ctx, site: ctx.site });
    expect(ctx.site.failed).toEqual([{ id: "o1", code: "user_not_found", final: true }]);
    expect(ctx.site.acked).toEqual([]);
  });

  test("ticket replies post into the thread", async () => {
    const ctx = fakeCtx();
    await deliverItem(item({ kind: "ticket-reply:helper", slackId: "C0000000009", href: "1700.5", text: "Try this." }), { ctx, site: ctx.site });
    expect(ctx.says[0]).toEqual({ channel: "C0000000009", text: "Try this.", threadTs: "1700.5" });
    expect(ctx.dms).toEqual([]);
    expect(ctx.site.acked).toEqual(["o1"]);
  });

  test("announcements need the community channel, else fail final", async () => {
    const off = fakeCtx({ config: { communityChannelId: "" } });
    await deliverItem(item({ kind: "announcement", slackId: "" }), { ctx: off, site: off.site });
    expect(off.site.failed).toEqual([{ id: "o1", code: "no_channel", final: true }]);

    const on = fakeCtx();
    await deliverItem(item({ kind: "announcement", slackId: "", href: "/ships/1" }), { ctx: on, site: on.site });
    expect(on.says[0]?.channel).toBe(COMMUNITY_CHANNEL);
    expect(on.says[0]?.text).toBe("Your ship was approved.\nhttps://site.test/ships/1");
  });
});

describe("poller", () => {
  test("tick delivers every item and survives a failing fetch", async () => {
    const ctx = fakeCtx({ site: { outboxItems: [item({ id: "a" }), item({ id: "b" })] } });
    const poller = createOutboxPoller({ ctx, random: () => 0, setTimer: () => 0, clearTimer: () => {} });
    await poller.tick();
    expect(ctx.site.acked).toEqual(["a", "b"]);

    const broken = fakeSite();
    broken.outbox = async () => {
      throw new Error("down");
    };
    const ctx2 = fakeCtx({ site: broken });
    await createOutboxPoller({ ctx: ctx2, random: () => 0, setTimer: () => 0, clearTimer: () => {} }).tick();
    expect(ctx2.log.events.some((e) => e.event === "outbox.fetch_failed")).toBe(true);
  });

  test("the next poll is scheduled after the interval plus jitter, and stop cancels it", () => {
    const delays: number[] = [];
    const cleared: unknown[] = [];
    const ctx = fakeCtx();
    const poller = createOutboxPoller({
      ctx,
      random: () => 0.5,
      setTimer: (_fn, ms) => {
        delays.push(ms);
        return "h";
      },
      clearTimer: (h) => cleared.push(h),
    });
    poller.start();
    expect(delays).toEqual([POLL_INTERVAL_MS + Math.floor(0.5 * POLL_JITTER_MS)]);
    poller.stop();
    expect(cleared).toEqual(["h"]);
  });
});

describe("orders DM commands", () => {
  test("parses exactly the three phrases", () => {
    expect(parseOrdersCommand("orders on")).toBe("on");
    expect(parseOrdersCommand("  Orders OFF ")).toBe("off");
    expect(parseOrdersCommand("orders status")).toBe("status");
    expect(parseOrdersCommand("orders on please")).toBeNull();
    expect(parseOrdersCommand("orders")).toBeNull();
  });

  test("the preference is off by default and lives in memory", () => {
    const alerts = createOrderAlerts();
    expect(alerts.get("U0000000004")).toBe(false);
    alerts.set("U0000000004", true);
    expect(alerts.get("U0000000004")).toBe(true);
    alerts.set("U0000000004", false);
    expect(alerts.count()).toBe(0);
  });
});
