import { describe, expect, it } from "bun:test";
import { parseSlackId } from "./hca";
import { pickSlackImage } from "./slack-avatar";

const ok = (profile: Record<string, unknown>) => ({ ok: true, user: { profile } });

describe("pickSlackImage", () => {
  it("takes the biggest picture on a known host", () => {
    const url = pickSlackImage(ok({ image_512: "https://avatars.slack-edge.com/a/512.png", image_72: "https://avatars.slack-edge.com/a/72.png" }));
    expect(url).toBe("https://avatars.slack-edge.com/a/512.png");
  });
  it("skips Gravatar placeholders and unknown hosts", () => {
    expect(pickSlackImage(ok({ image_512: "https://secure.gravatar.com/avatar/x", image_192: "https://evil.example/a.png" }))).toBeNull();
    expect(pickSlackImage(ok({ image_512: "https://secure.gravatar.com/avatar/x", image_72: "https://ca.slack-edge.com/T/U/72.png" }))).toBe("https://ca.slack-edge.com/T/U/72.png");
  });
  it("returns null for a failed or odd reply", () => {
    expect(pickSlackImage({ ok: false })).toBeNull();
    expect(pickSlackImage(null)).toBeNull();
    expect(pickSlackImage(ok({}))).toBeNull();
  });
});

describe("parseSlackId", () => {
  it("accepts member ids only", () => {
    expect(parseSlackId("U0A2SJ7B739")).toBe("U0A2SJ7B739");
    expect(parseSlackId("u0a2sj7b739")).toBeNull();
    expect(parseSlackId("U1&token=x")).toBeNull();
    expect(parseSlackId(42)).toBeNull();
  });
});
