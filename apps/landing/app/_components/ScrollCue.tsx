"use client";

import { LoadoutIcon } from "./icons/LoadoutIcon";

export function ScrollCue() {
  return (
    <div className="scroll-cue">
      <span>Continue scrolling</span>
      <LoadoutIcon name="down" className="scroll-cue-arrow" />
    </div>
  );
}
