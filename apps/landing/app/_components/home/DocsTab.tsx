"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { prefersReducedMotion, usePull } from "./usePull";

// The floating Docs tab, and a toy: drag it up like a rubber band (.ulpi/design/pull-tab.md). A blue band stretches up from
// the floor, thins and pulls back harder the further you go. Let go and it snaps back first; if the pull was long enough,
// the Docs open once it has settled. The gesture itself lives in usePull. The tab stays a plain link: a click and the
// keyboard work as before, and nothing here touches page scrolling.
const NUDGE_KEY = "loadout-docs-tab-nudged";
const NUDGE_AFTER_MS = 4000;

export function DocsTab() {
  const router = useRouter();
  const tab = useRef<HTMLAnchorElement>(null);
  const pull = usePull(tab, () => router.push("/docs"));
  const isPulling = pull.isPulling;

  // One small wiggle, once per visit, so the first visitor sees that the tab can be pulled.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    try {
      if (window.sessionStorage.getItem(NUDGE_KEY)) return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => {
      if (isPulling()) return;
      tab.current?.classList.add("is-nudging");
      try {
        window.sessionStorage.setItem(NUDGE_KEY, "1");
      } catch {
        // storage can be blocked; the nudge then simply plays on the next visit too
      }
    }, NUDGE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [isPulling]);

  return (
    <Link
      ref={tab}
      className="docs-tab"
      href="/docs"
      aria-label="Open LOADOUT documentation"
      draggable={false}
      {...pull.handlers}
      onAnimationEnd={(event) => event.currentTarget.classList.remove("is-nudging")}
    >
      LOADOUT DOCS
    </Link>
  );
}
