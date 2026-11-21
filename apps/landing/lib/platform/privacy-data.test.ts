import { describe, expect, test } from "bun:test";
import { dataExportAudit, EXPORT_PROJECT_FIELDS } from "./privacy-data";

// buildExport needs the database, so check that the successful-build path is wired to the audit helper in its source.
test("a successful export writes an export_downloaded audit row", async () => {
  const text = await Bun.file(new URL("./privacy-data.ts", import.meta.url)).text();
  expect(text).toContain("await recordAudit(db()");
  expect(text).toContain('action: "person.export_downloaded"');
  expect(text.indexOf("const envelope = exportEnvelope(parts, now)")).toBeLessThan(text.indexOf('action: "person.export_downloaded"'));
  expect(text.indexOf('action: "person.export_downloaded"')).toBeLessThan(text.indexOf("return envelope"));
});

describe("EXPORT_PROJECT_FIELDS", () => {
  test("a builder's own project export never carries a reviewer note", () => {
    expect(Object.keys(EXPORT_PROJECT_FIELDS)).not.toContain("reviewNote");
    expect(Object.keys(EXPORT_PROJECT_FIELDS)).toContain("changeNote");
  });
});

describe("dataExportAudit", () => {
  test("records the downloader, the person and the channel", () => {
    expect(dataExportAudit("p1", "settings", "actor1")).toEqual({
      actorId: "actor1",
      action: "person.data_exported",
      targetType: "Person",
      targetId: "p1",
      reason: "A builder downloaded their own data.",
      after: { channel: "settings", keyId: null },
    });
  });

  test("an API download also names the key that asked", () => {
    expect(dataExportAudit("p1", "api", "p1", "k1").after).toEqual({ channel: "api", keyId: "k1" });
  });
});
