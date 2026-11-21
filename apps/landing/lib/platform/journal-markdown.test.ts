import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JournalMarkdown } from "../../app/_components/platform/JournalMarkdown";
import { safeLinkUrl } from "./journal-markdown";

const html = (source: string) => renderToStaticMarkup(createElement(JournalMarkdown, { source }));

describe("safeLinkUrl", () => {
  test("links: https, http and mailto only", () => {
    expect(safeLinkUrl("https://a.dev/x", "link")).toBe("https://a.dev/x");
    expect(safeLinkUrl("mailto:a@b.dev", "link")).toBe("mailto:a@b.dev");
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "/relative", "file:///etc/passwd", ""]) expect(safeLinkUrl(bad, "link")).toBe("");
  });
  test("images: https only", () => {
    expect(safeLinkUrl("https://a.dev/x.png", "image")).toBe("https://a.dev/x.png");
    expect(safeLinkUrl("http://a.dev/x.png", "image")).toBe("");
  });
});

describe("JournalMarkdown", () => {
  test("renders bold, italics and lists", () => {
    const out = html("**bold** and *italic*\n\n- one\n- two");
    expect(out).toContain("<strong>bold</strong>");
    expect(out).toContain("<em>italic</em>");
    expect(out).toContain("<li>one</li>");
  });
  test("raw HTML is shown as text and never becomes an element", () => {
    const out = html("<b>not bold</b> <script>alert(1)</script>");
    expect(out).not.toContain("<b>");
    expect(out).not.toContain("<script");
    expect(out).toContain("&lt;b&gt;not bold&lt;/b&gt;");
  });
  test("a javascript link has no address, an https link opens safely", () => {
    expect(html("[x](javascript:alert(1))")).not.toContain("javascript:");
    const out = html("[docs](https://example.com)");
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });
  test("headings shift below the page headings", () => {
    const out = html("# Big");
    expect(out).toContain("<h4>Big</h4>");
    expect(out).not.toContain("<h1");
  });
  test("an http image is dropped", () => {
    expect(html("![x](http://a.dev/x.png)")).not.toContain("<img");
    expect(html("![x](https://a.dev/x.png)")).toContain("<img");
  });
});
