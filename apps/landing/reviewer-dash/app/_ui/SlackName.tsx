import { Suspense } from "react";
import { slackHandle } from "@/reviewer-dash/lib/slack";

async function Resolved({ id, fallback }: { id: string; fallback: string }) {
  return <>{(await slackHandle(id)) ?? fallback}</>;
}

// A Slack id shown as its @handle. The lookup streams in behind a Suspense
// boundary so a slow or offline Slack never holds up the page render; until
// it resolves (or if it fails) the fallback is shown.
export default function SlackName({ id, fallback }: { id: string; fallback?: string }) {
  const shown = fallback ?? id;
  return (
    <Suspense fallback={shown}>
      <Resolved id={id} fallback={shown} />
    </Suspense>
  );
}
