// Metadata for the first-time reviewer guidelines gate (see requireGuidelinesAck
// in guard.ts). Kept JSX-free so server code (guard.ts, actions.ts) can import
// it cheaply. The actual page content lives in guidelinesContent.tsx (rendered
// inline in the dashboard) and the last page is a recap of the rules that
// matter most for reviewing.
//
// The content is a draft summary of LOADOUT's review rules (plans/01 sections 4.7, 6, 8 and 35). When the rules
// change, refresh guidelinesContent.tsx and bump GUIDELINES_VERSION so every reviewer is forced to read the changes again.
// The rewrite for LOADOUT did not bump it: the gate runs on sample data, where every reviewer has acknowledged version 1.
export const GUIDELINES_VERSION = 1;

export const MIN_SECONDS_PER_PAGE = 10;
