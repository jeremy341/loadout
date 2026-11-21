import { describe, expect, test } from "bun:test";
import { BOT_USER_ID, HELP_CHANNEL, fakeApp, fakeCtx } from "../_testkit";
import orphan from "./index";
import { THANK_COOLDOWN_MS, shouldThank } from "./rule";

const ORPHAN = "B0000000001";
const config = { orphanBotId: ORPHAN, helpChannelId: HELP_CHANNEL };
const base = { channel: "C0000000003", ts: "1700.1", bot_id: ORPHAN };
const T0 = 1_000_000_000_000;

describe("shouldThank", () => {
  test("thanks a message from the orphan bot in an ordinary channel", () => {
    expect(shouldThank(base, new Map(), T0, config, BOT_USER_ID)).toBe(true);
    expect(shouldThank({ ...base, bot_id: undefined, user: ORPHAN }, new Map(), T0, config)).toBe(true);
  });

  test("ignores other bots, humans and the bot's own messages", () => {
    expect(shouldThank({ ...base, bot_id: "B9999999999" }, new Map(), T0, config)).toBe(false);
    expect(shouldThank({ channel: "C1", ts: "1", user: "U0000000004" }, new Map(), T0, config)).toBe(false);
    expect(shouldThank({ ...base, user: BOT_USER_ID }, new Map(), T0, config, BOT_USER_ID)).toBe(false);
  });

  test("ignores edits and deletes, but allows bot_message", () => {
    expect(shouldThank({ ...base, subtype: "message_changed" }, new Map(), T0, config)).toBe(false);
    expect(shouldThank({ ...base, subtype: "bot_message" }, new Map(), T0, config)).toBe(true);
  });

  test("never in the help channel", () => {
    expect(shouldThank({ ...base, channel: HELP_CHANNEL }, new Map(), T0, config)).toBe(false);
  });

  test("at most once per channel per 10 minutes", () => {
    const last = new Map([[base.channel, T0]]);
    expect(shouldThank(base, last, T0 + THANK_COOLDOWN_MS - 1, config)).toBe(false);
    expect(shouldThank(base, last, T0 + THANK_COOLDOWN_MS, config)).toBe(true);
    expect(shouldThank({ ...base, channel: "C0000000005" }, last, T0 + 1, config)).toBe(true);
  });

  test("an empty orphan id switches the rule off", () => {
    expect(shouldThank(base, new Map(), T0, { ...config, orphanBotId: "" })).toBe(false);
  });
});

describe("orphan module", () => {
  test("registers nothing when the orphan id is empty", async () => {
    const app = fakeApp();
    await orphan.register(app, fakeCtx({ config: { orphanBotId: "" } }));
    expect(app.events.size).toBe(0);
  });

  test("replies in a thread once, then waits out the cooldown", async () => {
    const app = fakeApp();
    const ctx = fakeCtx({ config: { orphanBotId: ORPHAN, helpChannelId: HELP_CHANNEL }, now: new Date(T0) });
    orphan.register(app, ctx);
    const handler = app.events.get("message");
    if (!handler) throw new Error("no message handler");
    await handler({ event: { ...base } });
    await handler({ event: { ...base, ts: "1700.2" } });
    expect(ctx.says).toEqual([{ channel: base.channel, text: "thx orphan", threadTs: "1700.1" }]);
    ctx.clock.now = new Date(T0 + THANK_COOLDOWN_MS);
    await handler({ event: { ...base, ts: "1700.3", thread_ts: "1700.0" } });
    expect(ctx.says[1]?.threadTs).toBe("1700.0");
  });
});
