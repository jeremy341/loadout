// The external-AI adapter. It is the only door a model call could go through. In this staging build it is closed: the function answers
// "not connected" and sends nothing, so no review text or project data leaves the app. The pre-check's OpenRouter read is a separate,
// already-declared path (lib/platform/fraud/config.ts) and is not used here.
//
// A real client goes behind the same signature. Its output is only ever a draft: it is returned to a reviewer, never submitted.

export type ExternalAiResult = { ok: false; state: "not_connected"; live: false; message: string };

export async function requestExternalAiDraft(prompt: string): Promise<ExternalAiResult> {
  void prompt; // not sent anywhere
  return {
    ok: false,
    state: "not_connected",
    live: false,
    message: "No external AI service is connected in this staging build, so no model draft was made.",
  };
}
