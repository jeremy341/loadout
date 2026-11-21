import { describe, expect, it } from "bun:test";
import { checkReadme, MIN_README_WORDS, readmeWordCount } from "./readme";

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${String.fromCharCode(97 + (i % 26))}`).join(" ");

describe("readmeWordCount", () => {
  it("counts plain prose", () => {
    expect(readmeWordCount("A small tool that parses logs")).toBe(6);
  });
  it("ignores heading marks, links, badges, code and comments", () => {
    const text = "# Title\n[![badge](https://x.test/b.svg)](https://x.test)\n<!-- hidden words here -->\n```js\nconst a = 1;\n```\nSee [the docs](https://x.test/docs) for `inline code` use.\nhttps://x.test/bare";
    expect(readmeWordCount(text)).toBe(6);
  });
  it("does not count numbers or punctuation alone", () => {
    expect(readmeWordCount("1 2 3 ... --- 42")).toBe(0);
  });
  it("is zero for empty text", () => {
    expect(readmeWordCount("")).toBe(0);
  });
});

describe("checkReadme", () => {
  it("waits when there is no text yet", () => {
    expect(checkReadme(null).status).toBe("waiting");
    expect(checkReadme(undefined).status).toBe("waiting");
  });
  it("calls an empty README missing", () => {
    expect(checkReadme("  \n ")).toEqual({ status: "missing", words: 0, minWords: MIN_README_WORDS });
  });
  it("fails below 100 words and passes at 100", () => {
    expect(checkReadme(words(99)).status).toBe("too_short");
    expect(checkReadme(words(100))).toEqual({ status: "passed", words: 100, minWords: 100 });
  });
});
