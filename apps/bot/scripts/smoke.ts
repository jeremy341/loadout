// Smoke test for the desk and docs wiring. Boots the desk against the in-memory site and a fake Slack client
// (no network), drives it with synthetic Slack events and button presses, and asserts the outcome of each flow:
// new question, title modal, thread note, helper macro, auto-close, docs fallback and the site-down retry.
// Run from apps/bot: bun run scripts/smoke.ts   (exit code 0 on success)
import type { App } from "@slack/bolt";
import { createAccess } from "../src/access";
import { loadConfig } from "../src/config";
import { createLogger } from "../src/log";
import { createSlackWeb, type SlackClient } from "../src/slack/app";
import { createFakeSite } from "../src/site/fake";
import { threadMutes } from "../src/modules/desk/mute";
import { wireDesk } from "../src/modules/desk";
import { createDocsAnswerer } from "../src/modules/docs/answer";
import type { Ctx, Stats } from "../src/types";

const HELP = "C0000000001";
const ASKER = "U0000000PER";
const HELPER = "U0000000HLP";
const ADMIN = "U0000000ADM";
const BOT = "U0000000BOT";
const SITE = "https://site.example.test";

const config = loadConfig({
  SLACK_BOT_TOKEN: "xoxb-smoke-not-real",
  SLACK_SIGNING_SECRET: "smoke-signing",
  SITE_BASE_URL: SITE,
  SERVICE_KEY_SLACK_BOT: "s".repeat(40),
  HELP_CHANNEL_ID: HELP,
  ADMIN_SLACK_IDS: ADMIN,
});

let clock = Date.parse("2026-11-18T10:00:00.000Z");
const now = () => new Date(clock);
const log = createLogger("warn", (line) => {
  if (process.env.SMOKE_VERBOSE) console.log(line);
});

// Fake Slack: records every call and hands back timestamps. Only the methods the desk uses are present.
type Call = { op: string; args: Record<string, unknown> };
const calls: Call[] = [];
let tsCounter = 0;
const nextTs = () => `1700000100.${String(++tsCounter).padStart(6, "0")}`;
const record = (op: string, args: Record<string, unknown>) => calls.push({ op, args });
const fakeClient = {
  chat: {
    postMessage: async (args: Record<string, unknown>) => {
      // The returned ts is also kept on the call so the script can match later edits to it.
      const ts = nextTs();
      record("chat.postMessage", { ...args, returnedTs: ts });
      return { ok: true, ts, channel: args.channel };
    },
    update: async (args: Record<string, unknown>) => {
      record("chat.update", args);
      return { ok: true, ts: args.ts };
    },
    delete: async (args: Record<string, unknown>) => {
      record("chat.delete", args);
      return { ok: true };
    },
    postEphemeral: async (args: Record<string, unknown>) => {
      record("chat.postEphemeral", args);
      return { ok: true };
    },
  },
  reactions: {
    add: async (args: Record<string, unknown>) => {
      record("reactions.add", args);
      return { ok: true };
    },
    remove: async (args: Record<string, unknown>) => {
      record("reactions.remove", args);
      return { ok: true };
    },
  },
  conversations: {
    open: async (args: Record<string, unknown>) => {
      record("conversations.open", args);
      return { ok: true, channel: { id: "D0000000001" } };
    },
  },
  views: {
    open: async (args: Record<string, unknown>) => {
      record("views.open", args);
      return { ok: true };
    },
  },
  auth: { test: async () => ({ ok: true, user_id: BOT }) },
} as unknown as SlackClient;

// Fake Bolt app: stores the handlers the modules register so the script can call them directly.
type Handler = (args: Record<string, unknown>) => Promise<void>;
const events = new Map<string, Handler>();
const actions = new Map<string, Handler>();
const views = new Map<string, Handler>();
const fakeApp = {
  client: fakeClient,
  event: (type: string, fn: Handler) => events.set(type, fn),
  action: (id: string, fn: Handler) => actions.set(id, fn),
  view: (id: string, fn: Handler) => views.set(id, fn),
  use: () => undefined,
  error: () => undefined,
} as unknown as App;

// Fake docs site: one docs page, one plans page (which must never be fetched).
const pages: Record<string, string> = {
  [`${SITE}/docs/sitemap.xml`]: `<urlset><url><loc>${SITE}/docs/ore</loc></url><url><loc>${SITE}/docs/plans/internal</loc></url></urlset>`,
  [`${SITE}/docs/ore`]: `<html><head><title>Ore</title></head><body><p>Ore is earned by approved hours. Ten Ore is a set price.</p></body></html>`,
  [`${SITE}/docs/plans/internal`]: "<html><body>secret plan: Ore is free</body></html>",
};
const fetchedPlans: string[] = [];
const fakeFetch = (async (input: string | URL | Request) => {
  const url = String(input);
  if (url.includes("/plans/")) fetchedPlans.push(url);
  const body = pages[url];
  if (body === undefined) return new Response("missing", { status: 404 });
  return new Response(body, { status: 200, headers: { "content-type": url.endsWith(".xml") ? "application/xml" : "text/html" } });
}) as unknown as typeof fetch;

const site = createFakeSite({ helpers: [HELPER], admins: [ADMIN], clock: now });
const web = createSlackWeb(fakeClient, { log, now: () => Date.now(), sleep: async () => undefined });
const access = createAccess({ site, adminSlackIds: config.adminSlackIds });
const stats: Stats = { ticketsOpened: 0, answeredFromDocs: 0, autoClosed: 0, remindersSent: 0, commandsRun: 0 };
const answer = createDocsAnswerer({ siteBaseUrl: SITE, anthropicApiKey: "", site, fetch: fakeFetch, now: () => clock, log });

const ctx: Ctx = {
  config,
  site,
  log,
  stats,
  botUserId: BOT,
  now,
  isHelper: access.isHelper,
  isAdmin: access.isAdmin,
  answer,
  say: web.say,
  dm: web.dm,
};

const { flow } = wireDesk(fakeApp, ctx, {
  emoji: config.emoji,
  web,
  now,
  // Advancing the clock is the only "wait" the smoke needs. The first wait also brings the site back.
  sleep: async (ms) => {
    clock += ms;
    site.setDown(false);
  },
});

// Dispatch helpers that mirror how Bolt calls the handlers.
async function message(event: Record<string, unknown>): Promise<void> {
  const fn = events.get("message");
  if (!fn) throw new Error("no message handler");
  await fn({ event });
}
async function button(id: string, value: string, user: string, extra: Record<string, unknown> = {}): Promise<void> {
  const fn = actions.get(id);
  if (!fn) throw new Error(`no action ${id}`);
  await fn({
    ack: async () => undefined,
    action: { value },
    body: { user: { id: user }, channel: { id: HELP }, trigger_id: "T0000000001", ...extra },
  });
}

const failures: string[] = [];
function check(label: string, ok: boolean, detail = ""): void {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${ok || !detail ? "" : ` (${detail})`}`);
  if (!ok) failures.push(label);
}
const opsSince = (from: number, op: string) => calls.slice(from).filter((c) => c.op === op);

const QUESTION_TS = nextTs();
const RESET = calls.length;

async function main(): Promise<void> {
  // 1. A new question: reaction, placeholder, ticket, docs answer edited in place, title prompt.
  await message({
    channel: HELP,
    ts: QUESTION_TS,
    user: ASKER,
    text: "How is ore earned from approved hours?",
  });
  const reaction = opsSince(RESET, "reactions.add").find((c) => c.args.timestamp === QUESTION_TS);
  check("new question gets the open reaction", reaction?.args.name === config.emoji.open);
  const placeholder = opsSince(RESET, "chat.postMessage").find((c) => c.args.thread_ts === QUESTION_TS);
  check("a placeholder is posted in the thread", placeholder?.args.text === "Looking into it.");
  const tickets = [...site.state.tickets.values()];
  check("a ticket is created for the question", tickets.length === 1 && tickets[0]?.messageTs === QUESTION_TS);
  const update = opsSince(RESET, "chat.update").find((c) => String(c.args.text).includes("Ore is earned"));
  check("the docs answer edits the placeholder in place", update !== undefined && update.args.ts === placeholder?.args.returnedTs);
  check("the docs answer carries the doc link", String(update?.args.text).includes(`<${SITE}/docs/ore>`));
  check("the reply has a resolve button", JSON.stringify(update?.args.blocks).includes("desk_resolve"));
  const prompt = opsSince(RESET, "chat.postEphemeral").find((c) => c.args.user === ASKER);
  check("the author is offered a title prompt (ephemeral)", prompt !== undefined);
  check("stats count the ticket and the docs answer", stats.ticketsOpened === 1 && stats.answeredFromDocs === 1);
  check("the plans path was never fetched", fetchedPlans.length === 0);

  // 2. Title modal: the button opens a modal, the submission stores the title.
  await button("desk_title_open", tickets[0]?.id ?? "", ASKER);
  check("Set title opens the modal", opsSince(RESET, "views.open").length === 1);
  const ticketId = tickets[0]?.id ?? "";
  const submit = views.get("desk_title_submit");
  if (!submit) throw new Error("no title submit handler");
  await submit({
    ack: async () => undefined,
    view: {
      private_metadata: ticketId,
      state: { values: { title: { value: { value: "Ore question" } } } },
    },
  });
  check("the submitted title is saved on the ticket", site.state.tickets.get(ticketId)?.title === "Ore question");

  // 3. A person replies in the thread: it is recorded as a person message.
  await message({ channel: HELP, ts: nextTs(), thread_ts: QUESTION_TS, user: ASKER, text: "thanks, that helped a lot" });
  check("a person thread reply is stored on the ticket", site.state.messages.some((m) => m.authorKind === "person"));

  // 4. Thread mute: the exact name plus STOP mutes the thread.
  await message({ channel: HELP, ts: nextTs(), thread_ts: QUESTION_TS, user: ASKER, text: "RigSTOP" });
  check("RigSTOP mutes the thread", threadMutes.isMuted(HELP, QUESTION_TS));
  await message({ channel: HELP, ts: nextTs(), thread_ts: QUESTION_TS, user: ASKER, text: "RigSTART" });
  check("RigSTART unmutes the thread", !threadMutes.isMuted(HELP, QUESTION_TS));

  // 5. Helper macro: ?resolve closes the ticket, the reaction flips and the macro message is deleted.
  const macroTs = nextTs();
  const beforeMacro = calls.length;
  await message({ channel: HELP, ts: macroTs, thread_ts: QUESTION_TS, user: HELPER, text: "?resolve" });
  check("?resolve by a helper closes the ticket", site.state.tickets.get(ticketId)?.status === "closed");
  check("?resolve records the helper as closer", site.state.tickets.get(ticketId)?.closedBy === HELPER);
  check("the macro message is deleted after running", opsSince(beforeMacro, "chat.delete").some((c) => c.args.ts === macroTs));
  check(
    "the reaction flips to resolved",
    opsSince(beforeMacro, "reactions.add").some((c) => c.args.name === config.emoji.resolved),
  );

  // A non-helper cannot run a macro: the text is recorded as a normal message instead.
  const beforeFake = calls.length;
  await message({ channel: HELP, ts: nextTs(), thread_ts: QUESTION_TS, user: ASKER, text: "?reopen" });
  check("a macro from a non helper does nothing", opsSince(beforeFake, "chat.delete").length === 0 && site.state.tickets.get(ticketId)?.status === "closed");

  // 6. Reopen through the helper macro.
  await message({ channel: HELP, ts: nextTs(), thread_ts: QUESTION_TS, user: HELPER, text: "?reopen please" });
  check("?reopen by a helper reopens the ticket", site.state.tickets.get(ticketId)?.status === "open");

  // 7. Docs fallback: nothing in the docs covers this, so the placeholder says a helper will answer.
  const offTopicTs = nextTs();
  await message({ channel: HELP, ts: offTopicTs, user: ASKER, text: "Will there be a bus to the moon next summer?" });
  const offTopicUpdate = opsSince(RESET, "chat.update").find((c) => String(c.args.text).includes("A helper will answer"));
  check("no docs answer falls back to 'a helper will answer'", offTopicUpdate !== undefined);
  check("a second ticket is opened for it", site.state.tickets.size === 2);

  // 8. Auto-close: after 6 quiet days both open tickets (the reopened question and the off-topic one) qualify.
  clock += 6 * 24 * 60 * 60 * 1000;
  const beforeClose = calls.length;
  const closed = await flow.runAutoClose();
  check("auto-close closes both quiet open tickets", closed === 2, `closed ${closed}`);
  const closedTicket = [...site.state.tickets.values()].find((t) => t.messageTs === offTopicTs);
  check("the auto-closed ticket is closed in the site", closedTicket?.status === "closed");
  check("auto-close posts one note in the thread", opsSince(beforeClose, "chat.postMessage").filter((c) => c.args.thread_ts === offTopicTs).length === 1);
  check("stats count the auto closes", stats.autoClosed === 2);

  // 9. Site down: the ticket is retried and the placeholder changes; the first retry brings the site back.
  site.setDown(true);
  const downTs = nextTs();
  await message({ channel: HELP, ts: downTs, user: ASKER, text: "Can someone check my sensor wiring please" });
  const downUpdate = calls.filter((c) => c.op === "chat.update" && String(c.args.text).includes("could not reach"));
  check("site down changes the placeholder text", downUpdate.length >= 1);
  check("the ticket is created once the site is back", [...site.state.tickets.values()].some((t) => t.messageTs === downTs));

  console.log(failures.length === 0 ? "\nAll smoke checks passed." : `\n${failures.length} check(s) failed.`);
  if (failures.length > 0) process.exit(1);
}

main().catch((err: unknown) => {
  console.error("smoke crashed:", err);
  process.exit(1);
});
