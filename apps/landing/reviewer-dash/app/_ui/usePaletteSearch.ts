"use client";

import { useEffect, useState } from "react";
import { fetchRemoteHits, MIN_TERM_LENGTH, NO_REMOTE_HITS, type RemoteHits, type RemoteResult } from "./paletteSearch";

const DEBOUNCE_MS = 200;

/**
 * Builder and project matches for the palette's text, debounced and cancelled as the text changes. `remote` turns false once
 * /api/search has failed in a way that means it is not there; the palette then keeps working on page names.
 */
export function usePaletteSearch(q: string, onNewTerm: () => void): RemoteHits & { remote: boolean } {
  const [hits, setHits] = useState<RemoteHits>(NO_REMOTE_HITS);
  const [remote, setRemote] = useState(true);

  useEffect(() => {
    const term = q.trim();
    onNewTerm();
    if (term.length < MIN_TERM_LENGTH || !remote) {
      setHits(NO_REMOTE_HITS);
      return;
    }
    const ctrl = new AbortController();
    const apply = (result: RemoteResult | null) => {
      if (result?.kind === "hits") setHits(result.hits);
      else if (result?.kind === "absent") setRemote(false);
    };
    const t = setTimeout(() => void fetchRemoteHits(term, ctrl.signal).then(apply), DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // onNewTerm only resets the cursor, a stable state setter wrapper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, remote]);

  return { ...hits, remote };
}
