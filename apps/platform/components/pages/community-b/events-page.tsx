"use client";

import { useState } from "react";
import { PageHeader, Panel, PreviewNote, Stat, StatGrid, Tag } from "../../ui/ui";
import { DRAFT_RULES, SAMPLE_EVENTS } from "./data";
import { parseMs } from "./logic/dates";
import { myRsvp } from "./logic/events";
import { CertificatesPanel, EventCard, IrlPanel, VerifyPanel } from "./events-parts";
import { PreviewToolsPanel } from "./shared";
import { useCertificates, useEventsState, usePreviewClock } from "./state";

export function EventsPage() {
  const { nowMs } = usePreviewClock();
  const { state } = useEventsState();
  const { items: certs } = useCertificates();
  const [selected, setSelected] = useState<string | null>(null);

  const sorted = [...SAMPLE_EVENTS].sort((a, b) => parseMs(a.startsAt) - parseMs(b.startsAt));
  const upcoming = sorted.filter((e) => parseMs(e.startsAt) > nowMs);
  const started = sorted.filter((e) => parseMs(e.startsAt) <= nowMs);

  const statuses = SAMPLE_EVENTS.map((event) => {
    const rec = state.rsvps[event.id];
    return rec?.wants ? myRsvp(event, state.drops[event.id] ?? 0, true, rec.held).status : "none";
  });
  const going = statuses.filter((s) => s === "going").length;
  const waiting = statuses.filter((s) => s === "waitlist").length;

  function view(code: string) {
    setSelected(code);
    window.requestAnimationFrame(() => {
      const heading = document.getElementById("cb-cert-heading");
      heading?.scrollIntoView({ block: "start" });
      heading?.focus();
    });
  }

  return (
    <>
      <PageHeader eyebrow="Community" title="Events" lead="RSVP to events and collect achievement certificates." />
      <PreviewNote>
        The online events below are invented samples that exercise RSVP, seats, waitlists, calendar files and certificates. No event is scheduled, and
        what you do is saved only in this browser. Nothing is sent to LOADOUT.
      </PreviewNote>

      <div className="pg-stack cb-stack">
        <IrlPanel />

        <StatGrid>
          <Stat label="Seats held" value={going} hint="Sample events" />
          <Stat label="On a waitlist" value={waiting} />
          <Stat label="Certificates" value={certs.length} hint="Issued in this browser" />
        </StatGrid>

        <Panel title="Upcoming online events" actions={<Tag>Sample</Tag>}>
          <p className="mut">{DRAFT_RULES.rsvp} Times are shown in UTC.</p>
          {upcoming.length ? (
            <ul className="card-grid cb-events">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} nowMs={nowMs} onViewCertificate={view} />
              ))}
            </ul>
          ) : (
            <p className="mut">All sample events have started on the Preview date. Reset the Preview date under Preview tools to see them again.</p>
          )}
        </Panel>

        {started.length ? (
          <Panel title="Started events" actions={<Tag>Sample</Tag>}>
            <p className="mut">RSVP is closed. If you held a seat, use Mark attended under Preview tools to record attendance and get a certificate.</p>
            <ul className="card-grid cb-events">
              {started.map((event) => (
                <EventCard key={event.id} event={event} nowMs={nowMs} onViewCertificate={view} />
              ))}
            </ul>
          </Panel>
        ) : null}

        <CertificatesPanel certs={certs} selectedCode={selected} onSelect={setSelected} />
        <VerifyPanel certs={certs} />
        <PreviewToolsPanel />
      </div>
    </>
  );
}
