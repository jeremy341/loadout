import { expect, test } from "@playwright/test";

// The currency is called Ore, with the ore gem icon (.ulpi/design/brand-and-type-record.md). These tests guard against a
// half-finished rename: the old name must not be readable anywhere a visitor can read.
const oldName = /\bBolts?\b/i;

test("visitors read Ore, never the old currency name, on the homepage and in the docs", async ({ page, request }) => {
  await page.goto("/");
  // Every text node in the page, including answers inside closed FAQ items.
  const homepageText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const parts: string[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement?.closest("script, style, noscript")) continue;
      parts.push(node.nodeValue ?? "");
    }
    return parts.join(" ");
  });
  expect(homepageText).not.toMatch(oldName);
  expect(homepageText).toMatch(/\bOre\b/);

  // The docs search index carries the text of every public docs page.
  const index = await (await request.get("/docs/search-index.json")).text();
  expect(index).not.toMatch(oldName);
  expect(index).toMatch(/\bOre\b/);
});

test("the currency icon is the ore gem, a 32 by 32 sprite, and the bolt sprite is gone", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('use[href="#i-ore"]')).toHaveCount(1);
  await expect(page.locator('use[href="#i-bolt"]')).toHaveCount(0);
  const sprite = await request.get("/loadout/sprites/ore.png");
  expect(sprite.status()).toBe(200);
  expect(sprite.headers()["content-type"]).toContain("image/png");
  const png = await sprite.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([32, 32]);
  expect((await request.get("/loadout/sprites/bolt.png")).status()).toBe(404);
});
