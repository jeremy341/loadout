import type { Metadata } from "next";
import { CommunityHead } from "@/app/_components/platform/community/CommunityHead";
import "@/app/_components/platform/expeditions.css";
import { EVENT_STATUS_LABELS, EVENTS, openFacts, RSVP_SENTENCE } from "@/lib/platform/events";
import { requireViewer } from "@/lib/platform/session";

export const metadata: Metadata = { title: "Events - LOADOUT" };

// Events, after Pixl's events page in structure only (that page is an admin tool for timed bonuses, which LOADOUT does not
// have). Each planned event says plainly what is decided and what is still open, shows no date, price or registration,
// and keeps RSVP off. Plans 01 and 11 own the program facts.
export default async function EventsPage() {
  await requireViewer();

  return (
    <>
      <CommunityHead title="Events">Events we have planned, and what is still undecided.</CommunityHead>

      <p className="pf-event-line">
        <span className="pf-event-dot" aria-hidden="true" />
        Nothing on this page is scheduled. There are no dates and no registration yet.
      </p>

      <section className="ex-section" aria-labelledby="planned-heading">
        <h2 id="planned-heading">Planned</h2>
        <ul className="ex-list">
          {EVENTS.map((event) => (
            <li className="pf-box ex-event" key={event.id}>
              <div className="ex-event-grid">
                <div>
                  <span className="ex-label">
                    {event.kind} / {EVENT_STATUS_LABELS[event.status]}
                  </span>
                  <h3 className="ex-event-title">{event.name}</h3>
                  <p className="ex-event-text">{event.summary}</p>
                  <div className="ex-event-actions">
                    <button type="button" className="pf-btn" disabled aria-describedby={`rsvp-${event.id}`}>
                      RSVP
                    </button>
                    <p className="ex-closed" id={`rsvp-${event.id}`}>
                      {RSVP_SENTENCE}
                    </p>
                  </div>
                </div>

                <div className="ex-open">
                  <h4>Still open</h4>
                  <dl>
                    {openFacts(event).map((fact) => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.note}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
