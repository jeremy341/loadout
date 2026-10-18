// Orry's body and movement: popping up, running, digging, being picked up, shaken, thrown and landing.
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { state, box, anim, centre, open, waitForIdle, record, seen, sawState, sawAnim, watchStates, states } from "./mole-helpers";

test("the mole pops out of the ground, stands on the bottom edge and settles", async ({ page }) => {
  await open(page);
  await expect.poll(() => state(page), { timeout: 4000 }).toBe("popout");
  await waitForIdle(page);
  const { y, ground, size } = await box(page);
  expect(size).toBe(128);
  expect(Math.abs(y - ground)).toBeLessThan(2);
  await expect(page.locator(".mole")).toBeVisible();
});


test("the mole layer is decoration: hidden from assistive technology and it lets the pointer through", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const layer = page.locator(".mole-layer");
  await expect(layer).toHaveAttribute("aria-hidden", "true");
  await expect(layer).toHaveCSS("pointer-events", "none");
  await expect(page.locator(".mole")).toHaveCSS("pointer-events", "auto");
  const covered = await page.evaluate(() => {
    const el = document.elementFromPoint(40, 200);
    return !!el?.closest(".mole-layer");
  });
  expect(covered).toBe(false);
});


test("the sprite atlases are served and are the right size", async ({ request }) => {
  for (const [name, w, h] of [["mole", 640, 1280], ["fx", 256, 96]] as const) {
    const response = await request.get(`/loadout/mole/${name}.png`);
    expect(response.status(), name).toBe(200);
    const body = await response.body();
    expect(body.readUInt32BE(16), name).toBe(w);
    expect(body.readUInt32BE(20), name).toBe(h);
    expect(body.length, name).toBeLessThan(200_000);
  }
});


test("the petting and pinch cursors are served at the right sizes", async ({ request }) => {
  for (const [name, size] of [["pet", 32], ["petHeart", 40], ["pinch", 32], ["shake", 32], ["thumbs", 32], ["stop", 32]] as const) {
    for (const theme of ["dark", "light"]) {
      for (const [suffix, factor] of [["", 1], ["@2x", 2]] as const) {
        const response = await request.get(`/loadout/cursors/${name}-${theme}${suffix}.png`);
        expect(response.status(), name).toBe(200);
        const body = await response.body();
        expect(body.readUInt32BE(16), name).toBe(size * factor);
        expect(body.readUInt32BE(20), name).toBe(size * factor);
      }
    }
  }
});

// ---- the bug that started the rework -------------------------------------------------------------------------------

test("held, he hangs there amused first and does not laugh, and after a gentle drop he gets up, stomps and runs off", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  await record(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 40, start.y - 120, { steps: 10 });
  await expect.poll(() => state(page)).toBe("held");
  expect(await sawAnim(page, "yelp")).toBe(true);
  await page.waitForTimeout(1200);
  expect(await anim(page)).toMatch(/^dangle/);
  expect(await sawAnim(page, "laugh")).toBe(false);
  await page.mouse.up();
  await expect.poll(async () => sawAnim(page, "getUp"), { timeout: 6000 }).toBe(true);
  await expect.poll(async () => sawState(page, "stomp"), { timeout: 6000 }).toBe(true);
  expect(await sawState(page, "joy")).toBe(false);
  expect(await sawState(page, "shake")).toBe(false); // no second get-up: he stands, stomps and runs
  await expect.poll(async () => sawState(page, "run"), { timeout: 6000 }).toBe(true);
  await waitForIdle(page);
});


test("he can be picked up, dangles, and falls back to the ground when dropped", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 60, start.y - 300, { steps: 12 });
  await expect.poll(() => state(page)).toBe("held");
  await expect(page.locator(".mole")).toHaveClass(/is-held/);
  await expect(page.locator(".mole")).toHaveCSS("cursor", /grabbing/);
  const held = await box(page);
  expect(held.y).toBeLessThan(held.ground - 150);
  await page.mouse.up();
  await expect.poll(() => state(page), { timeout: 3000 }).toMatch(/fall|land|shake|dizzy|stand|joy|idle/);
  await expect.poll(async () => (await box(page)).y, { timeout: 3000 }).toBeGreaterThan(held.ground - 2);
  await expect.poll(() => state(page), { timeout: 12000 }).toBe("idle");
});


test("held a long time he struggles and tires out", async ({ page }) => {
  await open(page, "?mole=pop&speed=4");
  await waitForIdle(page);
  await record(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y - 200, { steps: 8 });
  await expect.poll(() => state(page)).toBe("held");
  await expect.poll(async () => sawAnim(page, "struggle"), { timeout: 8000 }).toBe(true);
  await expect.poll(async () => sawAnim(page, "tired"), { timeout: 12000 }).toBe(true);
  await page.mouse.up();
});


test("shaken hard he gets queasy and sulks after the drop", async ({ page }) => {
  await open(page, "?mole=pop&speed=5");
  await waitForIdle(page);
  await page.evaluate(() => window.loadoutMole!.runTo(720));
  await waitForIdle(page);
  await record(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 20, start.y - 150, { steps: 6 });
  await expect.poll(() => state(page)).toBe("held");
  await page.evaluate(() => window.loadoutMole!.shakeForTest(700));
  await expect.poll(() => anim(page), { timeout: 2000 }).toBe("queasy");
  expect(await sawAnim(page, "queasy")).toBe(true);
  // Let the strong tier clear the post-drop threshold before releasing.
  await page.waitForTimeout(140);
  await page.mouse.up();
  await expect.poll(async () => sawState(page, "sulk"), { timeout: 20000 }).toBe(true);
  expect(await sawState(page, "mad")).toBe(true);
  // mad has three beats (puff, facepalm, furious), and the sulk is the grumpy face; the turned back comes after a stomp
  await expect.poll(async () => sawAnim(page, "grumpy"), { timeout: 12000 }).toBe(true);
  for (const name of ["puff", "facepalm", "furious"]) expect(await sawAnim(page, name), name).toBe(true);
});


test("after a long fall he sways dazed, shakes his head, rubs the bump and gets up, each beat once", async ({ page }) => {
  await open(page, "?mole=pop&speed=4");
  await waitForIdle(page);
  await record(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y - 700, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => sawAnim(page, "getUp"), { timeout: 25000 }).toBe(true);
  const anims = (await seen(page)).map((entry) => entry.split(":")[1]);
  for (const step of ["splat", "impact", "landSquash", "dazed", "dazedShake", "rubHead", "getUp"]) expect(anims, step).toContain(step);
  // on a big fall the landing goes flat, then impact lines, then the squash
  expect(anims.indexOf("splat")).toBeLessThan(anims.indexOf("impact"));
  expect(anims.indexOf("impact")).toBeLessThan(anims.indexOf("landSquash", anims.indexOf("impact")));
  // a beat plays once: the dazed look, the confused look and the get-up each appear as one run, never twice
  const runs = (name: string) => anims.filter((a, i) => a === name && anims[i - 1] !== name).length;
  for (const step of ["dazed", "dazedShake", "rubHead", "getUp"]) expect(runs(step), step).toBe(1);
  expect(anims.indexOf("dazed")).toBeLessThan(anims.indexOf("getUp"));
});


test("thrown fast he flies, bounces and lands, and does not stay stuck", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  await record(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 8, start.y - 20, { steps: 2 });
  await page.mouse.move(start.x + 500, start.y - 300, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => sawState(page, "fall"), { timeout: 3000 }).toBe(true);
  await expect.poll(() => state(page), { timeout: 20000 }).toBe("idle");
});

// ---- the pointer near him ---------------------------------------------------------------------------------------

test("he digs down and comes up somewhere else along the bottom", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const before = await box(page);
  await record(page);
  await page.evaluate(() => window.loadoutMole!.burrow());
  await expect.poll(async () => sawState(page, "under"), { timeout: 8000 }).toBe(true);
  await waitForIdle(page);
  const states = (await seen(page)).map((entry) => entry.split(":")[0]);
  expect(states.indexOf("under")).toBeGreaterThan(states.indexOf("sink"));
  expect(states.slice(states.indexOf("under"))).toContain("popout");
  const after = await box(page);
  expect(Math.abs(after.x - before.x)).toBeGreaterThan(100);
  expect(Math.abs(after.y - after.ground)).toBeLessThan(2);
});


test("the footer has no motion or Orry controls", async ({ page }) => {
  await open(page);
  await expect(page.locator(".motion-toggle")).toHaveCount(0);
  await expect(page.locator(".mole-controls")).toHaveCount(0);
  await expect(page.locator(".ft")).not.toContainText(/Play with Orry|Hide Orry|Enable Orry|Bring Orry back/);
});


test("?mole=0 keeps the mole away", async ({ page }) => {
  await open(page, "?mole=0");
  await page.waitForTimeout(2500);
  expect(await state(page)).toBe("hidden");
});


test("reduced motion stops Orry's automatic movement", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?mole=pop");
  await page.waitForFunction(() => !!window.loadoutMole);
  await page.waitForTimeout(2500);
  expect(await state(page)).toBe("hidden");
  await expect(page.locator("html")).toHaveAttribute("data-motion-paused", "true");
  await expect(page.locator(".motion-toggle")).toHaveCount(0);
  await expect(page.locator(".mole-controls")).toHaveCount(0);
});


test("on a phone the mole is half the size and still pops out", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?mole=pop");
  await page.waitForFunction(() => !!window.loadoutMole);
  await expect.poll(() => state(page), { timeout: 6000 }).toBe("idle");
  expect((await box(page)).size).toBe(64);
});


test("with the mole on screen there are no serious accessibility problems", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});


test("shaken in the air he is scared at once, and trembles, without waiting to get queasy", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 20, start.y - 150, { steps: 6 });
  await expect.poll(() => state(page)).toBe("held");
  await page.waitForTimeout(700);
  expect(await anim(page)).toMatch(/^dangle/); // calm: he hangs there
  await record(page);
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(start.x + (i % 2 ? -160 : 200), start.y - 150, { steps: 2 });
    await page.waitForTimeout(90);
  }
  expect(await sawAnim(page, "yelp")).toBe(true);
  // then he is flung about with the pointer: hectic, swinging both ways
  for (let i = 0; i < 10; i++) {
    await page.mouse.move(start.x + (i % 2 ? -160 : 200), start.y - 150, { steps: 2 });
    await page.waitForTimeout(90);
  }
  expect(await sawAnim(page, "dangleLeft")).toBe(true);
  expect(await sawAnim(page, "dangleRight")).toBe(true);
  await page.mouse.up();
});


test("a dropped Orry lands without bouncing, and only a thrown one bounces", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 5, start.y - 350, { steps: 8 });
  await page.waitForTimeout(250);
  await page.mouse.up();
  await expect.poll(() => state(page), { timeout: 3000 }).toBe("fall");
  await expect.poll(() => state(page), { timeout: 8000 }).not.toBe("fall");
  await waitForIdle(page);
  expect((await box(page)).bounces).toBe(0);
  const again = await centre(page);
  await page.mouse.move(again.x, again.y);
  await page.mouse.down();
  const toward = again.x > 720 ? -1 : 1; // aim at the middle of the window so the throw is never clipped by the edge
  await page.mouse.move(again.x + toward * 8, again.y - 20, { steps: 2 });
  await page.mouse.move(again.x + toward * 60, again.y - 60, { steps: 2 });
  await expect.poll(() => state(page)).toBe("held");
  // A real release reads the pointer velocity over the last 100 ms, which CI scheduling can miss; throw deterministically instead.
  await page.evaluate((dir) => window.loadoutMole!.throwForTest(dir * 1400, -1200), toward);
  await page.mouse.up();
  await expect.poll(async () => (await box(page)).bounces, { timeout: 10000 }).toBeGreaterThan(0);
});


test("after a fall he plays one recovery, and the mood does not make him go mad a second time", async ({ page }) => {
  await open(page, "?mole=pop&speed=4");
  await waitForIdle(page);
  await watchStates(page);
  const start = await centre(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 20, start.y - 150, { steps: 6 });
  for (let i = 0; i < 60; i++) {
    await page.mouse.move(start.x + (i % 2 ? -180 : 220), start.y - 150, { steps: 2 });
    await page.waitForTimeout(110);
  }
  await page.mouse.up();
  await expect.poll(async () => (await states(page)).includes("sulk"), { timeout: 20000 }).toBe(true);
  await page.waitForTimeout(6000);
  const seenStates = await states(page);
  expect(seenStates.filter((s) => s === "mad")).toHaveLength(1);
  expect(seenStates.includes("stand") && seenStates.includes("dizzy")).toBe(false);
});

// ---- sleeping: only a tap reaches him ------------------------------------------------------------------------------
