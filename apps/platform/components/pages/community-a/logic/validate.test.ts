import { describe, expect, test } from "bun:test";
import { DRAFT_RULES } from "./rules";
import { validateComment, validateIdea, validatePost } from "./validate";

describe("validateIdea", () => {
  const ok = { title: "A useful idea", body: "It would help builders find each other.", track: "Tools" };
  test("accepts a valid idea and cleans the text", () => {
    const result = validateIdea({ ...ok, title: "  A useful   idea \n" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.title).toBe("A useful   idea");
  });
  test("title is limited to 80 characters", () => {
    expect(validateIdea({ ...ok, title: "x".repeat(DRAFT_RULES.ideaTitleMax) }).ok).toBe(true);
    const bad = validateIdea({ ...ok, title: "x".repeat(DRAFT_RULES.ideaTitleMax + 1) });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.title).toContain("80");
  });
  test("body is limited to 600 characters and needs a minimum", () => {
    expect(validateIdea({ ...ok, body: "x".repeat(600) }).ok).toBe(true);
    const long = validateIdea({ ...ok, body: "x".repeat(601) });
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.errors.body).toContain("600");
    expect(validateIdea({ ...ok, body: "short" }).ok).toBe(false);
  });
  test("reports every problem at once", () => {
    const bad = validateIdea({ title: "", body: "", track: "Nope" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["body", "title", "track"]);
  });
  test("Any track is allowed", () => {
    expect(validateIdea({ ...ok, track: "Any" }).ok).toBe(true);
  });
});

describe("validatePost", () => {
  const ok = {
    title: "Pocket logic analyser",
    built: "A two-channel logic analyser on a small board with a browser viewer.",
    link: "https://github.com/you/analyser",
    track: "Hardware",
    learned: "",
  };
  test("accepts a valid post; learned is optional", () => {
    const result = validatePost(ok);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.learned).toBeUndefined();
  });
  test("requires an https link", () => {
    const bad = validatePost({ ...ok, link: "http://github.com/you/analyser" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.link).toContain("https://");
    expect(validatePost({ ...ok, link: "" }).ok).toBe(false);
    expect(validatePost({ ...ok, link: "javascript:alert(1)" }).ok).toBe(false);
  });
  test("enforces length limits", () => {
    expect(validatePost({ ...ok, built: "too short" }).ok).toBe(false);
    expect(validatePost({ ...ok, built: "x".repeat(801) }).ok).toBe(false);
    expect(validatePost({ ...ok, learned: "x".repeat(601) }).ok).toBe(false);
    expect(validatePost({ ...ok, learned: "x".repeat(600) }).ok).toBe(true);
    expect(validatePost({ ...ok, title: "x".repeat(81) }).ok).toBe(false);
  });
  test("requires a known track", () => {
    expect(validatePost({ ...ok, track: "Any" }).ok).toBe(false);
  });
});

describe("validateComment", () => {
  test("500 characters is the limit", () => {
    expect(validateComment("x".repeat(500)).ok).toBe(true);
    expect(validateComment("x".repeat(501)).ok).toBe(false);
  });
  test("empty and whitespace-only comments are rejected", () => {
    expect(validateComment("").ok).toBe(false);
    expect(validateComment("   \n ").ok).toBe(false);
  });
});
