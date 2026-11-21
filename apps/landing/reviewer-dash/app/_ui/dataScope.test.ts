import { describe, expect, test } from "bun:test";
import { dataScopeFor } from "./dataScope";

describe("dataScopeFor", () => {
  test("Operations says it is saved, not sample", () => {
    const scope = dataScopeFor("/operations");
    expect(scope?.kind).toBe("saved");
    expect(scope?.text).toContain("audit history");
  });

  test("ship pages are mixed: reviews saved, sample ships in memory", () => {
    for (const path of ["/review", "/review/2041", "/review/stats", "/review/second-pass"]) {
      expect(dataScopeFor(path)?.kind).toBe("mixed");
    }
  });

  test("review sub-pages built from fixtures are read-only sample data", () => {
    for (const path of ["/review/pay", "/review/macros", "/review/erasure"]) {
      expect(dataScopeFor(path)?.kind).toBe("sample");
      expect(dataScopeFor(path)?.text).toContain("Read only");
    }
  });

  test("tickets and news are saved, and the Overview never claims a write", () => {
    expect(dataScopeFor("/tickets")?.text).toContain("saved to the database");
    expect(dataScopeFor("/news")?.kind).toBe("mixed");
    expect(dataScopeFor("/")?.label).toBe("Read only");
  });

  test("pages that carry their own notice get none", () => {
    expect(dataScopeFor("/fulfillment/airbridge-preview")).toBeNull();
    expect(dataScopeFor("/notify")).toBeNull();
    expect(dataScopeFor("/review/guidelines")).toBeNull();
  });

  test("an unknown page defaults to the sample warning, a trailing slash is ignored", () => {
    expect(dataScopeFor("/shop/")?.kind).toBe("sample");
    expect(dataScopeFor("/fulfillment")?.text).toContain("memory");
    expect(dataScopeFor("/operations/")?.kind).toBe("saved");
  });
});
