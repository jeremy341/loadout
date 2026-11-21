// The help desk flow (spec sections 3 and 12): a new question, thread replies, macros, resolve and reopen,
// the title prompt and auto-close. Pure rules are in rules.ts; Slack calls go through SlackWeb and site calls
// through SiteClient, both injected so the flow can be driven by fakes.
// API: createDeskFlow(deps) -> DeskFlow. Action ids: desk_resolve, desk_reopen, desk_title_open, desk_title_skip,
// modal callback desk_title_submit (the module in index.ts wires them).
import type { Ctx, Logger, SiteClient, Stats, TicketRow } from "../../types";
import type { SlackBlock, SlackModal, SlackWeb } from "../../slack/app";
import { escapeMrkdwn, looksNonEnglish, parseMacro, shouldAutoClose, type Macro } from "./rules";


export type DeskDeps = {
  helpChannel: string;
  siteBaseUrl: string;
  // The bot's own Slack id: the actor recorded when the bot itself closes a ticket (auto-close).
  botUserId: string;
  emoji: { open: string; resolved: string };
  site: SiteClient;
  web: SlackWeb;
  log: Logger;
  stats: Stats;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  isHelper: Ctx["isHelper"];
  answer: Ctx["answer"];
};

export type Incoming = { channel: string; ts: string; user: string; text: string };
export type ThreadIncoming = Incoming & { thread_ts: string };

export type DeskFlow = ReturnType<typeof createDeskFlow>;

const MINUTE = 60_000;
export const TICKET_RETRY_WINDOW_MS = 15 * MINUTE;
export const TICKET_RETRY_EVERY_MS = MINUTE;
export const TITLE_WINDOW_MS = 3 * MINUTE;
const TICKET_TEXT_MAX = 4000;
const TITLE_MAX = 100;
export const FAQ_PATH = "/docs/faq";
export const TITLE_CALLBACK = "desk_title_submit";

export const COPY = {
  looking: "Looking into it.",
  english: "Please write in English so a helper can follow. Your question is logged.",
  unreachable: "I could not reach the help desk, a helper will look at this. I will keep trying for a few minutes.",
  helperWillAnswer: "A helper will answer this one.",
  similar: "A similar question was closed earlier:",
  resolved: "Marked as resolved. Reopen if you still need help.",
  autoClose: "Closed because it was quiet for 5 days. Post again if you still need help.",
  titleAsk: "Want to give this a short title? It helps helpers find it.",
  titleClosed: "The title prompt has closed. A helper can add one.",
  resolveDenied: "Only the person who asked or a helper can do that.",
  faq: "Our FAQ is here:",
  readMore: "Read more:",
};

// Block builders. Typed through SlackBlock so Slack's shapes are checked at compile time.
const section = (text: string): SlackBlock => ({ type: "section", text: { type: "mrkdwn", text } });
const buttons = (items: { id: string; label: string; value: string }[]): SlackBlock => ({
  type: "actions",
  elements: items.map((b) => ({
    type: "button" as const,
    action_id: b.id,
    text: { type: "plain_text" as const, text: b.label },
    value: b.value,
  })),
});

const titleModal = (ticketId: string): SlackModal => ({
  type: "modal",
  callback_id: TITLE_CALLBACK,
  private_metadata: ticketId,
  title: { type: "plain_text", text: "Ticket title" },
  submit: { type: "plain_text", text: "Save" },
  close: { type: "plain_text", text: "Cancel" },
  blocks: [
    {
      type: "input",
      block_id: "title",
      label: { type: "plain_text", text: "Short title" },
      element: { type: "plain_text_input", action_id: "value", max_length: TITLE_MAX },
    },
  ],
});

export function createDeskFlow(d: DeskDeps) {
  // Ticket id -> time the title prompt stops accepting clicks. Lazily checked, so no timers are needed.
  const pendingTitles = new Map<string, number>();
  const nowMs = () => d.now().getTime();

  // Moves the reaction on the question between the open and resolved emoji.
  async function swapReaction(t: TicketRow, to: "open" | "resolved"): Promise<void> {
    const remove = to === "open" ? d.emoji.resolved : d.emoji.open;
    const add = to === "open" ? d.emoji.open : d.emoji.resolved;
    await d.web.unreact(t.channelId, t.messageTs, remove);
    await d.web.react(t.channelId, t.messageTs, add);
  }

  // Creates the ticket, retrying every minute for 15 minutes. The placeholder changes on the first failure.
  async function createTicketWithRetry(m: Incoming, onFirstFailure: () => Promise<void>): Promise<TicketRow | null> {
    const deadline = nowMs() + TICKET_RETRY_WINDOW_MS;
    let warned = false;
    for (;;) {
      try {
        const created = await d.site.createTicket({
          channelId: m.channel,
          messageTs: m.ts,
          authorSlackId: m.user,
          text: m.text.slice(0, TICKET_TEXT_MAX),
        });
        return created.ticket;
      } catch (err) {
        d.log.warn("ticket_create_failed", { error: err });
        if (nowMs() >= deadline) return null;
        if (!warned) {
          warned = true;
          await onFirstFailure();
        }
        await d.sleep(TICKET_RETRY_EVERY_MS);
      }
    }
  }

  async function answerSafely(text: string) {
    try {
      return await d.answer(text);
    } catch (err) {
      d.log.warn("docs_answer_failed", { error: err });
      return null;
    }
  }

  async function similarSafely(text: string) {
    try {
      return await d.site.similarTicket(text);
    } catch (err) {
      d.log.warn("similar_lookup_failed", { error: err });
      return null;
    }
  }

  function replyFor(
    docs: { text: string; links: string[] } | null,
    similar: { url: string } | null,
    ticketId: string,
  ): { text: string; blocks: SlackBlock[] } {
    let body: string;
    if (docs) {
      const links = docs.links.slice(0, 3).map((l) => `<${l}>`);
      body = escapeMrkdwn(docs.text);
      if (links.length > 0) body += `\n\n${COPY.readMore} ${links.join(" ")}`;
    } else {
      body = COPY.helperWillAnswer;
    }
    if (similar) body += `\n\n${COPY.similar} <${similar.url}>`;
    return {
      text: body,
      blocks: [section(body), buttons([{ id: "desk_resolve", label: "Mark as resolved", value: ticketId }])],
    };
  }

  // Edits the placeholder in place. If it never got posted, the reply goes in the thread instead.
  async function showReply(m: Incoming, placeholderTs: string | undefined, reply: { text: string; blocks: SlackBlock[] }) {
    const result = placeholderTs
      ? await d.web.update({ channel: m.channel, ts: placeholderTs, text: reply.text, blocks: reply.blocks })
      : await d.web.post({ channel: m.channel, threadTs: m.ts, text: reply.text, blocks: reply.blocks });
    if (!result.ok) d.log.warn("reply_failed", { code: result.code });
  }

  async function promptTitle(ticket: TicketRow, channel: string, user: string): Promise<void> {
    pendingTitles.set(ticket.id, nowMs() + TITLE_WINDOW_MS);
    if (pendingTitles.size > 500) {
      for (const [id, until] of pendingTitles) if (until < nowMs()) pendingTitles.delete(id);
    }
    await d.web.ephemeral({
      channel,
      user,
      text: COPY.titleAsk,
      blocks: [
        section(COPY.titleAsk),
        buttons([
          { id: "desk_title_open", label: "Set title", value: ticket.id },
          { id: "desk_title_skip", label: "Skip", value: ticket.id },
        ]),
      ],
    });
  }

  // A new top-level question in the help channel (spec section 3, steps 1 to 6).
  async function handleQuestion(m: Incoming): Promise<void> {
    await d.web.react(m.channel, m.ts, d.emoji.open);
    const placeholder = await d.web.say({
      channel: m.channel,
      threadTs: m.ts,
      text: looksNonEnglish(m.text) ? COPY.english : COPY.looking,
    });

    const ticket = await createTicketWithRetry(m, async () => {
      if (placeholder) await d.web.update({ channel: m.channel, ts: placeholder.ts, text: COPY.unreachable });
    });
    if (!ticket) {
      d.log.error("ticket_gave_up");
      return;
    }
    d.stats.ticketsOpened++;

    const docs = await answerSafely(m.text);
    if (docs) d.stats.answeredFromDocs++;
    const similar = await similarSafely(m.text);
    await showReply(m, placeholder?.ts, replyFor(docs, similar, ticket.id));
    await promptTitle(ticket, m.channel, m.user);
  }

  // A thread reply. Helpers may run a macro (then it is deleted); anything else is kept as a ticket message.
  async function handleThreadMessage(m: ThreadIncoming): Promise<void> {
    if (m.channel !== d.helpChannel) return;
    const ticket = await d.site.findTicketByMessage(m.channel, m.thread_ts);
    if (!ticket) return;
    const helper = await d.isHelper(m.user);
    const macro = parseMacro(m.text, helper);
    if (macro) {
      await runMacro(ticket, macro, m.user);
      const removed = await d.web.remove(m.channel, m.ts);
      if (!removed.ok) d.log.info("macro_not_deleted", { code: removed.code });
      return;
    }
    await d.site.addTicketMessage(ticket.id, {
      slackTs: m.ts,
      authorKind: helper ? "helper" : "person",
      authorSlackId: m.user,
      text: m.text.slice(0, TICKET_TEXT_MAX),
    });
  }

  async function runMacro(ticket: TicketRow, macro: Macro, actor: string): Promise<void> {
    if (macro === "resolve") {
      if (ticket.status === "open") await resolveTicket(ticket, actor);
      return;
    }
    if (macro === "reopen") {
      if (ticket.status === "closed") await reopenTicket(ticket, actor);
      return;
    }
    const link = `${d.siteBaseUrl}${FAQ_PATH}`;
    await d.web.post({ channel: ticket.channelId, threadTs: ticket.messageTs, text: `${COPY.faq} <${link}>` });
    if (ticket.status === "open") await resolveTicket(ticket, actor);
  }

  async function resolveTicket(t: TicketRow, actor: string): Promise<void> {
    await d.site.updateTicket(t.id, { status: "closed", closedBy: actor });
    await swapReaction(t, "resolved");
    await d.web.post({
      channel: t.channelId,
      threadTs: t.messageTs,
      text: COPY.resolved,
      blocks: [section(COPY.resolved), buttons([{ id: "desk_reopen", label: "Reopen", value: t.id }])],
    });
  }

  async function reopenTicket(t: TicketRow, actor: string): Promise<void> {
    await d.site.updateTicket(t.id, { status: "open", closedBy: null, actorSlackId: actor });
    await swapReaction(t, "open");
  }

  async function mayChange(t: TicketRow, actor: string): Promise<boolean> {
    return actor === t.authorSlackId || (await d.isHelper(actor));
  }

  async function denyIfNeeded(t: TicketRow, actor: string, channel: string | undefined): Promise<void> {
    await d.web.ephemeral({ channel: channel ?? t.channelId, user: actor, text: COPY.resolveDenied });
  }

  // The Resolve button: the author or a helper may use it on an open ticket.
  async function resolveByButton(ticketId: string, actor: string, channel: string | undefined): Promise<void> {
    const t = await d.site.getTicket(ticketId);
    if (!t || t.status !== "open") return;
    if (!(await mayChange(t, actor))) return denyIfNeeded(t, actor, channel);
    await resolveTicket(t, actor);
  }

  async function reopenByButton(ticketId: string, actor: string, channel: string | undefined): Promise<void> {
    const t = await d.site.getTicket(ticketId);
    if (!t || t.status !== "closed") return;
    if (!(await mayChange(t, actor))) return denyIfNeeded(t, actor, channel);
    await reopenTicket(t, actor);
  }

  // Set title button. The prompt stops working after 3 minutes; a late click gets a short note.
  async function openTitle(args: { ticketId: string; triggerId: string; channel: string | undefined; user: string }): Promise<void> {
    const until = pendingTitles.get(args.ticketId);
    if (until === undefined || nowMs() > until) {
      if (args.channel) {
        await d.web.ephemeral({ channel: args.channel, user: args.user, text: COPY.titleClosed });
      }
      return;
    }
    await d.web.openModal(args.triggerId, titleModal(args.ticketId));
  }

  async function saveTitle(ticketId: string, raw: string): Promise<void> {
    const title = raw.trim().slice(0, TITLE_MAX);
    if (!title) return;
    await d.site.updateTicket(ticketId, { title });
    pendingTitles.delete(ticketId);
  }

  function skipTitle(ticketId: string): void {
    pendingTitles.delete(ticketId);
  }

  // Spec section 3: one note per quiet ticket, closed through the site, reaction flipped. Returns how many closed.
  async function runAutoClose(): Promise<number> {
    let open: TicketRow[];
    try {
      open = await d.site.listOpenTickets();
    } catch (err) {
      d.log.warn("auto_close_list_failed", { error: err });
      return 0;
    }
    let closed = 0;
    for (const t of open) {
      if (!shouldAutoClose(t, d.now())) continue;
      try {
        const posted = await d.web.post({ channel: t.channelId, threadTs: t.messageTs, text: COPY.autoClose });
        if (!posted.ok) continue; // left open so the next run tries again
        await d.site.updateTicket(t.id, { status: "closed", closedBy: d.botUserId, actorSlackId: d.botUserId });
        await swapReaction(t, "resolved");
        d.stats.autoClosed++;
        closed++;
      } catch (err) {
        d.log.warn("auto_close_failed", { error: err });
      }
    }
    return closed;
  }

  return {
    handleQuestion,
    handleThreadMessage,
    resolveByButton,
    reopenByButton,
    openTitle,
    saveTitle,
    skipTitle,
    runAutoClose,
  };
}
