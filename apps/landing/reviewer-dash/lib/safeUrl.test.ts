import { describe, expect, test } from "bun:test";
import { escapeAttr, isAllowedImageSrc, isJournalMediaPath, isSafeImageUrl, isSafeUrl, safeBaseHref, safeRedirectPath } from "./safeUrl";

describe("isSafeUrl", () => {
  test("rejects dangerous schemes", () => {
    expect(isSafeUrl("javascript://alert(1)")).toBe(false);
    expect(isSafeUrl("javascript://%0aalert(1)")).toBe(false);
    expect(isSafeUrl("JaVaScRiPt://alert(1)")).toBe(false);
    expect(isSafeUrl("data://text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("vbscript://alert(1)")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  test("accepts plain http(s) links", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("https://github.com/user/repo")).toBe(true);
  });

  test("accepts relative, same-app links", () => {
    expect(isSafeUrl("/players/123")).toBe(true);
    expect(isSafeUrl("/players/123?tab=orders#top")).toBe(true);
  });

  test("rejects protocol-relative and backslash hosts", () => {
    expect(isSafeUrl("//evil.example")).toBe(false);
    expect(isSafeUrl("//evil.example/a.png")).toBe(false);
    expect(isSafeUrl("\\\\evil.example")).toBe(false);
    expect(isSafeUrl("/\\evil.example")).toBe(false);
    expect(isSafeUrl("\\evil.example")).toBe(false);
    expect(isSafeUrl("https://evil.example\\@good.example")).toBe(false);
  });

  test("rejects control characters, spaces and scheme tricks the URL parser would forgive", () => {
    expect(isSafeUrl("/\t/evil.example")).toBe(false);
    expect(isSafeUrl("/\n/evil.example")).toBe(false);
    expect(isSafeUrl("java\tscript:alert(1)")).toBe(false);
    expect(isSafeUrl("http:evil.example")).toBe(false);
    expect(isSafeUrl("https:/evil.example")).toBe(false);
    expect(isSafeUrl("https://")).toBe(false);
    expect(isSafeUrl("https:///evil.example")).toBe(false);
    expect(isSafeUrl("https://good.example/a b")).toBe(false);
    expect(isSafeUrl("players/123")).toBe(false);
  });

  test("rejects empty/blank/missing values", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl("   ")).toBe(false);
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl(undefined)).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  test("passes same-app paths through unchanged", () => {
    expect(safeRedirectPath("/review/123", "/review")).toBe("/review/123");
    expect(safeRedirectPath("/projects/7?tab=mod", "/review")).toBe("/projects/7?tab=mod");
    expect(safeRedirectPath("/notify", "/review")).toBe("/notify");
  });

  test("falls back on absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.com", "/review")).toBe("/review");
    expect(safeRedirectPath("http://evil.com/phish", "/review")).toBe("/review");
    expect(safeRedirectPath("//evil.com", "/review")).toBe("/review");
    // Dot segments collapse into a protocol-relative path that passes the origin check on the raw input.
    expect(safeRedirectPath("/..//evil.com", "/review")).toBe("/review");
    expect(safeRedirectPath("/%2e%2e//evil.com", "/review")).toBe("/review");
    expect(safeRedirectPath("/a/..//evil.com", "/review")).toBe("/review");
    expect(safeRedirectPath("javascript:alert(1)", "/review")).toBe("/review");
    expect(safeRedirectPath("", "/review")).toBe("/review");
    expect(safeRedirectPath(null, "/review")).toBe("/review");
    expect(safeRedirectPath(undefined, "/review")).toBe("/review");
  });

  test("falls back on backslash and header-injection tricks", () => {
    expect(safeRedirectPath("/\\evil.com", "/review")).toBe("/review");
    expect(safeRedirectPath("/foo\\bar", "/review")).toBe("/review");
    expect(safeRedirectPath("/review\r\nSet-Cookie: x=1", "/review")).toBe("/review");
    expect(safeRedirectPath("/review\u2028x", "/review")).toBe("/review");
  });
});

describe("isSafeImageUrl", () => {
  test("accepts the Pixl site and Hack Club CDN hosts", () => {
    expect(isSafeImageUrl("https://loadout.invalid/shop/keyboard.webp")).toBe(true);
    expect(isSafeImageUrl("https://cdn.hackclub.com/abc/item.webp")).toBe(true);
    expect(isSafeImageUrl("https://hc-cdn.hel1.your-objectstorage.com/x/item.webp")).toBe(true);
    expect(isSafeImageUrl("https://assets.hackclub.com/icon.png")).toBe(true);
  });
  test("rejects dangerous schemes", () => {
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeImageUrl("data:image/png;base64,AAAA")).toBe(false);
  });
  test("rejects loopback, private and unexpected hosts", () => {
    expect(isSafeImageUrl("https://localhost/a.png")).toBe(false);
    expect(isSafeImageUrl("https://127.0.0.1/a.png")).toBe(false);
    expect(isSafeImageUrl("https://192.168.1.10/a.png")).toBe(false);
    expect(isSafeImageUrl("https://10.0.0.5/a.png")).toBe(false);
    expect(isSafeImageUrl("https://evil.example/a.png")).toBe(false);
  });
  test("rejects plain http, credentials, ports, lookalikes and relative paths", () => {
    expect(isSafeImageUrl("http://pixl.hackclub.com/a.png")).toBe(false);
    expect(isSafeImageUrl("https://user:pw@cdn.hackclub.com/a.png")).toBe(false);
    expect(isSafeImageUrl("https://cdn.hackclub.com:8443/a.png")).toBe(false);
    expect(isSafeImageUrl("https://cdn.hackclub.com.evil.example/a.png")).toBe(false);
    expect(isSafeImageUrl("/label/pixorpheus.png")).toBe(false);
    expect(isSafeImageUrl(null)).toBe(false);
  });
});

describe("isAllowedImageSrc", () => {
  test("accepts the participant media path and the CDN allowlist", () => {
    expect(isJournalMediaPath("/api/journal-media/cmabc123def456ghi789")).toBe(true);
    expect(isAllowedImageSrc("/api/journal-media/cmabc123def456ghi789")).toBe(true);
    expect(isAllowedImageSrc("https://cdn.hackclub.com/abc/item.webp")).toBe(true);
  });
  test("rejects trackers, other app paths and tricks", () => {
    expect(isAllowedImageSrc("https://tracker.example/pixel.gif")).toBe(false);
    expect(isAllowedImageSrc("/api/journal-media/")).toBe(false);
    expect(isAllowedImageSrc("/api/journal-media/abc")).toBe(false);
    expect(isAllowedImageSrc("/api/journal-media/cmabc123def456ghi789/../../x")).toBe(false);
    expect(isAllowedImageSrc("/api/journal-media/cmabc123def456ghi789?x=1")).toBe(false);
    expect(isAllowedImageSrc("//evil.example/a.png")).toBe(false);
    expect(isAllowedImageSrc("/api/other/cmabc123def456ghi789")).toBe(false);
    expect(isAllowedImageSrc("data:image/png;base64,AAAA")).toBe(false);
    expect(isAllowedImageSrc(null)).toBe(false);
  });
});

describe("escapeAttr", () => {
  test("escapes every character that can leave an attribute or a tag", () => {
    expect(escapeAttr(`a&b<c>d"e'f`)).toBe("a&amp;b&lt;c&gt;d&quot;e&#39;f");
  });
});

describe("safeBaseHref", () => {
  test("accepts an absolute https base and normalizes it", () => {
    expect(safeBaseHref("https://raw.example/repo/main/")).toBe("https://raw.example/repo/main/");
    expect(safeBaseHref("https://raw.example/a?x=1&y=2")).toBe("https://raw.example/a?x=1&amp;y=2");
  });
  test("refuses anything that is not a plain https address", () => {
    for (const value of ["http://raw.example/a", "//raw.example/a", "/app/path", "javascript:alert(1)", "https://user:pw@raw.example/", "https://raw.example/a b", "", null, undefined]) {
      expect(safeBaseHref(value)).toBeNull();
    }
  });
});
