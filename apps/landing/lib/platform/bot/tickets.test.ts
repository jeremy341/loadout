import { describe, expect, test } from "bun:test";
import {
  bestSimilar,
  clipText,
  clipTitle,
  closedFields,
  dayBuckets,
  resolverRows,
  shouldAutoClose,
  statusChange,
  ticketUrl,
  toTicketRow,
  TITLE_MAX,
  type TicketRecord,
} from "./tickets";

const DAY = 86_400_000;
const NOW = new Date("2026-11-18T12:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY);

describe("statusChange", () => {
  test("open to closed is a close, closed to open is a reopen", () => {
    expect(statusChange("open", "closed")).toBe("close");
    expect(statusChange("closed", "open")).toBe("reopen");
  });

  test("the same state is a no-op", () => {
    expect(statusChange("open", "open")).toBe("none");
    expect(statusChange("closed", "closed")).toBe("none");
  });

  test("an unknown stored status counts as open", () => {
    expect(statusChange("weird", "open")).toBe("none");
    expect(statusChange("weird", "closed")).toBe("close");
  });
});

describe("closedFields", () => {
  test("closing sets the time and the closer", () => {
    expect(closedFields("close", "U0123ABCD", NOW)).toEqual({ closedAt: NOW, closedBy: "U0123ABCD" });
  });

  test("reopening clears both", () => {
    expect(closedFields("reopen", null, NOW)).toEqual({ closedAt: null, closedBy: null });
  });
});

describe("shouldAutoClose", () => {
  const base = { status: "open", keepOpen: false, createdAt: daysAgo(6), lastMessageAt: daysAgo(6) };

  test("open 5+ days and quiet 5+ days is due", () => {
    expect(shouldAutoClose(base, NOW)).toBe(true);
  });

  test("exactly five days counts as due", () => {
    expect(shouldAutoClose({ ...base, createdAt: daysAgo(5), lastMessageAt: daysAgo(5) }, NOW)).toBe(true);
  });

  test("a recent message keeps it open even if it is old", () => {
    expect(shouldAutoClose({ ...base, lastMessageAt: daysAgo(1) }, NOW)).toBe(false);
  });

  test("a young ticket is not due", () => {
    expect(shouldAutoClose({ ...base, createdAt: daysAgo(4) }, NOW)).toBe(false);
  });

  test("a keep-open ticket is never due, and a closed one is not reopened by this", () => {
    expect(shouldAutoClose({ ...base, keepOpen: true }, NOW)).toBe(false);
    expect(shouldAutoClose({ ...base, status: "closed" }, NOW)).toBe(false);
  });
});

describe("clipping", () => {
  test("clipText leaves short text alone and cuts long text with an ellipsis", () => {
    expect(clipText("short", 10)).toBe("short");
    expect(clipText("abcdefghij", 5)).toBe("abcd…");
    expect(Array.from(clipText("abcdefghij", 5)).length).toBe(5);
  });

  test("clipText counts characters, not UTF-16 units", () => {
    expect(clipText("😀😀😀", 3)).toBe("😀😀😀");
    expect(clipText("😀😀😀😀", 3)).toBe("😀😀…");
  });

  test("clipTitle collapses spaces, clips to 100, and turns blank into null", () => {
    expect(clipTitle("   Login   broke  ")).toBe("Login broke");
    expect(clipTitle("   ")).toBeNull();
    expect(Array.from(clipTitle("x".repeat(300)) ?? "").length).toBe(TITLE_MAX);
  });
});

describe("ticketUrl", () => {
  test("is the reviewer path with the ticket id (a placeholder until the page reads it)", () => {
    expect(ticketUrl("abc 1")).toBe("/reviewer/tickets?t=abc%201");
  });
});

describe("bestSimilar", () => {
  const closed = [
    { id: "t1", title: "Cannot log in", text: "the login page says my password is wrong" },
    { id: "t2", title: "Ore not showing", text: "I earned hours but my Ore balance is zero" },
  ];

  test("returns the closest ticket above the threshold", () => {
    expect(bestSimilar("login says password wrong", closed)?.id).toBe("t1");
  });

  test("a vague match is ignored", () => {
    expect(bestSimilar("how do I buy stickers", closed)).toBeNull();
  });

  test("an empty candidate list gives nothing", () => {
    expect(bestSimilar("login", [])).toBeNull();
  });
});

describe("resolverRows", () => {
  test("counts totals and the 7 and 30 day windows, most resolved first", () => {
    const rows = [
      { closedBy: "UAAAA1111", closedAt: daysAgo(1) },
      { closedBy: "UAAAA1111", closedAt: daysAgo(20) },
      { closedBy: "UAAAA1111", closedAt: daysAgo(90) },
      { closedBy: "UBBBB2222", closedAt: daysAgo(2) },
    ];
    expect(resolverRows(rows, NOW)).toEqual([
      { slackId: "UAAAA1111", total: 3, last7d: 1, last30d: 2 },
      { slackId: "UBBBB2222", total: 1, last7d: 1, last30d: 1 },
    ]);
  });

  test("no rows gives an empty board", () => {
    expect(resolverRows([], NOW)).toEqual([]);
  });
});

describe("dayBuckets", () => {
  test("returns every day oldest first, with zero where nothing happened", () => {
    const created = [new Date("2026-11-18T01:00:00.000Z"), new Date("2026-11-18T23:00:00.000Z")];
    const resolved = [new Date("2026-11-17T08:00:00.000Z")];
    const points = dayBuckets(created, resolved, NOW, 3);
    expect(points).toEqual([
      { date: "2026-11-16", created: 0, resolved: 0 },
      { date: "2026-11-17", created: 0, resolved: 1 },
      { date: "2026-11-18", created: 2, resolved: 0 },
    ]);
  });
});

describe("toTicketRow", () => {
  const record: TicketRecord = {
    id: "clx1",
    channelId: "C0123456789",
    messageTs: "1794759095.100006",
    authorSlackId: "U0123ABCD",
    title: null,
    text: "help",
    status: "closed",
    claimedBy: null,
    closedBy: "UAAAA1111",
    closedAt: NOW,
    keepOpen: false,
    lastMessageAt: NOW,
    createdAt: daysAgo(2),
  };

  test("maps dates to ISO text and status to open or closed", () => {
    const row = toTicketRow(record);
    expect(row.status).toBe("closed");
    expect(row.lastMessageAt).toBe(NOW.toISOString());
    expect(row.createdAt).toBe(daysAgo(2).toISOString());
  });

  test("carries no personal field: only the Slack id of the author", () => {
    const keys = Object.keys(toTicketRow(record));
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("authorPersonId");
    expect(keys).not.toContain("closedAt");
  });
});
