// The public docs corpus (spec section 4). API: createCorpus({ siteBaseUrl, fetch, now, log }) -> { passages() }.
// Lists pages from /docs/sitemap.xml (falling back to /sitemap.xml), keeps only same-origin /docs pages (never plans),
// fetches them with redirects refused, and turns them into passages. Cached for 6 hours; an empty result is retried
// after 5 minutes so a site blip does not blank the answers for hours.
import type { Logger } from "../../types";
import { chunkText, htmlToText, isDocUrl, parseSitemapLocs, type Passage } from "./text";

export type CorpusDeps = {
  siteBaseUrl: string;
  fetch: typeof fetch;
  now: () => number;
  log: Logger;
};

const TTL_MS = 6 * 60 * 60 * 1000;
const EMPTY_TTL_MS = 5 * 60 * 1000;
const MAX_PAGES = 200;
const BATCH = 4;
const REQUEST_TIMEOUT_MS = 8000;

export function createCorpus(deps: CorpusDeps): { passages(): Promise<Passage[]> } {
  const base = deps.siteBaseUrl.replace(/\/+$/, "");
  const origin = new URL(base).origin;
  let cache: { at: number; ttl: number; items: Passage[] } | null = null;
  let inflight: Promise<Passage[]> | null = null;

  async function getText(url: string): Promise<string | null> {
    try {
      const res = await deps.fetch(url, {
        redirect: "manual",
        headers: { accept: "text/html, application/xml;q=0.9" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      return await res.text();
    } catch (err) {
      deps.log.debug("corpus_fetch_failed", { error: err });
      return null;
    }
  }

  async function listUrls(): Promise<string[]> {
    for (const path of ["/docs/sitemap.xml", "/sitemap.xml"]) {
      const xml = await getText(`${base}${path}`);
      if (xml !== null) return parseSitemapLocs(xml).filter((u) => isDocUrl(u, origin)).slice(0, MAX_PAGES);
    }
    return [];
  }

  async function pagePassages(url: string): Promise<Passage[]> {
    const html = await getText(url);
    if (html === null) return [];
    const { title, text } = htmlToText(html);
    if (!text) return [];
    return chunkText(text).map((chunk) => ({ url, title: title || url, text: chunk }));
  }

  async function load(): Promise<Passage[]> {
    const urls = await listUrls();
    const items: Passage[] = [];
    for (let i = 0; i < urls.length; i += BATCH) {
      const batch = await Promise.all(urls.slice(i, i + BATCH).map(pagePassages));
      for (const passages of batch) items.push(...passages);
    }
    deps.log.info("corpus_loaded", { pages: urls.length, passages: items.length });
    return items;
  }

  return {
    passages() {
      if (cache && deps.now() - cache.at < cache.ttl) return Promise.resolve(cache.items);
      inflight ??= load()
        .then((items) => {
          cache = { at: deps.now(), ttl: items.length > 0 ? TTL_MS : EMPTY_TTL_MS, items };
          return items;
        })
        .catch((err: unknown) => {
          deps.log.warn("corpus_load_failed", { error: err });
          // Remember the failure for the empty-result interval so a dead site is not hammered per question.
          cache = { at: deps.now(), ttl: EMPTY_TTL_MS, items: cache?.items ?? [] };
          return cache.items;
        })
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
  };
}
