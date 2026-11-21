import { expect, test } from "bun:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectResultRow } from "../../app/_components/platform/ProjectResultRow";
import { STAR_PATH_FILLED, STAR_PATH_OUTLINE } from "../../app/_components/platform/SaveButton";

const row = {
  id: "p1", title: "Tape Deck", description: "A tape deck for builds", track: "Tools", ownerHandle: "mira", usedBy: 3,
  saved: true, hasRepo: true, status: "approved", createdAt: "2026-11-01T00:00:00.000Z", repoHost: "github.com/mira/tape",
};

test("marks matches and shows meta, repo host and slot", () => {
  const html = renderToStaticMarkup(
    h(ProjectResultRow, { row, query: "tape", showRepo: true, as: "li", saveSlot: h("button", null, "star") }),
  );
  expect(html.startsWith("<li ")).toBe(true);
  expect(html).toContain('<mark class="pf-result-mark">Tape</mark> Deck');
  expect(html).toContain("by mira");
  expect(html).toContain("Used by 3");
  expect(html).toContain("github.com/mira/tape");
  expect(html).toContain('data-track="tools"');
  expect(html).toContain('<span class="pf-result-save"><button>star</button></span>');
});

test("no repo without showRepo, no link without href, fallbacks", () => {
  const html = renderToStaticMarkup(h(ProjectResultRow, { row: { ...row, description: null, ownerHandle: null } }));
  expect(html).not.toContain("github.com");
  expect(html).not.toContain("<a ");
  expect(html).toContain("No description.");
  expect(html).toContain("by a builder");
  expect(html).not.toContain("<mark");
  expect(html).not.toContain("pf-result-save");
});

test("href wraps only the main block", () => {
  const html = renderToStaticMarkup(h(ProjectResultRow, { row, href: "/dashboard/explore/p1", saveSlot: h("i") }));
  expect(html).toContain('<a class="pf-result-main" href="/dashboard/explore/p1">');
  expect(html.indexOf("</a>")).toBeLessThan(html.indexOf("pf-result-save"));
});

test("star outline is a ring inside the filled shape", () => {
  expect(STAR_PATH_FILLED.length).toBeGreaterThan(STAR_PATH_OUTLINE.length);
  expect(STAR_PATH_OUTLINE.length).toBeGreaterThan(0);
});
