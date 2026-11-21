import { describe, expect, test } from "bun:test";
import { ADMIN_ID, CHANNEL, HELP_CHANNEL, HELPER_ID, MEMBER_ID, fakeApp, fakeCtx } from "../_testkit";
import commands from "./index";
import { COMMANDS, createRateLimiter, helpText, latestShip, meText, parseAsk, parseMentionId, shipMessage, validateShipText } from "./rules";

describe("rate limiter", () => {
  test("allows 10 uses in a minute, then refuses until the window slides", () => {
    const l = createRateLimiter({ limit: 10, windowMs: 60_000 });
    for (let i = 0; i < 10; i += 1) expect(l.take("U1", 1000 + i)).toBe(true);
    expect(l.take("U1", 1011)).toBe(false);
    expect(l.take("U2", 1011)).toBe(true);
    expect(l.take("U1", 61_000)).toBe(true);
  });
});

describe("ship rules", () => {
  test("text must be present and at most 200 characters", () => {
    expect(validateShipText("   ")).toMatchObject({ ok: false });
    expect(validateShipText("a".repeat(201))).toMatchObject({ ok: false });
    expect(validateShipText(" hello ")).toEqual({ ok: true, text: "hello" });
  });

  test("latest ship is the newest approvedAt", () => {
    const older = { projectId: "p1", title: "Old", url: "https://a.test", approvedAt: "2026-01-01T00:00:00.000Z" };
    const newer = { projectId: "p2", title: "New", url: "https://b.test", approvedAt: "2026-02-01T00:00:00.000Z" };
    expect(latestShip([older, newer])?.title).toBe("New");
    expect(latestShip([])).toBeNull();
  });

  test("message shape", () => {
    const ship = { projectId: "p", title: "Synth", url: "https://site.test/p", approvedAt: "2026-01-01T00:00:00.000Z" };
    expect(shipMessage("U0000000004", ship, "it works")).toBe("<@U0000000004> shipped Synth: it works https://site.test/p");
  });
});

describe("ask and mention parsing", () => {
  test("public is the first word only", () => {
    expect(parseAsk("public how do I start")).toEqual({ isPublic: true, question: "how do I start" });
    expect(parseAsk("PUBLIC")).toBeNull();
    expect(parseAsk("how public is it")).toEqual({ isPublic: false, question: "how public is it" });
    expect(parseAsk("   ")).toBeNull();
  });

  test("mentions with or without a name, and bad ids", () => {
    expect(parseMentionId("<@U0000000004|name>")).toBe("U0000000004");
    expect(parseMentionId("<@U0000000004>")).toBe("U0000000004");
    expect(parseMentionId("<@u1>")).toBeNull();
    expect(parseMentionId("just text")).toBeNull();
  });
});

describe("me text", () => {
  test("unlinked people are told how to link, with nothing else", () => {
    expect(meText({ linked: false })).toBe("Link your Hack Club account on the site (Settings) so I can find you.");
  });

  test("linked people see handle, levels, total hours and Ore", () => {
    const text = meText({
      linked: true,
      handle: "maker",
      levels: [{ track: "Tools", level: 2, approvedHours: 40 }],
      approvedHours: 40,
      ore: 7,
    });
    expect(text).toBe("Handle: maker\nTools: level 2, 40 approved hours\nTotal approved hours: 40\nOre: 7");
  });
});

describe("command list", () => {
  test("help lists every command name once", () => {
    const names = COMMANDS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of ["/loadout-remind", "/loadout-countdown", "/loadout-poll", "/loadout-addhelper"]) expect(names).toContain(n);
    expect(helpText()).toContain("/loadout-addhelper @user (admins)");
  });
});

describe("command handlers", () => {
  const cmd = (name: string, text: string, user = MEMBER_ID) => ({ name, text, user_id: user, channel_id: CHANNEL });

  async function run(app: ReturnType<typeof fakeApp>, name: string, c: ReturnType<typeof cmd>, ctx: ReturnType<typeof fakeCtx>) {
    const replies: { text: string; response_type?: string }[] = [];
    let acked = false;
    const handler = app.commands.get(name);
    if (!handler) throw new Error(`no handler for ${name}`);
    await handler({
      ack: async () => {
        acked = true;
      },
      command: { text: c.text, user_id: c.user_id, channel_id: c.channel_id },
      respond: async (m: { text: string; response_type?: string }) => {
        replies.push(m);
      },
    });
    expect(acked).toBe(true);
    return replies;
  }

  test("registers the commands and answers /loadout-me for an unlinked person", async () => {
    const app = fakeApp();
    const ctx = fakeCtx();
    await commands.register(app, ctx);
    expect(app.commands.has("/loadout-me")).toBe(true);
    const replies = await run(app, "/loadout-me", cmd("/loadout-me", ""), ctx);
    expect(replies[0]?.text).toContain("Link your Hack Club account");
    expect(replies[0]?.response_type).toBe("ephemeral");
    expect(ctx.stats.commandsRun).toBe(1);
  });

  test("ship refuses without an approved ship and posts with one", async () => {
    const app = fakeApp();
    const ctx = fakeCtx();
    await commands.register(app, ctx);
    const none = await run(app, "/loadout-ship", cmd("/loadout-ship", "it works"), ctx);
    expect(none[0]?.text).toContain("approved ship");
    expect(ctx.says.length).toBe(0);

    ctx.site.ships = [{ projectId: "p", title: "Synth", url: "https://site.test/p", approvedAt: "2026-01-01T00:00:00.000Z" }];
    await run(app, "/loadout-ship", cmd("/loadout-ship", "it works"), ctx);
    expect(ctx.says[0]).toEqual({ channel: CHANNEL, text: `<@${MEMBER_ID}> shipped Synth: it works https://site.test/p` });
  });

  test("helpers list is for helpers only; add helper is for admins only", async () => {
    const app = fakeApp();
    const ctx = fakeCtx();
    ctx.site.helpers = [HELPER_ID];
    await commands.register(app, ctx);
    const denied = await run(app, "/loadout-helpers", cmd("/loadout-helpers", "", MEMBER_ID), ctx);
    expect(denied[0]?.text).toContain("Only helpers");
    const allowed = await run(app, "/loadout-helpers", cmd("/loadout-helpers", "", HELPER_ID), ctx);
    expect(allowed[0]?.text).toBe(`Helpers: <@${HELPER_ID}>`);

    const notAdmin = await run(app, "/loadout-addhelper", cmd("/loadout-addhelper", `<@${HELPER_ID}>`, MEMBER_ID), ctx);
    expect(notAdmin[0]?.text).toContain("Only admins");
    expect(ctx.site.calls.some((c) => c.method === "addHelper")).toBe(false);

    await run(app, "/loadout-addhelper", cmd("/loadout-addhelper", `<@${MEMBER_ID}|name>`, ADMIN_ID), ctx);
    expect(ctx.site.calls.find((c) => c.method === "addHelper")?.args).toEqual([ADMIN_ID, MEMBER_ID]);
  });

  test("ask without a docs answer points at the help channel only when it is set", async () => {
    const app = fakeApp();
    const ctx = fakeCtx();
    await commands.register(app, ctx);
    const replies = await run(app, "/loadout-ask", cmd("/loadout-ask", "what is ore"), ctx);
    expect(replies[0]?.text).toContain(`<#${HELP_CHANNEL}>`);

    const bare = fakeCtx({ config: { helpChannelId: "" } });
    const app2 = fakeApp();
    await commands.register(app2, bare);
    const r2 = await run(app2, "/loadout-ask", cmd("/loadout-ask", "what is ore"), bare);
    expect(r2[0]?.text).not.toContain("<#");
  });

  test("a site failure is answered politely and logged", async () => {
    const app = fakeApp();
    const ctx = fakeCtx({ site: { person: async () => { throw new Error("boom"); } } });
    await commands.register(app, ctx);
    const replies = await run(app, "/loadout-me", cmd("/loadout-me", ""), ctx);
    expect(replies[0]?.text).toContain("Something went wrong");
    expect(ctx.log.events.some((e) => e.event === "command.failed")).toBe(true);
  });
});
