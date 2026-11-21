import { describe, expect, test } from "bun:test";
import { createAccess } from "./access";

function site(list: () => Promise<string[]>) {
  let calls = 0;
  return {
    listHelpers: () => {
      calls++;
      return list();
    },
    get calls() {
      return calls;
    },
  };
}

describe("createAccess", () => {
  test("admins are helpers and admins without a site call", async () => {
    const s = site(async () => []);
    const access = createAccess({ site: s, adminSlackIds: ["U0000000009"] });
    expect(await access.isHelper("U0000000009")).toBe(true);
    expect(access.isAdmin("U0000000009")).toBe(true);
    expect(s.calls).toBe(0);
  });

  test("helpers come from the site and are cached for the ttl", async () => {
    let t = 0;
    const s = site(async () => ["U0000000001"]);
    const access = createAccess({ site: s, adminSlackIds: [], now: () => t, ttlMs: 60_000 });
    expect(await access.isHelper("U0000000001")).toBe(true);
    expect(await access.isHelper("U0000000002")).toBe(false);
    expect(s.calls).toBe(1);
    t = 60_000;
    await access.isHelper("U0000000001");
    expect(s.calls).toBe(2);
  });

  test("concurrent checks share one site call", async () => {
    const s = site(async () => ["U0000000001"]);
    const access = createAccess({ site: s, adminSlackIds: [] });
    await Promise.all([access.isHelper("U0000000001"), access.isHelper("U0000000003")]);
    expect(s.calls).toBe(1);
  });

  test("keeps the last good list when the site fails after the ttl", async () => {
    let t = 0;
    let fail = false;
    const errors: string[] = [];
    const s = site(async () => {
      if (fail) throw Object.assign(new Error("down"), { code: "network" });
      return ["U0000000001"];
    });
    const access = createAccess({ site: s, adminSlackIds: [], now: () => t, ttlMs: 10, onError: (c) => errors.push(c) });
    expect(await access.isHelper("U0000000001")).toBe(true);
    t = 100;
    fail = true;
    expect(await access.isHelper("U0000000001")).toBe(true);
    expect(errors).toEqual(["network"]);
  });
});
