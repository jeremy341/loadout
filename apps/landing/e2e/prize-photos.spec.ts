import { expect, test } from "@playwright/test";

// The proposed prizes show one product photo each (.ulpi/design/prize-photos.md): photos from Pixl, small, decorative
// next to a visible name, and kept on their white plate.
const PHOTOS = ["framework-16", "esp32", "rpi", "soldering-iron", "samsung-t7-ssd", "a1-mini", "domain-grant", "centauri-carbon"];

test("each of the eight prizes shows a photo that stays on its plate", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#shop h2")).toHaveText(/Proposed\s+prizes/);
  const cards = page.locator(".pb-half").first().locator("li");
  await expect(cards).toHaveCount(8);
  for (let index = 0; index < 8; index++) {
    const card = cards.nth(index);
    await card.scrollIntoViewIfNeeded();
    const image = card.locator("img");
    await expect(image).toHaveAttribute("alt", "");
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const boxes = await card.evaluate((element) => {
      const plate = element.querySelector(".pb-photo")!.getBoundingClientRect();
      const photo = element.querySelector("img")!.getBoundingClientRect();
      return { plate: { top: plate.top, bottom: plate.bottom, left: plate.left, right: plate.right }, photo: { top: photo.top, bottom: photo.bottom, left: photo.left, right: photo.right } };
    });
    expect(boxes.photo.top).toBeGreaterThanOrEqual(boxes.plate.top - 1);
    expect(boxes.photo.bottom).toBeLessThanOrEqual(boxes.plate.bottom + 1);
    expect(boxes.photo.left).toBeGreaterThanOrEqual(boxes.plate.left - 1);
    expect(boxes.photo.right).toBeLessThanOrEqual(boxes.plate.right + 1);
  }
});

test("every prize has a category and an example name, and the prices are examples", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#shop");
  await expect(section).toContainText("Examples of what Ore could buy");
  for (const text of ["Developer hardware", "Framework 16 laptop", "Embedded boards", "ESP32 starter kit", "Compute", "Raspberry Pi 5", "Tools", "Soldering iron kit", "Storage", "Samsung T7 SSD", "Fabrication", "Bambu Lab A1 Mini 3D printer", "Domains", "Custom equipment"]) {
    await expect(section.locator(".pb-half").first()).toContainText(text);
  }
});

test("the photos are small WebP files, together well under 1.5 MB", async ({ request }) => {
  let total = 0;
  for (const name of PHOTOS) {
    const response = await request.get(`/loadout/prizes/${name}.webp`);
    expect(response.status(), name).toBe(200);
    expect(response.headers()["content-type"], name).toContain("image/webp");
    total += (await response.body()).length;
  }
  expect(total).toBeLessThan(1_500_000);
});
