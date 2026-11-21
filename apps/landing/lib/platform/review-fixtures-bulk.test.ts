import { describe, expect, test } from "bun:test";
import { resolveAccess } from "../reviewer/access";
import { navCounts } from "../reviewer/counts";
import { FULFILMENT_ORDERS, TICKETS } from "../reviewer/fulfilment";
import { REPORTS, reportCounts } from "../reviewer/moderation";
import { PLAYERS, playerById, STAFF_PROJECTS } from "../reviewer/people";
import { BULK_AUDITS, BULK_HANDLES, BULK_ORDERS, BULK_PLAYERS, BULK_PROJECTS, BULK_REPORTS, BULK_SHIPS, BULK_TICKETS } from "./review-fixtures-bulk";
import { filterShips, queueView, QUEUE_PAGE_SIZE, REVIEW_AUDITS, REVIEW_LOG, REVIEW_SHIPS, tabCounts } from "./review";

const owner = () => {
  const access = resolveAccess({ id: "o", email: "owner@loadout.test" }, { ownerEmails: ["owner@loadout.test"], roles: [] });
  if (!access) throw new Error("expected access");
  return access;
};

describe("the generated sample data", () => {
  test("ships start at sh-3101, are unique, and sit beside the hand-written ones", () => {
    expect(BULK_SHIPS.length).toBeGreaterThanOrEqual(60);
    expect(BULK_SHIPS[0].id).toBe("sh-3101");
    expect(new Set(REVIEW_SHIPS.map((ship) => ship.id)).size).toBe(REVIEW_SHIPS.length);
    expect(REVIEW_SHIPS.slice(0, 17).every((ship) => /^sh-20/.test(ship.id))).toBe(true);
    for (const ship of BULK_SHIPS) expect(ship.source).toContain(".example/");
  });

  test("generated ships never take the hand-written special roles", () => {
    for (const ship of BULK_SHIPS) {
      expect(ship.claimedBy).toBeNull();
      expect(ship.hold).toBeUndefined();
      expect(ship.reserved).toBeUndefined();
      expect(ship.update).toBeUndefined();
      expect(ship.turnedNineteen).toBeUndefined();
      expect(ship.expeditionId).toBeUndefined();
      expect(["kestrel42", "ploughshare"]).not.toContain(ship.builder);
    }
  });

  test("every generated builder is a player and the handles are invented", () => {
    expect(BULK_HANDLES).toHaveLength(60);
    expect(new Set(BULK_HANDLES).size).toBe(60);
    for (const ship of BULK_SHIPS) expect(playerById(ship.builder)).not.toBeNull();
    expect(PLAYERS.length).toBeGreaterThanOrEqual(BULK_PLAYERS.length + 27);
  });

  test("the lists are long enough to page: queue, audits, log, projects, orders, tickets, reports", () => {
    expect(queueView(REVIEW_SHIPS, { kind: "software", type: "all", page: 1 }).total).toBeGreaterThan(QUEUE_PAGE_SIZE);
    expect(BULK_AUDITS.length).toBeGreaterThanOrEqual(100);
    expect(REVIEW_AUDITS.length).toBeGreaterThan(100);
    expect(REVIEW_LOG.length).toBeGreaterThan(100);
    expect(STAFF_PROJECTS.length).toBeGreaterThanOrEqual(BULK_PROJECTS.length + REVIEW_SHIPS.length);
    expect(BULK_ORDERS.length).toBeGreaterThanOrEqual(30);
    expect(BULK_TICKETS.length).toBeGreaterThanOrEqual(30);
    expect(BULK_REPORTS.length).toBeGreaterThanOrEqual(30);
    expect(FULFILMENT_ORDERS.length).toBeGreaterThan(40);
    expect(TICKETS.length).toBeGreaterThan(40);
    expect(REPORTS.length).toBeGreaterThan(40);
  });

  test("the nav badges read the same lists as the tabs", () => {
    const counts = navCounts(owner());
    expect(counts["/review"]).toBe(tabCounts(REVIEW_SHIPS).pending);
    expect(counts["/review"]).toBe(filterShips(REVIEW_SHIPS, { statuses: ["waiting", "claimed"] }).length);
    expect(counts["/reports"]).toBe(reportCounts().open);
    expect(counts["/tickets"]).toBe(TICKETS.filter((ticket) => ticket.status === "open").length);
    expect(counts["/fulfilment"]).toBe(FULFILMENT_ORDERS.filter((order) => order.status === "new").length);
  });

  test("generated audits and the hand-written ones stay newest first", () => {
    const ages = REVIEW_AUDITS.map((audit) => audit.hoursAgo);
    expect(ages).toEqual([...ages].sort((a, b) => a - b));
    for (const audit of BULK_AUDITS) expect(audit.hoursAgo).toBeGreaterThan(800);
  });
});


describe("the queue view options", () => {
  test("the queue can be narrowed by a match and given another page size", () => {
    const all = queueView(REVIEW_SHIPS, { kind: "software", type: "all", page: 1 });
    const found = queueView(REVIEW_SHIPS, { kind: "software", type: "all", page: 1 }, { match: (item) => item.title.toLowerCase().includes("rollback") });
    expect(found.total).toBe(1);
    expect(found.chips[0].count).toBe(1);
    const big = queueView(REVIEW_SHIPS, { kind: "software", type: "all", page: 1 }, { per: 50 });
    expect(big.page.items).toHaveLength(all.total);
    expect(big.page.pages).toBe(1);
  });
});
