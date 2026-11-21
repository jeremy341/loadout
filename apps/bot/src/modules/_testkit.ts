// Test-only fakes for the bot modules: a Ctx, a SiteClient, a Slack App and a Logger that record what happened.
// Only imports the contract types, so tests never depend on the slack, site or config code another agent writes.
import type { App } from "@slack/bolt";
import type { Config, Ctx, JobRow, Logger, OutboxItem, PersonView, QaRow, ShipView, SiteClient, Stats, TicketRow } from "../types";

export const BOT_USER_ID = "U0000000001";
export const ADMIN_ID = "U0000000002";
export const HELPER_ID = "U0000000003";
export const MEMBER_ID = "U0000000004";
export const HELP_CHANNEL = "C0000000001";
export const COMMUNITY_CHANNEL = "C0000000002";
export const CHANNEL = "C0000000003";

export function fakeConfig(overrides: Partial<Config> = {}): Config {
  return {
    botName: "Rig",
    triggerWords: ["rig"],
    slackBotToken: "xoxb-test",
    slackSigningSecret: "secret",
    siteBaseUrl: "https://site.test",
    serviceKey: "k".repeat(32),
    helpChannelId: HELP_CHANNEL,
    communityChannelId: COMMUNITY_CHANNEL,
    logChannelId: "",
    adminSlackIds: [ADMIN_ID],
    orphanBotId: "",
    orphanReply: "thx orphan",
    anthropicApiKey: "",
    chatEnabled: false,
    chatChime: false,
    port: 3000,
    logLevel: "error",
    ...overrides,
  };
}

export type FakeLog = Logger & { events: { level: string; event: string; fields?: Record<string, unknown> }[] };

export function fakeLog(): FakeLog {
  const events: FakeLog["events"] = [];
  const rec = (level: string) => (event: string, fields?: Record<string, unknown>) => {
    events.push({ level, event, fields });
  };
  return { events, debug: rec("debug"), info: rec("info"), warn: rec("warn"), error: rec("error") };
}

// An in-memory site. Each method records its calls so tests can assert on them.
export type FakeSite = SiteClient & {
  calls: { method: string; args: unknown[] }[];
  jobs: JobRow[];
  outboxItems: OutboxItem[];
  acked: string[];
  failed: { id: string; code: string; final: boolean }[];
  helpers: string[];
  personView: PersonView;
  ships: ShipView[];
  last: ShipView | null;
  listHelpersError: Error | null;
};

export function fakeSite(overrides: Partial<FakeSite> = {}): FakeSite {
  const calls: FakeSite["calls"] = [];
  const rec = (method: string, args: unknown[]) => calls.push({ method, args });
  const site: FakeSite = {
    calls,
    jobs: [],
    outboxItems: [],
    acked: [],
    failed: [],
    helpers: [],
    personView: { linked: false },
    ships: [],
    last: null,
    listHelpersError: null,
    async createTicket(input) {
      rec("createTicket", [input]);
      const ticket: TicketRow = {
        id: "t1",
        channelId: input.channelId,
        messageTs: input.messageTs,
        authorSlackId: input.authorSlackId,
        title: null,
        text: input.text,
        status: "open",
        claimedBy: null,
        closedBy: null,
        keepOpen: false,
        lastMessageAt: input.messageTs,
        createdAt: input.messageTs,
      };
      return { ticket, linked: false };
    },
    async getTicket() {
      rec("getTicket", []);
      return null;
    },
    async findTicketByMessage() {
      rec("findTicketByMessage", []);
      return null;
    },
    async updateTicket() {
      throw new Error("updateTicket not faked");
    },
    async addTicketMessage(id, input) {
      rec("addTicketMessage", [id, input]);
    },
    async listOpenTickets() {
      return [];
    },
    async similarTicket() {
      return null;
    },
    async listHelpers() {
      rec("listHelpers", []);
      if (site.listHelpersError) throw site.listHelpersError;
      return site.helpers;
    },
    async addHelper(admin, slackId) {
      rec("addHelper", [admin, slackId]);
    },
    async removeHelper(admin, slackId) {
      rec("removeHelper", [admin, slackId]);
    },
    async person(slackId) {
      rec("person", [slackId]);
      return site.personView;
    },
    async lastShip(slackId) {
      rec("lastShip", [slackId]);
      return site.last;
    },
    async approvedShips(slackId) {
      rec("approvedShips", [slackId]);
      return site.ships;
    },
    async outbox() {
      rec("outbox", []);
      const items = site.outboxItems;
      site.outboxItems = [];
      return items;
    },
    async ackOutbox(id) {
      site.acked.push(id);
    },
    async failOutbox(id, code, final) {
      site.failed.push({ id, code, final });
    },
    async qaGet(question): Promise<QaRow | null> {
      rec("qaGet", [question]);
      return null;
    },
    async qaPut(row) {
      rec("qaPut", [row]);
    },
    async listJobs() {
      return site.jobs.slice();
    },
    async createJob(input) {
      rec("createJob", [input]);
      const job: JobRow = { id: `j${site.jobs.length + 1}`, kind: input.kind, ownerSlackId: input.ownerSlackId, runAt: input.runAt, payload: input.payload };
      site.jobs.push(job);
      return job;
    },
    async finishJob(id) {
      rec("finishJob", [id]);
      site.jobs = site.jobs.filter((j) => j.id !== id);
    },
    async countJobs(ownerSlackId, kind) {
      return site.jobs.filter((j) => j.ownerSlackId === ownerSlackId && j.kind === kind).length;
    },
    ...overrides,
  };
  return site;
}

export type SayCall = { channel: string; text: string; threadTs?: string };
export type DmCall = { slackId: string; text: string };

export type FakeCtx = Ctx & { says: SayCall[]; dms: DmCall[]; clock: { now: Date }; log: FakeLog; site: FakeSite };

export function fakeCtx(opts: { config?: Partial<Config>; site?: Partial<FakeSite>; now?: Date; helpers?: string[]; dmResult?: { ok: true } | { ok: false; code: string; final: boolean }; say?: boolean } = {}): FakeCtx {
  const config = fakeConfig(opts.config);
  const site = fakeSite(opts.site);
  const clock = { now: opts.now ?? new Date("2026-11-18T12:00:00.000Z") };
  const says: SayCall[] = [];
  const dms: DmCall[] = [];
  const log = fakeLog();
  const helpers = new Set([...(opts.helpers ?? []), ...config.adminSlackIds, HELPER_ID]);
  const stats: Stats = { ticketsOpened: 0, answeredFromDocs: 0, autoClosed: 0, remindersSent: 0, commandsRun: 0 };
  const ctx: FakeCtx = {
    config,
    site,
    log,
    stats,
    botUserId: BOT_USER_ID,
    now: () => new Date(clock.now.getTime()),
    async isHelper(slackId) {
      return helpers.has(slackId);
    },
    isAdmin(slackId) {
      return config.adminSlackIds.includes(slackId);
    },
    async answer() {
      return null;
    },
    async say(args) {
      if (opts.say === false) return null;
      says.push(args);
      return { ts: `1700000000.${String(says.length).padStart(6, "0")}` };
    },
    async dm(slackId, text) {
      dms.push({ slackId, text });
      return opts.dmResult ?? { ok: true };
    },
    says,
    dms,
    clock,
  };
  return ctx;
}

// A Slack App stub. Records command, event and message handlers so tests can invoke them directly.
export type FakeApp = {
  commands: Map<string, (args: Record<string, unknown>) => Promise<void>>;
  events: Map<string, (args: Record<string, unknown>) => Promise<void>>;
  messages: ((args: Record<string, unknown>) => Promise<void>)[];
  reactionsAdded: { channel: string; timestamp: string; name: string }[];
  reactionsStore: Record<string, { name: string; count: number; users: string[] }[]>;
  client: Record<string, unknown>;
};

export function fakeApp(opts: { reactionAddFails?: boolean } = {}): FakeApp & App {
  const app: FakeApp = {
    commands: new Map(),
    events: new Map(),
    messages: [],
    reactionsAdded: [],
    reactionsStore: {},
    client: {},
  };
  app.client = {
    reactions: {
      async add(args: { channel: string; timestamp: string; name: string }) {
        if (opts.reactionAddFails) throw new Error("ratelimited");
        app.reactionsAdded.push(args);
        return { ok: true };
      },
      async get(args: { channel: string; timestamp: string }) {
        return { ok: true, message: { reactions: app.reactionsStore[args.timestamp] ?? [] } };
      },
    },
    conversations: {
      async replies() {
        return { ok: true, messages: [] };
      },
    },
  };
  const api = {
    command(name: string, fn: (args: Record<string, unknown>) => Promise<void>) {
      app.commands.set(name, fn);
    },
    event(name: string, fn: (args: Record<string, unknown>) => Promise<void>) {
      app.events.set(name, fn);
    },
    message(fn: (args: Record<string, unknown>) => Promise<void>) {
      app.messages.push(fn);
    },
    ...app,
    client: app.client,
  };
  return api as unknown as FakeApp & App;
}

export function job(partial: Partial<JobRow> & Pick<JobRow, "kind">): JobRow {
  return { id: "j1", ownerSlackId: MEMBER_ID, runAt: "2026-11-18T12:00:00.000Z", payload: {}, ...partial };
}
