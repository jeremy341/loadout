import { Suspense } from "react";
import { cache } from "react";
import { slackHandle } from "@/reviewer-dash/lib/slack";

// One users.info call per id per request, however many rows mention it.
const handleFor = cache(slackHandle);

async function ResolvedHandle({ id, fallback }: { id: string; fallback: string }) {
  return <>{(await handleFor(id)) ?? fallback}</>;
}

// A Slack @handle that streams in after the page renders. The lookup hits the
// Slack API (up to 8 s, rate limited), so the page must never wait on it; the
// fallback (the raw id or a known name) shows until it resolves.
export function SlackHandle({ id, fallback }: { id: string; fallback?: string }) {
  const shown = fallback ?? id;
  return (
    <Suspense fallback={shown}>
      <ResolvedHandle id={id} fallback={shown} />
    </Suspense>
  );
}
