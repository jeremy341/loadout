import { describe, expect, test } from "bun:test";
import { docsAliases, docsGroups, docsItems } from "./docs-data";
import { guides } from "./guide-content";
import { DocsDocument } from "./DocsDocument";

describe("participant documentation scope", () => {
  test("navigation stays focused on LOADOUT builders", () => {
    expect(docsGroups.map((group) => group.label)).toEqual(["START HERE", "BUILD & REVIEW", "PROGRESS & PRIZES", "COMMUNITY"]);
    expect(docsItems).toHaveLength(9);
    expect(new Set(docsItems.map((item) => item.slug)).size).toBe(docsItems.length);
    for (const item of docsItems) expect(Boolean(guides[item.slug]) || item.slug === "faq").toBe(true);
    for (const slug of ["contributing", "architecture", "references", "operations", "library", "plans", "engineering", "reference-audit", "design-records", "archive", "bonuses", "community"]) {
      expect(docsItems.some((item) => item.slug === slug)).toBe(false);
      expect(DocsDocument({ slug })).toBeNull();
    }
    expect(docsAliases.workflow).toBe("shipping");
  });

  test("builder guides focus on project fit, building, rewards, and community", () => {
    const visibleText = Object.values(guides).flatMap((guide) => [
      guide.lead,
      ...guide.sections.flatMap((section) => [
        section.title,
        ...(section.paragraphs ?? []),
        ...(section.bullets ?? []),
        ...(section.steps ?? []),
        ...(section.rows ?? []).flat(),
        ...(section.note ? [section.note.title, section.note.text] : []),
      ]),
    ]).join(" ");
    expect(visibleText).not.toMatch(/GitHub CLI|CodeScene|branch protection|promotion PR|bootstrap prompt|source library|engineering architecture/i);
    expect(visibleText).toContain("Research Mode");
    expect(visibleText).toContain("Custom Orders");
    expect(visibleText).toContain("Community Eras");
  });
});
