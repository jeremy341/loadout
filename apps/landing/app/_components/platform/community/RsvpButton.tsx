"use client";

import { useActionState } from "react";
import { toggleRsvpAction } from "@/lib/platform/rsvp-actions";
import type { FormState } from "@/lib/platform/actions";
import { FormStatus } from "@/app/_components/platform/forms";

const idle: FormState = { status: "idle" };

// The RSVP control for one event: a pressed-in state once the builder is going. The action flips the EventRsvp row; if the
// event's window closed while the page was open, the answer says so plainly. The accessible name carries the state, so the
// button never reads the same for both (no aria-pressed on top, which would say it twice). A closed event shows the button inert and the page says why beside it.
export function RsvpButton({ eventId, going, open }: Readonly<{ eventId: string; going: boolean; open: boolean }>) {
  const [state, action, pending] = useActionState(toggleRsvpAction, idle);

  return (
    <form action={action} className="ex-event-rsvp">
      <input type="hidden" name="eventId" value={eventId} />
      <button type="submit" className="pf-btn" disabled={pending || (!open && !going)}>
        <span aria-hidden="true">{going ? "Going" : "RSVP"}</span>
        <span className="pf-sr">{going ? "RSVP — you are going; press to take it back" : open ? "RSVP — you are not going; press to RSVP" : "RSVP closed"}</span>
      </button>
      <span aria-live="polite">
        <FormStatus state={state} />
      </span>
    </form>
  );
}
