"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, type FormEvent } from "react";
import { EXPEDITIONS_QUERY_MAX, expeditionsHref, parseExpeditionsQuery } from "@/lib/platform/expeditions";

// The two controls of the Expeditions list: one search box and one plain select for the track. One GET form, so Enter or
// the Search button works with no script (?q=&track=). With script, the form goes to the tidy address (empty parts left
// out) and picking a track sends it at once. The page below is the only list of results.
export function ExpeditionFilters({ q, track, tracks }: Readonly<{ q: string; track: string; tracks: readonly { value: string; label: string }[] }>) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const searchId = useId();
  const trackId = useId();

  function go(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = parseExpeditionsQuery({ q: String(data.get("q") ?? ""), track: String(data.get("track") ?? "") });
    router.push(expeditionsHref({ q: next.q, track: next.track }));
  }

  return (
    <form ref={form} className="ex-form" method="get" action="/dashboard/shop/expeditions" role="search" aria-label="Expeditions" onSubmit={go}>
      <div className="ex-field ex-field-search">
        <label htmlFor={searchId}>Search</label>
        <input id={searchId} className="pf-input" type="search" name="q" defaultValue={q} maxLength={EXPEDITIONS_QUERY_MAX} placeholder="A name, a skill or a step" autoComplete="off" enterKeyHint="search" />
      </div>
      <div className="ex-field ex-field-track">
        <label htmlFor={trackId}>Track</label>
        <select id={trackId} className="pf-input" name="track" defaultValue={track} onChange={() => form.current?.requestSubmit()}>
          <option value="">All tracks</option>
          {tracks.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="pf-btn pri ex-submit-search">
        Search
      </button>
    </form>
  );
}
