import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { ORDERS } from "../platform/orders";
import { shopItemById } from "../platform/shop";
import {
  ACTIVITY_DAYS,
  ORDERS_PAGE_SIZE,
  approvedHoursFor,
  budgetCents,
  budgetUsd,
  canCancel,
  canSeeDetails,
  canViewLabel,
  claimStateFor,
  coveragePercent,
  DEFAULT_QUERY,
  emptyTitle,
  filterOrders,
  filterTickets,
  formatOre,
  formatSpan,
  FULFILLERS,
  FULFILMENT_ORDERS,
  fromParticipantStatus,
  fulfilmentHref,
  fulfilmentOrderById,
  fulfillerById,
  fulfillerHandle,
  fulfillerStats,
  fixturePersonFor,
  fundingFor,
  HELPERS,
  isMyQueue,
  isOverBudget,
  isOwnOrderFor,
  labelFor,
  lastActivity,
  lastSpeaker,
  lastUpdatedHours,
  matchesSearch,
  myQueueQuery,
  openedHoursAgo,
  orderHref,
  oreToCents,
  oreToUsd,
  oreTotal,
  orderView,
  ordersFor,
  parseFulfilmentQuery,
  parseTicketQuery,
  previousSourceFor,
  primaryAction,
  resolverLeaderboard,
  SAMPLE_FULFILLER_EMAIL,
  SAMPLE_FULFILLER_ID,
  shopEconomy,
  sortOrders,
  sortTickets,
  statusCounts,
  summaryFor,
  TICKETS,
  ticketActivity,
  ticketById,
  ticketCounts,
  ticketHref,
  ticketStats,
  toParticipantStatus,
  visibleOrderActions,
  type FulfilmentViewer,
  type OrderActionContext,
} from "./fulfilment";

// Person ids are generated per database, so these are only stand-ins for what requireAccess returns.
const OWNER: FulfilmentViewer = { personId: "p-owner", isOwner: true, email: "staff@loadout.test" };
const FULFILLER: FulfilmentViewer = { personId: "p-fulfiller", isOwner: false, email: SAMPLE_FULFILLER_EMAIL };
const OTHER_FULFILLER: FulfilmentViewer = { personId: "p-other", isOwner: false, email: "someone.else@loadout.test" };

const order = (id: string) => {
  const found = fulfilmentOrderById(id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
};

describe("order fixtures", () => {
  test("every line is a real catalog item", () => {
    for (const item of FULFILMENT_ORDERS) {
      for (const line of item.lines) expect(shopItemById(line.itemId)).not.toBeNull();
    }
  });

  test("the participant side's own orders appear with the same number, lines and mapped status", () => {
    for (const mine of ORDERS) {
      const staff = order(mine.id);
      expect(staff.number).toBe(mine.number);
      expect(staff.lines).toEqual(mine.lines);
      expect(staff.status).toBe(fromParticipantStatus(mine.status));
      expect(toParticipantStatus(staff.status)).toBe(mine.status);
    }
  });

  test("the staff stages fold back onto the builder's four words, and a cancelled order has none", () => {
    expect(toParticipantStatus("new")).toBe("placed");
    expect(toParticipantStatus("claimed")).toBe("placed");
    expect(toParticipantStatus("packed")).toBe("packed");
    expect(toParticipantStatus("cancelled")).toBeNull();
    expect(fromParticipantStatus("placed")).toBe("new");
  });

  test("ids are unique, numbers match ids and only a country is stored as a destination", () => {
    expect(new Set(FULFILMENT_ORDERS.map((item) => item.id)).size).toBe(FULFILMENT_ORDERS.length);
    for (const item of FULFILMENT_ORDERS) {
      expect(item.number).toBe(item.id.toUpperCase());
      expect(item.country).toMatch(/^[A-Za-z ]+$/);
    }
  });

  test("a stage has its stamps and its fulfiller; only new and cancelled orders have none", () => {
    for (const item of FULFILMENT_ORDERS) {
      expect(item.assignee === null).toBe(item.status === "new" || item.status === "cancelled");
      if (item.assignee) expect(fulfillerById(item.assignee)).not.toBeNull();
      expect(item.claimedHoursAgo !== undefined).toBe(["claimed", "packed", "shipped", "delivered"].includes(item.status));
      expect(item.packedHoursAgo !== undefined).toBe(["packed", "shipped", "delivered"].includes(item.status));
      expect(item.shippedHoursAgo !== undefined).toBe(item.status === "shipped" || item.status === "delivered");
      expect(item.deliveredHoursAgo !== undefined).toBe(item.status === "delivered");
      expect(Boolean(item.tracking)).toBe(item.status === "shipped" || item.status === "delivered");
      expect(item.actualCostUsd !== undefined).toBe(["packed", "shipped", "delivered"].includes(item.status));
      expect(Boolean(item.note)).toBe(item.status === "cancelled");
    }
  });

  test("stamps run forward in time: placed, claimed, packed, shipped, delivered", () => {
    for (const item of FULFILMENT_ORDERS) {
      const stamps = [item.placedHoursAgo, item.claimedHoursAgo, item.packedHoursAgo, item.shippedHoursAgo, item.deliveredHoursAgo].filter((value): value is number => value !== undefined);
      expect(stamps).toEqual([...stamps].sort((a, b) => b - a));
    }
  });

  test("a flag belongs to an order that is still open and names who raised it", () => {
    for (const item of FULFILMENT_ORDERS.filter((entry) => entry.flag)) {
      expect(["new", "claimed", "packed"]).toContain(item.status);
      expect(fulfillerById(item.flag?.by ?? "")).not.toBeNull();
    }
  });
});

describe("prices", () => {
  test("a total is the sum of the shop's own final prices at the buyer's level", () => {
    const item = order("lo-1063");
    expect(oreTotal(item)).toBeGreaterThan(0);
    expect(oreTotal(item)).toBeLessThanOrEqual(60 + 2 * 15);
    expect(summaryFor(item)).toBe("Multimeter, Raspberry Pi Pico W x2");
  });

  test("10 Ore is $4.35", () => {
    expect(oreToUsd(10)).toBe("$4.35");
    expect(oreToUsd(0)).toBe("$0.00");
    expect(oreToUsd(100)).toBe("$43.50");
    expect(oreToUsd(-5)).toBe("$0.00");
    expect(oreToCents(10)).toBe(435);
    expect(formatOre(1290)).toBe("1,290 Ore");
  });

  test("the budget is the Ore total at the shop rate, and over budget means the real cost is above it", () => {
    const item = order("lo-1063");
    expect(budgetCents(item)).toBe(oreToCents(oreTotal(item)));
    expect(budgetUsd(item)).toBe(oreToUsd(oreTotal(item)));
    expect(isOverBudget(item)).toBe(false);
    expect(isOverBudget(order("lo-1068"))).toBe(true);
    expect(isOverBudget(order("lo-1058"))).toBe(false);
  });

  test("an unknown buyer pays full price", () => {
    expect(Object.values(approvedHoursFor("nobody")).every((hours) => hours === 0)).toBe(true);
  });
});

describe("who sees the address", () => {
  test("the sample fulfiller account stands in for exactly one fixture fulfiller; nobody else does", () => {
    expect(fixturePersonFor(SAMPLE_FULFILLER_EMAIL)).toBe(SAMPLE_FULFILLER_ID);
    expect(fixturePersonFor(" Fulfiller@LOADOUT.test ")).toBe(SAMPLE_FULFILLER_ID);
    expect(fixturePersonFor("staff@loadout.test")).toBeNull();
    expect(fixturePersonFor("helper@loadout.test")).toBeNull();
  });

  test("the sample fulfiller account matches the seeded local test fulfiller", () => {
    const seed = readFileSync(new URL("../platform/local-accounts.ts", import.meta.url), "utf8");
    expect(seed).toContain(`email: "${SAMPLE_FULFILLER_EMAIL}"`);
    expect(seed).toMatch(new RegExp(`${SAMPLE_FULFILLER_EMAIL.replace(".", "\\.")}[^\\n]*roles: \\["fulfiller"\\]`));
  });

  test("an owner sees every order's details", () => {
    for (const item of FULFILMENT_ORDERS) expect(canSeeDetails(item, OWNER)).toBe(true);
  });

  test("a fulfiller sees details only for the orders they claimed, and the country for the rest", () => {
    const visible = FULFILMENT_ORDERS.filter((item) => canSeeDetails(item, FULFILLER));
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((item) => item.assignee === SAMPLE_FULFILLER_ID)).toBe(true);
    expect(visible.length).toBeLessThan(FULFILMENT_ORDERS.length / 2);
    expect(canSeeDetails(order("lo-1062"), FULFILLER)).toBe(true);
    expect(canSeeDetails(order("lo-1063"), FULFILLER)).toBe(false);
    expect(canSeeDetails(order("lo-1058"), FULFILLER)).toBe(false);
  });

  test("the sample fulfiller holds exactly one open order, so the queue shows one with details", () => {
    const open = ordersFor(SAMPLE_FULFILLER_ID).filter((item) => ["claimed", "packed"].includes(item.status));
    expect(open.map((item) => item.id)).toEqual(["lo-1062"]);
  });

  test("a fulfiller who claimed nothing sees no details at all", () => {
    expect(FULFILMENT_ORDERS.some((item) => canSeeDetails(item, OTHER_FULFILLER))).toBe(false);
  });

  test("the label follows the address rule", () => {
    expect(canViewLabel(order("lo-1062"), FULFILLER)).toBe(true);
    expect(canViewLabel(order("lo-1066"), FULFILLER)).toBe(false);
    expect(canViewLabel(order("lo-1066"), OWNER)).toBe(true);
  });

  test("claim state: unclaimed, mine or others", () => {
    expect(claimStateFor(order("lo-1058"), FULFILLER)).toBe("unclaimed");
    expect(claimStateFor(order("lo-1062"), FULFILLER)).toBe("mine");
    expect(claimStateFor(order("lo-1063"), FULFILLER)).toBe("others");
    expect(claimStateFor(order("lo-1062"), OWNER)).toBe("others");
    expect(claimStateFor(order("lo-1062"), OTHER_FULFILLER)).toBe("others");
  });

  test("a fulfiller's own order is theirs to see as a buyer but never to claim; an owner has none", () => {
    expect(isOwnOrderFor(order("lo-1073"), FULFILLER)).toBe(true);
    expect(isOwnOrderFor(order("lo-1058"), FULFILLER)).toBe(false);
    expect(isOwnOrderFor(order("lo-1073"), OWNER)).toBe(false);
    expect(isOwnOrderFor(order("lo-1073"), OTHER_FULFILLER)).toBe(false);
  });
});

describe("actions", () => {
  const base: OrderActionContext = { status: "new", flagged: false, mine: false, ownOrder: false, canManage: false };

  test("a fulfiller can claim a new order, but not their own", () => {
    expect(visibleOrderActions(base).primary).toBe(true);
    expect(primaryAction(base)).toBe("claim");
    expect(primaryAction({ ...base, ownOrder: true })).toBe("own");
  });

  test("the main step follows the stage for the fulfiller who claimed it", () => {
    expect(primaryAction({ ...base, status: "claimed", mine: true })).toBe("pack");
    expect(primaryAction({ ...base, status: "packed", mine: true })).toBe("ship");
  });

  test("another fulfiller's order shows nothing to a fulfiller, and reassign to an owner", () => {
    for (const status of ["claimed", "packed"] as const) {
      expect(visibleOrderActions({ ...base, status }).primary).toBe(false);
      expect(primaryAction({ ...base, status })).toBe("none");
      expect(primaryAction({ ...base, status, canManage: true })).toBe("reassign");
    }
  });

  test("shipped orders are closed only by an owner, and closed orders have no main step", () => {
    expect(visibleOrderActions({ ...base, status: "shipped", mine: true }).any).toBe(false);
    expect(primaryAction({ ...base, status: "shipped", canManage: true })).toBe("deliver");
    for (const status of ["delivered", "cancelled"] as const) {
      const shown = visibleOrderActions({ ...base, status, canManage: true, mine: true });
      expect(shown.primary || shown.flag).toBe(false);
      expect(primaryAction({ ...base, status, canManage: true })).toBe("none");
    }
    expect(visibleOrderActions({ ...base, status: "cancelled", canManage: true }).any).toBe(false);
  });

  test("flagging is for the fulfiller who has it or an owner; only an owner clears a flag", () => {
    expect(visibleOrderActions({ ...base, status: "claimed", mine: true }).flag).toBe(true);
    expect(visibleOrderActions({ ...base, status: "claimed" }).flag).toBe(false);
    expect(visibleOrderActions({ ...base, status: "claimed", mine: true, flagged: true }).flag).toBe(false);
    expect(visibleOrderActions({ ...base, status: "claimed", mine: true, flagged: true, canManage: true }).flag).toBe(true);
    expect(visibleOrderActions({ ...base, status: "shipped", canManage: true }).flag).toBe(false);
  });

  test("editing the record is owner only, and not for a new or cancelled order", () => {
    expect(visibleOrderActions({ ...base, status: "packed", mine: true }).edit).toBe(false);
    expect(visibleOrderActions({ ...base, status: "packed", canManage: true }).edit).toBe(true);
    expect(visibleOrderActions({ ...base, status: "new", canManage: true }).edit).toBe(false);
    expect(visibleOrderActions({ ...base, status: "delivered", canManage: true }).edit).toBe(true);
  });

  test("cancel and refund is owner only, and only before the order ships", () => {
    expect(canCancel("new", true)).toBe(true);
    expect(canCancel("packed", true)).toBe(true);
    expect(canCancel("shipped", true)).toBe(false);
    expect(canCancel("new", false)).toBe(false);
  });
});

describe("funding check", () => {
  test("it covers, falls short, waits on hours in review, or needs review", () => {
    expect(fundingFor(order("lo-1058")).status).toBe("covered");
    expect(fundingFor(order("lo-1071")).status).toBe("short");
    expect(fundingFor(order("lo-1060")).status).toBe("unverified");
    expect(fundingFor(order("lo-1065")).status).toBe("review");
    expect(fundingFor(order("lo-1068")).status).toBe("review");
  });

  test("the sums add up: earned minus spent is the balance, minus the order is what is left", () => {
    for (const item of FULFILMENT_ORDERS) {
      const funding = fundingFor(item);
      expect(funding.balance).toBe(funding.earned - funding.committed);
      expect(funding.after).toBe(funding.balance - funding.cost);
      expect(funding.committed).toBe(funding.spentBefore + funding.commitments.reduce((sum, entry) => sum + entry.ore, 0));
      expect(funding.byTrack.reduce((sum, row) => sum + row.hours, 0)).toBe(funding.approvedHours);
      expect(funding.earned).toBe(funding.approvedHours * 10);
    }
  });

  test("only earlier orders of the same builder count, and never a cancelled one", () => {
    const funding = fundingFor(order("lo-1063"));
    expect(funding.commitments.map((entry) => entry.id).sort()).toEqual(["lo-1042", "lo-1057"]);
    const cancelled = fundingFor(order("lo-1072"));
    expect(cancelled.cost).toBe(0);
    expect(fundingFor(order("lo-1062")).commitments).toEqual([]);
  });

  test("hours in review are never counted as available", () => {
    const funding = fundingFor(order("lo-1060"));
    expect(funding.after).toBeLessThan(0);
    expect(funding.after + funding.pendingOre).toBeGreaterThanOrEqual(0);
  });

  test("coverage is a percent of the cost, clamped, and a free order is covered", () => {
    expect(coveragePercent({ ...fundingFor(order("lo-1058")), balance: 1000, cost: 100 })).toBe(100);
    expect(coveragePercent({ ...fundingFor(order("lo-1058")), balance: 50, cost: 200 })).toBe(25);
    expect(coveragePercent({ ...fundingFor(order("lo-1058")), balance: -10, cost: 200 })).toBe(0);
    expect(coveragePercent({ ...fundingFor(order("lo-1058")), balance: 0, cost: 0 })).toBe(100);
  });

  test("the shop economy compares what builders paid with what was spent, on orders with a recorded cost", () => {
    const economy = shopEconomy();
    const costed = FULFILMENT_ORDERS.filter((item) => item.actualCostUsd !== undefined);
    expect(economy.orders).toBe(costed.length);
    expect(economy.netCents).toBe(economy.redeemedCents - economy.spentCents);
    expect(economy.redeemedOre).toBe(costed.reduce((sum, item) => sum + oreTotal(item), 0));
  });

  test("a supplier from an earlier order for the same item is offered again", () => {
    expect(previousSourceFor(order("lo-1063"))).toBe("Sample parts shop");
    expect(previousSourceFor(order("lo-1071"))).toBeNull();
  });
});

describe("order list", () => {
  test("parseFulfilmentQuery accepts known values and falls back", () => {
    expect(parseFulfilmentQuery({})).toEqual(DEFAULT_QUERY);
    expect(parseFulfilmentQuery({ status: "Packed", claim: "MINE", funding: "short", sort: "shortfall", page: "2", q: "  pico  ", order: "LO-1062" })).toEqual({
      status: "packed",
      claim: "mine",
      funding: "short",
      sort: "shortfall",
      page: 2,
      q: "pico",
      order: "lo-1062",
    });
    expect(parseFulfilmentQuery({ status: "nope", claim: "x", funding: "y", sort: "z", page: "-3", order: "../etc" })).toEqual(DEFAULT_QUERY);
    expect(parseFulfilmentQuery({ status: ["flagged", "new"] }).status).toBe("flagged");
    expect(parseFulfilmentQuery({ q: "x".repeat(300) }).q).toHaveLength(80);
  });

  test("fulfilmentHref leaves the defaults out and round-trips", () => {
    expect(fulfilmentHref(DEFAULT_QUERY)).toBe("/fulfilment");
    expect(fulfilmentHref({ ...DEFAULT_QUERY, status: "all" })).toBe("/fulfilment?status=all");
    expect(fulfilmentHref({ ...DEFAULT_QUERY, page: 2 })).toBe("/fulfilment?page=2");
    expect(orderHref("lo-1057")).toBe("/fulfilment?status=all&order=lo-1057");
    const query = { status: "shipped", claim: "others", q: "kit", funding: "covered", sort: "hours", order: "lo-1067", page: 2 } as const;
    expect(parseFulfilmentQuery(Object.fromEntries(new URL(`http://x${fulfilmentHref(query)}`).searchParams))).toEqual(query);
  });

  test("My queue is the in-progress stages, claimed by the viewer", () => {
    expect(isMyQueue(myQueueQuery())).toBe(true);
    expect(isMyQueue(DEFAULT_QUERY)).toBe(false);
    const mine = filterOrders(FULFILMENT_ORDERS, myQueueQuery(), FULFILLER);
    expect(mine.map((item) => item.id)).toEqual(["lo-1062"]);
    expect(filterOrders(FULFILMENT_ORDERS, myQueueQuery(), OWNER)).toHaveLength(0);
  });

  test("stage filters: one stage, the over-budget queue, in progress, or all", () => {
    expect(filterOrders(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "all" }, OWNER)).toHaveLength(FULFILMENT_ORDERS.length);
    expect(filterOrders(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "claimed" }, OWNER).every((item) => item.status === "claimed")).toBe(true);
    expect(filterOrders(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "flagged" }, OWNER).map((item) => item.id)).toEqual(["lo-1065"]);
    const active = filterOrders(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "active" }, OWNER);
    expect(active.every((item) => ["claimed", "packed", "shipped"].includes(item.status))).toBe(true);
  });

  test("claim state filters: unclaimed, mine, others", () => {
    const all = { ...DEFAULT_QUERY, status: "all" } as const;
    const unclaimed = filterOrders(FULFILMENT_ORDERS, { ...all, claim: "unclaimed" }, FULFILLER);
    expect(unclaimed.every((item) => item.assignee === null)).toBe(true);
    const mine = filterOrders(FULFILMENT_ORDERS, { ...all, claim: "mine" }, FULFILLER);
    const others = filterOrders(FULFILMENT_ORDERS, { ...all, claim: "others" }, FULFILLER);
    expect(unclaimed.length + mine.length + others.length).toBe(FULFILMENT_ORDERS.length);
    expect(mine.every((item) => item.assignee === SAMPLE_FULFILLER_ID)).toBe(true);
  });

  test("search matches the number, the handle, the country and the items, every word", () => {
    expect(matchesSearch(order("lo-1062"), "pico")).toBe(true);
    expect(matchesSearch(order("lo-1062"), "LO-1062")).toBe(true);
    expect(matchesSearch(order("lo-1062"), "picopilgrim canada")).toBe(true);
    expect(matchesSearch(order("lo-1062"), "pico germany")).toBe(false);
    expect(matchesSearch(order("lo-1062"), "")).toBe(true);
    expect(filterOrders(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "all", q: "kestrel42" }, OWNER).map((item) => item.id).sort()).toEqual(["lo-1042", "lo-1057", "lo-1063"]);
  });

  test("the funding filter keeps one verdict", () => {
    const short = filterOrders(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "all", funding: "short" }, OWNER);
    expect(short.map((item) => item.id)).toEqual(["lo-1071"]);
  });

  test("sort: newest by default, then the funding sorts, without changing the input", () => {
    const copy = [...FULFILMENT_ORDERS];
    const newest = sortOrders(FULFILMENT_ORDERS);
    expect(FULFILMENT_ORDERS).toEqual(copy);
    const ages = newest.map(lastUpdatedHours);
    expect(ages).toEqual([...ages].sort((a, b) => a - b));
    expect(sortOrders(FULFILMENT_ORDERS, "shortfall")[0]?.id).toBe("lo-1071");
    const remaining = sortOrders(FULFILMENT_ORDERS, "remaining").map((item) => fundingFor(item).after);
    expect(remaining).toEqual([...remaining].sort((a, b) => b - a));
    const hours = sortOrders(FULFILMENT_ORDERS, "hours").map((item) => fundingFor(item).approvedHours);
    expect(hours).toEqual([...hours].sort((a, b) => b - a));
  });

  test("counts add up and the flag is counted on its own", () => {
    const counts = statusCounts(FULFILMENT_ORDERS);
    expect(counts.new + counts.claimed + counts.packed + counts.shipped + counts.delivered + counts.cancelled).toBe(counts.all);
    expect(counts.all).toBe(FULFILMENT_ORDERS.length);
    expect(counts.flagged).toBe(1);
  });

  test("the view pages ten at a time, selects the named order or the first, and clamps a page past the end", () => {
    const first = orderView(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "all" }, OWNER);
    expect(first.page.items).toHaveLength(10);
    expect(first.page.pages).toBe(Math.ceil(FULFILMENT_ORDERS.length / ORDERS_PAGE_SIZE));
    expect(first.page.pages).toBeGreaterThan(2);
    expect(first.selected?.id).toBe(first.page.items[0]?.id);
    expect(first.explicit).toBe(false);
    const named = orderView(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "all", order: "lo-1042" }, OWNER);
    expect(named.selected?.id).toBe("lo-1042");
    expect(named.explicit).toBe(true);
    const missing = orderView(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, order: "lo-9999" }, OWNER);
    expect(missing.explicit).toBe(false);
    expect(orderView(FULFILMENT_ORDERS, { ...DEFAULT_QUERY, status: "all", page: 99 }, OWNER).page.page).toBe(first.page.pages);
    expect(orderView([], DEFAULT_QUERY, OWNER).selected).toBeNull();
  });

  test("the empty message says what is missing", () => {
    expect(emptyTitle({ ...DEFAULT_QUERY, q: "zzz" })).toBe('No orders match "zzz"');
    expect(emptyTitle(myQueueQuery())).toBe("Nothing in your queue");
    expect(emptyTitle(DEFAULT_QUERY)).toBe("No orders waiting to be claimed");
    expect(emptyTitle({ ...DEFAULT_QUERY, status: "flagged" })).toBe("Nothing over budget right now");
  });
});

describe("fulfillers", () => {
  test("stats count what is on their desk and what they shipped", () => {
    const stats = fulfillerStats("tamsin");
    expect(stats.claimed).toBe(5);
    expect(stats.inQueue).toBe(2);
    expect(stats.shipped).toBe(3);
    expect(stats.delivered).toBe(1);
    expect(stats.avgClaimToShipHours).toBeGreaterThan(0);
    expect(stats.lastActivityHours).toBe(Math.min(...ordersFor("tamsin").map(lastUpdatedHours)));
  });

  test("a fulfiller with nothing has zero stats and never been active", () => {
    const stats = fulfillerStats("nobody");
    expect(stats).toEqual({ claimed: 0, shipped: 0, delivered: 0, inQueue: 0, avgClaimToShipHours: 0, lastActivityHours: null });
  });

  test("every fulfiller has a handle and orders are counted once", () => {
    for (const person of FULFILLERS) expect(fulfillerHandle(person.id)).toBe(person.handle);
    expect(FULFILLERS.reduce((sum, person) => sum + fulfillerStats(person.id).claimed, 0)).toBe(FULFILMENT_ORDERS.filter((item) => item.assignee).length);
  });

  test("handle lookup", () => {
    expect(fulfillerHandle(null)).toBe("Unassigned");
    expect(fulfillerHandle("unknown")).toBe("unknown");
  });

  test("spans read as days and hours", () => {
    expect(formatSpan(0)).toBe("-");
    expect(formatSpan(5)).toBe("5h");
    expect(formatSpan(24)).toBe("1d");
    expect(formatSpan(40)).toBe("1d 16h");
  });
});

describe("shipping label", () => {
  test("only placeholders and the country", () => {
    for (const item of FULFILMENT_ORDERS) {
      const label = labelFor(item);
      expect(label.recipient).toContain("Sample");
      expect(label.lines.every((line) => /sample|^0+ /i.test(line))).toBe(true);
      expect(label.country).toBe(item.country);
      expect(label.footer).toContain(item.number);
    }
  });

  test("the footer counts items with a plural", () => {
    expect(labelFor(order("lo-1057")).footer).toBe("Order LO-1057, 1 item");
    expect(labelFor(order("lo-1063")).footer).toBe("Order LO-1063, 3 items");
  });
});

describe("tickets", () => {
  test("ids are unique, threads are ordered oldest first, linked orders exist and resolved tickets say who and when", () => {
    expect(new Set(TICKETS.map((ticket) => ticket.id)).size).toBe(TICKETS.length);
    for (const ticket of TICKETS) {
      const ages = ticket.thread.map((message) => message.hoursAgo);
      expect(ages).toEqual([...ages].sort((a, b) => b - a));
      if (ticket.order) expect(fulfilmentOrderById(ticket.order)).not.toBeNull();
      expect(ticket.thread[0]?.from).toBe("builder");
      expect(ticket.status === "resolved").toBe(ticket.resolvedBy !== undefined && ticket.resolvedHoursAgo !== undefined);
      if (ticket.resolvedBy) expect(HELPERS.some((helper) => helper.id === ticket.resolvedBy)).toBe(true);
      if (ticket.resolvedHoursAgo !== undefined) expect(ticket.resolvedHoursAgo).toBeLessThanOrEqual(lastActivity(ticket));
    }
  });

  test("parse and href round-trip and drop defaults", () => {
    expect(parseTicketQuery({})).toEqual({ status: "open", q: "" });
    expect(parseTicketQuery({ status: "RESOLVED", q: " cable " })).toEqual({ status: "resolved", q: "cable" });
    expect(parseTicketQuery({ status: "x" })).toEqual({ status: "open", q: "" });
    expect(parseTicketQuery({ status: "waiting" }).status).toBe("open");
    expect(ticketHref({ status: "open", q: "" })).toBe("/tickets");
    expect(ticketHref({ status: "all", q: "" })).toBe("/tickets?status=all");
    expect(ticketHref({ status: "resolved", q: "cable" })).toBe("/tickets?status=resolved&q=cable");
    const query = { status: "all", q: "lo-1066" } as const;
    expect(parseTicketQuery(Object.fromEntries(new URL(`http://x${ticketHref(query)}`).searchParams))).toEqual(query);
  });

  test("filter by tab and search together, searching the thread, the handle and the order number", () => {
    expect(filterTickets(TICKETS, { status: "open", q: "" }).every((ticket) => ticket.status === "open")).toBe(true);
    expect(filterTickets(TICKETS, { status: "all", q: "" })).toHaveLength(TICKETS.length);
    expect(filterTickets(TICKETS, { status: "all", q: "photo of the cable" }).map((ticket) => ticket.id)).toEqual(["tk-302"]);
    expect(filterTickets(TICKETS, { status: "all", q: "LO-1066" }).map((ticket) => ticket.id)).toEqual(["tk-313"]);
    expect(filterTickets(TICKETS, { status: "resolved", q: "kestrel42" })).toHaveLength(0);
  });

  test("sort is newest opened first", () => {
    const ages = sortTickets(TICKETS).map(openedHoursAgo);
    expect(ages).toEqual([...ages].sort((a, b) => a - b));
  });

  test("stats and counts add up, and counts follow the search", () => {
    const stats = ticketStats();
    expect(stats.open + stats.resolved).toBe(stats.total);
    const counts = ticketCounts(TICKETS, "");
    expect(counts).toEqual({ open: stats.open, resolved: stats.resolved, all: stats.total });
    expect(ticketCounts(TICKETS, "cable").all).toBe(filterTickets(TICKETS, { status: "all", q: "cable" }).length);
  });

  test("activity buckets tickets by day over the last 30 days, oldest first", () => {
    const points = ticketActivity();
    expect(points).toHaveLength(ACTIVITY_DAYS);
    expect(points[0]?.daysAgo).toBe(ACTIVITY_DAYS - 1);
    expect(points.at(-1)?.daysAgo).toBe(0);
    const within = TICKETS.filter((ticket) => openedHoursAgo(ticket) < ACTIVITY_DAYS * 24);
    expect(points.reduce((sum, point) => sum + point.created, 0)).toBe(within.length);
    const resolved = TICKETS.filter((ticket) => ticket.resolvedHoursAgo !== undefined && ticket.resolvedHoursAgo < ACTIVITY_DAYS * 24);
    expect(points.reduce((sum, point) => sum + point.resolved, 0)).toBe(resolved.length);
  });

  test("the resolver table ranks by all-time, then 30 days, and counts windows", () => {
    const rows = resolverLeaderboard();
    expect(rows.map((row) => row.total)).toEqual([...rows.map((row) => row.total)].sort((a, b) => b - a));
    for (const row of rows) {
      expect(row.last7d).toBeLessThanOrEqual(row.last30d);
      expect(row.last30d).toBeLessThanOrEqual(row.total);
    }
    expect(rows.reduce((sum, row) => sum + row.total, 0)).toBe(ticketStats().resolved);
  });

  test("activity helpers read the thread", () => {
    const ticket = ticketById("tk-303");
    if (!ticket) throw new Error("missing ticket");
    expect(openedHoursAgo(ticket)).toBe(26);
    expect(lastActivity(ticket)).toBe(6);
    expect(lastSpeaker(ticket)).toBe("builder");
    const other = ticketById("tk-302");
    if (!other) throw new Error("missing ticket");
    expect(lastSpeaker(other)).toBe("staff");
  });
});
