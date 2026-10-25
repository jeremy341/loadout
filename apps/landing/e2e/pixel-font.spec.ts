import { expect, test } from "@playwright/test";

// The pixel face's C must not read as an O (.ulpi/design/brand-and-type-record.md). The page draws each letter in the
// font the browser actually loads, then measures how much of the letter's right edge is open: the longest vertical run
// of rows with no ink in the right fifth of the letter, as a share of the letter's height.
async function openness(page: import("@playwright/test").Page, weight: number) {
  return page.evaluate(async (fontWeight) => {
    // Only the first family: the list also names the generated fallback face (a local Arial), which does not exist on
    // a Linux CI runner and makes document.fonts.load() reject with a NetworkError.
    const family = getComputedStyle(document.querySelector(".hero .h1")!).fontFamily.split(",")[0].trim();
    const font = `${fontWeight} 200px ${family}`;
    const measure = async (letter: string) => {
      await document.fonts.load(font, letter);
      const size = 400;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d")!;
      context.font = font;
      context.fillStyle = "#000";
      context.fillText(letter, 80, 300);
      const { data } = context.getImageData(0, 0, size, size);
      const ink = (x: number, y: number) => data[(y * size + x) * 4 + 3] > 128;
      let minX = size, maxX = -1, minY = size, maxY = -1;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (ink(x, y)) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      const band = Math.max(4, Math.round((maxX - minX) * 0.2));
      let longest = 0, run = 0;
      for (let y = minY; y <= maxY; y++) {
        let hit = false;
        for (let x = maxX - band; x <= maxX && !hit; x++) hit = ink(x, y);
        run = hit ? 0 : run + 1;
        longest = Math.max(longest, run);
      }
      return longest / (maxY - minY + 1);
    };
    return { C: await measure("C"), O: await measure("O"), c: await measure("c"), o: await measure("o") };
  }, weight);
}

for (const weight of [400, 700]) {
  test(`the pixel face's C and c stay open at weight ${weight}, and O and o stay closed`, async ({ page }) => {
    await page.goto("/");
    const open = await openness(page, weight);
    expect(open.C, "capital C opening").toBeGreaterThanOrEqual(0.3);
    expect(open.O, "capital O opening").toBeLessThan(0.02);
    expect(open.c, "lowercase c opening").toBeGreaterThanOrEqual(0.15);
    expect(open.o, "lowercase o opening").toBeLessThan(0.02);
  });
}
