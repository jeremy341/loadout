import { describe, expect, test } from "bun:test";
import { checkAvatarUrl, parseAvatar } from "./avatar";

describe("checkAvatarUrl", () => {
  test("accepts an https URL on a known host", () => {
    expect(checkAvatarUrl("https://avatars.slack-edge.com/T1-U1/photo_512.png")).toBe("https://avatars.slack-edge.com/T1-U1/photo_512.png");
  });
  test("rejects http, javascript:, data:, other hosts and tricks", () => {
    for (const bad of [
      "http://avatars.slack-edge.com/a.png",
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
      "https://example.com/a.png",
      "https://avatars.slack-edge.com.evil.test/a.png",
      "https://user:pw@avatars.slack-edge.com/a.png",
      "https://avatars.slack-edge.com:8443/a.png",
      "//avatars.slack-edge.com/a.png",
      "",
      "not a url",
    ]) expect(checkAvatarUrl(bad)).toBeNull();
    expect(checkAvatarUrl(null)).toBeNull();
    expect(checkAvatarUrl(42)).toBeNull();
  });
});

describe("parseAvatar", () => {
  test("keeps a valid record and drops everything else", () => {
    expect(parseAvatar({ url: "https://ca.slack-edge.com/x.png", alt: "Photo" })).toEqual({ url: "https://ca.slack-edge.com/x.png", alt: "Photo" });
    expect(parseAvatar({ url: "http://ca.slack-edge.com/x.png" })).toBeNull();
    expect(parseAvatar("x")).toBeNull();
    expect(parseAvatar(null)).toBeNull();
  });
});
