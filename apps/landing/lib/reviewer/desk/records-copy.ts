// The two fixed sentences from the reviewer desk parity brief. A block shows one of them once, in a `rv-lock` line.
// Never add a third state: a block is Local (works on sample data in this browser) or Stub (laid out, disabled).

export type RecordsState = "local" | "stub";

export const LOCAL_SENTENCE = "Sample data. Changes stay in this browser and are not sent anywhere.";
export const STUB_SENTENCE = "Opens with the review service. Nothing here is saved.";

export const STATE_SENTENCES: Record<RecordsState, string> = { local: LOCAL_SENTENCE, stub: STUB_SENTENCE };

// An amount the owner has not set.
export const NOT_SET = "Not set";
