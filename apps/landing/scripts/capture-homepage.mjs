import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("../../.impeccable/review/final");
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += height * 0.7) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true });
  await page.screenshot({ path: resolve(output, `${name}-viewport.png`) });
  console.log(`${name}: ${width}×${total}`);
  await page.close();
}
const hero = await browser.newPage({ viewport: { width: 1659, height: 948 } });
await hero.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await hero.evaluate(() => document.fonts.ready);
await hero.waitForTimeout(1100);
await hero.screenshot({ path: resolve(output, "hero-reference.png") });
await hero.close();
await browser.close();
