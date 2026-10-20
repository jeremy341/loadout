"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { pushNotification } from "../../../lib/notifications";
import { ME } from "../../../lib/sample/builders";
import { EmptyState, Field, Meter, Panel, Status, Tag } from "../../ui/ui";
import { DRAFT_RULES, IRL_PLANNED, type SampleEvent } from "./data";
import { formatDateTimeUtc, formatDateUtc, parseMs } from "./logic/dates";
import {
  canMarkAttended,
  joinEvent,
  leaveEvent,
  maxDrops,
  myRsvp,
  rsvpOpen,
  seating,
  seatsTaken,
  settleRsvp,
  type AttendReason,
} from "./logic/events";
import { buildIcs, icsFileName } from "./logic/ics";
import { issueCertificate, validateCertificateName, verifyCode, type IssuedCertificate, type VerifyOutcome } from "./logic/certificate";
import { InlineConfirm, useAnnounce } from "./shared";
import { useCertificateName, useCertificates, useEventsState } from "./state";

// ---------------------------------------------------------------------------------------------------------
// LOADOUT IRL: planned, details unconfirmed. Plan 15 and plans/proposals/future-platform-ui.md.
// ---------------------------------------------------------------------------------------------------------

export function IrlPanel() {
  const { state, update } = useEventsState();
  const [message, say] = useAnnounce();
  return (
    <Panel title={IRL_PLANNED.title} actions={<Tag tone="warn">{IRL_PLANNED.status}</Tag>}>
      <p>
        <strong>{IRL_PLANNED.line}</strong>
      </p>
      <ul className="cb-notes">
        {IRL_PLANNED.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="mut">There is no date, no registration and no RSVP. Anything you see about it elsewhere is also a concept until details are confirmed.</p>
      <label className="check">
        <input
          type="checkbox"
          checked={state.irlNotify}
          onChange={(e) => {
            const on = e.target.checked;
            update((prev) => ({ ...prev, irlNotify: on }));
            say(on ? "Saved in this browser: you want to be told when LOADOUT IRL details are confirmed." : "Removed. You will not be asked about LOADOUT IRL.");
          }}
        />
        <span>Get notified when details are confirmed</span>
      </label>
      <p className="mut">This only saves your choice in this browser. Nothing is sent, because there is no notification service yet.</p>
      <Status message={message} />
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Sample online events.
// ---------------------------------------------------------------------------------------------------------

const ATTEND_MESSAGE: Record<Exclude<AttendReason, "ok">, string> = {
  "no-rsvp": "RSVP first. Only someone holding a seat can be marked as attended.",
  waitlisted: "You stayed on the waitlist and never got a seat, so you cannot be marked as attended.",
  "not-started": "This event has not started on the Preview date. Move the Preview date forward first.",
  already: "Attendance is already recorded for this event.",
};

function downloadIcs(event: SampleEvent, stampMs: number) {
  const ics = buildIcs({
    id: event.id,
    title: `${event.title} (sample)`,
    description: `${event.blurb}\n\nThis is a sample event from the LOADOUT platform preview. It is not a real event.`,
    startMs: parseMs(event.startsAt),
    durationMin: event.durationMin,
    stampMs,
    location: "Online (sample)",
  });
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = icsFileName(event.id);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function EventCard({ event, nowMs, onViewCertificate }: { event: SampleEvent; nowMs: number; onViewCertificate: (code: string) => void }) {
  const { state, update, rsvpOf } = useEventsState();
  const { items: certs, set: setCerts } = useCertificates();
  const { name: certName } = useCertificateName();
  const [message, say] = useAnnounce();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const startMs = parseMs(event.startsAt);
  const open = rsvpOpen(startMs, nowMs);
  const rec = rsvpOf(event.id);
  const drops = state.drops[event.id] ?? 0;
  const mine = myRsvp(event, drops, rec.wants, rec.held);
  const seats = seating(event, drops);
  const taken = seatsTaken(event, drops, mine);
  const full = seats.freeSeats < 1 || seats.sampleWaiting > 0;
  const attendedAt = state.attended[event.id];
  const cert = certs.find((c) => c.eventId === event.id && c.handle === ME.handle);

  function rsvp() {
    const next = joinEvent(event, drops);
    update((prev) => ({ ...prev, rsvps: { ...prev.rsvps, [event.id]: next } }));
    say(next.held ? `You are going to ${event.title}. You can add it to your calendar.` : `${event.title} is full. You are number ${seats.sampleWaiting + 1} on the waitlist.`);
  }

  function cancel() {
    const wasWaiting = mine.status === "waitlist";
    update((prev) => {
      const rsvps = { ...prev.rsvps };
      const left = leaveEvent();
      if (left.wants) rsvps[event.id] = left;
      else delete rsvps[event.id];
      return { ...prev, rsvps };
    });
    setConfirmCancel(false);
    say(wasWaiting ? `You left the waitlist for ${event.title}.` : `Your RSVP for ${event.title} is cancelled and your seat is free.`);
  }

  function freeSeat() {
    if (drops >= maxDrops(event)) {
      say("No more sample attendees are left to cancel.");
      return;
    }
    const nextDrops = drops + 1;
    const settled = settleRsvp(event, nextDrops, rec);
    update((prev) => {
      const rsvps = { ...prev.rsvps };
      const current = rsvps[event.id];
      if (current) rsvps[event.id] = settleRsvp(event, nextDrops, current);
      return { ...prev, drops: { ...prev.drops, [event.id]: nextDrops }, rsvps };
    });
    const after = myRsvp(event, nextDrops, rec.wants, settled.held);
    if (mine.status === "waitlist" && after.status === "going") {
      pushNotification({ kind: "system", title: `You have a seat: ${event.title}`, body: "A sample attendee cancelled and you moved up from the waitlist.", href: "/events" });
      say(`A sample attendee cancelled. You now have a seat at ${event.title}.`);
    } else if (after.status === "waitlist") {
      say(`A sample attendee cancelled. You are number ${after.position} on the waitlist.`);
    } else {
      say("A sample attendee cancelled and a seat was freed.");
    }
  }

  function markAttended() {
    const reason = canMarkAttended(startMs, nowMs, mine, Boolean(attendedAt));
    if (reason !== "ok") {
      say(ATTEND_MESSAGE[reason]);
      return;
    }
    const issuedAtIso = new Date(nowMs).toISOString();
    const { certificate, created } = issueCertificate(certs, {
      eventId: event.id,
      eventTitle: event.title,
      builderName: certName,
      handle: ME.handle,
      issuedAtIso,
      sample: true,
    });
    if (created) setCerts((prev) => [...prev, certificate]);
    update((prev) => ({ ...prev, attended: { ...prev.attended, [event.id]: issuedAtIso } }));
    pushNotification({
      kind: "system",
      title: `Certificate issued: ${event.title}`,
      body: `Preview certificate ${certificate.code}. It is for a sample event and is not an official LOADOUT record.`,
      href: "/events",
    });
    say(`Attendance recorded. Certificate ${certificate.code} issued.`);
    onViewCertificate(certificate.code);
  }

  const statusTag = attendedAt ? (
    <Tag tone="ok">Attended</Tag>
  ) : mine.status === "going" ? (
    <Tag tone="ok">Going</Tag>
  ) : mine.status === "waitlist" ? (
    <Tag tone="warn">Waitlist number {mine.position}</Tag>
  ) : !open ? (
    <Tag>Started</Tag>
  ) : null;

  return (
    <li className="card cb-event">
      <div className="cb-event-head">
        <h3>{event.title}</h3>
        <span className="cb-tags">
          <Tag>Sample</Tag>
          {statusTag}
        </span>
      </div>
      <p>
        <strong>{formatDateTimeUtc(startMs)}</strong>
      </p>
      <p className="mut">
        {event.durationMin} minutes · Online (sample event)
      </p>
      <p>{event.blurb}</p>
      <Meter value={taken} max={event.capacity} label={`${event.title} seats taken: ${taken} of ${event.capacity}`} />
      <p className="mut">
        {taken} of {event.capacity} seats taken
        {seats.sampleWaiting > 0 ? ` · ${seats.sampleWaiting} waiting` : ""}
        {full && mine.status !== "going" && seats.sampleWaiting === 0 ? " · full" : ""}
      </p>

      <div className="pg-actions">
        {open && mine.status === "none" ? (
          <button type="button" className="btn btn-sm" onClick={rsvp}>
            {full ? "Join waitlist" : "RSVP"}
            <span className="sr-only"> for {event.title}</span>
          </button>
        ) : null}
        {open && mine.status !== "none" && !confirmCancel ? (
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmCancel(true)}>
            {mine.status === "waitlist" ? "Leave waitlist" : "Cancel RSVP"}
            <span className="sr-only"> for {event.title}</span>
          </button>
        ) : null}
        {open || mine.status !== "none" ? (
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => downloadIcs(event, nowMs)}>
            Add to calendar (.ics)
            <span className="sr-only"> for {event.title}</span>
          </button>
        ) : null}
        {cert ? (
          <button type="button" className="btn btn-sm" onClick={() => onViewCertificate(cert.code)}>
            View certificate
            <span className="sr-only"> for {event.title}</span>
          </button>
        ) : null}
      </div>
      {!open && mine.status === "none" ? <p className="mut">RSVP closed: this event has started on the Preview date.</p> : null}
      {confirmCancel ? (
        <InlineConfirm
          message={mine.status === "waitlist" ? "Leave the waitlist? You would lose your place in the queue." : "Cancel your RSVP? Your seat goes back to the pool."}
          confirmLabel={mine.status === "waitlist" ? "Leave waitlist" : "Cancel RSVP"}
          onConfirm={cancel}
          onCancel={() => setConfirmCancel(false)}
        />
      ) : null}
      <Status message={message} />

      <div className="cb-ptools" role="group" aria-label={`Preview tools for ${event.title}`}>
        <p className="cb-ptools-title">Preview tools</p>
        <p className="mut">These stand in for other people and for a host confirming attendance. A live platform has no such buttons.</p>
        <div className="pg-actions">
          <button type="button" className="btn btn-quiet btn-sm" onClick={freeSeat} disabled={!open}>
            A sample attendee cancels
            <span className="sr-only"> ({event.title})</span>
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={markAttended}>
            Mark attended
            <span className="sr-only"> ({event.title})</span>
          </button>
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Certificates.
// ---------------------------------------------------------------------------------------------------------

export function CertificateView({ cert }: { cert: IssuedCertificate }) {
  const [message, say] = useAnnounce();

  useEffect(
    () => () => {
      document.documentElement.classList.remove("cb-printing");
    },
    [],
  );

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(cert.code);
      say(`Code ${cert.code} copied.`);
    } catch {
      say("Could not copy automatically. Select the code and copy it.");
    }
  }

  function print() {
    const root = document.documentElement;
    root.classList.add("cb-printing");
    const done = () => {
      root.classList.remove("cb-printing");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    try {
      window.print();
    } catch {
      done();
    }
  }

  return (
    <div className="cb-cert-wrap">
      <div className="cb-cert" role="region" aria-label={`Certificate ${cert.code}`}>
        <p className="cb-cert-kicker">LOADOUT // platform preview</p>
        <h3 className="cb-cert-title">Achievement certificate</h3>
        <p>This certifies that</p>
        <p className="cb-cert-name">{cert.builderName}</p>
        <p>
          attended <strong>{cert.eventTitle}</strong>
        </p>
        <dl className="cb-cert-meta">
          <div>
            <dt>Issued</dt>
            <dd>{formatDateUtc(parseMs(cert.issuedAt))}</dd>
          </div>
          <div>
            <dt>Builder</dt>
            <dd>@{cert.handle}</dd>
          </div>
          <div>
            <dt>Verification code</dt>
            <dd className="cb-code">{cert.code}</dd>
          </div>
        </dl>
        <p className="cb-cert-sample">
          {cert.sample ? "Sample event. " : ""}Preview certificate: it is not an official LOADOUT record and can only be verified in the browser that issued it.
        </p>
      </div>
      <div className="pg-actions">
        <button type="button" className="btn btn-quiet btn-sm" onClick={copy}>
          Copy code
        </button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={print}>
          Print or save as PDF
        </button>
      </div>
      <Status message={message} />
    </div>
  );
}

export function CertificatesPanel({ certs, selectedCode, onSelect }: { certs: IssuedCertificate[]; selectedCode: string | null; onSelect: (code: string) => void }) {
  const ids = useId();
  const { name, setName } = useCertificateName();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, say] = useAnnounce();
  const selected = certs.find((c) => c.code === selectedCode) ?? certs[certs.length - 1] ?? null;

  function saveName(event: FormEvent) {
    event.preventDefault();
    const check = validateCertificateName(draft ?? name);
    if (!check.ok) {
      setError(check.message ?? "Enter a valid name.");
      say(check.message ?? "Enter a valid name.");
      return;
    }
    setError(null);
    setName(check.name);
    setDraft(null);
    say(`Name saved. New certificates will say ${check.name}.`);
  }

  return (
    <Panel title="Achievement certificates" actions={<Tag tone="warn">Draft wording</Tag>}>
      <p className="mut">{DRAFT_RULES.certificate}</p>
      <form onSubmit={saveName} noValidate className="cb-name-form">
        <Field label="Name on new certificates" hint="Existing certificates keep the name they were issued with." error={error}>
          <input
            id={`${ids}-name`}
            type="text"
            autoComplete="off"
            value={draft ?? name}
            maxLength={80}
            aria-invalid={error ? true : undefined}
            onChange={(e) => setDraft(e.target.value)}
          />
        </Field>
        <button type="submit" className="btn btn-quiet btn-sm">
          Save name
        </button>
      </form>
      <Status message={message} />

      {certs.length === 0 ? (
        <EmptyState title="No certificates yet">
          RSVP to a sample event, move the Preview date past its start, then use Mark attended under Preview tools on that event to issue one.
        </EmptyState>
      ) : (
        <div className="cb-cert-layout">
          <div>
            <h3 id={`${ids}-list`} className="cb-sub">
              Issued in this browser
            </h3>
            <ul className="row-list" aria-labelledby={`${ids}-list`}>
              {certs.map((c) => (
                <li key={c.code} className="row-item">
                  <div>
                    <p>
                      <strong>{c.eventTitle}</strong>
                    </p>
                    <p className="mut cb-code">{c.code}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-quiet btn-sm"
                    aria-pressed={selected?.code === c.code}
                    onClick={() => onSelect(c.code)}
                  >
                    {selected?.code === c.code ? "Showing" : "Show"}
                    <span className="sr-only"> certificate for {c.eventTitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 id="cb-cert-heading" tabIndex={-1} className="cb-sub">
              Certificate
            </h3>
            {selected ? <CertificateView cert={selected} /> : null}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Verify by code.
// ---------------------------------------------------------------------------------------------------------

function verifyMessage(outcome: VerifyOutcome<IssuedCertificate>): { tone: "ok" | "bad" | "warn"; title: string; text: string } {
  switch (outcome.status) {
    case "valid":
      return {
        tone: "ok",
        title: "Valid certificate",
        text: `Issued to ${outcome.certificate.builderName} for ${outcome.certificate.eventTitle} on ${formatDateUtc(parseMs(outcome.certificate.issuedAt))}. Code ${outcome.certificate.code}.`,
      };
    case "checksum":
      return { tone: "bad", title: "Code has a typing mistake", text: "The check character does not match, so one or more characters are wrong. Compare it with the certificate and try again." };
    case "malformed":
      return { tone: "bad", title: "Not a certificate code", text: "Codes look like LDT-XXXX-XXXX-X: eight letters or digits and a check character. Letters I, L, O and U are not used." };
    case "not-issued":
      return {
        tone: "warn",
        title: "No certificate found",
        text: "The code is well formed but no certificate with it was issued in this browser. The live platform will check LOADOUT's own records instead.",
      };
    default:
      return { tone: "bad", title: "Enter a code", text: "Type or paste the verification code from a certificate." };
  }
}

export function VerifyPanel({ certs }: { certs: IssuedCertificate[] }) {
  const ids = useId();
  const [code, setCode] = useState("");
  const [outcome, setOutcome] = useState<VerifyOutcome<IssuedCertificate> | null>(null);
  const result = outcome ? verifyMessage(outcome) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setOutcome(verifyCode(code, certs));
  }

  return (
    <Panel title="Verify a certificate">
      <p className="mut">
        Anyone holding a certificate should be able to check it. This preview checks the code (casing and dashes do not matter) and then looks it up among
        the certificates issued in this browser.
      </p>
      <form onSubmit={submit} noValidate className="cb-verify">
        <Field label="Certificate code" hint="For example LDT-XXXX-XXXX-X">
          <input
            id={`${ids}-code`}
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={code}
            aria-describedby={`${ids}-result`}
            onChange={(e) => {
              setCode(e.target.value);
              setOutcome(null);
            }}
          />
        </Field>
        <button type="submit" className="btn btn-sm">
          Verify
        </button>
      </form>
      <div id={`${ids}-result`} role="status" aria-live="polite" className="cb-verify-result">
        {result ? (
          <p>
            <Tag tone={result.tone}>{result.title}</Tag> {result.text}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
