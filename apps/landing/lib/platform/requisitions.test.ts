import { describe, expect, test } from "bun:test";
import { requisitionOffer, requisitionReasonText, requisitionsAvailable, requisitionsEarned } from "./requisitions";
import { priceFor, shopItemById, type TrackHours } from "./shop";

const hours = (over: Partial<TrackHours> = {}): TrackHours => ({ Tools: 0, Systems: 0, Compute: 0, Hardware: 0, ...over });
const item = (id: string) => {
  const found = shopItemById(id);
  if (!found) throw new Error(`no item ${id}`);
  return found;
};
const offer = (id: string, approved: TrackHours, used: Parameters<typeof requisitionsAvailable>[1] = []) => {
  const entry = item(id);
  return requisitionOffer(entry, priceFor(entry, approved), requisitionsAvailable(requisitionsEarned(approved), used));
};

describe("requisitionsEarned", () => {
  test("one per coupon level reached: 5, 8, 11, 15, 18 and 20", () => {
    // LV.5 is 23 hours, LV.8 58, LV.11 104, LV.15 178, LV.18 236, LV.20 275.
    const steps: [number, number][] = [
      [0, 0],
      [22, 0],
      [23, 1],
      [57, 1],
      [58, 2],
      [104, 3],
      [177, 3],
      [178, 4],
      [236, 5],
      [274, 5],
      [275, 6],
      [999, 6],
    ];
    for (const [approved, count] of steps) expect(requisitionsEarned(hours({ Tools: approved })).Tools).toBe(count);
  });

  test("counts each track on its own", () => {
    expect(requisitionsEarned(hours({ Tools: 58, Systems: 23, Hardware: 1 }))).toEqual({ Tools: 2, Systems: 1, Compute: 0, Hardware: 0 });
  });
});

describe("requisitionsAvailable", () => {
  const earned = { Tools: 2, Systems: 1, Compute: 0, Hardware: 0 };
  test("used is zero by default", () => expect(requisitionsAvailable(earned)).toEqual(earned));
  test("a list of used requisitions comes off its track", () => {
    expect(requisitionsAvailable(earned, [{ track: "Tools" }])).toEqual({ Tools: 1, Systems: 1, Compute: 0, Hardware: 0 });
  });
  test("a count per track works and never goes below zero", () => {
    expect(requisitionsAvailable(earned, { Tools: 5 }).Tools).toBe(0);
    expect(requisitionsAvailable(earned, [{ track: "Compute" }]).Compute).toBe(0);
  });
});

describe("requisitionOffer", () => {
  test("ok: a matching track, a requisition left and 400 Ore or more", () => {
    const result = offer("framework-12", hours({ Tools: 58 }));
    expect(result).toMatchObject({ eligible: true, reason: "ok", available: 2, track: "Tools" });
    expect(result.percentWith).toBeGreaterThan(priceFor(item("framework-12"), hours({ Tools: 58 })).percent);
  });

  test("no_requisition_available: nothing earned anywhere", () => {
    expect(offer("framework-12", hours())).toMatchObject({ eligible: false, reason: "no_requisition_available", available: 0 });
  });

  test("no_requisition_available: all earned ones are used", () => {
    expect(offer("framework-12", hours({ Tools: 23 }), [{ track: "Tools" }]).reason).toBe("no_requisition_available");
  });

  test("wrong_track: requisitions exist, but not in this item's tracks", () => {
    const result = offer("oscilloscope", hours({ Tools: 58 }));
    expect(result).toMatchObject({ eligible: false, reason: "wrong_track", available: 0 });
  });

  test("under_minimum: an item below 400 Ore", () => {
    expect(item("usb-c-dock").baseOre).toBeLessThan(400);
    expect(offer("usb-c-dock", hours({ Tools: 58 })).reason).toBe("under_minimum");
  });

  test("the minimum is 400 Ore: 400 qualifies", () => {
    expect(item("flipper-zero").baseOre).toBe(400);
    expect(offer("flipper-zero", hours({ Hardware: 23 })).reason).toBe("ok");
  });

  test("general_item: no track, never eligible", () => {
    const result = offer("ipad", hours({ Tools: 275, Systems: 275, Compute: 275, Hardware: 275 }));
    expect(result).toMatchObject({ eligible: false, reason: "general_item", track: null });
    expect(result.priceWith).toBe(item("ipad").baseOre);
  });

  test("an item with two tracks uses the track that has one left", () => {
    expect(offer("monitor", hours({ Hardware: 23 }))).toMatchObject({ eligible: true, track: "Hardware", available: 1 });
  });

  test("the level discount and the requisition together stop at 40%", () => {
    const result = offer("mac-mini", hours({ Tools: 999, Systems: 999, Compute: 999 }));
    expect(result.eligible).toBe(true);
    // LV.20 gives 20% and the requisition 10%: 30%, under the cap.
    expect(result.percentWith).toBe(30);
    // Force the cap with a larger level discount than the game gives, to prove the ceiling holds.
    const capped = requisitionOffer(item("mac-mini"), { base: 2585, track: "Systems", percent: 35, final: 1680 }, { Tools: 0, Systems: 1, Compute: 0, Hardware: 0 });
    expect(capped.percentWith).toBe(40);
    expect(capped.priceWith).toBe(1551);
  });

  test("not eligible keeps the level-discount price", () => {
    const entry = item("framework-12");
    const price = priceFor(entry, hours({ Tools: 10 }));
    const result = requisitionOffer(entry, price, requisitionsAvailable(requisitionsEarned(hours({ Tools: 10 }))));
    expect(result.priceWith).toBe(price.final);
  });
});

describe("requisitionReasonText", () => {
  test("gives plain words for each reason and nothing for ok", () => {
    expect(requisitionReasonText("ok")).toBeNull();
    expect(requisitionReasonText("no_requisition_available")).toBe("You have no Field Requisition for this track yet.");
    expect(requisitionReasonText("wrong_track")).toBe("This item is in another track.");
    expect(requisitionReasonText("under_minimum")).toBe("Requisitions need an item of 400 Ore or more.");
    expect(requisitionReasonText("general_item")).toContain("General items");
  });
});
