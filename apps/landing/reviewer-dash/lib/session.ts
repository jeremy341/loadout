// The staff session. Pixl keeps a signed cookie with the Slack id; LOADOUT's session is the signed-in person (readViewer in
// lib/platform/session.ts), and the sample reviewer handle stands in for the Slack id. Nothing is signed or stored here.
// A person with no role at all has no staff session (null), so every guard answers the plain 404.
import { cache } from "react";
import { readViewer } from "@/lib/platform/session";
import { deskViewer } from "@/lib/platform/review";

export interface AdminSession {
  slackId: string;
  name: string;
  exp: number;
}

const NO_ACCESS = { isOwner: false, canSecondPass: false, reviewQueues: "both" } as const;

// The handle shown as the reviewer's id: the sample handle of a local test account, else the display name as a slug.
export function handleFor(access: Parameters<typeof deskViewer>[0] | null, displayName: string): string {
  const mapped = deskViewer(access ?? NO_ACCESS, displayName).reviewer;
  return mapped || displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "reviewer";
}

export const getSession = cache(async (): Promise<AdminSession | null> => {
  const viewer = await readViewer();
  if (!viewer?.access) return null;
  return { slackId: handleFor(viewer.access, viewer.displayName), name: viewer.displayName, exp: Math.floor(Date.now() / 1000) + 3600 };
});
