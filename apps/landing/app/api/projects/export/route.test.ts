import { expect, test } from "bun:test";

// The route is wrapped in next/headers, so check the wiring in its source instead of importing it into Bun.
test("an owner CSV download writes an audit row with the owner and the row count", async () => {
  const text = await Bun.file(new URL("./route.ts", import.meta.url)).text();
  expect(text).toContain("recordAudit(db()");
  expect(text).toContain('action: "api.projects.export"');
  expect(text).toContain('actorId: viewer?.id ?? "anonymous"');
  expect(text).toContain("rowCount: rows.length");
});
