// Chat limits (spec section 10): a sliding-window counter per key, and a daily token budget.
// API: createWindowLimiter({ limit, windowMs }) -> { take(key, nowMs) }, createDailyBudget(limit) -> { canSpend(now), spend(now, tokens), used(now) }.
// Why both are here and not shared: the chat module stays self-contained, and these are small.
export const HOUR_MS = 60 * 60 * 1000;
export const REPLIES_PER_USER_PER_HOUR = 20;
export const DEFAULT_DAILY_TOKEN_BUDGET = 200_000;

export function createWindowLimiter(opts: { limit: number; windowMs: number }) {
  const uses = new Map<string, number[]>();
  return {
    take(key: string, nowMs: number): boolean {
      const recent = (uses.get(key) ?? []).filter((t) => nowMs - t < opts.windowMs);
      const allowed = recent.length < opts.limit;
      if (allowed) recent.push(nowMs);
      uses.set(key, recent);
      return allowed;
    },
  };
}

// Tokens are counted per UTC day. Over budget the bot stays silent until the day changes.
export function createDailyBudget(limit: number) {
  let day = "";
  let used = 0;
  const roll = (now: Date) => {
    const key = now.toISOString().slice(0, 10);
    if (key !== day) {
      day = key;
      used = 0;
    }
  };
  return {
    canSpend(now: Date): boolean {
      roll(now);
      return used < limit;
    },
    spend(now: Date, tokens: number): void {
      roll(now);
      used += Math.max(0, tokens);
    },
    used(now: Date): number {
      roll(now);
      return used;
    },
  };
}
