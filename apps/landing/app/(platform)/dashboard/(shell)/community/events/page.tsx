import type { Metadata } from "next";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import { RsvpButton } from "@/app/_components/platform/community/RsvpButton";
import { EVENT_STATUS_LABELS, eventStatus, isRsvpOpen, rsvpCountText } from "@/lib/platform/community";
import { listEvents, type EventRow } from "@/lib/platform/community-data";
import { requireViewer } from "@/lib/platform/session";
import "@/app/_components/platform/expeditions.css";

export const metadata: Metadata = { title: "Events - LOADOUT" };

// The time an event runs, in UTC with no invented zone: the day and clock for the start, the day and clock for the end.
function eventWindow(event: EventRow): string {
  const fmt = (date: Date) =>
    `${date.getUTCDate()} ${date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })} ${date.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`;
  return event.endsAt ? `${fmt(event.startsAt)} to ${fmt(event.endsAt)}` : `from ${fmt(event.startsAt)}`;
}

// Events the community can act on: the planned ones with their dates, each with the live count of builders going and an
// RSVP of one's own. The rows are Event rows (written by the team on the review site); a stopped event is not listed at
// all, because a stop closes it for builders immediately. Dates and details are as configured: nothing is invented here.
export default async function EventsPage() {
  const viewer = await requireViewer();
  const now = new Date();
  const events = await listEvents(viewer.id);
  const upcoming = events.filter((event) => {
    const status = eventStatus({ startsAt: event.startsAt, endsAt: event.endsAt, stoppedAt: null }, now);
    return status === "upcoming" || status === "live";
  });
  const past = events.filter((event) => eventStatus({ startsAt: event.startsAt, endsAt: event.endsAt, stoppedAt: null }, now) === "ended");

  return (
    <>
      <CommunityHead title="Events">Events with their dates, and who is going.</CommunityHead>

      <p className="pf-event-line">
        <span className="pf-event-dot" aria-hidden="true" />
        RSVP saves your place. You can take it back until the event ends.
      </p>

      <section className="ex-section" aria-labelledby="planned-heading">
        <h2 id="planned-heading">Planned</h2>
        {upcoming.length === 0 ? (
          <p className="pf-empty-line">No event is planned right now. The team writes one here when the next session is set.</p>
        ) : (
          <ul className="ex-list">
            {upcoming.map((event) => {
              const open = isRsvpOpen({ startsAt: event.startsAt, endsAt: event.endsAt, stoppedAt: null }, now);
              const status = eventStatus({ startsAt: event.startsAt, endsAt: event.endsAt, stoppedAt: null }, now);
              return (
                <li className="pf-box ex-event" key={event.id}>
                  <div className="ex-event-grid">
                    <div>
                      <span className="ex-label">
                        {event.kind} / {EVENT_STATUS_LABELS[status]}
                      </span>
                      <h3 className="ex-event-title">{event.title}</h3>
                      <p className="ex-event-text">{event.body}</p>
                      <p className="cm-mini-kind">{eventWindow(event)}</p>
                      <RsvpButton eventId={event.id} going={event.viewerGoing} open={open} />
                      <p className="ex-closed">{rsvpCountText(event.rsvpCount)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section className="ex-section" aria-labelledby="past-heading">
          <h2 id="past-heading">Past</h2>
          <ul className="ex-list">
            {past.map((event) => (
              <li className="pf-box ex-event" key={event.id}>
                <div className="ex-event-grid">
                  <div>
                    <span className="ex-label">
                      {event.kind} / {EVENT_STATUS_LABELS.ended}
                    </span>
                    <h3 className="ex-event-title">{event.title}</h3>
                    <p className="ex-event-text">{event.body}</p>
                    <p className="cm-mini-kind">{eventWindow(event)}</p>
                    <p className="ex-closed">{rsvpCountText(event.rsvpCount)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
