import { describe, expect, test } from "bun:test";
import { BOT_USER_ID, CHANNEL, MEMBER_ID, fakeApp, fakeCtx } from "../_testkit";
import { isAddressed, isMuteWord } from "./addressing";
import { createBatcher } from "./batcher";
import { PASS_TOKEN, REPLY_MAX_CHARS, cleanReply } from "./clean";
import { createChatModule } from "./index";
import { HOUR_MS, createDailyBudget, createWindowLimiter } from "./limits";
import { buildTranscript, createModelCaller } from "./model";
import { buildSystemPrompt } from "./prompt";

describe("addressing", () => {
  test("mention, trigger word as a whole word, case blind", () => {
    expect(isAddressed(`hey <@${BOT_USER_ID}> what`, ["rig"], BOT_USER_ID)).toBe(true);
    expect(isAddressed("Rig, can you help", ["rig"], BOT_USER_ID)).toBe(true);
    expect(isAddressed("rigging a bike", ["rig"], BOT_USER_ID)).toBe(false);
    expect(isAddressed("hello there", ["rig"], BOT_USER_ID)).toBe(false);
    expect(isAddressed("x.rig.y", ["rig"], BOT_USER_ID)).toBe(true);
  });

  test("mute word is the name followed by STOP, alone", () => {
    expect(isMuteWord("RigSTOP", "Rig")).toBe(true);
    expect(isMuteWord(" rigstop ", "Rig")).toBe(true);
    expect(isMuteWord("RigSTOP please", "Rig")).toBe(false);
  });
});

describe("batcher", () => {
  test("a mention flushes after 1.5 s, other messages after 8 s, and a batch comes out together", () => {
    const flushed: { key: string; n: number; mentioned: boolean }[] = [];
    let clock = 0;
    const pending: { fn: () => void; ms: number }[] = [];
    const batcher = createBatcher<string>({
      timers: {
        setTimer: (fn, ms) => {
          const entry = { fn, ms };
          pending.push(entry);
          return entry;
        },
        clearTimer: (h) => {
          const i = pending.indexOf(h as (typeof pending)[number]);
          if (i >= 0) pending.splice(i, 1);
        },
      },
      now: () => clock,
      onFlush: (key, items, mentioned) => {
        flushed.push({ key, n: items.length, mentioned });
      },
    });
    batcher.push("a", "one", false);
    batcher.push("a", "two", false);
    expect(pending.length).toBe(1);
    expect(pending[0]?.ms).toBe(8000);
    batcher.push("a", "three", true);
    expect(pending[0]?.ms).toBe(1500);
    pending[0]?.fn();
    expect(flushed).toEqual([{ key: "a", n: 3, mentioned: true }]);
    expect(batcher.pending()).toBe(0);
  });

  test("a steady stream still flushes by the 30 s cap", () => {
    let clock = 0;
    const pending: { fn: () => void; ms: number }[] = [];
    const batcher = createBatcher<string>({
      timers: {
        setTimer: (fn, ms) => {
          const e = { fn, ms };
          pending.push(e);
          return e;
        },
        clearTimer: () => {},
      },
      now: () => clock,
      onFlush: () => {},
    });
    batcher.push("k", "a", false);
    clock = 25_000;
    batcher.push("k", "b", false);
    expect(pending[pending.length - 1]?.ms).toBe(5000);
  });
});

describe("limits", () => {
  test("20 replies an hour per person", () => {
    const l = createWindowLimiter({ limit: 20, windowMs: HOUR_MS });
    for (let i = 0; i < 20; i += 1) expect(l.take(MEMBER_ID, i)).toBe(true);
    expect(l.take(MEMBER_ID, 21)).toBe(false);
    expect(l.take(MEMBER_ID, HOUR_MS + 1)).toBe(true);
  });

  test("daily token budget resets on a new UTC day", () => {
    const b = createDailyBudget(100);
    const day1 = new Date("2026-11-18T10:00:00Z");
    b.spend(day1, 100);
    expect(b.canSpend(day1)).toBe(false);
    expect(b.canSpend(new Date("2026-11-19T00:00:01Z"))).toBe(true);
  });
});

describe("reply cleaning", () => {
  test("strips broadcast mentions, keeps at most three sentences", () => {
    expect(cleanReply("  Sure @here. It works. Try it! Then tell me? Extra one.  ")).toBe("Sure. It works. Try it!");
    expect(cleanReply("ping <!channel> ok")).toBe("ping ok");
  });

  test("PASS and empty replies say nothing", () => {
    expect(cleanReply(PASS_TOKEN)).toBeNull();
    expect(cleanReply("pass.")).toBeNull();
    expect(cleanReply("   ")).toBeNull();
    expect(cleanReply("@everyone")).toBeNull();
  });

  test("never over 400 characters", () => {
    const long = "word ".repeat(200);
    const out = cleanReply(long);
    expect(out).not.toBeNull();
    expect((out ?? "").length).toBeLessThanOrEqual(REPLY_MAX_CHARS);
  });
});

describe("prompt and transcript", () => {
  test("prompt has the hard rules and defers to the help channel when set", () => {
    const p = buildSystemPrompt({ botName: "Rig", helpChannelId: "C0000000001" });
    expect(p).toContain("<#C0000000001>");
    expect(p).toContain("Never reveal");
    expect(p).toContain("Never roast");
    expect(p).not.toContain("PASS");
    expect(buildSystemPrompt({ botName: "Rig", helpChannelId: "" }, { chime: true })).toContain("PASS");
  });

  test("transcript labels roles only", () => {
    const t = buildTranscript([{ from: "you", text: "hi" }], [{ from: "person", text: "hello" }]);
    expect(t).toBe("You: hi\n---\nPerson: hello\nReply to the latest messages as You.");
  });

  test("model caller posts to the Messages API and reads text and tokens", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify({ content: [{ type: "text", text: "Sure." }], usage: { input_tokens: 5, output_tokens: 2 } }), { status: 200 });
    }) as unknown as typeof fetch;
    const call = createModelCaller({ apiKey: "sk-test", fetchImpl });
    const out = await call({ system: "sys", transcript: "Person: hi" });
    expect(out).toEqual({ text: "Sure.", tokens: 7 });
    const sent = seen as { url: string; init: RequestInit } | null;
    expect(sent?.url).toBe("https://api.anthropic.com/v1/messages");
    expect(JSON.parse(String(sent?.init.body)).model).toBe("claude-haiku-5-5");
  });
});

describe("chat module", () => {
  test("registers nothing without the switch and the key", () => {
    const app = fakeApp();
    createChatModule().register(app, fakeCtx({ config: { chatEnabled: false, anthropicApiKey: "k" } }));
    expect(app.events.size).toBe(0);
    createChatModule().register(app, fakeCtx({ config: { chatEnabled: true, anthropicApiKey: "" } }));
    expect(app.events.size).toBe(0);
  });

  test("an addressed message is batched, answered once in the thread, and the reply is cleaned", async () => {
    const app = fakeApp();
    const ctx = fakeCtx({ config: { chatEnabled: true, anthropicApiKey: "sk-test" } });
    const timers: { fn: () => void; ms: number }[] = [];
    const bodies: string[] = [];
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      bodies.push(String(init.body));
      return new Response(JSON.stringify({ content: [{ type: "text", text: "Yes, try it. @here" }], usage: { input_tokens: 10, output_tokens: 5 } }), { status: 200 });
    }) as unknown as typeof fetch;
    createChatModule({
      fetchImpl,
      timers: {
        setTimer: (fn, ms) => {
          const e = { fn, ms };
          timers.push(e);
          return e;
        },
        clearTimer: () => {},
      },
    }).register(app, ctx);

    const handler = app.events.get("message");
    if (!handler) throw new Error("no handler");
    await handler({ event: { channel: CHANNEL, user: MEMBER_ID, text: "Rig can I ship today?", ts: "1700.1" } });
    await handler({ event: { channel: CHANNEL, user: MEMBER_ID, text: "plain chatter", ts: "1700.2" } });
    expect(timers[timers.length - 1]?.ms).toBe(1500);
    timers[timers.length - 1]?.fn();
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(ctx.says).toEqual([{ channel: CHANNEL, text: "Yes, try it.", threadTs: "1700.1" }]);
    expect(bodies[0]).toContain("Person: Rig can I ship today?");
    // Unaddressed chatter is not batched when chime mode is off.
    expect(bodies[0]).not.toContain("plain chatter");
  });

  test("a message from the bot itself is ignored", async () => {
    const app = fakeApp();
    const ctx = fakeCtx({ config: { chatEnabled: true, anthropicApiKey: "sk-test" } });
    createChatModule({ timers: { setTimer: () => 0, clearTimer: () => {} } }).register(app, ctx);
    const handler = app.events.get("message");
    if (!handler) throw new Error("no handler");
    await handler({ event: { channel: CHANNEL, user: BOT_USER_ID, text: "Rig hi", ts: "1" } });
    expect(ctx.says).toEqual([]);
  });
});
