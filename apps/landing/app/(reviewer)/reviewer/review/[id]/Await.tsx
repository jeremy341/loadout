import type { ReactNode } from "react";

// Renders once a promise the page started has settled. Wrap it in <Suspense>
// so the slow lookups (GitHub, Hackatime, the YSWS archive, Slack) stream in
// after the rest of the review page instead of holding the whole render.
export async function Await<T>({
  promise,
  children,
}: {
  promise: Promise<T>;
  children: (value: T) => ReactNode;
}) {
  return children(await promise);
}
