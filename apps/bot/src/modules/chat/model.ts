// Calls the Anthropic Messages API for one reply (spec section 10). fetch is injectable for tests.
// API: createModelCaller({ apiKey, fetchImpl?, model?, maxTokens? }) -> (input) => Promise<{ text, tokens }>,
//      buildTranscript(context, batch) -> string.
// Why one user message: the thread is sent as a transcript, so role alternation rules never apply and no
// Slack ids are sent to the model, only the words.
export const MODEL_ID = "claude-haiku-5-5";
export const ANTHROPIC_VERSION = "2023-06-01";
export const API_URL = "https://api.anthropic.com/v1/messages";

export type ModelReply = { text: string; tokens: number };
export type ModelCall = (input: { system: string; transcript: string }) => Promise<ModelReply>;

export function createModelCaller(opts: { apiKey: string; fetchImpl?: typeof fetch; model?: string; maxTokens?: number }): ModelCall {
  const fetchImpl = opts.fetchImpl ?? fetch;
  return async ({ system, transcript }) => {
    const res = await fetchImpl(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": opts.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model ?? MODEL_ID,
        max_tokens: opts.maxTokens ?? 200,
        system,
        messages: [{ role: "user", content: transcript }],
      }),
    });
    if (!res.ok) throw new Error(`model_http_${res.status}`);
    const body = (await res.json()) as {
      content?: { type?: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = (body.content ?? [])
      .filter((c) => c.type === "text" && typeof c.text === "string")
      .map((c) => c.text ?? "")
      .join("")
      .trim();
    const tokens = (body.usage?.input_tokens ?? 0) + (body.usage?.output_tokens ?? 0);
    return { text, tokens };
  };
}

export type ContextLine = { from: "person" | "you"; text: string };

// Earlier thread lines first, then the batch being answered. Lines are plain text, labelled only by role.
export function buildTranscript(context: readonly ContextLine[], batch: readonly ContextLine[]): string {
  const render = (l: ContextLine) => `${l.from === "you" ? "You" : "Person"}: ${l.text}`;
  const lines = [...context.map(render)];
  if (lines.length > 0) lines.push("---");
  lines.push(...batch.map(render));
  lines.push("Reply to the latest messages as You.");
  return lines.join("\n");
}
