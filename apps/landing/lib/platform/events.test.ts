import { describe, expect, test } from "bun:test";
import { eventById, EVENTS, isRsvpOpen, openFacts, publicText, RSVP_SENTENCE } from "./events";

describe("events", () => {
  test("finds an event by id and returns null for an unknown one", () => {
    expect(eventById("show-and-tell")?.name).toBe("Show and Tell");
    expect(eventById("nope")).toBeNull();
  });

  test("no event takes an RSVP", () => {
    for (const event of EVENTS) expect(isRsvpOpen(event)).toBe(false);
    expect(isRsvpOpen({ ...EVENTS[0], rsvp: "open" })).toBe(true);
  });

  test("every event lists what is still open", () => {
    for (const event of EVENTS) expect(openFacts(event).length).toBeGreaterThan(0);
  });
});

describe("nothing unconfirmed is stated", () => {
  const text = publicText().join("\n");

  test("no date, year, month or time", () => {
    expect(text).not.toMatch(/20\d{2}/);
    expect(text).not.toMatch(/(january|february|march|april|june|july|august|september|october|november|december)/i);
    expect(text).not.toMatch(/\d{1,2}:\d{2}/);
    expect(text).not.toMatch(/\d{1,2}(st|nd|rd|th)/i);
  });

  test("no price or currency", () => {
    expect(text).not.toMatch(/[€$£]/);
    expect(text).not.toMatch(/(euro|eur|usd|dollar)s?/i);
  });

  test("the RSVP sentence says nothing is saved", () => {
    expect(RSVP_SENTENCE).toContain("Nothing here is saved.");
  });
});
