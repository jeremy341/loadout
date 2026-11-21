import { describe, expect, test } from "bun:test";
import { ACCOUNT_MENU, currentLink, isBarePath, isLinkCurrent, legacyTarget, reviewQueueHref, SIDEBAR_GROUPS, SIDEBAR_LINKS } from "./nav";

describe("participant sidebar", () => {
  test("has four groups with plain labels", () => {
    expect(SIDEBAR_GROUPS.map((group) => group.label)).toEqual(["Build", "Discover", "Shop", "Me"]);
    expect(SIDEBAR_GROUPS.map((group) => group.links.map((link) => link.label))).toEqual([
      ["Projects", "Review Queue"],
      ["Explore", "Ideas", "Community", "Docs"],
      ["Shop", "Expeditions", "Orders"],
      ["Profile", "Ledger", "Settings"],
    ]);
  });

  test("has no Overview, no Referrals and no staff link", () => {
    const labels = SIDEBAR_LINKS.map((link) => link.label);
    for (const gone of ["Overview", "Referrals", "Ship"]) expect(labels).not.toContain(gone);
    for (const link of SIDEBAR_LINKS) expect(link.href).not.toMatch(/reviewer|staff|users|audit|flags|events|referrals/);
  });

  test("Community is one link under Discover and owns the pages under it", () => {
    const community = SIDEBAR_LINKS.find((link) => link.label === "Community");
    expect(community).toMatchObject({ href: "/dashboard/community" });
    expect(SIDEBAR_LINKS.filter((link) => link.href.startsWith("/dashboard/community"))).toHaveLength(1);
  });

  test("every link is a dashboard route, except public destinations, and none repeats", () => {
    for (const link of SIDEBAR_LINKS) expect(link.href.startsWith(link.label === "Docs" ? "/docs/" : link.label === "Review Queue" ? "/review-queue" : "/dashboard")).toBe(true);
    expect(new Set(SIDEBAR_LINKS.map((link) => link.href)).size).toBe(SIDEBAR_LINKS.length);
  });

  test("the account menu holds Profile, Ledger, Notifications, Orders, Referrals and Settings", () => {
    expect(ACCOUNT_MENU.map((item) => item.label)).toEqual(["Profile", "Ledger", "Notifications", "Orders", "Referrals", "Settings"]);
    for (const item of ACCOUNT_MENU) expect(item.href.startsWith("/dashboard/")).toBe(true);
  });
});

describe("current link", () => {
  const cases: [string, string | null][] = [
    ["/dashboard", null],
    ["/dashboard/", null],
    ["/review-queue", "Review Queue"],
    ["/dashboard/projects/new", "Projects"],
    ["/dashboard/projects", "Projects"],
    ["/dashboard/projects/abc", "Projects"],
    ["/dashboard/tracks/tools", "Projects"],
    ["/dashboard/explore", "Explore"],
    ["/dashboard/explore/abc", "Explore"],
    ["/dashboard/ideas", "Ideas"],
    ["/dashboard/ideas/abc", "Ideas"],
    ["/dashboard/notifications", null],
    ["/dashboard/builders/jolt", "Explore"],
    ["/dashboard/shop", "Shop"],
    ["/dashboard/shop/raspberry-pi-5", "Shop"],
    ["/dashboard/shop/expeditions", "Expeditions"],
    ["/dashboard/shop/expeditions/profile-it", "Expeditions"],
    ["/dashboard/orders", "Orders"],
    ["/dashboard/orders/abc", "Orders"],
    ["/dashboard/ledger", "Ledger"],
    ["/docs/start", "Docs"],
    ["/docs/progress", "Docs"],
    ["/dashboard/profile", "Profile"],
    ["/dashboard/settings", "Settings"],
    ["/dashboard/referrals", null],
    ["/dashboard/community", "Community"],
    ["/dashboard/community/ideas", "Community"],
    ["/dashboard/community/events", "Community"],
    ["/dashboard/communityx", null],
  ];
  for (const [path, label] of cases) {
    test(`${path} is ${label ?? "no link"}`, () => {
      expect(currentLink(path)?.label ?? null).toBe(label);
    });
  }

  test("a path is not matched by a longer name that shares its start", () => {
    expect(isLinkCurrent("/dashboard/projectsx", "/dashboard/projects")).toBe(false);
    expect(isLinkCurrent("/dashboard/shopping", "/dashboard/shop")).toBe(false);
  });

  test("exactly one link is current on a page that has one", () => {
    for (const path of ["/dashboard/projects", "/dashboard/projects/abc", "/dashboard/shop/expeditions/x", "/dashboard/shop/y"]) {
      expect(SIDEBAR_LINKS.filter((link) => isLinkCurrent(path, link.href))).toHaveLength(1);
    }
  });
});

describe("old addresses", () => {
  test("the Overview page is gone: /dashboard goes to Projects", () => {
    expect(legacyTarget("/dashboard")).toBe("/dashboard/projects");
    expect(legacyTarget("/dashboard/")).toBe("/dashboard/projects");
  });

  test("Expeditions goes under Shop and a mission keeps its id", () => {
    expect(legacyTarget("/dashboard/expeditions")).toBe("/dashboard/shop/expeditions");
    expect(legacyTarget("/dashboard/expeditions/bare-metal")).toBe("/dashboard/shop/expeditions/bare-metal");
  });

  test("current addresses are not redirected", () => {
    for (const path of ["/dashboard/projects", "/dashboard/projects/new", "/dashboard/shop/expeditions", "/dashboard/shop", "/dashboard/community"]) {
      expect(legacyTarget(path)).toBeNull();
    }
  });
});

describe("bare pages", () => {
  test("only the creation wizard opens with no sidebar", () => {
    expect(isBarePath("/dashboard/projects/new")).toBe(true);
    expect(isBarePath("/dashboard/projects/new/")).toBe(true);
    for (const path of ["/dashboard/projects", "/dashboard/projects/abc", "/dashboard/projects/new/x", "/dashboard/explore"]) expect(isBarePath(path)).toBe(false);
  });
});

test("Review Queue deep links preserve the project number and queue", () => {
  expect(reviewQueueHref(42, false)).toBe("/review-queue?q=%2342");
  expect(reviewQueueHref(42, true)).toBe("/review-queue?q=%2342&queue=hardware");
});
