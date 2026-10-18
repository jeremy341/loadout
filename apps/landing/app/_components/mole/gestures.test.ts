import { describe, expect, test } from "bun:test";
import { GestureTracker, type GestureEvent, type Rect } from "./gestures";

// A body box at (400, 300), 100 wide and 100 high.
const BOX: Rect = { x: 400, y: 300, w: 100, h: 100 };
// His head is the top part of the body box, a little narrower.
const headOf = (r: Rect): Rect => ({ x: r.x + r.w * 0.2, y: r.y, w: r.w * 0.6, h: r.h * 0.4 });
const make = (rect: () => Rect = () => BOX) => new GestureTracker(rect, () => headOf(rect()));

// Moves the pointer along a list of points, one every `every` ms, and returns the time after the last one and every event.
function path(g: GestureTracker, from: number, points: [number, number][], every: number): { t: number; events: GestureEvent[] } {
  let t = from;
  const events: GestureEvent[] = [];
  for (const [x, y] of points) {
    events.push(...g.move(t, x, y));
    t += every;
  }
  return { t, events };
}

describe("petting", () => {
  test("slow strokes inside the body box, in circles or back and forth, count as gentle", () => {
    const g = make();
    const points: [number, number][] = [];
    for (let i = 0; i < 40; i++) points.push([450 + Math.cos(i / 4) * 25, 320 + Math.sin(i / 4) * 10]);
    const { t } = path(g, 1000, points, 25);
    expect(g.frame(t).petting).toBe("gentle");
  });

  test("a pointer that is not moving never pets, even when he runs underneath it", () => {
    let rect: Rect = { x: 0, y: 300, w: 100, h: 100 };
    const g = make(() => rect);
    path(g, 1000, [[600, 350]], 25); // the pointer rests outside him
    rect = { x: 560, y: 300, w: 100, h: 100 }; // he runs under it
    expect(g.frame(1500).petting).toBe("none");
    expect(g.frame(1500).over).toBe(true);
    rect = { x: 580, y: 300, w: 100, h: 100 };
    expect(g.frame(2500).petting).toBe("none");
  });

  test("the first sample after he arrives under the pointer starts a new stroke instead of continuing an old one", () => {
    let rect: Rect = { x: 0, y: 300, w: 100, h: 100 };
    const g = make(() => rect);
    path(g, 1000, [[900, 350], [905, 350], [910, 350]], 25);
    rect = { x: 880, y: 300, w: 100, h: 100 };
    g.move(1100, 940, 350); // one real movement, now over him
    expect(g.frame(1110).petting).toBe("none");
  });

  test("fast or scribbling movement is rough, not petting", () => {
    const g = make();
    const points: [number, number][] = [];
    for (let i = 0; i < 30; i++) points.push([i % 2 ? 430 : 470, 320]);
    const { t } = path(g, 1000, points, 12);
    expect(g.frame(t).petting).toBe("rough");
  });

  test("moving too slowly, or only a few pixels, is not petting", () => {
    const slow = make();
    const a = path(slow, 1000, Array.from({ length: 20 }, (_, i) => [450 + i, 320] as [number, number]), 120);
    expect(slow.frame(a.t).petting).toBe("none");
    const tiny = make();
    const b = path(tiny, 1000, Array.from({ length: 20 }, (_, i) => [450 + (i % 2), 320] as [number, number]), 25);
    expect(tiny.frame(b.t).petting).toBe("none");
  });

  test("petting stops when the pointer stops", () => {
    const g = make();
    const points: [number, number][] = [];
    for (let i = 0; i < 40; i++) points.push([430 + (i % 20) * 2, 320]);
    const { t } = path(g, 1000, points, 25);
    expect(g.frame(t).petting).toBe("gentle");
    expect(g.frame(t + 600).petting).toBe("none");
  });

  test("stroking his body below the head is not petting, and neither is scribbling there", () => {
    const g = make();
    const gentle: [number, number][] = [];
    for (let i = 0; i < 40; i++) gentle.push([430 + (i % 20) * 2, 380]);
    const a = path(g, 1000, gentle, 25);
    expect(g.frame(a.t).petting).toBe("none");
    expect(g.frame(a.t).over).toBe(true);
    expect(g.frame(a.t).overHead).toBe(false);
    const h = make();
    const fast: [number, number][] = [];
    for (let i = 0; i < 30; i++) fast.push([i % 2 ? 430 : 470, 380]);
    const b = path(h, 1000, fast, 12);
    expect(h.frame(b.t).petting).toBe("none");
  });

  test("moving outside the body box is not petting", () => {
    const g = make();
    const { t } = path(g, 1000, Array.from({ length: 40 }, (_, i) => [600 + (i % 20) * 3, 350] as [number, number]), 25);
    expect(g.frame(t).petting).toBe("none");
  });
});

describe("taps, tickles and pokes", () => {
  const tap = (g: GestureTracker, at: number) => {
    g.down(at, 450, 350);
    return g.up(at + 80);
  };

  test("a quick press and release is a tap", () => {
    const g = make();
    expect(tap(g, 1000).map((e) => e.type)).toEqual(["tap"]);
  });
  test("two taps within 0.4 s tickle him, and three within a second do too", () => {
    const g = make();
    tap(g, 1000);
    expect(tap(g, 1300).map((e) => e.type)).toEqual(["tap", "tickle"]);
    const h = make();
    tap(h, 1000);
    tap(h, 1450);
    expect(tap(h, 1900).map((e) => e.type)).toEqual(["tap", "tickle"]);
  });
  test("taps further apart are only pokes", () => {
    const g = make();
    tap(g, 1000);
    expect(tap(g, 2200).map((e) => e.type)).toEqual(["tap"]);
  });
  test("four taps in 1.5 s is spam", () => {
    const g = make();
    tap(g, 1000);
    tap(g, 1300);
    tap(g, 1600);
    expect(tap(g, 1900).map((e) => e.type)).toContain("spam");
  });
  test("a press outside the body box is ignored", () => {
    const g = make();
    expect(g.down(1000, 100, 100)).toBe(false);
    expect(g.up(1080)).toEqual([]);
  });
});

describe("pinching and picking up", () => {
  test("a press that stays still for half a second is a pinch, and ends with a pinch-end", () => {
    const g = make();
    g.down(1000, 450, 350);
    expect(g.frame(1300).pinching).toBe(false);
    expect(g.frame(1600).pinching).toBe(true);
    expect(g.up(2400).map((e) => e.type)).toEqual(["pinch-end"]);
  });
  test("moving a press by more than 8 px picks him up, and 6 px does not", () => {
    const g = make();
    g.down(1000, 450, 350);
    expect(g.move(1050, 456, 350)).toEqual([]);
    expect(g.move(1100, 462, 350).map((e) => e.type)).toEqual(["pickup"]);
    expect(g.frame(1110).held).toBe(true);
  });
  test("touch needs 12 px", () => {
    const g = make();
    g.down(1000, 450, 350, true);
    expect(g.move(1050, 460, 350)).toEqual([]);
    expect(g.move(1100, 464, 350).map((e) => e.type)).toEqual(["pickup"]);
  });
  test("moving the pointer back and forth while held shakes him, light then strong then violent", () => {
    const g = make();
    g.down(1000, 450, 350);
    g.move(1020, 470, 350);
    let t = 1040;
    const levels: number[] = [];
    for (let i = 0; i < 12; i++) {
      g.move(t, i % 2 ? 300 : 600, 350);
      levels.push(g.frame(t).shake);
      t += 130;
    }
    expect(levels.some((l) => l === 1)).toBe(true);
    expect(levels.some((l) => l === 2)).toBe(true);
    expect(Math.max(...levels)).toBe(3);
  });
  test("slow carrying does not shake", () => {
    const g = make();
    g.down(1000, 450, 350);
    g.move(1020, 470, 350);
    path(g, 1040, Array.from({ length: 30 }, (_, i) => [480 + i * 4, 350] as [number, number]), 40);
    expect(g.frame(2300).shake).toBe(0);
  });
  test("letting go after a drag reports how fast the pointer was moving", () => {
    const g = make();
    g.down(1000, 450, 350);
    g.move(1020, 470, 350);
    path(g, 1040, [[500, 340], [560, 320], [620, 300], [680, 280]], 25);
    const events = g.up(1140);
    expect(events[0]?.type).toBe("drop");
    const drop = events[0] as Extract<GestureEvent, { type: "drop" }>;
    expect(drop.vx).toBeGreaterThan(1500);
    expect(drop.vy).toBeLessThan(-300);
  });
});

describe("charging and staring", () => {
  test("a fast pointer heading for him is a charge, once, with a cooldown", () => {
    const g = make();
    const first = path(g, 1000, [[100, 350], [300, 350], [380, 350]], 25);
    expect(first.events.map((e) => e.type)).toContain("charge");
    const again = path(g, first.t + 100, [[100, 350], [300, 350], [380, 350]], 25);
    expect(again.events.map((e) => e.type)).not.toContain("charge");
  });
  test("moving fast inside him is not a charge", () => {
    const g = make();
    const { events } = path(g, 1000, [[410, 350], [490, 350], [410, 350], [490, 350]], 12);
    expect(events.map((e) => e.type)).not.toContain("charge");
  });
  test("a pointer that stays still near him is a stare that grows", () => {
    const g = make();
    path(g, 1000, [[700, 350], [701, 350]], 25);
    expect(g.frame(1100).stareMs).toBe(0);
    expect(g.frame(6200).stareMs).toBeGreaterThanOrEqual(5000);
    g.move(6300, 900, 350);
    expect(g.frame(6400).stareMs).toBe(0);
  });
});
