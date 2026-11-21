import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  EVENT_STATUS_LABELS,
  eventStatus,
  isRsvpOpen,
  rsvpCountText,
  type EventWindow,
} from "../lib/platform/community";

// The Community section of the participant platform. Goals, news, events and the leaderboard read real database rows
// (seeded for local development by `bun run db:seed:local` plus `bun run scripts/seed-community.ts`); the era strip, the idea
// board and Show & Tell are still proposed content and each says so where it appears. Local development opens without
// sign-in as the builder test account (see platform.spec.ts), so these tests need the same local Postgres and seeded accounts.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const VIEWPORTS = [
  [375, 812],
  [1440, 900],
] as const;
const SCHEMES = ["dark", "light"] as const;
const PAGES = [
  "/dashboard/community",
  "/dashboard/community/show-and-tell",
  "/dashboard/community/show-and-tell/session-2",
  "/dashboard/community/ideas",
  "/dashboard/community/ideas/parts-checklist",
  "/dashboard/community/news",
  "/dashboard/community/leaderboard",
  "/dashboard/community/leaderboard?range=all",
  "/dashboard/community/goals",
  "/dashboard/community/events",
];
const TABS = ["Overview", "Show & Tell", "Ideas", "News", "Leaderboard", "Goals", "Events"];

async function setTheme(page: Page, width: number, height: number, scheme: (typeof SCHEMES)[number]) {
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
  await page.addInitScript((theme) => localStorage.setItem("loadout-theme", theme), scheme);
}

test("the Community hub has the tab row, the Era, real goals and one short preview of each page", async ({ page }) => {
  await page.goto("/dashboard/community");
  // The heading is visible and comes before the tab row.
  await expect(page.getByRole("heading", { level: 1, name: "Community" })).toBeVisible({ timeout: 30000 });
  const tabs = page.getByRole("navigation", { name: "Community" }).getByRole("link");
  await expect(tabs).toHaveText(TABS, { timeout: 30000 });
  await expect(tabs.first()).toHaveAttribute("aria-current", "page");

  await expect(page.getByRole("heading", { level: 2, name: "Community Era" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Example Era sequence" }).getByRole("listitem")).toHaveCount(5);
  await expect(page.getByText("+10% of base Ore (planned)")).toBeVisible();
  // No threshold, countdown or percentage for the Era.
  await expect(page.locator(".cm-era")).not.toContainText(/\d+\s?%\s?(complete|done)/i);

  // The goal strip is the real goals section: the seeded goals page copies decide whether the rows are there.
  const goalBars = page.locator(".cm-refer .cm-bar");
  const seededGoals = await goalBars.count();
  test.skip(seededGoals === 0, "Community goals reads the database. Run scripts/seed-community.ts first.");
  await expect(page.getByRole("heading", { level: 2, name: "Community goals" })).toBeVisible();
  await expect(goalBars).toHaveCount(2);

  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveText(["Community Era", "Community goals", "Show & Tell", "Leaderboard", "Top ideas", "Latest news", "Referrals"]);
  await expect(page.getByRole("link", { name: "Next session: date to be announced." })).toBeVisible();
  // Three rows at most in any preview, and nothing that looks like a feed or a repost. Five preview lists: the goals
  // strip, Show & Tell, the leaderboard, the top ideas and the latest news.
  await expect(page.locator(".cm-mini")).toHaveCount(5);
  for (const list of await page.locator(".cm-mini").all()) {
    expect(await list.locator(":scope > li").count()).toBeLessThanOrEqual(3);
  }
  await expect(page.getByRole("list", { name: "Top builders this week by approved hours, all tracks" })).toBeVisible();
  await expect(page.getByText(/repost/i)).toHaveCount(0);
  // The sample banner is gone from the real sections; the proposal notes stay where fixtures remain.
  await expect(page.getByText(/invented samples/)).toHaveCount(0);
  await expect(page.getByText("Show & Tell is still a proposal: these sessions are samples.")).toBeVisible();
  // Referrals has no tab; it is a plain link from the hub.
  await page.getByRole("link", { name: "Open Referrals" }).click();
  await expect(page).toHaveURL(/\/dashboard\/referrals$/);
  await page.goBack();

  await page.getByRole("link", { name: "See all Top ideas" }).click();
  await expect(page).toHaveURL(/\/dashboard\/community\/ideas$/);
  await expect(page.getByRole("navigation", { name: "Community" }).getByRole("link", { name: "Ideas" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Community" }).getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current", "page");
});

test("events list the team's events with real RSVPs, and a press takes the place back", async ({ page }) => {
  await page.goto("/dashboard/community/events");
  await expect(page.getByRole("heading", { level: 1, name: "Events" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Community" }).getByRole("link", { name: "Events" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("RSVP saves your place. You can take it back until the event ends.")).toBeVisible();

  const planned = page.getByRole("heading", { level: 3 });
  const seeded = await planned.count();
  test.skip(seeded === 0, "Events reads the database. Run scripts/seed-community.ts first.");

  try {
    await expect(planned).toHaveText(["Show and Tell", "Tools that rescued a bad afternoon"]);
    await expect(page.getByRole("heading", { level: 2, name: "Planned" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Past" })).toBeVisible();

    // The upcoming event's RSVP is open: the button is enabled while the builder is not going.
    const rsvp = page.getByRole("button", { name: /RSVP — you are not going/ });
    await expect(rsvp).toBeEnabled();
    await expect(page.getByText("2 builders going")).toBeVisible();
    await rsvp.click();
    await expect(page.getByRole("button", { name: /RSVP — you are going/ })).toBeEnabled({ timeout: 15000 });
    await expect(page.getByText("3 builders going").first()).toBeVisible();

    // The past event carries no RSVP control at all: ended events close by their date, and the page says who went.
    await expect(page.getByRole("button", { name: /RSVP/ })).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Past" }).getByRole("button", { name: /RSVP/ })).toHaveCount(0);
  } finally {
    // A failed press must not leave the one test account RSVP'd for the rest of the run or the next one.
    await page.goto("/dashboard/community/events");
    const going = page.getByRole("button", { name: /RSVP — you are going/ });
    if (await going.count()) {
      await going.click();
      await expect(page.getByRole("button", { name: /RSVP — you are not going/ })).toBeEnabled({ timeout: 15000 });
    }
  }
});

test("Community is in the main navigation, and its link is current on its pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard/community/goals");
  const nav = page.getByRole("navigation", { name: "Participant" });
  await expect(nav).toBeVisible({ timeout: 30000 });
  await expect(nav.getByRole("link", { name: "Community" })).toHaveAttribute("aria-current", "page");
  const current = nav.locator('a[aria-current="page"]');
  await expect(current).toHaveCount(1);
});

test("Show & Tell names no date for an upcoming session and disables sign-up", async ({ page }) => {
  await page.goto("/dashboard/community/show-and-tell");
  await expect(page.getByText("Next session: date to be announced.")).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("button", { name: "Offer a showcase" })).toBeDisabled();
  await expect(page.getByText("Showcase sign-up opens with the community release. Nothing here is saved.")).toBeVisible();
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toHaveText(["Upcoming", "Past sessions"]);

  await page.getByRole("link", { name: "Tools that rescued a bad afternoon" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Session 3/ })).toBeVisible({ timeout: 30000 });
  await expect(page.locator(".cm-showcases > li")).toHaveCount(2);

  await page.goto("/dashboard/community/show-and-tell/next-session");
  await expect(page.getByText("To be announced")).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("No showcases are listed yet.")).toBeVisible();
});

test("the idea board filters and sorts from the address, and voting is disabled", async ({ page }) => {
  await page.goto("/dashboard/community/ideas");
  await expect(page.getByText("Voting opens with the community release. Nothing here is saved.").first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/cannot be shop requests/)).toBeVisible();

  const rows = page.locator(".cm-idea");
  await expect(rows).toHaveCount(6);
  await expect(rows.first().getByRole("heading", { level: 2 })).toHaveText("Build-along threads for each Era objective");
  const upvotes = page.getByRole("button", { name: /^Upvote:/ });
  await expect(upvotes).toHaveCount(6);
  for (const button of await upvotes.all()) await expect(button).toBeDisabled();

  const statuses = page.getByRole("navigation", { name: "Filter by status" }).getByRole("link");
  await expect(statuses).toHaveText(["All ideas", "Open", "Planned", "Built", "Declined"]);
  await expect(statuses.first()).toHaveAttribute("aria-current", "page");
  await statuses.filter({ hasText: "Declined" }).click();
  await expect(page).toHaveURL(/\/dashboard\/community\/ideas\?status=declined$/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Peer scores on every project");

  await page.goto("/dashboard/community/ideas?sort=newest");
  await expect(rows.first().getByRole("heading", { level: 2 })).toHaveText("Pin one project to your profile", { timeout: 30000 });
  await expect(page.getByRole("navigation", { name: "Sort ideas" }).getByRole("link", { name: "Newest" })).toHaveAttribute("aria-current", "true");

  // Unknown values fall back to the default view.
  await page.goto("/dashboard/community/ideas?status=shop&sort=random");
  await expect(rows).toHaveCount(6, { timeout: 30000 });
});

test("an idea opens read only with its team reply, and an unknown idea is a 404", async ({ page }) => {
  await page.goto("/dashboard/community/ideas/peer-scores");
  await expect(page.getByRole("heading", { level: 1, name: "Peer scores on every project" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { level: 2, name: "Team reply" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Upvote:/ })).toBeDisabled();
  await expect(page.getByText("Voting opens with the community release. Nothing here is saved.")).toBeVisible();
  const response = await page.goto("/dashboard/community/ideas/not-an-idea");
  expect(response?.status()).toBe(404);
  const session = await page.goto("/dashboard/community/show-and-tell/not-a-session");
  expect(session?.status()).toBe(404);
});

test("news lists the team's notes newest first, with their dates", async ({ page }) => {
  await page.goto("/dashboard/community/news");
  const notes = page.locator(".cm-news > li");
  const seeded = await notes.count();
  test.skip(seeded === 0, "News reads the database. Run scripts/seed-community.ts first.");
  await expect(notes).toHaveCount(3, { timeout: 30000 });
  await expect(page.locator(".cm-news").getByRole("heading", { level: 2 })).toHaveText([
    "Review has no scores and no peer rating",
    "Explore lists approved projects",
    "How Community Eras are meant to work",
  ]);
  // Each note says who wrote it and how long ago, beside the date in words.
  await expect(page.locator(".cm-news")).toContainText(/ago\b/);
});

test("the leaderboard ranks the seed from the nightly snapshot, from the address", async ({ page }) => {
  await page.goto("/dashboard/community/leaderboard");
  await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeAttached({ timeout: 30000 });
  const ranges = page.getByRole("navigation", { name: "Choose a range" }).getByRole("link");
  await expect(ranges).toHaveText(["This week", "All time"]);
  await expect(ranges.first()).toHaveAttribute("aria-current", "page");
  // The snapshot line, or the honest empty state when no builder is on the board yet.
  const rows = page.locator(".cm-leader tbody tr");
  if ((await rows.count()) === 0) {
    await expect(page.getByText(/No builder has approved hours here yet/)).toBeVisible();
  } else {
    await expect(page.getByText(/As of the (first )?snapshot/)).toBeVisible();
  }
  // The track filter is gone with the fixture board: the snapshot has no per-track rows.
  await expect(page.getByRole("navigation", { name: "Filter by track" })).toHaveCount(0);
  await expect(page.locator("main").getByText(/\bOre\b/)).toHaveCount(0);

  await page.getByRole("navigation", { name: "Choose a range" }).getByRole("link", { name: "All time" }).click();
  await expect(page).toHaveURL(/\/dashboard\/community\/leaderboard\?range=all$/);
  await expect(ranges.filter({ hasText: "All time" })).toHaveAttribute("aria-current", "page");

  // Unknown values show the default view.
  await page.goto("/dashboard/community/leaderboard?range=forever");
  await expect(ranges.first()).toHaveAttribute("aria-current", "page", { timeout: 30000 });
});

test("goals are plain bars with the figures written out", async ({ page }) => {
  await page.goto("/dashboard/community/goals");
  const bars = page.getByRole("progressbar");
  const seeded = await bars.count();
  test.skip(seeded === 0, "Goals reads the database. Run scripts/seed-community.ts first.");
  await expect(bars).toHaveCount(3, { timeout: 30000 });
  await expect(bars.first()).toHaveAttribute("aria-valuetext", "1,240 of 2,000, 62%");
  await expect(page.getByText("1,240 of 2,000").first()).toBeVisible();
  await expect(page.getByText("62%").first()).toBeVisible();
});

test("community pages do not scroll sideways at phone width", async ({ page }) => {
  await setTheme(page, 375, 812, "dark");
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeAttached({ timeout: 30000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

for (const path of PAGES) {
  for (const [width, height] of VIEWPORTS) {
    for (const scheme of SCHEMES) {
      test(`${path} has no WCAG 2.2 AA violations at ${width}px, ${scheme}`, async ({ page }) => {
        await setTheme(page, width, height, scheme);
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeAttached({ timeout: 30000 });
        const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
      });
    }
  }
}

// ---- Deterministic edge cases ----
// These tests do not depend on the seeded rows or on the wall clock. The RSVP boundary is checked against the pure rules
// with an injected `now`, because the pages read the server clock and there is no test hook or query parameter that can
// move it. The page checks assert the invariant that each list renders either its rows or its honest empty/label copy, so
// they hold whether or not `db:seed:community` and the nightly snapshot have run. Nothing here writes state, so there is
// no RSVP row, goal, event or snapshot to clean up afterwards.

test.describe("RSVP closes at the event's end boundary", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");
  const endsAt = new Date("2026-06-01T12:00:00.000Z");
  const eventWindow: EventWindow = { startsAt, endsAt, stoppedAt: null };

  test("a millisecond before the end the event is live and RSVP is open", () => {
    const now = new Date(endsAt.getTime() - 1);
    expect(eventStatus(eventWindow, now)).toBe("live");
    expect(EVENT_STATUS_LABELS[eventStatus(eventWindow, now)]).toBe("Happens now");
    expect(isRsvpOpen(eventWindow, now)).toBe(true);
  });

  // The rule uses a strictly-greater-than comparison, so the end instant itself still takes a place.
  test("at the exact end the event is still live and RSVP is still open", () => {
    expect(eventStatus(eventWindow, endsAt)).toBe("live");
    expect(isRsvpOpen(eventWindow, endsAt)).toBe(true);
  });

  test("a millisecond after the end the event is ended and RSVP is closed", () => {
    const now = new Date(endsAt.getTime() + 1);
    expect(eventStatus(eventWindow, now)).toBe("ended");
    expect(EVENT_STATUS_LABELS[eventStatus(eventWindow, now)]).toBe("Ended");
    expect(isRsvpOpen(eventWindow, now)).toBe(false);
  });

  test("a stopped event takes no RSVP even inside its own window", () => {
    const stopped: EventWindow = { startsAt, endsAt, stoppedAt: new Date("2026-06-01T09:00:00.000Z") };
    expect(eventStatus(stopped, startsAt)).toBe("stopped");
    expect(EVENT_STATUS_LABELS[eventStatus(stopped, startsAt)]).toBe("Stopped");
    expect(isRsvpOpen(stopped, startsAt)).toBe(false);
  });

  test("an event with no end keeps taking RSVPs long after it started", () => {
    const openEnded: EventWindow = { startsAt, endsAt: null, stoppedAt: null };
    const now = new Date("2027-06-01T12:00:00.000Z");
    expect(eventStatus(openEnded, now)).toBe("live");
    expect(isRsvpOpen(openEnded, now)).toBe(true);
  });

  test("an upcoming event takes RSVPs before it starts", () => {
    const now = new Date(startsAt.getTime() - 1);
    expect(eventStatus(eventWindow, now)).toBe("upcoming");
    expect(EVENT_STATUS_LABELS[eventStatus(eventWindow, now)]).toBe("Upcoming");
    expect(isRsvpOpen(eventWindow, now)).toBe(true);
  });

  test("the attendance count says none, one and many in full", () => {
    expect(rsvpCountText(0)).toBe("No builders going yet");
    expect(rsvpCountText(1)).toBe("1 builder going");
    expect(rsvpCountText(2)).toBe("2 builders going");
    expect(rsvpCountText(1234)).toBe("1,234 builders going");
  });
});

test.describe("Community lists explain both their full and their empty state", () => {
  test("goals show either bars with the figures written out or the empty-state copy", async ({ page }) => {
    await page.goto("/dashboard/community/goals");
    await expect(page.getByRole("heading", { level: 1, name: "Goals" })).toBeVisible({ timeout: 30000 });
    const bars = page.getByRole("progressbar");
    const rows = page.locator("ol.cm-goals > li");
    const empty = page.getByText(
      "No community goal is set yet. The team writes one here when the community has something to work toward together.",
      { exact: true },
    );

    if ((await bars.count()) === 0) {
      // Empty goals: one honest line replaces the whole list, with no bars and no stale figures.
      await expect(empty).toHaveCount(1);
      await expect(empty).toBeVisible();
      await expect(rows).toHaveCount(0);
      await expect(page.locator("ol.cm-goals")).toHaveCount(0);
    } else {
      await expect(empty).toHaveCount(0);
      await expect(rows).toHaveCount(await bars.count());
      // The active goal row prints its figures twice today: once inside GoalBar and once beside it on the Goals page.
      await expect(page.locator(".cm-goal-value")).toHaveCount((await bars.count()) * 2);
      for (const bar of await bars.all()) {
        await expect(bar).toHaveAttribute("aria-valuetext", /^[\d,]+ of [\d,]+, \d+%$/);
      }
    }
  });

  test("the leaderboard shows a captioned table of rows or the empty-state copy", async ({ page }) => {
    await page.goto("/dashboard/community/leaderboard");
    await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeAttached({ timeout: 30000 });
    const rows = page.locator(".cm-leader tbody tr");
    const empty = page.getByText(/No builder has approved hours here yet/);

    if ((await rows.count()) === 0) {
      await expect(empty).toBeVisible();
      await expect(page.locator(".cm-leader table")).toHaveCount(0);
      // The empty copy still points at the Settings page where stats visibility is controlled.
      await expect(page.locator('main p.pf-empty-line a[href="/dashboard/settings"]')).toHaveCount(1);
    } else {
      await expect(empty).toHaveCount(0);
      await expect(page.locator(".cm-leader table")).toHaveCount(1);
      await expect(page.locator(".cm-leader caption")).toHaveText("This week, by approved hours");
      await expect(page.getByRole("columnheader", { name: "Approved hours" })).toBeVisible();
      await expect(rows.first().locator(".cm-rank")).toBeVisible();
    }
  });

  test("the snapshot line names its own day and never claims a live count", async ({ page }) => {
    await page.goto("/dashboard/community/leaderboard");
    await expect(page.getByRole("heading", { level: 1, name: "Leaderboard" })).toBeAttached({ timeout: 30000 });
    const note = page.locator("main p.pf-box-note");

    if ((await page.locator(".cm-leader tbody tr").count()) === 0) {
      // No rows means no snapshot line that could imply the board is current.
      await expect(note).toHaveCount(0);
      return;
    }

    await expect(note).toHaveCount(1);
    await expect(note).toContainText("Only builders who turned stats on in Settings appear.");
    await expect(note).not.toContainText(/live|real time|up to the second/i);
    const text = (await note.textContent())?.trim() ?? "";
    // A stale snapshot is labelled with its own UTC day; with no snapshot at all, the "first snapshot" wording is used.
    const dated = text.match(/^As of the snapshot for (\d{4}-\d{2}-\d{2})\. Only builders/);
    expect(dated || text.startsWith("As of the first snapshot."), `unexpected snapshot label: ${text}`).toBeTruthy();
    if (dated) {
      const parsed = new Date(`${dated[1]}T00:00:00.000Z`);
      expect(Number.isNaN(parsed.getTime())).toBe(false);
      expect(parsed.toISOString().slice(0, 10)).toBe(dated[1]);
    }
  });

  test("an ended event stays in Past with its Ended label and no RSVP control", async ({ page }) => {
    await page.goto("/dashboard/community/events");
    await expect(page.getByRole("heading", { level: 1, name: "Events" })).toBeVisible({ timeout: 30000 });
    const past = page.getByRole("region", { name: "Past" });
    test.skip((await past.locator(".ex-event").count()) === 0, "Ended events read the database. Run scripts/seed-community.ts first.");
    const ended = past.locator(".ex-event").filter({ hasText: "Tools that rescued a bad afternoon" });

    await expect(ended).toHaveCount(1);
    await expect(ended.locator(".ex-label")).toContainText("Ended");
    await expect(ended.getByRole("button", { name: /RSVP/ })).toHaveCount(0);
    await expect(ended.locator("p.ex-closed")).toContainText(/builder(s)? going|No builders going yet/);
    await expect(ended.locator("p.cm-mini-kind")).toContainText("UTC");
  });
});
