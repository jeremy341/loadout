"use client";

import MiniSearch from "minisearch";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { docsSearchOptions } from "./search-options";

type SearchDocument = { id: string; title: string; heading: string; snippet: string; url: string; text: string };
type SearchHit = Pick<SearchDocument, "title" | "heading" | "snippet" | "url">;

export function DocsSearch() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [focused, setFocused] = useState(false);
  const indexRef = useRef<MiniSearch<SearchDocument> | null>(null);
  const loadingRef = useRef<Promise<MiniSearch<SearchDocument>> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef("");
  const requestIdRef = useRef(0);

  const loadIndex = useCallback(async (retry = false) => {
    if (indexRef.current) return indexRef.current;
    if (loadingRef.current && !retry) return loadingRef.current;
    setStatus("loading");
    const request = fetch("/docs/search-index.json", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Search index request failed");
        const payload = await response.json() as { index: unknown };
        const index = MiniSearch.loadJSON<SearchDocument>(JSON.stringify(payload.index), docsSearchOptions);
        indexRef.current = index;
        setStatus("ready");
        return index;
      })
      .catch((error: unknown) => {
        loadingRef.current = null;
        setStatus("error");
        throw error;
      });
    loadingRef.current = request;
    return request;
  }, []);

  const runSearch = useCallback(async (value: string, retry = false) => {
    const requestId = ++requestIdRef.current;
    const normalized = value.trim();
    if (!normalized && !retry) {
      setHits([]);
      return;
    }
    try {
      const index = await loadIndex(retry);
      if (requestId !== requestIdRef.current || queryRef.current.trim() !== normalized) return;
      const results = index.search(normalized, docsSearchOptions.searchOptions).map((result) => ({
        title: String(result.title ?? ""),
        heading: String(result.heading ?? ""),
        snippet: String(result.snippet ?? ""),
        url: String(result.url ?? ""),
      }));
      setHits(results.slice(0, 8));
    } catch {
      setHits([]);
    }
  }, [loadIndex]);

  function onChange(value: string) {
    queryRef.current = value;
    setQuery(value);
    setStatus(indexRef.current ? "ready" : status);
    void runSearch(value);
  }

  function clearSearch() {
    requestIdRef.current++;
    queryRef.current = "";
    setQuery("");
    setHits([]);
    setStatus(indexRef.current ? "ready" : "idle");
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && hits.length) {
      event.preventDefault();
      document.getElementById("docs-search-result-0")?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      clearSearch();
    }
  }

  function onResultKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      inputRef.current?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      clearSearch();
      inputRef.current?.focus();
    }
  }

  function onResultClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    clearSearch();
    setFocused(false);
  }

  function retry() {
    loadingRef.current = null;
    void runSearch(query, true);
  }

  const feedback = status === "loading" ? "Loading search index…"
    : status === "error" ? "Search is unavailable. Try again."
      : query.trim() && status === "ready" ? hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "No matching guides."
        : "Search public guides by topic or heading.";

  return <div className="docs-search">
    <label className="docs-search-label" htmlFor="docs-search-input">Search documentation</label>
    <input
      ref={inputRef}
      id="docs-search-input"
      type="search"
      role="searchbox"
      value={query}
      onFocus={() => { setFocused(true); if (status === "idle") void loadIndex().catch(() => undefined); }}
      onBlur={(event) => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setFocused(false); }}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onInputKeyDown}
      placeholder="Search topics"
      aria-describedby="docs-search-feedback"
    />
    <p className="docs-search-feedback" id="docs-search-feedback" aria-live="polite">{feedback}</p>
    {status === "error" && <button className="docs-search-retry" type="button" onClick={retry}>Retry search</button>}
    {focused && hits.length > 0 && <ul className="docs-search-results" id="docs-search-results" aria-label="Search results">
      {hits.map((hit, index) => <li key={`${hit.url}:${hit.heading}`}>
        <Link id={`docs-search-result-${index}`} href={hit.url} onKeyDown={onResultKeyDown} onClick={onResultClick}>
          <strong>{hit.title}</strong><span>{hit.heading}</span><small>{hit.snippet}</small>
        </Link>
      </li>)}
    </ul>}
  </div>;
}
