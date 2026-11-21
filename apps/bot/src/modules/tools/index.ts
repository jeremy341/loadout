// Reminders, countdowns and polls (spec section 7). Registers /loadout-remind, /loadout-countdown and /loadout-poll.
// API: default BotModule { name: "tools", register(app, ctx) }.
// Flow: a command acks at once, validates, stores the job through the site, then schedules it in memory.
// At startup the pending jobs are loaded from the site and scheduled again, so a restart loses nothing.
import type { BotModule, Ctx, JobRow } from "../../types";
import { DURATION_ERROR_TEXT, POLL_ERROR_TEXT, isCountdownPayload, isPollPayload, isReminderPayload, parseDuration, parsePoll } from "./parse";
import { NUMBER_REACTIONS, countVotes, formatResults, pollText, type SlackReaction } from "./poll";
import { createScheduler, realTimers, type Scheduler } from "./scheduler";

export const MAX_PENDING_REMINDERS = 20;
export const MAX_PENDING_COUNTDOWNS = 5;
const MAX_REMINDER_TEXT = 300;
const MAX_COUNTDOWN_LABEL = 100;

// Splits "10min rest of text" into the time and the rest.
function splitFirstWord(text: string): { head: string; rest: string } | null {
  const m = /^(\S+)\s+([\s\S]+)$/.exec(text.trim());
  if (!m || m[1] === undefined || m[2] === undefined) return null;
  return { head: m[1], rest: m[2].trim() };
}

async function runJob(client: PollClient, ctx: Ctx, job: JobRow): Promise<void> {
  try {
    if (job.kind === "reminder" && isReminderPayload(job.payload)) {
      const res = await ctx.dm(job.ownerSlackId, `Reminder: ${job.payload.text}`);
      if (res.ok) ctx.stats.remindersSent += 1;
      else ctx.log.warn("reminder.undelivered", { code: res.code, final: res.final });
    } else if (job.kind === "countdown" && isCountdownPayload(job.payload)) {
      await ctx.say({ channel: job.payload.channelId, text: `<@${job.ownerSlackId}> time is up: ${job.payload.label}` });
    } else if (job.kind === "poll" && isPollPayload(job.payload)) {
      const p = job.payload;
      // reactions.get returns the message's reactions; votes are counted per option number.
      const res = (await client.reactions.get({ channel: p.channelId, timestamp: p.messageTs })) as {
        message?: { reactions?: SlackReaction[] };
      };
      const reactions = res.message?.reactions ?? [];
      const votes = p.options.map((_, i) => countVotes(reactions.find((r) => r.name === NUMBER_REACTIONS[i]), ctx.botUserId));
      await ctx.say({ channel: p.channelId, text: formatResults(p.question, p.options, votes), threadTs: p.messageTs });
    } else {
      ctx.log.warn("job.skipped", { kind: job.kind, id: job.id });
    }
  } finally {
    // A job is finished even when it fails, so a broken row cannot be retried forever.
    await ctx.site.finishJob(job.id).catch(() => ctx.log.warn("job.finish_failed", { id: job.id }));
  }
}

type PollClient = {
  reactions: {
    add(args: { channel: string; timestamp: string; name: string }): Promise<unknown>;
    get(args: { channel: string; timestamp: string }): Promise<unknown>;
  };
};

const mod: BotModule = {
  name: "tools",
  async register(app, ctx) {
    const client = app.client as unknown as PollClient;
    const scheduler: Scheduler = createScheduler({
      run: (job) => runJob(client, ctx, job),
      timers: realTimers,
      log: ctx.log,
    });

    const scheduleAt = (ms: number) => new Date(ctx.now().getTime() + ms).toISOString();

    app.command("/loadout-remind", async ({ ack, command, respond }) => {
      await ack();
      ctx.stats.commandsRun += 1;
      const parts = splitFirstWord(command.text);
      if (!parts) {
        await respond({ text: "Use: /loadout-remind <time> <text>, for example /loadout-remind 10min stretch", response_type: "ephemeral" });
        return;
      }
      const dur = parseDuration(parts.head);
      if ("error" in dur) {
        await respond({ text: DURATION_ERROR_TEXT[dur.error], response_type: "ephemeral" });
        return;
      }
      if (parts.rest.length > MAX_REMINDER_TEXT) {
        await respond({ text: `Keep the reminder to ${MAX_REMINDER_TEXT} characters or fewer.`, response_type: "ephemeral" });
        return;
      }
      try {
        if ((await ctx.site.countJobs(command.user_id, "reminder")) >= MAX_PENDING_REMINDERS) {
          await respond({ text: `You can have ${MAX_PENDING_REMINDERS} reminders pending. Wait for one to go off first.`, response_type: "ephemeral" });
          return;
        }
        const job = await ctx.site.createJob({ kind: "reminder", ownerSlackId: command.user_id, runAt: scheduleAt(dur.ms), payload: { text: parts.rest } });
        scheduler.schedule(job);
        await respond({ text: `Got it. I will DM you in ${parts.head}.`, response_type: "ephemeral" });
      } catch {
        await respond({ text: "I could not save that reminder. Try again in a moment.", response_type: "ephemeral" });
      }
    });

    app.command("/loadout-countdown", async ({ ack, command, respond }) => {
      await ack();
      ctx.stats.commandsRun += 1;
      const parts = splitFirstWord(command.text);
      if (!parts) {
        await respond({ text: "Use: /loadout-countdown <time> <label>, for example /loadout-countdown 25min break", response_type: "ephemeral" });
        return;
      }
      const dur = parseDuration(parts.head);
      if ("error" in dur) {
        await respond({ text: DURATION_ERROR_TEXT[dur.error], response_type: "ephemeral" });
        return;
      }
      if (parts.rest.length > MAX_COUNTDOWN_LABEL) {
        await respond({ text: `Keep the label to ${MAX_COUNTDOWN_LABEL} characters or fewer.`, response_type: "ephemeral" });
        return;
      }
      try {
        if ((await ctx.site.countJobs(command.user_id, "countdown")) >= MAX_PENDING_COUNTDOWNS) {
          await respond({ text: `You can have ${MAX_PENDING_COUNTDOWNS} countdowns pending.`, response_type: "ephemeral" });
          return;
        }
        const job = await ctx.site.createJob({
          kind: "countdown",
          ownerSlackId: command.user_id,
          runAt: scheduleAt(dur.ms),
          payload: { label: parts.rest, channelId: command.channel_id },
        });
        scheduler.schedule(job);
        await respond({ text: `Countdown set. It posts here in ${parts.head}.`, response_type: "ephemeral" });
      } catch {
        await respond({ text: "I could not save that countdown. Try again in a moment.", response_type: "ephemeral" });
      }
    });

    app.command("/loadout-poll", async ({ ack, command, respond }) => {
      await ack();
      ctx.stats.commandsRun += 1;
      const parsed = parsePoll(command.text);
      if ("error" in parsed) {
        await respond({ text: POLL_ERROR_TEXT[parsed.error], response_type: "ephemeral" });
        return;
      }
      const posted = await ctx.say({ channel: command.channel_id, text: pollText(parsed.question, parsed.options) });
      if (!posted) {
        await respond({ text: "I could not post the poll. Try again in a moment.", response_type: "ephemeral" });
        return;
      }
      // Number reactions are a convenience: a failed one is logged, the poll still works from the text.
      for (let i = 0; i < parsed.options.length; i += 1) {
        const name = NUMBER_REACTIONS[i];
        if (!name) break;
        try {
          await client.reactions.add({ channel: command.channel_id, timestamp: posted.ts, name });
        } catch {
          ctx.log.warn("poll.reaction_failed", { index: i });
        }
      }
      if (parsed.durationMs !== undefined) {
        try {
          const job = await ctx.site.createJob({
            kind: "poll",
            ownerSlackId: command.user_id,
            runAt: scheduleAt(parsed.durationMs),
            payload: { question: parsed.question, options: parsed.options, channelId: command.channel_id, messageTs: posted.ts },
          });
          scheduler.schedule(job);
        } catch {
          ctx.log.warn("poll.schedule_failed");
        }
      }
    });

    // Registered first so commands are live at once. Reloading pending jobs is best effort: a failure is
    // logged and the bot carries on without the old timers.
    try {
      const jobs = await ctx.site.listJobs();
      for (const job of jobs) scheduler.schedule(job);
      ctx.log.info("jobs.loaded", { count: jobs.length });
    } catch {
      ctx.log.warn("jobs.load_failed");
    }
  },
};

export default mod;
