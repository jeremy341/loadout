// Batches messages per conversation so a fast exchange gets one reply (spec section 10).
// API: createBatcher({ timers, now, onFlush, shortMs?, longMs?, maxWaitMs? }) -> { push(key, item, mentioned), pending() }.
// Timing: 1.5 s after the last message that mentions the bot, 8 s otherwise. A batch never waits longer than
// maxWaitMs from its first message, so a chatty thread still gets answered.
export type BatchTimers = {
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
};

export type Batcher<T> = {
  push(key: string, item: T, mentioned: boolean): void;
  pending(): number;
};

export function createBatcher<T>(opts: {
  timers: BatchTimers;
  now: () => number;
  onFlush: (key: string, items: T[], mentioned: boolean) => void | Promise<void>;
  shortMs?: number;
  longMs?: number;
  maxWaitMs?: number;
}): Batcher<T> {
  const shortMs = opts.shortMs ?? 1500;
  const longMs = opts.longMs ?? 8000;
  const maxWaitMs = opts.maxWaitMs ?? 30_000;
  type Entry = { items: T[]; mentioned: boolean; firstAt: number; handle: unknown };
  const entries = new Map<string, Entry>();

  const flush = (key: string): void => {
    const entry = entries.get(key);
    if (!entry) return;
    entries.delete(key);
    void Promise.resolve(opts.onFlush(key, entry.items, entry.mentioned)).catch(() => {
      // The flusher logs its own failures; a batch error must not reach the timer.
    });
  };

  return {
    push(key, item, mentioned) {
      const now = opts.now();
      const entry = entries.get(key) ?? { items: [], mentioned: false, firstAt: now, handle: null };
      entry.items.push(item);
      entry.mentioned = entry.mentioned || mentioned;
      if (entry.handle !== null) opts.timers.clearTimer(entry.handle);
      const wanted = entry.mentioned ? shortMs : longMs;
      const untilCap = Math.max(0, entry.firstAt + maxWaitMs - now);
      entry.handle = opts.timers.setTimer(() => flush(key), Math.min(wanted, untilCap));
      entries.set(key, entry);
    },
    pending: () => entries.size,
  };
}
