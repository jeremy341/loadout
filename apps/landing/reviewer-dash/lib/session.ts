// The staff session for the reviewer site. Pixl keeps a signed cookie with the Slack id; LOADOUT's session is the signed-in
// person (readViewer in lib/platform/session.ts). Nothing here is signed or stored.
//
// Two identities are kept apart on purpose:
// - personId is the stable Person id. Every access decision (the team-log overlay, claims, locks, holds, self-review, buyer
//   details) keys on it, so two people with the same display name can never share a role or a claim.
// - slackId is only the id shown in the reviewer UI and used by the invented sample fixtures. For a local test account it is
//   the fixture handle through the adapter below; for a real account it is the Person id, which is unique. It grants nothing.
// A person with no role at all has no staff session (null), so every guard answers the plain 404.
import { cache } from "react";
import { readViewer } from "@/lib/platform/session";
import { deskViewer } from "@/lib/platform/review";
import { emailForHandle, HANDLE_BY_EMAIL } from "./sample/role-grants";

export interface AdminSession {
  slackId: string;
  personId: string;
  name: string;
}

const NO_ACCESS = { isOwner: false, canSecondPass: false, reviewQueues: "both" } as const;

const slugHandle = (displayName: string): string =>
  displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "reviewer";

// Adapter from a stable person key to the invented team's sample handle. Only the seeded local test accounts have one; real
// accounts fall through to their Person id. Never key this on a display name: two people can share one.
function fixtureHandle(personId?: string, email?: string): string | null {
  const key = email?.trim().toLowerCase() ?? "";
  const direct = Object.hasOwn(HANDLE_BY_EMAIL, key) ? HANDLE_BY_EMAIL[key] : null;
  if (direct) return direct;
  const mapped = personId ? emailForHandle(personId) : null;
  return mapped && Object.hasOwn(HANDLE_BY_EMAIL, mapped) ? HANDLE_BY_EMAIL[mapped] : null;
}

// The handle shown as the reviewer's id. The two-argument form is kept for the sample-only helpers that still pass a display
// name; callers with a signed-in person pass their stable id and email so the handle cannot follow a rename.
export function handleFor(
  access: Parameters<typeof deskViewer>[0] | null,
  displayName: string,
  personId?: string,
  email?: string,
): string {
  if (personId || email) {
    const sample = fixtureHandle(personId, email);
    return sample ?? personId?.trim() ?? slugHandle(displayName);
  }
  const mapped = deskViewer(access ?? NO_ACCESS, displayName).reviewer;
  return mapped || slugHandle(displayName);
}

// The one place a Viewer becomes a staff session. Pure, so the same-name identity rule can be unit tested without a request.
export function sessionFor(viewer: { id: string; email: string; displayName: string; access: Parameters<typeof deskViewer>[0] | null }): AdminSession {
  return {
    slackId: handleFor(viewer.access, viewer.displayName, viewer.id, viewer.email),
    personId: viewer.id,
    name: viewer.displayName,
  };
}

export const getSession = cache(async (): Promise<AdminSession | null> => {
  const viewer = await readViewer();
  if (!viewer?.access) return null;
  return sessionFor(viewer);
});
