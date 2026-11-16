// Erasure (area E, owner only, Stub): what removing one person's data would take away. Rewritten for LOADOUT from the shape of
// Pixl's erasure (the delete plus what a cascade misses). The screen only lists it; nothing is removed.

export const ERASURE_SAMPLE_HANDLE = "sample_builder";

export type ErasureAction = "removed" | "cleared" | "handed over" | "kept without the person";
export type ErasureItem = { id: string; area: string; detail: string; action: ErasureAction };

export const HANDLE_PATTERN = /^[a-z0-9_.-]{2,32}$/;

// Handles compare without a leading @ and without case.
export const normaliseHandle = (text: string): string => text.trim().replace(/^@/, "").toLowerCase();
export const isValidHandle = (text: string): boolean => HANDLE_PATTERN.test(normaliseHandle(text));

export function erasurePlan(handle: string): ErasureItem[] {
  const who = `@${normaliseHandle(handle)}`;
  return [
    { id: "profile", area: "Profile", detail: `The account for ${who}, its display name, and the sign-in link.`, action: "removed" },
    { id: "projects", area: "Projects", detail: "Their projects, journal entries, hour logs and screenshots.", action: "removed" },
    { id: "ships", area: "Ships and review notes", detail: "Their ships. Reviewer notes on them stay for the audit trail, without the handle.", action: "kept without the person" },
    { id: "invites", area: "Collaborator invitations", detail: "Invitations they sent onto other people's projects pass to that project's owner.", action: "handed over" },
    { id: "messages", area: "Community messages", detail: "Their posts and replies, including their name on them.", action: "removed" },
    { id: "tickets", area: "Support tickets", detail: "Tickets they opened and the forms they sent.", action: "removed" },
    { id: "orders", area: "Shop orders", detail: "Delivery details on their orders. The order record stays for accounts, without the person.", action: "cleared" },
    { id: "audit", area: "Audit log", detail: "The network address and browser details on rows about them.", action: "cleared" },
  ];
}

// The confirmation: typing the handle exactly (a leading @ and capitals do not matter).
export function confirmationMatches(typed: string, handle: string): boolean {
  const wanted = normaliseHandle(handle);
  return wanted !== "" && normaliseHandle(typed) === wanted;
}
