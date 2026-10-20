import { describe, expect, test } from "bun:test";
import { activeSlugFromPathname, groupId, groupLabelForSlug, sectionLabelFromPathname } from "./navigation";

describe("activeSlugFromPathname", () => {
  test("takes the first segment", () => {
    expect(activeSlugFromPathname("/projects")).toBe("projects");
    expect(activeSlugFromPathname("/projects/new/")).toBe("projects");
    expect(activeSlugFromPathname("/Show-And-Tell")).toBe("show-and-tell");
  });

  test("returns null without a segment", () => {
    expect(activeSlugFromPathname("/")).toBeNull();
    expect(activeSlugFromPathname("")).toBeNull();
    expect(activeSlugFromPathname(null)).toBeNull();
    expect(activeSlugFromPathname(undefined)).toBeNull();
  });
});

describe("sectionLabelFromPathname", () => {
  test("returns the nav label for known sections only", () => {
    expect(sectionLabelFromPathname("/ore-calculator")).toBe("Ore calculator");
    expect(sectionLabelFromPathname("/show-and-tell")).toBe("Show & Tell");
    expect(sectionLabelFromPathname("/nope")).toBeNull();
    expect(sectionLabelFromPathname("/")).toBeNull();
  });
});

describe("groupLabelForSlug", () => {
  test("finds the group of a slug", () => {
    expect(groupLabelForSlug("overview")).toBe("Build");
    expect(groupLabelForSlug("friends")).toBe("Community");
    expect(groupLabelForSlug("shop")).toBe("Gear");
    expect(groupLabelForSlug("account")).toBe("You");
    expect(groupLabelForSlug("missing")).toBeNull();
  });
});

describe("groupId", () => {
  test("makes a lowercase id fragment", () => {
    expect(groupId("Build")).toBe("build");
    expect(groupId("Show & Tell")).toBe("show-tell");
  });
});
