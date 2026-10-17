"use client";

import { setMotionPaused, useMotionPreference } from "./motion-preference";

export function MotionToggle() {
  const { paused, reduced } = useMotionPreference();
  return <button className="motion-toggle" type="button" aria-pressed={paused} aria-disabled={reduced || undefined}
    onClick={() => { if (!reduced) setMotionPaused(!paused); }}>
    {reduced ? "Animations paused (system preference)" : paused ? "Resume animations" : "Pause animations"}
  </button>;
}
