// The contracts every bot module builds against (plans/proposals/slack-bot-spec.md). Pure types and one tiny helper: no Slack or network
// code lives here, so modules can be written and tested in parallel against fakes.
import type { App } from "@slack/bolt";

export type Config = {
  botName: string;
  triggerWords: readonly string[];
  slackBotToken: string;
  slackSigningSecret: string;
  siteBaseUrl: string;
  serviceKey: string;
  // Optional ids. An empty string means the feature is off. Never hard code an id anywhere.
  helpChannelId: string;
  communityChannelId: string;
  logChannelId: string;
  adminSlackIds: readonly string[];
  orphanBotId: string;
  orphanReply: string;
  anthropicApiKey: string;
  chatEnabled: boolean;
  chatChime: boolean;
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
};

export type TicketStatus = "open" | "closed";

export type TicketRow = {
  id: string;
  channelId: string;
  messageTs: string;
  authorSlackId: string;
  title: string | null;
  text: string;
  status: TicketStatus;
  claimedBy: string | null;
  closedBy: string | null;
  keepOpen: boolean;
  lastMessageAt: string;
  createdAt: string;
};

export type PersonView = {
  linked: boolean;
  handle?: string;
  // One entry per track: Tools, Systems, Compute, Hardware.
  levels?: { track: string; level: number; approvedHours: number }[];
  approvedHours?: number;
  ore?: number;
};

export type OutboxItem = { id: string; kind: string; slackId: string; text: string; href: string | null };

export type JobKind = "reminder" | "countdown" | "poll";
export type JobRow = { id: string; kind: JobKind; ownerSlackId: string; runAt: string; payload: Record<string, unknown> };

export type QaRow = { question: string; answer: string; links: string[]; hits: number; confirmedAt: string };

export type ShipView = { projectId: string; title: string; url: string; approvedAt: string };

// The site routes under /api/internal/bot (spec section 9). Every method resolves, or throws SiteError with a short code.
export interface SiteClient {
  createTicket(input: { channelId: string; messageTs: string; authorSlackId: string; text: string }): Promise<{ ticket: TicketRow; linked: boolean }>;
  getTicket(id: string): Promise<TicketRow | null>;
  findTicketByMessage(channelId: string, messageTs: string): Promise<TicketRow | null>;
  updateTicket(id: string, patch: { title?: string; status?: TicketStatus; claimedBy?: string | null; closedBy?: string | null; keepOpen?: boolean; actorSlackId?: string | null }): Promise<TicketRow>;
  addTicketMessage(id: string, input: { slackTs?: string; authorKind: "person" | "helper" | "bot"; authorSlackId?: string; text: string }): Promise<void>;
  listOpenTickets(): Promise<TicketRow[]>;
  similarTicket(text: string): Promise<{ id: string; title: string | null; url: string } | null>;

  listHelpers(): Promise<string[]>;
  addHelper(adminSlackId: string, slackId: string): Promise<void>;
  removeHelper(adminSlackId: string, slackId: string): Promise<void>;

  person(slackId: string): Promise<PersonView>;
  lastShip(slackId: string): Promise<ShipView | null>;
  approvedShips(slackId: string): Promise<ShipView[]>;

  outbox(): Promise<OutboxItem[]>;
  ackOutbox(id: string): Promise<void>;
  failOutbox(id: string, code: string, final: boolean): Promise<void>;

  qaGet(question: string): Promise<QaRow | null>;
  qaPut(row: { question: string; answer: string; links: string[] }): Promise<void>;

  listJobs(): Promise<JobRow[]>;
  createJob(input: { kind: JobKind; ownerSlackId: string; runAt: string; payload: Record<string, unknown> }): Promise<JobRow>;
  finishJob(id: string): Promise<void>;
  countJobs(ownerSlackId: string, kind: JobKind): Promise<number>;
}

export class SiteError extends Error {
  constructor(public readonly code: string, public readonly status = 0) {
    super(code);
    this.name = "SiteError";
  }
}

export type Logger = {
  debug(event: string, fields?: Record<string, unknown>): void;
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>): void;
  error(event: string, fields?: Record<string, unknown>): void;
};

// Shared counters for /loadout-stats, reset at restart.
export type Stats = { ticketsOpened: number; answeredFromDocs: number; autoClosed: number; remindersSent: number; commandsRun: number };

export type Ctx = {
  config: Config;
  site: SiteClient;
  log: Logger;
  stats: Stats;
  // The bot's own Slack user id, filled in at startup by the slack module.
  botUserId: string;
  now(): Date;
  // True for helpers and admins. Cached for 60 seconds.
  isHelper(slackId: string): Promise<boolean>;
  isAdmin(slackId: string): boolean;
  // Docs answer for a question, or null. Provided by the docs module so desk and commands share it.
  answer(question: string): Promise<{ text: string; links: string[] } | null>;
  // Posts as the bot. Rate limited and retried by the slack module.
  say(args: { channel: string; text: string; threadTs?: string }): Promise<{ ts: string } | null>;
  dm(slackId: string, text: string): Promise<{ ok: true } | { ok: false; code: string; final: boolean }>;
};

export type BotModule = { name: string; register(app: App, ctx: Ctx): void | Promise<void> };
