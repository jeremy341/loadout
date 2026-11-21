import { describe, expect, test } from "bun:test";
import {
  BACKOFF_MINUTES,
  checkHref,
  clipOutbox,
  failDecision,
  messageIdFromDedupe,
  noticeKind,
  notificationText,
  OUTBOX_TEXT_MAX,
  siteBase,
  ticketReplyDedupe,
  ticketReplyKind,
} from "./outbox";

describe("failDecision (the backoff schedule)", () => {
  test("the first failure waits 1 minute, the second 5, the third 30", () => {
    expect(failDecision(1, "rate_limited", false)).toEqual({ status: "pending", delayMs: 60_000 });
    expect(failDecision(2, "rate_limited", false)).toEqual({ status: "pending", delayMs: 5 * 60_000 });
    expect(failDecision(3, "rate_limited", false)).toEqual({ status: "pending", delayMs: 30 * 60_000 });
  });

  test("the fourth failure is final", () => {
    expect(failDecision(4, "rate_limited", false)).toEqual({ status: "failed" });
  });

  test("the schedule is 1, 5 and 30 minutes", () => {
    expect([...BACKOFF_MINUTES]).toEqual([1, 5, 30]);
  });

  test("user_not_found and cannot_dm_bot are final at once", () => {
    expect(failDecision(1, "user_not_found", false)).toEqual({ status: "failed" });
    expect(failDecision(1, "cannot_dm_bot", false)).toEqual({ status: "failed" });
  });

  test("the bot can mark a failure final itself", () => {
    expect(failDecision(1, "timeout", true)).toEqual({ status: "failed" });
  });
});

describe("clipOutbox", () => {
  test("text is clipped to 600 characters including the ellipsis", () => {
    const clipped = clipOutbox("a".repeat(700));
    expect(Array.from(clipped).length).toBe(OUTBOX_TEXT_MAX);
    expect(clipped.endsWith("…")).toBe(true);
  });

  test("short text is untouched", () => {
    expect(clipOutbox("hello")).toBe("hello");
  });
});

describe("checkHref", () => {
  const base = "https://loadout.example";

  test("nothing is allowed through as null", () => {
    expect(checkHref(null, base)).toEqual({ ok: true, value: null });
    expect(checkHref("", base)).toEqual({ ok: true, value: null });
  });

  test("a site path starting with a single slash is allowed", () => {
    expect(checkHref("/dashboard/explore/abc", base)).toEqual({ ok: true, value: "/dashboard/explore/abc" });
  });

  test("a link under the site base is allowed, anything else is refused", () => {
    expect(checkHref(`${base}/docs/ore`, base).ok).toBe(true);
    expect(checkHref("//evil.example", base).ok).toBe(false);
    expect(checkHref("https://evil.example/x", base).ok).toBe(false);
    expect(checkHref("1794759095.100006", base).ok).toBe(false);
  });
});

describe("siteBase", () => {
  test("uses the public site URL first and drops trailing slashes", () => {
    expect(siteBase({ NEXT_PUBLIC_LOADOUT_SITE_URL: "https://a.example//", SITE_BASE_URL: "https://b.example" })).toBe("https://a.example");
    expect(siteBase({ SITE_BASE_URL: "https://b.example/" })).toBe("https://b.example");
    expect(siteBase({})).toBe("");
  });
});

describe("notification text and kinds", () => {
  test("a title and body join on a new line", () => {
    expect(notificationText("Ship approved", "Nice work")).toBe("Ship approved\nNice work");
    expect(notificationText("Ship approved")).toBe("Ship approved");
  });

  test("notices carry a kind prefix", () => {
    expect(noticeKind("ship-approved")).toBe("notice:ship-approved");
  });
});

describe("ticket reply encoding", () => {
  test("the kind carries the ticket id and the dedupe key carries the message id", () => {
    expect(ticketReplyKind("clx1")).toBe("ticket-reply:clx1");
    expect(ticketReplyDedupe("clx1", "clx2")).toBe("ticket-reply:clx1:clx2");
    expect(messageIdFromDedupe("ticket-reply:clx1:clx2")).toBe("clx2");
  });

  test("a key that is not a ticket reply has no message id", () => {
    expect(messageIdFromDedupe("notice:u1:ship-approved:abc")).toBeNull();
    expect(messageIdFromDedupe("ticket-reply:clx1")).toBeNull();
  });
});
