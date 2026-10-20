import { describe, expect, test } from "bun:test";
import { ALL_ITEMS, HOME_SLUG, MOBILE_PRIMARY, NAV_GROUPS, ROUTE_SLUGS, findItem } from "./nav-data";

describe("nav data", () => {
  test("group labels are Build, Community, Gear and You in order", () => {
    expect(NAV_GROUPS.map((group) => group.label)).toEqual(["Build", "Community", "Gear", "You"]);
  });

  test("slugs are unique, lowercase and URL safe", () => {
    const slugs = ALL_ITEMS.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test("labels are unique", () => {
    const labels = ALL_ITEMS.map((item) => item.label.toLowerCase());
    expect(new Set(labels).size).toBe(labels.length);
  });

  test("every mobile primary slug exists and is a platform route", () => {
    expect(MOBILE_PRIMARY.length).toBe(4);
    for (const slug of MOBILE_PRIMARY) {
      const item = findItem(slug);
      expect(item).toBeDefined();
      expect(item?.external).toBeFalsy();
    }
  });

  test("the home slug exists and is a platform route", () => {
    expect(findItem(HOME_SLUG)).toBeDefined();
    expect(ROUTE_SLUGS).toContain(HOME_SLUG);
  });

  test("route slugs exclude external tabs and include everything else", () => {
    for (const item of ALL_ITEMS) {
      expect(ROUTE_SLUGS.includes(item.slug)).toBe(!item.external);
    }
    expect(ROUTE_SLUGS).not.toContain("docs");
  });

  test("every purpose is a non-empty sentence with no price", () => {
    for (const item of ALL_ITEMS) {
      expect(item.purpose.trim().length).toBeGreaterThan(0);
      expect(item.purpose).not.toContain("$");
    }
  });

  test("external tabs are live", () => {
    for (const item of ALL_ITEMS) {
      if (item.external) expect(item.status).toBe("live");
    }
  });

  test("findItem returns undefined for unknown slugs", () => {
    expect(findItem("not-a-tab")).toBeUndefined();
  });
});
