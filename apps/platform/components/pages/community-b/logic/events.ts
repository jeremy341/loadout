// Event RSVP, capacity and waitlist rules for the preview. Policy: plans/proposals/future-platform-ui.md
// ("event RSVPs, achievement certificates ... are planned. LOADOUT IRL is a planned future event; dates,
// venue, funding, travel support, and registration remain unconfirmed") and plans/15 (no registration for IRL).
// Capacity and waitlist behaviour is a Draft preview rule: the plans give no event capacity rules for online
// events.
//
// Model: an event has `capacity` seats. `baseGoing` sample people hold seats, `baseWaitlist` sample people wait
// behind them (only possible when full). A sample person can cancel ("drops"); the first waitlisted person is
// promoted into the freed seat. YOU hold a seat only if one is free and nobody is waiting; otherwise you queue
// behind the sample waitlist. Everything is derived from (event, drops, wantsSeat), so it is deterministic.

export interface SeatingEvent {
  capacity: number;
  baseGoing: number;
  baseWaitlist: number;
}

export interface Seating {
  /** Sample people currently holding a seat. */
  sampleGoing: number;
  /** Sample people still waiting. */
  sampleWaiting: number;
  /** Seats not held by a sample person. */
  freeSeats: number;
}

export function validateEvent(event: SeatingEvent): boolean {
  return (
    Number.isInteger(event.capacity) &&
    event.capacity > 0 &&
    event.baseGoing >= 0 &&
    event.baseGoing <= event.capacity &&
    event.baseWaitlist >= 0 &&
    // A waitlist only exists when every seat is taken.
    (event.baseWaitlist === 0 || event.baseGoing === event.capacity)
  );
}

/** Most sample cancellations that can still change anything. */
export function maxDrops(event: SeatingEvent): number {
  return event.baseGoing;
}

export function seating(event: SeatingEvent, drops: number): Seating {
  const d = Math.min(Math.max(0, Math.floor(drops)), maxDrops(event));
  const promoted = Math.min(d, event.baseWaitlist);
  const sampleWaiting = event.baseWaitlist - promoted;
  const sampleGoing = event.baseGoing - (d - promoted);
  return { sampleGoing, sampleWaiting, freeSeats: event.capacity - sampleGoing };
}

export type RsvpStatus = "none" | "going" | "waitlist";

export interface MyRsvp {
  status: RsvpStatus;
  /** 1-based place in the waitlist, only when status is "waitlist". */
  position: number | null;
}

/**
 * Your status. `wantsSeat` is whether you pressed RSVP and have not cancelled.
 * "going" needs a free seat and an empty sample waitlist, otherwise you queue behind the sample waitlist.
 */
export function myRsvp(event: SeatingEvent, drops: number, wantsSeat: boolean, held: boolean): MyRsvp {
  if (!wantsSeat) return { status: "none", position: null };
  const s = seating(event, drops);
  if (held) return { status: "going", position: null };
  if (s.freeSeats >= 1 && s.sampleWaiting === 0) return { status: "going", position: null };
  return { status: "waitlist", position: s.sampleWaiting + 1 };
}

export interface RsvpRecord {
  /** You asked for a seat and have not cancelled. */
  wants: boolean;
  /**
   * You were given a seat when you joined (or were promoted). Once held the seat stays yours until you cancel,
   * so later changes to the sample people cannot move you.
   */
  held: boolean;
}

export const NO_RSVP: RsvpRecord = { wants: false, held: false };

/** Press RSVP: take a seat if one is free and nobody is waiting, otherwise join the waitlist. */
export function joinEvent(event: SeatingEvent, drops: number): RsvpRecord {
  const s = seating(event, drops);
  return { wants: true, held: s.freeSeats >= 1 && s.sampleWaiting === 0 };
}

/** Cancel an RSVP or leave the waitlist. */
export function leaveEvent(): RsvpRecord {
  return NO_RSVP;
}

/**
 * A waitlisted RSVP becomes a held seat once a seat is free and nobody is ahead. Call after each change to
 * `drops` so the record, not just the display, reflects the promotion.
 */
export function settleRsvp(event: SeatingEvent, drops: number, record: RsvpRecord): RsvpRecord {
  if (!record.wants || record.held) return record;
  const s = seating(event, drops);
  return s.freeSeats >= 1 && s.sampleWaiting === 0 ? { wants: true, held: true } : record;
}

export function seatsTaken(event: SeatingEvent, drops: number, mine: MyRsvp): number {
  return seating(event, drops).sampleGoing + (mine.status === "going" ? 1 : 0);
}

export function eventHasStarted(startMs: number, nowMs: number): boolean {
  return nowMs >= startMs;
}

/** RSVP, cancelling and joining the waitlist close when the event starts. */
export function rsvpOpen(startMs: number, nowMs: number): boolean {
  return !eventHasStarted(startMs, nowMs);
}

export type AttendReason = "ok" | "no-rsvp" | "waitlisted" | "not-started" | "already";

/**
 * "Mark attended" (Preview tools) is allowed once the event has started and you held a seat. It stands in for
 * a host confirming attendance, which a live service would do.
 */
export function canMarkAttended(startMs: number, nowMs: number, mine: MyRsvp, alreadyAttended: boolean): AttendReason {
  if (alreadyAttended) return "already";
  if (mine.status === "waitlist") return "waitlisted";
  if (mine.status !== "going") return "no-rsvp";
  if (!eventHasStarted(startMs, nowMs)) return "not-started";
  return "ok";
}
