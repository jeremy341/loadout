import { describe, expect, test } from "bun:test";
import { plugin } from "bun";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

// Server-render each page once (no browser, no server). This catches render-time crashes and checks the
// markup rules that do not need interaction: the h1 equals the nav label, the preview note is present, no
// page reads the real clock during render, and nothing claims an unconfirmed LOADOUT IRL detail.
plugin({
  name: "css-stub",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "js" }));
  },
});

const { findItem } = await import("../../shell/nav-data");
const { communityBPages } = await import("./index");

describe("community-b pages render on the server", () => {
  for (const slug of ["leaderboards", "seasons", "events"]) {
    const html = () => renderToString(createElement(communityBPages[slug]));

    test(`${slug}: h1 and lead match the navigation`, () => {
      const item = findItem(slug);
      const out = html();
      expect(item).toBeDefined();
      expect(out).toContain(`<h1>${item?.label}</h1>`);
      expect(out).toContain(String(item?.purpose).replace(/&/g, "&amp;"));
      expect(out).toContain('role="note"');
    });

    test(`${slug}: renders the same twice (no clock or random in render)`, () => {
      expect(html()).toBe(html());
    });
  }

  test("leaderboards: an accessible, sortable table with a caption and 10 rows", () => {
    const out = renderToString(createElement(communityBPages.leaderboards));
    expect(out).toContain("<caption");
    expect(out).toContain('aria-sort="ascending"');
    expect((out.match(/<tbody>/g) ?? []).length).toBeGreaterThanOrEqual(1);
    const body = out.slice(out.indexOf("<tbody>"), out.indexOf("</tbody>"));
    expect((body.match(/<tr/g) ?? []).length).toBe(10);
    expect(out).toContain("Hide me from public leaderboards");
  });

  test("events: LOADOUT IRL is planned and unconfirmed, with no RSVP", () => {
    const out = renderToString(createElement(communityBPages.events));
    expect(out).toContain("Planned, details unconfirmed");
    expect(out).toContain("Get notified when details are confirmed");
    expect(out).toContain("There is no date, no registration and no RSVP");
    expect(out).toContain("Sample");
  });

  test("seasons: names the Season and Era and offers the contribution form", () => {
    const out = renderToString(createElement(communityBPages.seasons));
    expect(out).toContain("S00 // BOOT");
    expect(out).toContain("STEAM");
    expect(out).toContain("Add to log");
    expect(out).toContain("Draft");
  });
});
