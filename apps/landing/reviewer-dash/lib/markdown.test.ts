import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "./markdown";

const MEDIA = "/api/journal-media/cmabc123def456ghi789";

// Every tag name and attribute that is really in the markup (text content is escaped, so it never shows up here).
function tags(html: string): string[] {
  return [...html.matchAll(/<([a-z0-9]+)([^>]*)>/gi)].map((m) => `${m[1]}${m[2]}`);
}
function attrNames(html: string): string[] {
  return [...html.matchAll(/<[a-z0-9]+((?:\s+[a-z-]+(?:="[^"]*")?)*)\s*\/?>/gi)].flatMap((m) =>
    [...m[1].matchAll(/\s+([a-z-]+)(?:="[^"]*")?/gi)].map((a) => a[1].toLowerCase()),
  );
}

describe("renderMarkdown: script and markup injection", () => {
  test("escapes raw HTML, including script tags", () => {
    const html = renderMarkdown(`<script>alert(1)</script> <img src=x onerror=alert(1)>`);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(attrNames(html)).not.toContain("onerror");
  });

  test("a script tag in a fenced block, a heading and a quote stays text", () => {
    const html = renderMarkdown("```\n<script>alert(1)</script>\n```\n# <script>x</script>\n> <script>y</script>");
    expect(html).not.toContain("<script");
  });

  test("a NUL character cannot forge a placeholder", () => {
    const html = renderMarkdown("`a` \u00000\u0000 \u00001\u0000");
    expect(html).not.toContain("\u0000");
    expect(html).toContain("<code>a</code>");
  });
});

describe("renderMarkdown: links", () => {
  test("javascript:, data: and vbscript: links render as text", () => {
    for (const url of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>", "vbscript:x", "file:///etc/passwd", "//evil.example/x", "/relative/path"]) {
      const html = renderMarkdown(`[click me](${url})`);
      expect(html).toContain("click me");
      expect(html).not.toContain("<a ");
      expect(html).not.toContain("href");
    }
  });

  test("an https link gets noopener, noreferrer and no-referrer", () => {
    const html = renderMarkdown("[repo](https://github.com/example/repo)");
    expect(html).toContain('href="https://github.com/example/repo"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('referrerpolicy="no-referrer"');
    expect(html).toContain('target="_blank"');
  });

  test("quotes in a URL cannot leave the attribute", () => {
    const html = renderMarkdown(`[x](https://a.example/"onmouseover="alert(1)) [y](https://a.example/'onfocus='alert(1))`);
    expect(attrNames(html)).not.toContain("onmouseover");
    expect(attrNames(html)).not.toContain("onfocus");
    expect(html).toContain("&quot;");
    expect(html).toContain("&#39;");
  });

  test("angle brackets in link text are escaped", () => {
    const html = renderMarkdown("[<img src=x onerror=alert(1)>](https://a.example/)");
    expect(tags(html).some((t) => t.startsWith("img"))).toBe(false);
  });
});

describe("renderMarkdown: images", () => {
  test("a participant upload renders as an image with no-referrer", () => {
    const html = renderMarkdown(`![shot](${MEDIA})`);
    expect(html).toContain(`src="${MEDIA}"`);
    expect(html).toContain('alt="shot"');
    expect(html).toContain('referrerpolicy="no-referrer"');
  });

  test("an image on the CDN allowlist renders", () => {
    const html = renderMarkdown("![item](https://cdn.hackclub.com/abc/item.webp)");
    expect(html).toContain('src="https://cdn.hackclub.com/abc/item.webp"');
  });

  test("a tracker image becomes a plain link, not a request", () => {
    const html = renderMarkdown("![pixel](https://tracker.example/p.gif?u=reviewer)");
    expect(html).not.toContain("<img");
    expect(html).toContain('<a href="https://tracker.example/p.gif?u=reviewer"');
    expect(html).toContain(">pixel</a>");
  });

  test("a non-web image address becomes its alt text", () => {
    for (const url of ["javascript:alert(1)", "data:image/png;base64,AAAA", "//evil.example/a.png", "/api/other/thing", `${MEDIA}/../../x`]) {
      const html = renderMarkdown(`![the alt](${url})`);
      expect(html).not.toContain("<img");
      expect(html).not.toContain("href");
      expect(html).toContain("the alt");
    }
  });

  test("quotes and angle brackets in alt text stay inside the attribute", () => {
    const html = renderMarkdown(`![a" onerror="alert(1)](${MEDIA}) ![<b>x</b>](${MEDIA})`);
    expect(attrNames(html)).not.toContain("onerror");
    expect(html).toContain("alt=\"a&quot; onerror=&quot;alert(1)\"");
    expect(html).not.toContain("<b>");
  });

  test("quotes in an image URL cannot leave the attribute", () => {
    const html = renderMarkdown(`![x](https://cdn.hackclub.com/a"onerror="alert(1).png)`);
    expect(attrNames(html)).not.toContain("onerror");
    expect(html).not.toContain("<img");
  });

  test("a picture inside a link keeps both", () => {
    const html = renderMarkdown(`[![shot](${MEDIA})](https://example.com/page)`);
    expect(html).toContain('href="https://example.com/page"');
    expect(html).toContain(`src="${MEDIA}"`);
  });
});

describe("renderMarkdown: emphasis does not touch URLs or code", () => {
  test("underscores and asterisks inside a URL are left alone", () => {
    const html = renderMarkdown("[doc](https://example.com/a__b__c/*d*/e_f_) and **bold**");
    expect(html).toContain('href="https://example.com/a__b__c/*d*/e_f_"');
    expect(html).toContain("<strong>bold</strong>");
    expect(html).not.toContain("<em>d</em>");
  });

  test("emphasis inside a URL cannot inject markup into the attribute", () => {
    const html = renderMarkdown("[x](https://example.com/**a**/~~b~~/__c__)");
    expect(html).toContain('href="https://example.com/**a**/~~b~~/__c__"');
    expect(attrNames(html)).toEqual(["class", "href", "target", "rel", "referrerpolicy"]);
    expect(html.match(/<strong>|<s>|<em>/g)).toBeNull();
  });

  test("code is shown as typed", () => {
    const html = renderMarkdown("`**not bold** and <b>` and *it*");
    expect(html).toContain("<code>**not bold** and &lt;b&gt;</code>");
    expect(html).toContain("<em>it</em>");
  });

  test("link text can carry emphasis", () => {
    expect(renderMarkdown("[**big** news](https://example.com/)")).toContain("<strong>big</strong> news");
  });

  test("ordinary formatting still works", () => {
    const html = renderMarkdown("# Title\n\n- one\n- two\n\n1. a\n\n> quote\n\n---\n\n~~gone~~ __strong__");
    expect(html).toContain('<h1 class="md-h">Title</h1>');
    expect(html).toContain('<ul class="md-list"><li>one</li><li>two</li></ul>');
    expect(html).toContain('<ol class="md-list"><li>a</li></ol>');
    expect(html).toContain('<blockquote class="md-quote">quote</blockquote>');
    expect(html).toContain('<hr class="md-hr" />');
    expect(html).toContain("<s>gone</s> <strong>strong</strong>");
  });
});
