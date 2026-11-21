import {
  builderRedirect,
  handleLabel,
  isLegacyProfileTab,
  profileProjectHref,
  PUBLIC_LEVELS_ENABLED,
  summariseHandles,
  topTrack,
} from "./profile-view";

describe("isLegacyProfileTab", () => {
  test("the removed Journal and Toolbelt tabs are recognised so the page can redirect", () => {
    expect(isLegacyProfileTab("journal")).toBe(true);
    expect(isLegacyProfileTab(" Toolbelt ")).toBe(true);
    expect(isLegacyProfileTab(["journal"])).toBe(true);
  });
  test("the current tabs and anything else are not legacy", () => {
    for (const raw of [undefined, "", "projects", "activity", "zzz"]) expect(isLegacyProfileTab(raw)).toBe(false);
  });
});

describe("profileProjectHref", () => {
  test("own projects open in the workspace, a visitor opens the public page of any project", () => {
    expect(profileProjectHref(true, "p1")).toBe("/dashboard/projects/p1");
    expect(profileProjectHref(false, "p1")).toBe("/dashboard/explore/p1");
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

describe("trackLevelCards", () => {
  test("lists the four tracks in order with level and approved hours", async () => {
    const { trackLevelCards } = await import("./profile-view");
    const { sampleTrackHours, levelForHours, LEVEL_CAP } = await import("./progress");
    const cards = trackLevelCards(sampleTrackHours);
    expect(cards.map((card) => card.track)).toEqual(["Tools", "Systems", "Compute", "Hardware"]);
    for (const card of cards) {
      expect(card.approved).toBe(sampleTrackHours(card.track).approved);
      expect(card.level).toBe(levelForHours(card.approved));
      expect(card.label).toBe(`LV.${card.level} of ${LEVEL_CAP}`);
    }
  });
  test("zero hours is LV.0 and negative hours never go below zero", async () => {
    const { trackLevelCards } = await import("./profile-view");
    const cards = trackLevelCards(() => ({ approved: -5 }));
    expect(cards.every((card) => card.level === 0 && card.approved === 0)).toBe(true);
  });
});
