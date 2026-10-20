import { describe, expect, test } from "bun:test";
import {
  approveQuote,
  createCustomRequest,
  declineRequest,
  isActive,
  isHttpUrl,
  markOrdered,
  quoteItem,
  startReview,
  validateCustomInput,
  withdrawRequest,
  type CustomInput,
  type CustomRequest,
} from "./custom-orders";

const NOW = "2026-10-20T10:00:00.000Z";

const valid: CustomInput = {
  item: "Framework Laptop 13",
  url: "https://example.test/laptop",
  why: "Local builds, FPGA tooling and a travel development machine.",
  estimate: "1,049",
  currency: "EUR",
  tracks: ["Systems", "Compute"],
};

function made(): CustomRequest {
  const result = createCustomRequest(valid, "c1", NOW);
  if (!result.ok) throw new Error("invalid");
  return result.request;
}

describe("validation", () => {
  test("a complete request is valid", () => {
    expect(validateCustomInput(valid)).toEqual({});
  });

  test("each field is checked", () => {
    const errors = validateCustomInput({ item: "x", url: "ftp://nope", why: "short", estimate: "-5", currency: "EUR", tracks: [] });
    expect(Object.keys(errors).sort()).toEqual(["estimate", "item", "tracks", "url", "why"]);
  });

  test("only http and https links are accepted", () => {
    expect(isHttpUrl("https://example.test")).toBe(true);
    expect(isHttpUrl("http://example.test/x?y=1")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("example.test")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
  });

  test("the estimate must be a positive number within range", () => {
    expect(validateCustomInput({ ...valid, estimate: "0" }).estimate).toBeDefined();
    expect(validateCustomInput({ ...valid, estimate: "abc" }).estimate).toBeDefined();
    expect(validateCustomInput({ ...valid, estimate: "100001" }).estimate).toBeDefined();
    expect(validateCustomInput({ ...valid, estimate: "12.5" }).estimate).toBeUndefined();
  });
});

describe("status flow", () => {
  test("a new request starts as Requested with the tracks in order", () => {
    const request = made();
    expect(request.status).toBe("requested");
    expect(request.tracks).toEqual(["Systems", "Compute"]);
    expect(request.estimate).toBe(1049);
    expect(isActive(request)).toBe(true);
  });

  test("Requested, In review, Quote ready, Ordered", () => {
    let list = [made()];
    list = startReview(list, "c1", NOW);
    expect(list[0].status).toBe("in-review");
    const approved = approveQuote(list, "c1", "8420", true, NOW);
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    list = approved.list;
    expect(list[0].status).toBe("approved");
    expect(list[0].quote).toBe(8420);
    list = markOrdered(list, "c1", "ord_9", NOW);
    expect(list[0].status).toBe("ordered");
    expect(list[0].orderId).toBe("ord_9");
    expect(list[0].history.map((h) => h.status)).toEqual(["requested", "in-review", "approved", "ordered"]);
  });

  test("steps cannot be skipped", () => {
    const list = [made()];
    expect(approveQuote(list, "c1", 100, false, NOW).ok).toBe(false);
    expect(markOrdered(list, "c1", "o", NOW)[0].status).toBe("requested");
    expect(startReview(startReview(list, "c1", NOW), "c1", NOW)[0].history).toHaveLength(2);
  });

  test("a quote must be a whole positive Ore amount", () => {
    const list = startReview([made()], "c1", NOW);
    for (const quote of ["0", "-3", "1.5", "abc", "", "2000000"]) expect(approveQuote(list, "c1", quote, false, NOW).ok).toBe(false);
  });

  test("decline and withdraw end the request", () => {
    expect(declineRequest([made()], "c1", NOW)[0].status).toBe("declined");
    expect(withdrawRequest([made()], "c1", NOW)[0].status).toBe("withdrawn");
    const ordered = markOrdered(startReview([made()], "c1", NOW), "c1", "o", NOW);
    expect(ordered[0].status).toBe("in-review");
    expect(isActive(declineRequest([made()], "c1", NOW)[0])).toBe(false);
  });
});

describe("quoteItem", () => {
  test("is priced from the approved quote and carries the Requisition flag", () => {
    const review = startReview([made()], "c1", NOW);
    const approved = approveQuote(review, "c1", 8420, true, NOW);
    if (!approved.ok) throw new Error("approve");
    const item = quoteItem(approved.list[0]);
    expect(item?.basePrice).toBe(8420);
    expect(item?.requisitionEligible).toBe(true);
    expect(item?.tracks).toEqual(["Systems", "Compute"]);
  });

  test("there is no item before a quote exists", () => {
    expect(quoteItem(made())).toBeNull();
  });
});
