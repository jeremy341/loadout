// Events on the platform. Only events that are actually planned appear here. Each one states what is decided and what is still
// open, and nothing here may suggest a date, price, venue or registration that has not been confirmed. `events.test.ts`
// checks that.

export type EventStatus = "concept" | "planned";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  concept: "Concept",
  planned: "Planned",
};

// One thing about an event that is still undecided, with a plain note on what that means for a builder.
export type OpenFact = { label: string; note: string };

export type PlatformEvent = {
  id: string;
  name: string;
  kind: string;
  status: EventStatus;
  // One sentence. Never a date, a place's name, or a price.
  summary: string;
  // Registration is closed for every event in this release. An "open" value needs a confirmed event first.
  rsvp: "closed" | "open";
  open: readonly OpenFact[];
};

export const RSVP_SENTENCE = "RSVPs are not open. Registration opens only once the dates and details are confirmed. Nothing here is saved.";

export const EVENTS: readonly PlatformEvent[] = [
  {
    id: "show-and-tell",
    name: "Show and Tell",
    kind: "Community",
    status: "planned",
    summary: "A session where builders show what they made. The format and schedule are not set.",
    rsvp: "closed",
    open: [
      { label: "Dates", note: "Not set." },
      { label: "Format", note: "Not decided." },
    ],
  },
];

export function eventById(id: string): PlatformEvent | null {
  return EVENTS.find((event) => event.id === id) ?? null;
}

// Only an event marked open can take an RSVP, and nothing is. The page uses this to decide whether to show the button
// enabled; in this release it never does.
export function isRsvpOpen(event: PlatformEvent): boolean {
  return event.rsvp === "open";
}

// Everything the page says is undecided about an event, in order.
export function openFacts(event: PlatformEvent): readonly OpenFact[] {
  return event.open;
}

// Every sentence a builder can read in this file, for the check that no date, price or place has crept in.
export function publicText(): string[] {
  return [
    RSVP_SENTENCE,
    ...EVENTS.flatMap((event) => [event.name, event.kind, event.summary, ...event.open.flatMap((fact) => [fact.label, fact.note])]),
  ];
}
