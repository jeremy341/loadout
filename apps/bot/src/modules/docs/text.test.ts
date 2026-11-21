import { describe, expect, test } from "bun:test";
import {
  answerFromCorpus,
  chunkText,
  decodeEntities,
  htmlToText,
  isDocUrl,
  normaliseQuestion,
  overlap,
  parseSitemapLocs,
  scorePassages,
  tokens,
  type Passage,
} from "./text";

const corpus: Passage[] = [
  { url: "https://site.example.test/docs/ore", title: "Ore", text: "Ore is earned by approved hours. Ten Ore is a set price." },
  { url: "https://site.example.test/docs/ship", title: "Shipping", text: "Shipping goes to your home address once a box is packed." },
];

describe("normaliseQuestion and tokens", () => {
  test("lower cases, strips punctuation and collapses spaces", () => {
    expect(normaliseQuestion("  How do I Earn   Ore?! ")).toBe("how do i earn ore");
  });

  test("tokens drop stop words", () => {
    expect(tokens("How do I earn the Ore?")).toEqual(["earn", "ore"]);
  });
});

describe("overlap", () => {
  test("is 1 for the same content words and 0 for disjoint questions", () => {
    expect(overlap("How do I earn ore", "earn ore?")).toBe(1);
    expect(overlap("earn ore", "ship a box")).toBe(0);
  });

  test("is partial for a shared subset", () => {
    expect(overlap("earn ore fast", "earn ore")).toBeCloseTo(2 / 3);
  });
});

describe("scorePassages and answerFromCorpus", () => {
  test("ranks the passage with the most matching words first", () => {
    const ranked = scorePassages("how is ore earned", corpus);
    expect(ranked[0]?.passage.url).toBe("https://site.example.test/docs/ore");
    expect(ranked[0]?.matched).toBe(2);
  });

  test("answers only when enough distinct words match", () => {
    expect(answerFromCorpus("how is ore earned", corpus)?.[0]?.passage.title).toBe("Ore");
    expect(answerFromCorpus("what is the weather in Paris", corpus)).toBeNull();
    expect(answerFromCorpus("the", corpus)).toBeNull();
  });
});

describe("htmlToText", () => {
  test("drops scripts and tags, keeps text and the title", () => {
    const html = `<html><head><title>Ore &amp; hours</title><style>p{}</style></head>
      <body><nav>menu</nav><script>alert(1)</script><h1>Ore</h1><p>Earn&nbsp;it &#65;.</p></body></html>`;
    const { title, text } = htmlToText(html);
    expect(title).toBe("Ore & hours");
    expect(text).toContain("Ore");
    expect(text).toContain("Earn it A.");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("menu");
    expect(text).not.toContain("<");
  });

  test("decodeEntities ignores out of range code points", () => {
    expect(decodeEntities("&#99999999;x")).toBe("x");
  });
});

describe("parseSitemapLocs and isDocUrl", () => {
  test("reads loc values", () => {
    const xml = `<urlset><url><loc> https://site.example.test/docs/a </loc></url><url><loc>https://site.example.test/docs/b?x=1&amp;y=2</loc></url></urlset>`;
    expect(parseSitemapLocs(xml)).toEqual(["https://site.example.test/docs/a", "https://site.example.test/docs/b?x=1&y=2"]);
  });

  test("only same origin docs pages, never plans, never sitemaps", () => {
    const origin = "https://site.example.test";
    expect(isDocUrl("https://site.example.test/docs/ore", origin)).toBe(true);
    expect(isDocUrl("https://site.example.test/docs", origin)).toBe(true);
    expect(isDocUrl("https://evil.example.test/docs/ore", origin)).toBe(false);
    expect(isDocUrl("https://site.example.test/about", origin)).toBe(false);
    expect(isDocUrl("https://site.example.test/docs/plans/secret", origin)).toBe(false);
    expect(isDocUrl("https://site.example.test/docs/sitemap.xml", origin)).toBe(false);
    expect(isDocUrl("not a url", origin)).toBe(false);
  });
});

describe("chunkText", () => {
  test("keeps paragraphs together and splits long ones", () => {
    const chunks = chunkText("first paragraph.\n\nsecond paragraph.", 900);
    expect(chunks).toEqual(["first paragraph.\n\nsecond paragraph."]);
    const long = chunkText("x".repeat(2000), 900);
    expect(long.length).toBe(3);
    expect(long.every((c) => c.length <= 900)).toBe(true);
  });
});
