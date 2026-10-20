import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { ALL_ITEMS, NAV_GROUPS, findItem } from "../../shell/nav-data";
import { hubPages } from "./index";

// A server-render smoke test: every Hub page renders on the server (where there is no localStorage) without
// throwing, shows exactly one h1 equal to its nav label, uses the nav purpose as its lead sentence, carries the
// Preview note, and renders the same markup twice (so nothing reads the clock or a random number while rendering).

const EYEBROW: Record<string, string> = {
  overview: "Build",
  profile: "You",
  achievements: "You",
  notifications: "You",
  account: "You",
};

const html = (slug: string) => renderToString(createElement(hubPages[slug]));
const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");

describe("the Hub registers exactly its five tabs", () => {
  test("keys", () => {
    expect(Object.keys(hubPages).sort()).toEqual(["account", "achievements", "notifications", "overview", "profile"]);
  });
});

describe("hub pages render on the server", () => {
  for (const slug of Object.keys(EYEBROW)) {
    test(`${slug}: header, lead and Preview note match the navigation`, () => {
      const item = findItem(slug);
      expect(item).toBeDefined();
      const out = html(slug);
      const h1s = out.match(/<h1[^>]*>(.*?)<\/h1>/g) ?? [];
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toContain(`>${item!.label}</h1>`);
      expect(out).toContain(`<p class="eyebrow">${EYEBROW[slug]}</p>`);
      expect(out).toContain(escape(item!.purpose));
      expect(out).toContain("Preview.");
    });

    test(`${slug}: renders the same twice and never uses dangerouslySetInnerHTML-style markup`, () => {
      const out = html(slug);
      expect(html(slug)).toBe(out);
      expect(out).not.toContain("<script");
      expect(out).not.toContain("javascript:");
    });
  }
});

describe("overview", () => {
  const out = html("overview");

  test("lists every tab by group in the directory, with Docs as a plain link out", () => {
    for (const group of NAV_GROUPS) expect(out).toContain(`<h3>${group.label}</h3>`);
    for (const item of ALL_ITEMS) expect(out).toContain(escape(item.label));
    expect(out).toContain("public Docs, leaves the platform");
    expect(out).toMatch(/<a href="[^"]*\/docs">Docs/);
  });

  test("has the first-run checklist, the stats and the Season and Era meters", () => {
    expect(out).toContain("Getting started");
    expect(out).toContain("Create a project");
    expect(out).toContain("Write a journal entry");
    expect(out).toContain("Review a ship");
    expect(out).toContain("Add an item to your wishlist");
    expect(out).toContain("Approved ships");
    expect(out).toContain("Next actions");
    expect(out).toContain("Recent activity");
    expect(out).toContain('role="meter"');
  });
});

describe("profile", () => {
  const out = html("profile");

  test("edit form, visibility switches, pins and the public view", () => {
    expect(out).toContain("Display name");
    expect(out).toContain("Handle");
    expect(out).toContain("Public view");
    expect(out).toContain("Show my projects");
    expect(out).toContain("Show my journals");
    expect(out).toContain("Show my achievements");
    expect(out).toContain("Show my stats");
    expect(out).toContain("Save profile");
  });

  test("the bio limit is stated and the avatar choices are offered", () => {
    expect(out).toContain("of 280 characters");
    expect(out).toContain("Initials");
    expect(out).toContain("Wrench");
  });
});

describe("achievements", () => {
  const out = html("achievements");

  test("the catalog, the plan-defined +50 Ore claim and the preview approval", () => {
    expect(out).toContain("First outside contribution");
    expect(out).toContain("+50 Ore, once");
    expect(out).toContain("No Ore reward");
    expect(out).toContain("Approve (preview)");
    expect(out).toContain("Preview only");
    expect(out).toContain("Draft preview rule");
  });
});

describe("notifications", () => {
  const out = html("notifications");

  test("announces the unread count and offers Inbox and Settings", () => {
    expect(out).toContain('aria-live="polite"');
    expect(out).toContain("1 unread notification.");
    expect(out).toContain("Inbox");
    expect(out).toContain("Settings");
    expect(out).toContain('role="tablist"');
  });
});

describe("account", () => {
  const out = html("account");

  test("lists its five tabs and states the verification status honestly", () => {
    for (const label of ["Verification", "Privacy", "Connections", "Data", "Display"]) expect(out).toContain(label);
    expect(out).toContain("Exact Hack Club sign-in and verification integration is not connected yet");
    expect(out).toContain("Not started");
    expect(out).toContain("Start verification (preview)");
  });

  test("says nothing about ages", () => {
    expect(out).not.toMatch(/\b1[3-9]\b/);
  });
});
