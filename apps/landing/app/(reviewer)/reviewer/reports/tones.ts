import type { Tone } from "@/reviewer-dash/app/_ui/ui";

// Reporters and targets at or above this many reports get flagged.
export const REPEAT_THRESHOLD = 3;

export const REPORT_STATUS_TONE: Record<string, Tone> = {
  open: "warning",
  resolved: "success",
  dismissed: "neutral",
};
