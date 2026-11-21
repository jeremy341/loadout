import { describe, expect, test } from "bun:test";
import { activeNavHref, type NavModel } from "./nav";

const link = (href: string) => ({ href, label: href, glyph: "view" as const });

// What a reviewer who isn't an owner sees.
const reviewerNav: NavModel = {
  primary: [link("/review/stats"), link("/review"), link("/projects")],
  groups: [{ label: "Queues", glyph: "list", items: [link("/tickets")] }],
};

describe("activeNavHref", () => {
  test("a nested link wins over the link it sits under", () => {
    expect(activeNavHref("/review/stats", reviewerNav)).toBe("/review/stats");
  });

  test("other pages under a link still highlight it", () => {
    expect(activeNavHref("/review", reviewerNav)).toBe("/review");
    expect(activeNavHref("/review/1000", reviewerNav)).toBe("/review");
    expect(activeNavHref("/tickets", reviewerNav)).toBe("/tickets");
  });

  test("nothing is highlighted on a page with no link", () => {
    expect(activeNavHref("/login", reviewerNav)).toBeNull();
    expect(activeNavHref("/reviewers", reviewerNav)).toBeNull();
  });

  test("the overview only matches the root path", () => {
    const nav: NavModel = { primary: [link("/"), link("/review")], groups: [] };
    expect(activeNavHref("/", nav)).toBe("/");
    expect(activeNavHref("/review", nav)).toBe("/review");
  });
});
