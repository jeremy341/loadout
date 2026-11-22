import { afterEach, describe, expect, test } from "bun:test";
import { signWebhook } from "@/lib/platform/integrations/webhook-signature";
import { POST } from "./route";

const SECRET = "route-test-secret-0123456789";
const original = process.env.LOADOUT_FRAUD_WEBHOOK_SECRET;

afterEach(() => {
  if (original === undefined) delete process.env.LOADOUT_FRAUD_WEBHOOK_SECRET;
  else process.env.LOADOUT_FRAUD_WEBHOOK_SECRET = original;
});

function request(raw: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/fraud-outcome", { method: "POST", body: raw, headers });
}

function signed(raw: string, secret = SECRET) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return { "x-loadout-timestamp": timestamp, "x-loadout-signature": signWebhook(secret, timestamp, raw) };
}

describe("POST /api/fraud-outcome", () => {
  test("no secret configured answers 503 not connected", async () => {
    delete process.env.LOADOUT_FRAUD_WEBHOOK_SECRET;
    const res = await POST(request("{}", signed("{}")));
    expect(res.status).toBe(503);
    expect((await res.json()).state).toBe("not_connected");
  });
  test("a bad or missing signature is refused with 401", async () => {
    process.env.LOADOUT_FRAUD_WEBHOOK_SECRET = SECRET;
    const raw = '{"event":"ping"}';
    expect((await POST(request(raw, {}))).status).toBe(401);
    expect((await POST(request(raw, signed(raw, "some-other-secret-value")))).status).toBe(401);
  });
  test("a signed ping is answered ok", async () => {
    process.env.LOADOUT_FRAUD_WEBHOOK_SECRET = SECRET;
    const raw = '{"event":"ping"}';
    const res = await POST(request(raw, signed(raw)));
    expect(res.status).toBe(200);
  });
  test("a signed outcome without our external id is verified and read, but not applied to any ship", async () => {
    process.env.LOADOUT_FRAUD_WEBHOOK_SECRET = SECRET;
    const raw = JSON.stringify({ event: "outcome.set", projectId: "r1", outcome: { trustScore: 3, reviewedAt: "2026-11-22T10:00:00Z" } });
    const res = await POST(request(raw, signed(raw)));
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.applied).toBe(false);
    expect(json.state).toBe("unmatched");
  });
  test("a signed outcome naming our external id is matched, but applies nothing without a database", async () => {
    process.env.LOADOUT_FRAUD_WEBHOOK_SECRET = SECRET;
    const dbUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const raw = JSON.stringify({ event: "outcome.set", externalId: "loadout-100123-1763790000", outcome: { trustScore: 7, reviewedAt: "2026-11-22T10:00:00Z" } });
      const res = await POST(request(raw, signed(raw)));
      expect(res.status).toBe(202);
      const json = await res.json();
      expect(json.applied).toBe(false);
      expect(json.score).toBe(7);
      expect(json.state).toBe("no_database");
    } finally {
      if (dbUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = dbUrl;
    }
  });
  test("a signed outcome with no usable score is refused", async () => {
    process.env.LOADOUT_FRAUD_WEBHOOK_SECRET = SECRET;
    const raw = JSON.stringify({ event: "outcome.set", projectId: "r1", outcome: {} });
    expect((await POST(request(raw, signed(raw)))).status).toBe(400);
  });
});
