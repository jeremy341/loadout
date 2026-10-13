"use client";

import { useSyncExternalStore } from "react";

const MAX = 80;
const subscribe = () => () => {};

// "Nothing is down here at /the-path." The server does not know the address the visitor asked for, so the first
// render is "Nothing is down here." and the browser adds the path once it has hydrated.
export function RequestedPath() {
  const path = useSyncExternalStore(subscribe, () => window.location.pathname, () => "");
  const shown = path.length > MAX ? `${path.slice(0, MAX - 1)}…` : path;
  return (
    <>
      Nothing is down here{shown && <> at <code className="rb-path">{shown}</code></>}.
    </>
  );
}
