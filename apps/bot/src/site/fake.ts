// In-memory SiteClient for tests, the smoke script and BOT_FAKE_SITE=1 runs.
// API: createFakeSite({ linkedSlackIds?, helpers?, admins?, clock? }) -> FakeSite (a SiteClient plus controls).
// Controls: setDown(true) makes every call fail like an unreachable site; calls records method names;
// state exposes the maps so tests can seed and inspect data. Nothing here touches the network.
import { SiteError, type JobKind, type JobRow, type OutboxItem, type PersonView, type QaRow, type ShipView, type SiteClient, type TicketRow, type TicketStatus } from "../types";

export type FakeSiteOptions = {
  linkedSlackIds?: string[];
  helpers?: string[];
  admins?: string[];
  clock?: () => Date;
};

export type FakeMessage = { ticketId: string; slackTs?: string; authorKind: string; authorSlackId?: string; text: string };

export type FakeSite = SiteClient & {
  setDown(down: boolean): void;
  calls: string[];
  state: {
    tickets: Map<string, TicketRow>;
    messages: FakeMessage[];
    helpers: Set<string>;
    persons: Map<string, PersonView>;
    ships: Map<string, ShipView[]>;
    outbox: OutboxItem[];
    outboxFailures: { id: string; code: string; final: boolean }[];
    qa: Map<string, QaRow>;
    jobs: Map<string, JobRow>;
    similar: { id: string; title: string | null; url: string } | null;
  };
};

export function createFakeSite(options: FakeSiteOptions = {}): FakeSite {
  const clock = options.clock ?? (() => new Date());
  const linked = new Set(options.linkedSlackIds ?? []);
  const admins = new Set(options.admins ?? []);
  let down = false;
  let seq = 0;
  const calls: string[] = [];
  const state: FakeSite["state"] = {
    tickets: new Map(),
    messages: [],
    helpers: new Set(options.helpers ?? []),
    persons: new Map(),
    ships: new Map(),
    outbox: [],
    outboxFailures: [],
    qa: new Map(),
    jobs: new Map(),
    similar: null,
  };

  const enter = (name: string): void => {
    calls.push(name);
    if (down) throw new SiteError("network", 0);
  };
  const nowIso = () => clock().toISOString();
  const nextId = (prefix: string) => `${prefix}_${++seq}`;

  const site: FakeSite = {
    setDown(value) {
      down = value;
    },
    calls,
    state,

    async createTicket(input) {
      enter("createTicket");
      const at = nowIso();
      const ticket: TicketRow = {
        id: nextId("tk"),
        channelId: input.channelId,
        messageTs: input.messageTs,
        authorSlackId: input.authorSlackId,
        title: null,
        text: input.text,
        status: "open",
        claimedBy: null,
        closedBy: null,
        keepOpen: false,
        lastMessageAt: at,
        createdAt: at,
      };
      state.tickets.set(ticket.id, ticket);
      return { ticket, linked: linked.has(input.authorSlackId) };
    },

    async getTicket(id) {
      enter("getTicket");
      return state.tickets.get(id) ?? null;
    },

    async findTicketByMessage(channelId, messageTs) {
      enter("findTicketByMessage");
      for (const ticket of state.tickets.values()) {
        if (ticket.channelId === channelId && ticket.messageTs === messageTs) return ticket;
      }
      return null;
    },

    async updateTicket(id, patch) {
      enter("updateTicket");
      const current = state.tickets.get(id);
      if (!current) throw new SiteError("not_found", 404);
      const next: TicketRow = {
        ...current,
        title: patch.title ?? current.title,
        status: (patch.status as TicketStatus | undefined) ?? current.status,
        claimedBy: patch.claimedBy === undefined ? current.claimedBy : patch.claimedBy,
        closedBy: patch.closedBy === undefined ? current.closedBy : patch.closedBy,
        keepOpen: patch.keepOpen ?? current.keepOpen,
      };
      state.tickets.set(id, next);
      return next;
    },

    async addTicketMessage(id, input) {
      enter("addTicketMessage");
      if (!state.tickets.has(id)) throw new SiteError("not_found", 404);
      state.messages.push({ ticketId: id, slackTs: input.slackTs, authorKind: input.authorKind, authorSlackId: input.authorSlackId, text: input.text });
      const ticket = state.tickets.get(id);
      if (ticket && input.authorKind !== "bot") ticket.lastMessageAt = nowIso();
    },

    async listOpenTickets() {
      enter("listOpenTickets");
      return [...state.tickets.values()].filter((t) => t.status === "open");
    },

    async similarTicket() {
      enter("similarTicket");
      return state.similar;
    },

    async listHelpers() {
      enter("listHelpers");
      return [...state.helpers];
    },

    async addHelper(adminSlackId, slackId) {
      enter("addHelper");
      if (!admins.has(adminSlackId)) throw new SiteError("forbidden", 403);
      state.helpers.add(slackId);
    },

    async removeHelper(adminSlackId, slackId) {
      enter("removeHelper");
      if (!admins.has(adminSlackId)) throw new SiteError("forbidden", 403);
      state.helpers.delete(slackId);
    },

    async person(slackId) {
      enter("person");
      return state.persons.get(slackId) ?? { linked: linked.has(slackId) };
    },

    async lastShip(slackId) {
      enter("lastShip");
      return state.ships.get(slackId)?.at(-1) ?? null;
    },

    async approvedShips(slackId) {
      enter("approvedShips");
      return state.ships.get(slackId) ?? [];
    },

    async outbox() {
      enter("outbox");
      return [...state.outbox];
    },

    async ackOutbox(id) {
      enter("ackOutbox");
      state.outbox = state.outbox.filter((item) => item.id !== id);
    },

    async failOutbox(id, code, final) {
      enter("failOutbox");
      state.outboxFailures.push({ id, code, final });
      if (final) state.outbox = state.outbox.filter((item) => item.id !== id);
    },

    async qaGet(question) {
      enter("qaGet");
      const row = state.qa.get(question);
      if (!row) return null;
      row.hits += 1;
      return row;
    },

    async qaPut(row) {
      enter("qaPut");
      state.qa.set(row.question, { ...row, hits: (state.qa.get(row.question)?.hits ?? 0), confirmedAt: nowIso() });
    },

    async listJobs() {
      enter("listJobs");
      return [...state.jobs.values()];
    },

    async createJob(input) {
      enter("createJob");
      const job: JobRow = { id: nextId("job"), kind: input.kind, ownerSlackId: input.ownerSlackId, runAt: input.runAt, payload: input.payload };
      state.jobs.set(job.id, job);
      return job;
    },

    async finishJob(id) {
      enter("finishJob");
      state.jobs.delete(id);
    },

    async countJobs(ownerSlackId, kind: JobKind) {
      enter("countJobs");
      return [...state.jobs.values()].filter((j) => j.ownerSlackId === ownerSlackId && j.kind === kind).length;
    },
  };

  return site;
}
