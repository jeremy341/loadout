// Thread mute state with a 7-day expiry (spec section 6). API: createMuteStore(now?) -> { mute, unmute, isMuted, size };
// threadMutes is the shared instance the desk and chat modules use. It is the only per-thread state the bot keeps,
// and it lives in memory only.
export const MUTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SWEEP_AT = 1000;

export type MuteStore = {
  mute(channel: string, threadTs: string): void;
  unmute(channel: string, threadTs: string): void;
  isMuted(channel: string, threadTs: string): boolean;
  size(): number;
};

export function createMuteStore(now: () => number = () => Date.now()): MuteStore {
  const until = new Map<string, number>();
  const keyOf = (channel: string, threadTs: string) => `${channel}:${threadTs}`;

  const sweep = () => {
    const t = now();
    for (const [key, expiry] of until) if (expiry <= t) until.delete(key);
  };

  return {
    mute(channel, threadTs) {
      if (until.size >= SWEEP_AT) sweep();
      until.set(keyOf(channel, threadTs), now() + MUTE_TTL_MS);
    },
    unmute(channel, threadTs) {
      until.delete(keyOf(channel, threadTs));
    },
    isMuted(channel, threadTs) {
      const key = keyOf(channel, threadTs);
      const expiry = until.get(key);
      if (expiry === undefined) return false;
      if (now() >= expiry) {
        until.delete(key);
        return false;
      }
      return true;
    },
    size: () => until.size,
  };
}

export const threadMutes = createMuteStore();
