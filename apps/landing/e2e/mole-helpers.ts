// Shared helpers for the Orry browser tests. The suite is split into two files so each half can
// run on its own CI runner; anything both halves use lives here.
import { expect, type Page } from "@playwright/test";

export type Mood = { affection: number; irritation: number; affectionStage: string; irritationStage: string };

export type Mole = {
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

export const state = (page: Page) => page.evaluate(() => window.loadoutMole!.state());

export const box = (page: Page) => page.evaluate(() => window.loadoutMole!.box());

export const anim = (page: Page) => page.evaluate(() => window.loadoutMole!.anim());

export const mood = (page: Page) => page.evaluate(() => window.loadoutMole!.mood());

export const centre = async (page: Page) => {
  const { x, y, size } = await box(page);
  return { x: x + size / 2, y: y + size * 0.55 };
};

// Petting only counts on his head and helmet.

export const headCentre = async (page: Page) => {
  const { x, y, size } = await box(page);
  return { x: x + size / 2, y: y + size * 0.27 };
};


export async function open(page: Page, query = "?mole=pop") {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/" + query);
  await page.waitForFunction(() => !!window.loadoutMole);
}


export async function waitForIdle(page: Page) {
  await expect.poll(() => state(page), { timeout: 15000 }).toBe("idle");
}

// Records every state and animation he passes through (a sequence can be too short to catch by polling).

export async function record(page: Page) {
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as { seen: string[] }).seen = seen;
    window.setInterval(() => {
      const current = window.loadoutMole!.state() + ":" + window.loadoutMole!.anim();
      if (seen[seen.length - 1] !== current) seen.push(current);
    }, 20);
  });
}

export const seen = (page: Page) => page.evaluate(() => (window as unknown as { seen: string[] }).seen);

export const sawState = async (page: Page, name: string) => (await seen(page)).some((entry) => entry.startsWith(name + ":"));

export const sawAnim = async (page: Page, name: string) => (await seen(page)).some((entry) => entry.endsWith(":" + name));

// Strokes slowly back and forth over his body, about 250 px a second, for `ms`. Gentle petting.

export async function stroke(page: Page, x: number, y: number, ms: number) {
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

export async function scribble(page: Page, x: number, y: number, ms: number) {
  let side = 1;
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await page.mouse.move(x + side * 30, y - side * 24);
    side = -side;
    await page.waitForTimeout(10);
  }
}

// Orry only takes a stroke while he is standing about, so stroke again if he happened to run off.

export async function petFor(page: Page, ms: number) {
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


export async function watchStates(page: Page) {
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

export const states = (page: Page) => page.evaluate(() => (window as unknown as { states: string[] }).states);


export const goToSleep = (page: Page) => page.evaluate(() => (window.loadoutMole as unknown as { sleep: () => void }).sleep());

export const asleep = async (page: Page) => ["sleepy", "sleep"].includes(await state(page));

export async function tapHim(page: Page) {
  const { x, y } = await centre(page);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
}
