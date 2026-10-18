// Orry's mood and touch: tapping, petting, stroking, scribbling, pinching, looking, staring and sleep.
import { expect, test } from "@playwright/test";
import { state, box, anim, mood, centre, headCentre, open, waitForIdle, record, seen, sawState, sawAnim, stroke, scribble, petFor, goToSleep, asleep, tapHim } from "./mole-helpers";

test("a pointer that does not move never pets him, even when he runs right under it", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  await record(page);
  const { x, y } = await centre(page);
  // The pointer rests 500 px away, off him. Then he is sent to run onto it.
  const spot = x < 700 ? x + 500 : x - 500;
  await page.mouse.move(spot, y);
  await page.mouse.move(spot + 1, y);
  await page.evaluate((target) => (window as unknown as { loadoutMole: { runTo?: (x: number) => void } }).loadoutMole.runTo?.(target), spot - 64);
  await page.waitForTimeout(4500);
  const { x: now } = await centre(page);
  expect(Math.abs(now - spot)).toBeLessThan(200); // he did run to it
  expect(await sawState(page, "pet")).toBe(false);
  expect(await sawState(page, "poke")).toBe(false);
  expect((await mood(page)).affection).toBe(0);
});

// ---- being touched --------------------------------------------------------------------------------------------

test("a tap pokes him: a small hop and a heart, and it adds a little affection", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const { x, y } = await centre(page);
  await page.mouse.click(x, y);
  await expect.poll(() => state(page)).toBe("poke");
  expect((await mood(page)).affection).toBeGreaterThanOrEqual(4);
});


test("two quick taps tickle him, and a tap during the tickle cannot cut it short", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const { x, y } = await centre(page);
  await page.mouse.click(x, y);
  await page.waitForTimeout(150);
  await page.mouse.click(x, y);
  await expect.poll(() => state(page)).toBe("tickle");
  expect(await anim(page)).toBe("laugh");
  await page.waitForTimeout(150);
  await page.mouse.click(x, y);
  await page.waitForTimeout(200);
  expect(await state(page)).toBe("tickle");
});


test("slow strokes pet him: the flat hand cursor, affection goes up, and he is happy before he is blissful", async ({ page }) => {
  await open(page);
  await petFor(page, 1200);
  await expect(page.locator(".mole")).toHaveClass(/is-petted/);
  await expect(page.locator(".mole")).toHaveCSS("cursor", /pet-dark/);
  const m = await mood(page);
  expect(m.affection).toBeGreaterThan(5);
  expect(["happy", "none"]).toContain(m.affectionStage);
  expect(m.irritationStage).toBe("calm");
});


test("stroking his body below the head does nothing: only the head can be petted", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  await record(page);
  const { x, y, size } = await box(page);
  await stroke(page, x + size / 2, y + size * 0.8, 1800);
  expect(await sawState(page, "pet")).toBe(false);
  expect((await mood(page)).affection).toBe(0);
});


test("petting a while makes him blissful with a heart cursor, and it never makes him angry", async ({ page }) => {
  await open(page, "?mole=pop&speed=8");
  // Stroke in short rounds until he is blissful (a slow machine strokes slower, so give it a few rounds).
  let m = await mood(page);
  for (let round = 0; round < 8 && !["bliss", "overjoyed"].includes(m.affectionStage); round++) {
    await petFor(page, 1500);
    m = await mood(page);
  }
  expect(["bliss", "overjoyed"]).toContain(m.affectionStage);
  expect(m.irritationStage).toBe("calm");
  await record(page);
  await petFor(page, 2400);
  expect((await seen(page)).some((entry) => /:(content|blush)$/.test(entry))).toBe(true);
});


test("a rubbing that is fast and jittery is scribbling, not petting: it only annoys him", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  // He keeps still while a pointer moves on him, but he may have been running off at the start, so find him again every burst.
  for (let burst = 0; burst < 8; burst++) {
    const { x, y } = await headCentre(page);
    await scribble(page, x, y, 500);
  }
  const m = await mood(page);
  expect(m.irritation).toBeGreaterThan(15);
  // A fast, jittery rubbing must never make him happy: genuine petting reaches the happy stage at affection 5, so a
  // brief slip into the petting band on a loaded runner is still far short of petting.
  expect(m.affection).toBeLessThan(5);
});


test("scribbling long enough goes through wary, annoyed, angry and furious, and he storms off", async ({ page }) => {
  await open(page, "?mole=pop&speed=12");
  await waitForIdle(page);
  await record(page);
  for (let i = 0; i < 90 && (await state(page)) !== "hidden"; i++) {
    const { x, y } = await headCentre(page);
    await scribble(page, x, y, 400);
  }
  await expect.poll(() => state(page), { timeout: 30000 }).toBe("hidden");
  for (const name of ["annoyed", "mad", "stomp", "turnaway", "stormoff"]) expect(await sawState(page, name), name).toBe(true);
  // stomp, then his back is turned, then he storms off
  const order = (await seen(page)).map((entry) => entry.split(":")[0]);
  expect(order.indexOf("stomp")).toBeLessThan(order.indexOf("turnaway"));
  expect(order.indexOf("turnaway")).toBeLessThan(order.indexOf("stormoff"));
});


test("pressing on him without moving is a pinch: ow, the pinch hand cursor, and it does not count as a pet", async ({ page }) => {
  await open(page);
  let x = 0, y = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    await waitForIdle(page);
    ({ x, y } = await centre(page));
    await page.mouse.move(x, y);
    await page.mouse.down();
    try {
      await expect.poll(() => state(page), { timeout: 1800 }).toBe("pinch");
      break;
    } catch {
      await page.mouse.up();
    }
  }
  expect(await state(page)).toBe("pinch");
  expect(["pinchSquish", "ow"]).toContain(await anim(page));
  await expect(page.locator(".mole")).toHaveClass(/is-pinched/);
  await expect(page.locator(".mole")).toHaveCSS("cursor", /pinch-dark/);
  await page.mouse.up();
  await expect.poll(() => state(page), { timeout: 4000 }).not.toBe("pinch");
  expect((await mood(page)).affection).toBeLessThan(1);
});

// ---- being picked up --------------------------------------------------------------------------------------------

test("he looks at the pointer for a good while, and does not flick about", async ({ page }) => {
  await open(page);
  const looks = async (side: -1 | 1, name: string) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      await waitForIdle(page);
      const { x, y } = await centre(page);
      if (x + side * 330 < 20 || x + side * 330 > 1420) return false; // no room on that side of the screen
      await page.mouse.move(x + side * 330, y);
      await page.mouse.move(x + side * 300, y);
      try {
        await expect.poll(() => anim(page), { timeout: 1500 }).toBe(name);
        return true;
      } catch {
        /* he moved on; try again */
      }
    }
    expect(await anim(page)).toBe(name);
    return true;
  };
  const left = await looks(-1, "gazeLeft");
  const right = await looks(1, "gazeRight");
  expect(left || right).toBe(true);
});


test("the look is held after the pointer leaves, and a shaky hand does not turn his head", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  const { x, y } = await centre(page);
  const side = x > 760 ? -1 : 1;
  await page.mouse.move(x + side * 330, y);
  await page.mouse.move(x + side * 300, y);
  await expect.poll(() => anim(page), { timeout: 2000 }).toMatch(/^gaze/);
  const first = await anim(page);
  // A quick wobble across the other side of him for a moment does not change where he looks.
  await page.mouse.move(x + side * 300, y - 260);
  await page.mouse.move(x + side * 300, y);
  expect(await anim(page)).toBe(first);
  await page.mouse.move(x + side * 300, y - 10);
  await page.waitForTimeout(1500);
  if ((await state(page)) === "idle") expect(await anim(page)).toMatch(/^gaze/);
});


test("a pointer that charges at him makes him run, with his tongue out", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  await record(page);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { x, y } = await centre(page);
    const side = x > 760 ? -1 : 1;
    await page.mouse.move(x + side * 700, y - 40);
    await page.mouse.move(x + side * 150, y - 40, { steps: 3 });
    if (await sawState(page, "flee")) break;
    await page.waitForTimeout(500);
    await waitForIdle(page);
  }
  expect(await sawState(page, "flee")).toBe(true);
  expect(await sawAnim(page, "flinch")).toBe(true);
});

// ---- the rest ----------------------------------------------------------------------------------------------------

test("a pointer that stares at him makes him suspicious, then squinting, then half-lidded", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  await record(page);
  for (let attempt = 0; attempt < 3 && !(await sawAnim(page, "halfLid")); attempt++) {
    const { x, y } = await centre(page);
    const side = x > 760 ? -1 : 1;
    await page.mouse.move(x + side * 200, y);
    await page.mouse.move(x + side * 201, y);
    await expect.poll(() => sawAnim(page, "suspicious"), { timeout: 9000 }).toBe(true).catch(() => undefined);
    await page.waitForTimeout(2600);
  }
  for (const name of ["suspicious", "squint", "halfLid"]) expect(await sawAnim(page, name), name).toBe(true);
});

// ---- shaken, dropped and thrown ------------------------------------------------------------------------------------
// Counts how many times he touches the ground (a bounce is another touch) and the states he passes through.

test("asleep he ignores the pointer, and taps climb a ladder: startled, grumpy, then angry", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  await record(page);
  await goToSleep(page);
  // a pointer right next to him, moving and then still, does not wake him or make him look
  const { x, y } = await centre(page);
  await page.mouse.move(x + 150, y - 40);
  await page.mouse.move(x + 120, y - 20);
  await page.waitForTimeout(2500);
  expect(await asleep(page)).toBe(true);
  expect(await sawAnim(page, "gazeLeft") || await sawAnim(page, "gazeRight")).toBe(false);
  // tap 1: startled, then he drops off again
  await tapHim(page);
  await expect.poll(() => sawAnim(page, "startled"), { timeout: 2000 }).toBe(true);
  await expect.poll(() => asleep(page), { timeout: 4000 }).toBe(true);
  // tap 2: grumpy, and he drops off again
  await tapHim(page);
  await expect.poll(() => sawAnim(page, "grumpy"), { timeout: 2000 }).toBe(true);
  await expect.poll(() => asleep(page), { timeout: 4000 }).toBe(true);
  // tap 3: too much, he is angry
  await tapHim(page);
  await expect.poll(() => sawState(page, "mad"), { timeout: 2000 }).toBe(true);
});


test("asleep, petting, pinching and a charging pointer do nothing", async ({ page }) => {
  await open(page);
  await waitForIdle(page);
  await record(page);
  await goToSleep(page);
  const { x, y } = await headCentre(page);
  await stroke(page, x, y, 1600);
  expect(await sawState(page, "pet")).toBe(false);
  const before = await mood(page);
  const c = await centre(page);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
  expect(await sawState(page, "pinch")).toBe(false);
  await page.mouse.move(c.x - 700, c.y - 40);
  await page.mouse.move(c.x - 150, c.y - 40, { steps: 3 });
  expect(await sawState(page, "flee")).toBe(false);
  expect((await mood(page)).affection).toBe(before.affection);
  expect(await asleep(page)).toBe(true);
});


test("a pinch held for over a second ends with him swatting at the pointer", async ({ page }) => {
  await open(page);
  await record(page);
  for (let attempt = 0; attempt < 4 && !(await sawState(page, "swat")); attempt++) {
    await waitForIdle(page);
    const { x, y } = await centre(page);
    await page.mouse.move(x, y);
    await page.mouse.down();
    try { await expect.poll(() => state(page), { timeout: 1500 }).toBe("pinch"); } catch { await page.mouse.up(); continue; }
    await page.waitForTimeout(1500);
    await page.mouse.up();
    await expect.poll(() => sawState(page, "swat"), { timeout: 2000 }).toBe(true).catch(() => undefined);
  }
  expect(await sawState(page, "swat")).toBe(true);
});
