import { describe, expect, test } from "bun:test";
import { SAMPLE_EVENTS } from "../data";
import {
  NO_RSVP,
  canMarkAttended,
  eventHasStarted,
  joinEvent,
  leaveEvent,
  maxDrops,
  myRsvp,
  rsvpOpen,
  seating,
  seatsTaken,
  settleRsvp,
  validateEvent,
} from "./events";

const open = { capacity: 10, baseGoing: 4, baseWaitlist: 0 };
const full = { capacity: 5, baseGoing: 5, baseWaitlist: 2 };
const almost = { capacity: 5, baseGoing: 4, baseWaitlist: 0 };

describe("event data", () => {
  test("every sample event has a consistent seat model", () => {
    for (const event of SAMPLE_EVENTS) expect(validateEvent(event)).toBe(true);
  });

  test("rejects impossible seat models", () => {
    expect(validateEvent({ capacity: 0, baseGoing: 0, baseWaitlist: 0 })).toBe(false);
    expect(validateEvent({ capacity: 5, baseGoing: 6, baseWaitlist: 0 })).toBe(false);
    expect(validateEvent({ capacity: 5, baseGoing: 3, baseWaitlist: 1 })).toBe(false);
    expect(validateEvent({ capacity: 5, baseGoing: 5, baseWaitlist: -1 })).toBe(false);
  });
});

describe("seating", () => {
  test("untouched", () => {
    expect(seating(open, 0)).toEqual({ sampleGoing: 4, sampleWaiting: 0, freeSeats: 6 });
    expect(seating(full, 0)).toEqual({ sampleGoing: 5, sampleWaiting: 2, freeSeats: 0 });
  });

  test("a cancellation promotes the first waiting person, so the event stays full", () => {
    expect(seating(full, 1)).toEqual({ sampleGoing: 5, sampleWaiting: 1, freeSeats: 0 });
    expect(seating(full, 2)).toEqual({ sampleGoing: 5, sampleWaiting: 0, freeSeats: 0 });
    expect(seating(full, 3)).toEqual({ sampleGoing: 4, sampleWaiting: 0, freeSeats: 1 });
  });

  test("cancellations are capped at the number of seat holders", () => {
    expect(maxDrops(full)).toBe(5);
    expect(seating(full, 99).sampleGoing).toBe(2);
    expect(seating(open, -5)).toEqual(seating(open, 0));
  });
});

describe("joining, cancelling and the waitlist", () => {
  test("a free seat is taken immediately", () => {
    const rec = joinEvent(open, 0);
    expect(rec).toEqual({ wants: true, held: true });
    expect(myRsvp(open, 0, rec.wants, rec.held)).toEqual({ status: "going", position: null });
  });

  test("a full event puts you behind the sample waitlist", () => {
    const rec = joinEvent(full, 0);
    expect(rec).toEqual({ wants: true, held: false });
    expect(myRsvp(full, 0, true, rec.held)).toEqual({ status: "waitlist", position: 3 });
  });

  test("you move up as sample people cancel, then get a seat", () => {
    const rec = joinEvent(full, 0);
    expect(myRsvp(full, 1, true, rec.held)).toEqual({ status: "waitlist", position: 2 });
    expect(myRsvp(full, 2, true, rec.held)).toEqual({ status: "waitlist", position: 1 });
    // After both waiting people were promoted, the next cancellation frees a seat for you.
    expect(myRsvp(full, 3, true, rec.held).status).toBe("going");
    expect(settleRsvp(full, 3, rec)).toEqual({ wants: true, held: true });
    expect(settleRsvp(full, 1, rec)).toEqual(rec);
  });

  test("a held seat is not lost when others change", () => {
    const rec = joinEvent(almost, 0);
    expect(rec.held).toBe(true);
    expect(myRsvp(almost, 0, true, true).status).toBe("going");
  });

  test("when you take the last seat, the next person would wait", () => {
    expect(seatsTaken(almost, 0, myRsvp(almost, 0, true, true))).toBe(5);
    expect(seatsTaken(almost, 0, myRsvp(almost, 0, false, false))).toBe(4);
  });

  test("cancelling clears the RSVP", () => {
    expect(leaveEvent()).toEqual(NO_RSVP);
    expect(myRsvp(open, 0, false, false).status).toBe("none");
  });

  test("a waitlisted RSVP does not count toward seats taken", () => {
    const mine = myRsvp(full, 0, true, false);
    expect(seatsTaken(full, 0, mine)).toBe(5);
  });
});

describe("timing and attendance", () => {
  const start = Date.UTC(2026, 9, 22, 18);

  test("RSVP closes when the event starts", () => {
    expect(rsvpOpen(start, start - 1)).toBe(true);
    expect(rsvpOpen(start, start)).toBe(false);
    expect(eventHasStarted(start, start)).toBe(true);
  });

  test("Mark attended needs a held seat and a started event", () => {
    const going = { status: "going", position: null } as const;
    const waiting = { status: "waitlist", position: 1 } as const;
    const none = { status: "none", position: null } as const;
    expect(canMarkAttended(start, start + 1, going, false)).toBe("ok");
    expect(canMarkAttended(start, start - 1, going, false)).toBe("not-started");
    expect(canMarkAttended(start, start + 1, waiting, false)).toBe("waitlisted");
    expect(canMarkAttended(start, start + 1, none, false)).toBe("no-rsvp");
    expect(canMarkAttended(start, start + 1, going, true)).toBe("already");
  });
});
