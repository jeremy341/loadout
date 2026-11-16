import { describe, expect, test } from "bun:test";
import {
  builderRedirect,
  defaultTab,
  filterProjects,
  handleLabel,
  joinedLabel,
  ownProjectTag,
  ownTabs,
  parseProfileQuery,
  profileHref,
  projectCountLabel,
  PUBLIC_LEVELS_ENABLED,
  publicTabs,
  summariseHandles,
  tabLabel,
  topTrack,
} from "./profile-view";

const row = (status: string, extra: Partial<{ track: string | null; hidden: boolean; showBuilding: boolean; pinned: boolean }> = {}) => ({
  status,
  track: "Tools" as string | null,
  hidden: false,
  showBuilding: false,
  pinned: false,
  ...extra,
});

describe("parseProfileQuery", () => {
  test("own default is all, public default is approved", () => {
    expect(parseProfileQuery({}, true)).toEqual({ tab: "all", track: null });
    expect(parseProfileQuery({}, false)).toEqual({ tab: "approved", track: null });
    expect(defaultTab(true)).toBe("all");
  });
  test("reads a tab and a track, any case", () => {
    expect(parseProfileQuery({ tab: "Needs-Changes", track: "HARDWARE" }, true)).toEqual({ tab: "needs-changes", track: "Hardware" });
    expect(parseProfileQuery({ tab: ["draft", "x"], track: ["systems"] }, true)).toEqual({ tab: "draft", track: "Systems" });
  });
  test("a public view cannot ask for private tabs", () => {
    for (const tab of ["draft", "in-review", "needs-changes", "submitted", "all", "logging"]) {
      expect(parseProfileQuery({ tab }, false).tab).toBe("approved");
    }
    expect(parseProfileQuery({ tab: "building" }, false).tab).toBe("building");
  });
  test("own view has no building tab and ignores junk", () => {
    expect(parseProfileQuery({ tab: "building" }, true).tab).toBe("all");
    expect(parseProfileQuery({ tab: "zzz", track: "zzz" }, true)).toEqual({ tab: "all", track: null });
  });
});

describe("profileHref", () => {
  test("defaults are left out and the link ends at the list", () => {
    expect(profileHref("/dashboard/profile", { tab: "all", track: null }, true)).toBe("/dashboard/profile#profile-projects");
    expect(profileHref("/dashboard/builders/kestrel", { tab: "approved", track: null }, false)).toBe("/dashboard/builders/kestrel#profile-projects");
  });
  test("keeps both filters", () => {
    expect(profileHref("/dashboard/profile", { tab: "draft", track: "Compute" }, true)).toBe("/dashboard/profile?tab=draft&track=compute#profile-projects");
    expect(profileHref("/dashboard/builders/kestrel", { tab: "building", track: null }, false)).toBe("/dashboard/builders/kestrel?tab=building#profile-projects");
  });
});

describe("tabs and filters", () => {
  const rows = [row("approved"), row("approved", { track: "Systems" }), row("draft", { track: null }), row("needs_changes"), row("logging", { showBuilding: true })];
  test("own tabs count every status and keep zeros", () => {
    const tabs = ownTabs(rows);
    expect(tabs.map((t) => `${t.label} ${t.count}`)).toEqual(["All 5", "Draft 1", "Logging 1", "Submitted 0", "In review 0", "Needs changes 1", "Approved 2"]);
  });
  test("public tabs show Building only when there is one", () => {
    expect(publicTabs([row("approved")]).map((t) => t.key)).toEqual(["approved"]);
    expect(publicTabs(rows.filter((r) => r.status !== "draft")).map((t) => `${t.label} ${t.count}`)).toEqual(["Approved 2", "Building 1"]);
    // a logging project that is not shown, and a hidden approved one, do not count
    expect(publicTabs([row("logging"), row("approved", { hidden: true })])).toEqual([{ key: "approved", label: "Approved", count: 0 }]);
  });
  test("filters by tab and track together", () => {
    expect(filterProjects(rows, { tab: "all", track: null })).toHaveLength(5);
    expect(filterProjects(rows, { tab: "approved", track: null })).toHaveLength(2);
    expect(filterProjects(rows, { tab: "approved", track: "Systems" })).toHaveLength(1);
    expect(filterProjects(rows, { tab: "needs-changes", track: null })).toHaveLength(1);
    expect(filterProjects(rows, { tab: "building", track: null })).toHaveLength(1);
    expect(filterProjects(rows, { tab: "all", track: "Hardware" })).toHaveLength(0);
  });
  test("labels", () => {
    expect(tabLabel("needs-changes")).toBe("Needs changes");
    expect(tabLabel("all")).toBe("All");
    expect(projectCountLabel("Draft", 1)).toBe("Draft, 1 project");
    expect(projectCountLabel("Draft", 0)).toBe("Draft, 0 projects");
  });
});

describe("ownProjectTag", () => {
  test("says what others see", () => {
    expect(ownProjectTag(row("approved"))).toBe("On your profile");
    expect(ownProjectTag(row("approved", { hidden: true }))).toBe("Hidden");
    expect(ownProjectTag(row("logging", { showBuilding: true }))).toBe("On your profile");
    expect(ownProjectTag(row("logging"))).toBe("Private");
    for (const status of ["draft", "submitted", "in-review", "needs-changes"]) expect(ownProjectTag(row(status))).toBe("Private");
  });
});

describe("handle display and summaries", () => {
  test("a builder without a handle is plain text", () => {
    expect(handleLabel("kestrel")).toBe("kestrel");
    expect(handleLabel(null)).toBe("a builder");
    expect(handleLabel("")).toBe("a builder");
  });
  test("the used-by row stops at 12", () => {
    const names = Array.from({ length: 15 }, (_, i) => `b${i}`);
    expect(summariseHandles(names)).toEqual({ shown: names.slice(0, 12), more: 3 });
    expect(summariseHandles(["a"])).toEqual({ shown: ["a"], more: 0 });
  });
  test("top track", () => {
    expect(topTrack([{ track: "Tools", level: 8 }, { track: "Systems", level: 3 }])).toEqual({ track: "Tools", level: 8 });
    expect(topTrack([{ track: "Hardware", level: 4 }, { track: "Systems", level: 4 }])).toEqual({ track: "Systems", level: 4 });
    expect(topTrack([{ track: "Tools", level: 0 }])).toBeNull();
  });
  test("joined month", () => {
    expect(joinedLabel(new Date("2026-11-30T23:59:00Z"))).toBe("Nov 2026");
  });
  test("public levels stay off until per-person hours exist", () => {
    expect(PUBLIC_LEVELS_ENABLED).toBe(false);
  });
});

describe("builderRedirect", () => {
  test("own handle goes to the own profile, mixed case to lower case", () => {
    expect(builderRedirect("a", "a", "kestrel", "kestrel")).toBe("own");
    expect(builderRedirect("a", "b", "Kestrel", "kestrel")).toBe("lower");
    expect(builderRedirect("a", "b", "kestrel", "kestrel")).toBeNull();
  });
});
