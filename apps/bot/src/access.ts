// Who may do staff things. API: createAccess({ site, adminSlackIds, now?, ttlMs? }) -> { isHelper, isAdmin }.
// Helpers come from the site's list, cached for 60 s. Admins always count as helpers. If the site is down when the
// cache has expired, the last good list is kept rather than locking every helper out.
import type { SiteClient } from "./types";

export type Access = {
  isHelper(slackId: string): Promise<boolean>;
  isAdmin(slackId: string): boolean;
};

export function createAccess(opts: {
  site: Pick<SiteClient, "listHelpers">;
  adminSlackIds: readonly string[];
  now?: () => number;
  ttlMs?: number;
  onError?: (code: string) => void;
}): Access {
  const now = opts.now ?? (() => Date.now());
  const ttl = opts.ttlMs ?? 60_000;
  const admins = new Set(opts.adminSlackIds);
  let cache: { at: number; ids: Set<string> } | null = null;
  let inflight: Promise<Set<string>> | null = null;

  async function helperIds(): Promise<Set<string>> {
    if (cache && now() - cache.at < ttl) return cache.ids;
    inflight ??= opts.site
      .listHelpers()
      .then((list) => {
        cache = { at: now(), ids: new Set(list) };
        return cache.ids;
      })
      .catch((err: unknown) => {
        opts.onError?.(err instanceof Error && "code" in err ? String((err as { code: unknown }).code) : "unknown");
        return cache?.ids ?? new Set<string>();
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }

  return {
    isAdmin: (slackId) => admins.has(slackId),
    async isHelper(slackId) {
      if (admins.has(slackId)) return true;
      return (await helperIds()).has(slackId);
    },
  };
}
