import { describe, expect, it } from "bun:test";
import { fetchGithubReadme, parseGithubRepo } from "./readme-source";

describe("parseGithubRepo (Pixl: only GitHub addresses are read)", () => {
  it("reads owner and repo from a GitHub address, with or without .git", () => {
    expect(parseGithubRepo("https://github.com/acme/widget")).toEqual({ owner: "acme", repo: "widget" });
    expect(parseGithubRepo("https://www.github.com/acme/widget.git")).toEqual({ owner: "acme", repo: "widget" });
  });
  it("refuses other hosts, other schemes and bad names", () => {
    expect(parseGithubRepo("https://gitlab.com/acme/widget")).toBeNull();
    expect(parseGithubRepo("ftp://github.com/acme/widget")).toBeNull();
    expect(parseGithubRepo("https://github.com/acme")).toBeNull();
    expect(parseGithubRepo("https://github.com/ac me/widget")).toBeNull();
    expect(parseGithubRepo(null)).toBeNull();
  });
});

describe("fetchGithubReadme", () => {
  it("returns the README text from the readme endpoint", async () => {
    const calls: string[] = [];
    const fake = (async (url: string) => {
      calls.push(url);
      return new Response("# Widget\n\nWords.", { status: 200 });
    }) as unknown as typeof fetch;
    expect(await fetchGithubReadme("https://github.com/acme/widget", fake)).toBe("# Widget\n\nWords.");
    expect(calls).toEqual(["https://api.github.com/repos/acme/widget/readme"]);
  });
  it("says the repo has no README on 404, and null only when the failure is transient", async () => {
    const missing = (async () => new Response("", { status: 404 })) as unknown as typeof fetch;
    expect(await fetchGithubReadme("https://github.com/acme/widget", missing)).toBe("");
    for (const status of [503, 408, 429]) {
      const down = (async () => new Response("", { status })) as unknown as typeof fetch;
      expect(await fetchGithubReadme("https://github.com/acme/widget", down)).toBeNull();
    }
    const broken = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    expect(await fetchGithubReadme("https://github.com/acme/widget", broken)).toBeNull();
  });
  it("fails closed on a permanent fetch failure instead of waiting", async () => {
    for (const status of [401, 403, 422]) {
      const denied = (async () => new Response("", { status })) as unknown as typeof fetch;
      expect(await fetchGithubReadme("https://github.com/acme/widget", denied)).toBe("");
    }
  });
  it("fails closed for a non-GitHub address without calling out", async () => {
    let called = false;
    const fake = (async () => { called = true; return new Response("x"); }) as unknown as typeof fetch;
    expect(await fetchGithubReadme("https://gitlab.com/acme/widget", fake)).toBe("");
    expect(called).toBe(false);
  });
});
