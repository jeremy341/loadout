"use client";

import { LoadoutIcon } from "./icons/LoadoutIcon";

type ScrollCueProps = { targetId?: string };

export function ScrollCue({ targetId = "about" }: ScrollCueProps) {
  function focusDestination() {
    window.requestAnimationFrame(() => {
      const heading = document.getElementById(targetId)?.querySelector("h2");
      if (!heading) return;
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });
  }

  return (
    <a className="scroll-cue" href={`#${targetId}`} onClick={focusDestination}>
      <span>Continue scrolling</span>
      <LoadoutIcon name="down" className="scroll-cue-arrow" />
    </a>
  );
}
