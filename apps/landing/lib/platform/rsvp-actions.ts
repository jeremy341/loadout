"use server";

// The RSVP toggle for events, in the shape of lib/platform/kudos-actions.ts: (previous state, FormData), a FormState out.
// The person acting is always the signed-in viewer, and a banned viewer never reaches this (the session refuses them). The
// write itself is one EventRsvp row at most per person and event (the unique pair in the schema), so a second press flips
// the first; the window rules (not ended, not stopped) are checked inside the write, so a stale page cannot push a
// late RSVP in. Revalidates the Community events page, where the live count is shown.
import { revalidatePath } from "next/cache";
import type { FormState } from "./actions";
import { toggleRsvp } from "./community-data";
import { requireViewer } from "./session";

const NOT_FOUND: FormState = { status: "error", message: "That event is not taking RSVPs." };

export async function toggleRsvpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const raw = formData.get("eventId");
  const eventId = typeof raw === "string" ? raw : "";
  if (eventId === "") return NOT_FOUND;
  const result = await toggleRsvp(viewer.id, eventId);
  if (!result.ok) return { status: "error", message: result.message };
  revalidatePath("/dashboard/community/events");
  return { status: "saved", message: result.going ? "You are going." : "RSVP taken back." };
}
