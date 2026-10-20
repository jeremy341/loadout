import { describe, expect, test } from "bun:test";
import {
  INITIAL_PROFILE,
  buildPublicProfile,
  identityOf,
  initialsOf,
  normalizeProfile,
  resolveIdentity,
  togglePinned,
  validateBio,
  validateDisplayName,
  validateHandle,
  validateHttpsUrl,
  validateIdentity,
  validateLink,
  type PublicSource,
} from "./profile";

describe("handle validation", () => {
  test("accepts a lowercase slug and drops a leading @", () => {
    expect(validateHandle("@Nova-Forge")).toEqual({ ok: true, value: "nova-forge" });
  });

  test("rejects bad shapes", () => {
    for (const bad of ["ab", "-nova", "nova-", "no va", "nova--forge", "nova_forge", "x".repeat(25), "émile"]) {
      expect(validateHandle(bad).ok).toBe(false);
    }
  });

  test("rejects a handle a sample builder already uses, ignoring case", () => {
    const result = validateHandle("Ada-Cuts");
    expect(result.ok).toBe(false);
  });

  test("rejects reserved handles but keeps your own", () => {
    expect(validateHandle("admin").ok).toBe(false);
    expect(validateHandle("you", "you")).toEqual({ ok: true, value: "you" });
  });
});

describe("display name, bio and pronouns", () => {
  test("display name is tidied and length checked", () => {
    expect(validateDisplayName("  Nova   Forge ")).toEqual({ ok: true, value: "Nova Forge" });
    expect(validateDisplayName("N").ok).toBe(false);
    expect(validateDisplayName("x".repeat(41)).ok).toBe(false);
  });

  test("bio allows 280 characters and no more, counting a surrogate pair once", () => {
    expect(validateBio("a".repeat(280)).ok).toBe(true);
    expect(validateBio("a".repeat(281)).ok).toBe(false);
    expect(validateBio("\u{1F600}".repeat(280)).ok).toBe(true);
    expect(validateBio("").ok).toBe(true);
  });
});

describe("links", () => {
  test("https only", () => {
    expect(validateHttpsUrl("http://example.org").ok).toBe(false);
    expect(validateHttpsUrl("javascript:alert(1)").ok).toBe(false);
    expect(validateHttpsUrl("ftp://example.org").ok).toBe(false);
    expect(validateHttpsUrl("https://localhost").ok).toBe(false);
    expect(validateHttpsUrl("https://user:pw@example.org").ok).toBe(false);
    expect(validateHttpsUrl("https://exa mple.org").ok).toBe(false);
    expect(validateHttpsUrl("https://example.org/a")).toEqual({ ok: true, value: "https://example.org/a" });
  });

  test("a missing label becomes the host name", () => {
    expect(validateLink({ label: "", url: "https://example.org/me" })).toEqual({ ok: true, value: { label: "example.org", url: "https://example.org/me" } });
  });
});

describe("validateIdentity", () => {
  const good = identityOf(INITIAL_PROFILE);

  test("passes the default identity", () => {
    expect(validateIdentity(good).ok).toBe(true);
  });

  test("collects an error per field and per link", () => {
    const result = validateIdentity({ ...good, displayName: "", handle: "ab", links: [{ label: "x", url: "http://a.b" }, { label: "ok", url: "https://example.org" }] });
    expect(result.ok).toBe(false);
    expect(result.errors.displayName).toBeDefined();
    expect(result.errors.handle).toBeDefined();
    expect(result.errors.links[0]).toBeDefined();
    expect(result.errors.links[1]).toBeNull();
  });

  test("rejects duplicate links and more than three", () => {
    const link = { label: "a", url: "https://example.org/x" };
    expect(validateIdentity({ ...good, links: [link, link] }).ok).toBe(false);
    const many = [1, 2, 3, 4].map((n) => ({ label: `l${n}`, url: `https://example.org/${n}` }));
    expect(validateIdentity({ ...good, links: many }).ok).toBe(false);
  });

  test("resolveIdentity keeps the saved value for an invalid field", () => {
    const resolved = resolveIdentity(good, { ...good, displayName: "Nova", handle: "ada-cuts", bio: "x".repeat(300) });
    expect(resolved.displayName).toBe("Nova");
    expect(resolved.handle).toBe(good.handle);
    expect(resolved.bio).toBe(good.bio);
  });
});

describe("normalizeProfile", () => {
  test("falls back for garbage and keeps valid parts", () => {
    expect(normalizeProfile(null)).toEqual(INITIAL_PROFILE);
    const odd = normalizeProfile({ displayName: 12, track: "Nope", avatar: "../x", links: [{ url: "javascript:1" }, { url: "https://example.org" }], visibility: { projects: false, stats: "yes" }, pinned: ["a", 1] });
    expect(odd.displayName).toBe(INITIAL_PROFILE.displayName);
    expect(odd.track).toBe(INITIAL_PROFILE.track);
    expect(odd.avatar).toBe("initials");
    expect(odd.links).toHaveLength(1);
    expect(odd.visibility).toEqual({ projects: false, journals: true, achievements: true, stats: true });
    expect(odd.pinned).toEqual(["a"]);
  });
});

describe("public view", () => {
  const source: PublicSource = {
    projects: [
      { id: "a", name: "Alpha", track: "Tools", visibility: "public", status: "Draft" },
      { id: "b", name: "Secret", track: "Hardware", visibility: "private", status: "Draft" },
      { id: "c", name: "Gamma", track: "Systems", visibility: "public", status: "Approved" },
    ],
    journalEntries: 4,
    hoursLogged: 12,
    approvedShips: 1,
    reviewsDone: 3,
    followers: 2,
    following: 5,
    earnedNames: ["First project"],
  };
  const identity = identityOf(INITIAL_PROFILE);
  const open = { projects: true, journals: true, achievements: true, stats: true };

  test("lists pinned public projects only, never a private one", () => {
    const view = buildPublicProfile(identity, open, ["b", "c"], source);
    expect(view.projects?.map((p) => p.id)).toEqual(["c"]);
  });

  test("with nothing pinned it shows up to three public projects", () => {
    const view = buildPublicProfile(identity, open, [], source);
    expect(view.projects?.map((p) => p.id)).toEqual(["a", "c"]);
  });

  test("hidden sections are null and leak nothing", () => {
    const view = buildPublicProfile(identity, { projects: false, journals: false, achievements: false, stats: false }, ["a"], source);
    expect(view.projects).toBeNull();
    expect(view.journals).toBeNull();
    expect(view.achievements).toBeNull();
    expect(view.stats).toBeNull();
    expect(JSON.stringify(view)).not.toContain("Secret");
  });

  test("an empty pronouns field is not shown", () => {
    expect(buildPublicProfile(identity, open, [], source).pronouns).toBeNull();
  });

  test("initials", () => {
    expect(initialsOf("Nova Forge")).toBe("NF");
    expect(initialsOf("You (preview)")).toBe("YP");
    expect(initialsOf("  ")).toBe("?");
  });

  test("pinning is capped at three", () => {
    expect(togglePinned(["a", "b", "c"], "d").changed).toBe(false);
    expect(togglePinned(["a", "b", "c"], "b").pinned).toEqual(["a", "c"]);
    expect(togglePinned([], "a").pinned).toEqual(["a"]);
  });
});
