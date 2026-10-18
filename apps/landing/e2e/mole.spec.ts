import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Orry, the homepage mole (.ulpi/design/mole.md and mole-behaviour.md): he turns up at the bottom of the screen, reacts to what
// the pointer does to him, and can be hidden for good. ?mole=pop makes him pop out of the ground after a moment, so the tests do
// not wait for his random schedule, and &speed=8 runs his clock 8 times faster, for the long sequences. The pointer itself is
// always real time, so strokes and pinches are timed for real.
type Mood = { affection: number; irritation: number; affectionStage: string; irritationStage: string };
type Mole = {
  state: () => string;
  box: () => { x: number; y: number; size: number; ground: number; bounces: number };
  runTo: (x: number) => void;
  shakeForTest: (durationMs: number) => void;
  throwForTest: (vx: number, vy: number) => void;
  burrow: () => void;
  anim: () => string;
  mood: () => Mood;
  call: () => void;
};
declare global {
  interface Window {
    loadoutMole?: Mole;
  }
}
const state = (page: Page) => page.evaluate(() => window.loadoutMole!.state());
const box = (page: Page) => page.evaluate(() => window.loadoutMole!.box());
const anim = (page: Page) => page.evaluate(() => window.loadoutMole!.anim());
const mood = (page: Page) => page.evaluate(() => window.loadoutMole!.mood());
const centre = async (page: Page) => {
  const { x, y, size } = await box(page);
  return { x: x + size / 2, y: y + size * 0.55 };
};

// Petting only counts on his head and helmet.
const headCentre = async (page: Page) => {
  const { x, y, size } = await box(page);
  return { x: x + size / 2, y: y + size * 0.27 };
};

async function open(page: Page, query = "?mole=pop") {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/" + query);
  await page.waitForFunction(() => !!window.loadoutMole);
}

async function waitForIdle(page: Page) {
  await expect.poll(() => state(page), { timeout: 15000 }).toBe("idle");
}

// Records every state and animation he passes through (a sequence can be too short to catch by polling).
async function record(page: Page) {
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as { seen: string[] }).seen = seen;
    window.setInterval(() => {
      const current = window.loadoutMole!.state() + ":" + window.loadoutMole!.anim();
      if (seen[seen.length - 1] !== current) seen.push(current);
    }, 20);
  });
}
const seen = (page: Page) => page.evaluate(() => (window as unknown as { seen: string[] }).seen);
const sawState = async (page: Page, name: string) => (await seen(page)).some((entry) => entry.startsWith(name + ":"));
const sawAnim = async (page: Page, name: string) => (await seen(page)).some((entry) => entry.endsWith(":" + name));

// Strokes slowly back and forth over his body, about 250 px a second, for `ms`. Gentle petting.
async function stroke(page: Page, x: number, y: number, ms: number) {
  let offset = -30;
  let direction = 1;
  await page.mouse.move(x + offset, y);
  const end = Date.now() + ms;
  while (Date.now() < end) {
    offset += direction * 4;
    if (Math.abs(offset) >= 30) direction = -direction;
    await page.mouse.move(x + offset, y);
    await page.waitForTimeout(16);
  }
}

// Scribbles fast over his head, thousands of pixels a second. It crosses the head diagonally, edge to edge, so each
// move covers more ground and a loaded CI runner must not stretch one gap into the slower petting band.
async function scribble(page: Page, x: number, y: number, ms: number) {
  let side = 1;
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await page.mouse.move(x + side * 30, y - side * 24);
    side = -side;
    await page.waitForTimeout(10);
  }
}

// Orry only takes a stroke while he is standing about, so stroke again if he happened to run off.
async function petFor(page: Page, ms: number) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await waitForIdle(page);
    const { x, y } = await headCentre(page);
    await stroke(page, x, y, 900);
    if ((await state(page)) === "pet") {
      await stroke(page, x, y, ms);
      return { x, y };
    }
  }
  throw new Error("he never took the stroke");
}

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
async function watchStates(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { states: string[] };
    w.states = [];
    window.setInterval(() => {
      const m = window.loadoutMole!;
      const s = m.state();
      if (w.states[w.states.length - 1] !== s) w.states.push(s);
    }, 16);
  });
}
const states = (page: Page) => page.evaluate(() => (window as unknown as { states: string[] }).states);

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
const goToSleep = (page: Page) => page.evaluate(() => (window.loadoutMole as unknown as { sleep: () => void }).sleep());
const asleep = async (page: Page) => ["sleepy", "sleep"].includes(await state(page));
async function tapHim(page: Page) {
  const { x, y } = await centre(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
}

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
