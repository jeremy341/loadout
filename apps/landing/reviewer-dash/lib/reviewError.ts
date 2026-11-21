// A reviewer queue page never prints raw ?error= query text. Server actions and redirects can put arbitrary
// text in that parameter, so only a small allowlist of codes (and the two legacy messages they replaced) maps
// to fixed, safe copy. Anything else gets one generic sentence.

const COPY: Record<string, string> = {
  reserved: "That project is reserved for another reviewer right now.",
  // The message firstPassAccess used to redirect with; kept so an old link still shows sensible copy.
  "This project is reserved for the reviewer who requested its changes. It goes back to the shared queue if they don't review it within 3 days of the re-ship.":
    "That project is reserved for another reviewer right now.",
  second_pass: "Only a final reviewer can update this decision.",
  "Only a final reviewer can update this.": "Only a final reviewer can update this decision.",
  not_found: "That project is no longer in the queue.",
};

const FALLBACK = "That action could not be completed. Reload and try again.";

export function reviewErrorCopy(raw: string | string[] | undefined): string | null {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!value) return null;
  return COPY[value.slice(0, 300)] ?? FALLBACK;
}
