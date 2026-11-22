// Resubmit notice: the reviewer who asked for changes is told once when the builder re-ships. Pure decision; the caller sends.
//
// API:
//   resubmitNotice({ requestedByReviewerId, requestedAt, reshippedAt, noticeSentAt })
//     -> { send: false } | { send: true, recipientId, text }
//   The notice is sent once: noticeSentAt set means it already went.

export type ResubmitDecision = { send: false } | { send: true; recipientId: string; text: string };

export function resubmitNotice(input: {
  requestedByReviewerId: string | null;
  requestedAt: number | null;
  reshippedAt: number | null;
  noticeSentAt: number | null;
}): ResubmitDecision {
  if (input.requestedByReviewerId === null || input.requestedAt === null) return { send: false };
  if (input.reshippedAt === null || input.reshippedAt < input.requestedAt) return { send: false };
  if (input.noticeSentAt !== null) return { send: false };
  return {
    send: true,
    recipientId: input.requestedByReviewerId,
    text: "The builder has re-shipped a project you asked to change. It is back in your window to review.",
  };
}
