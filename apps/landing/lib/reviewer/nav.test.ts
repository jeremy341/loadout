import { describe, expect, test } from "bun:test";
import { resolveAccess, type ReviewerAccess } from "./access";
import { activeNavHref, buildNav, NAV_GROUPS, pageEntries, PRIMARY_ITEMS, REVIEW_TABS, visibleReviewTabs, type NavModel } from "./nav";

const OWNERS = ["owner@loadout.test"];
const who = (email: string, roles: string[]): ReviewerAccess => {
  const access = resolveAccess({ id: email, email }, { ownerEmails: OWNERS, roles });
  if (!access) throw new Error("expected access");
  return access;
};

const owner = who("owner@loadout.test", []);
const reviewer = who("r@loadout.test", ["reviewer"]);
const finalReviewer = who("f@loadout.test", ["reviewer", "second_pass"]);
const hardwareOnly = who("h@loadout.test", ["reviewer", "reviewer_hardware_only"]);
const softwareOnly = who("s@loadout.test", ["reviewer", "reviewer_software_only"]);
const helper = who("help@loadout.test", ["helper"]);
const fulfiller = who("ful@loadout.test", ["fulfiller"]);

const primary = (access: ReviewerAccess) => buildNav(access).primary.map((item) => item.label);
const groupLabels = (access: ReviewerAccess) => buildNav(access).groups.map((group) => group.label);
const moreLabels = (access: ReviewerAccess) => buildNav(access).groups.flatMap((group) => group.items.map((item) => item.label));
const tabLabels = (access: ReviewerAccess) => visibleReviewTabs(access).map((tab) => tab.label);

describe("the model", () => {
  test("every address is root-relative and none points at the participant dashboard or the internal tree", () => {
    for (const item of [...PRIMARY_ITEMS, ...NAV_GROUPS.flatMap((group) => group.items), ...REVIEW_TABS]) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.href).not.toMatch(/dashboard|^\/reviewer(\/|$)/);
    }
  });

  test("the More menu has Pixl's five sections, named in LOADOUT terms", () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual(["Queues", "Shop and money", "Community", "Moderation", "Admin"]);
  });

  test("no address appears twice in what one person sees in the bar and the menu", () => {
    for (const access of [owner, reviewer, finalReviewer, hardwareOnly, helper, fulfiller]) {
      const nav = buildNav(access);
      const hrefs = [...nav.primary, ...nav.groups.flatMap((group) => group.items)].map((item) => item.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });

  test("the spelling stays fulfilment, not Pixl's fulfillment", () => {
    for (const item of [...PRIMARY_ITEMS, ...NAV_GROUPS.flatMap((group) => group.items)]) expect(item.href).not.toContain("fulfillment");
  });
});

describe("what each role sees", () => {
  test("an owner has the everyday links in the bar and every queue and section under More", () => {
    expect(primary(owner)).toEqual(["Overview", "Review", "Projects", "Builders"]);
    expect(groupLabels(owner)).toEqual(["Queues", "Shop and money", "Community", "Moderation", "Admin"]);
    expect(moreLabels(owner)).toContain("Tickets");
    expect(moreLabels(owner)).toContain("Fulfilment");
    expect(moreLabels(owner)).toContain("Budget");
    expect(moreLabels(owner)).toContain("Team and roles");
    expect(tabLabels(owner)).toEqual(["Needs review", "Hardware", "Reviewed", "Stats", "Proposed bans", "Spot check", "Reviewer log", "Audit notes", "Guidelines"]);
  });

  test("a reviewer has My stats, Review and Projects, and nothing under More", () => {
    expect(primary(reviewer)).toEqual(["My stats", "Review", "Projects"]);
    expect(buildNav(reviewer).groups).toEqual([]);
    expect(tabLabels(reviewer)).toEqual(["Needs review", "Hardware", "Reviewed", "Stats", "Guidelines"]);
  });

  test("a final reviewer also has Second pass and Spot check, but not the owner-only tabs", () => {
    expect(tabLabels(finalReviewer)).toEqual(["Needs review", "Hardware", "Reviewed", "Stats", "Spot check", "Guidelines"]);
  });

  test("a software-only reviewer loses the hardware queue", () => {
    expect(tabLabels(hardwareOnly)).toEqual(["Needs review", "Hardware", "Reviewed", "Stats", "Guidelines"]);
    expect(tabLabels(softwareOnly)).toEqual(["Needs review", "Reviewed", "Stats", "Guidelines"]);
  });

  test("a helper has Tickets in the bar and nothing else", () => {
    expect(primary(helper)).toEqual(["Tickets"]);
    expect(buildNav(helper).groups).toEqual([]);
    expect(tabLabels(helper)).toEqual([]);
  });

  test("a fulfiller has Fulfilment in the bar and nothing else", () => {
    expect(primary(fulfiller)).toEqual(["Fulfilment"]);
    expect(buildNav(fulfiller).groups).toEqual([]);
  });

  test("nobody but an owner is offered an owner page", () => {
    const ownerOnly = new Set(
      [...PRIMARY_ITEMS, ...NAV_GROUPS.flatMap((group) => group.items), ...REVIEW_TABS].filter((item) => item.requires === "owner").map((item) => item.href),
    );
    for (const access of [reviewer, finalReviewer, hardwareOnly, softwareOnly, helper, fulfiller]) {
      const nav = buildNav(access);
      for (const item of [...nav.primary, ...nav.groups.flatMap((group) => group.items), ...visibleReviewTabs(access)]) expect(ownerOnly.has(item.href)).toBe(false);
    }
  });
});

const link = (href: string, label = href) => ({ href, label, requires: "reviewer" as const });
const reviewerNav: NavModel = {
  primary: [link("/review/stats"), link("/review"), link("/projects")],
  groups: [{ key: "queues", label: "Queues", items: [link("/tickets")] }],
};

describe("activeNavHref", () => {
  test("a nested link wins over the link it sits under", () => {
    expect(activeNavHref("/review/stats", reviewerNav)).toBe("/review/stats");
  });

  test("other pages under a link still highlight it", () => {
    expect(activeNavHref("/review", reviewerNav)).toBe("/review");
    expect(activeNavHref("/review/sh-2041", reviewerNav)).toBe("/review");
    expect(activeNavHref("/review/hardware", reviewerNav)).toBe("/review");
    expect(activeNavHref("/projects/pr-3001", reviewerNav)).toBe("/projects");
    expect(activeNavHref("/tickets", reviewerNav)).toBe("/tickets");
  });

  test("a link whose name only starts the same does not match", () => {
    expect(activeNavHref("/reviewers", reviewerNav)).toBeNull();
    expect(activeNavHref("/projectsx", reviewerNav)).toBeNull();
  });

  test("nothing is highlighted on a page with no link", () => {
    expect(activeNavHref("/nowhere", reviewerNav)).toBeNull();
    expect(activeNavHref("/settings", reviewerNav)).toBeNull();
  });

  test("the Overview only matches the root path", () => {
    const nav: NavModel = { primary: [link("/"), link("/review")], groups: [] };
    expect(activeNavHref("/", nav)).toBe("/");
    expect(activeNavHref("/review", nav)).toBe("/review");
    expect(activeNavHref("/budget", nav)).toBeNull();
  });

  test("the internal /reviewer path marks the same links as the browser's", () => {
    expect(activeNavHref("/reviewer", { primary: [link("/")], groups: [] })).toBe("/");
    expect(activeNavHref("/reviewer/review/stats", reviewerNav)).toBe("/review/stats");
    expect(activeNavHref("/reviewer/review/sh-2041", reviewerNav)).toBe("/review");
  });

  test("in the real nav an owner's detail pages mark their section link", () => {
    const nav = buildNav(owner);
    expect(activeNavHref("/", nav)).toBe("/");
    expect(activeNavHref("/players/kestrel42", nav)).toBe("/players");
    expect(activeNavHref("/review/sh-2041", nav)).toBe("/review");
    expect(activeNavHref("/review/stats", nav)).toBe("/review");
    expect(activeNavHref("/reports/rp-312", nav)).toBe("/reports");
    expect(activeNavHref("/fulfilment/label/lo-1042", nav)).toBe("/fulfilment");
    expect(activeNavHref("/settings", nav)).toBeNull();
  });
});

describe("the command palette's pages", () => {
  test("lists each page a role may open once, and none it may not", () => {
    for (const access of [owner, reviewer, finalReviewer, hardwareOnly, helper, fulfiller]) {
      const entries = pageEntries(access);
      const hrefs = entries.map((entry) => entry.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      const nav = buildNav(access);
      for (const item of [...nav.primary, ...nav.groups.flatMap((group) => group.items), ...visibleReviewTabs(access)]) expect(hrefs).toContain(item.href);
    }
    expect(pageEntries(helper).map((entry) => entry.href)).toEqual(["/tickets"]);
  });

  test("an owner can reach the Review tabs and the sections by name", () => {
    const entries = pageEntries(owner);
    expect(entries.find((entry) => entry.href === "/review/log")?.label).toBe("Reviewer log");
    expect(entries.find((entry) => entry.href === "/budget")?.group).toBe("Shop and money");
    expect(entries.find((entry) => entry.href === "/review/hardware")?.group).toBe("Review");
  });
});

// The check that the nav and the pages agree lives in route-matrix.test.ts, against the nav the site really uses
// (reviewer-dash/app/_ui/nav.ts) and the matrix of every route. This file keeps the older LOADOUT nav model
// (lib/reviewer/nav.ts), still used by the hand-built reviewer components that the Pixl port replaces.
