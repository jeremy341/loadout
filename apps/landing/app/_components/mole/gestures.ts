import { TUNING } from "./tuning";

// What did the person do to Orry? (.ulpi/design/mole-record.md, section 2.) This file turns raw pointer positions into
// gestures and knows nothing about moods or sprites. It is plain code with no DOM, so every rule is unit tested.
//
// One rule above all: only a real change of the pointer's position counts. If Orry runs under a pointer that is not moving,
// no event arrives, so nothing is petted. The first sample after he arrives under the pointer starts a new stroke, it never
// continues an old one.
export type Rect = { x: number; y: number; w: number; h: number };
export type Petting = "none" | "gentle" | "rough";
export type ShakeLevel = 0 | 1 | 2 | 3;
export type GestureEvent =
  | { type: "tap" }
  | { type: "tickle" }
  | { type: "spam" }
  | { type: "pickup"; x: number; y: number }
  | { type: "drop"; vx: number; vy: number }
  | { type: "pinch-end" }
  | { type: "charge" };

export type GestureFrame = {
  over: boolean;
  overHead: boolean;
  petting: Petting;
  pressing: boolean;
  pinching: boolean;
  held: boolean;
  shake: ShakeLevel;
  speed: number;
  stareMs: number;
  moveAgeMs: number;
};

type Sample = { t: number; x: number; y: number; over: boolean; head: boolean };
type Press = { t: number; x: number; y: number; moved: boolean; touch: boolean };

const inside = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

export class GestureTracker {
  private samples: Sample[] = [];
  private pos: { x: number; y: number } | null = null;
  private lastMoveT = -1e9;
  private ema = 0;
  private press: Press | null = null;
  private taps: number[] = [];
  private reversals: number[] = [];
  private lastDirX = 0;
  private lastChargeT = -1e9;
  private stareSince: number | null = null;

  constructor(private readonly hit: () => Rect, private readonly head: () => Rect) {}

  /** The pointer moved to (x, y) at time t (ms). Returns the gestures that this movement completes. */
  move(t: number, x: number, y: number): GestureEvent[] {
    if (this.pos && this.pos.x === x && this.pos.y === y) return [];
    const events: GestureEvent[] = [];
    const prev = this.pos;
    const dt = Math.max(4, t - this.lastMoveT);
    if (prev) {
      const instant = (Math.hypot(x - prev.x, y - prev.y) / dt) * 1000;
      this.ema = t - this.lastMoveT > 250 ? instant : this.ema * 0.6 + instant * 0.4;
    } else {
      this.ema = 0;
    }
    const rect = this.hit();
    const over = inside(rect, x, y);
    const head = inside(this.head(), x, y);

    // A fast pointer heading for him, but not on him, is a charge.
    if (!this.press && !over && prev && this.ema > TUNING.charge.speed && t - this.lastChargeT > TUNING.charge.cooldownMs) {
      const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
      const now = Math.hypot(x - cx, y - cy), before = Math.hypot(prev.x - cx, prev.y - cy);
      if (now < TUNING.charge.range && now < before) { events.push({ type: "charge" }); this.lastChargeT = t; }
    }

    this.samples.push({ t, x, y, over, head });
    while (this.samples.length && t - (this.samples[0] as Sample).t > 1500) this.samples.shift();

    const press = this.press;
    if (press) {
      if (!press.moved && Math.hypot(x - press.x, y - press.y) > (press.touch ? TUNING.pickUp.touch : TUNING.pickUp.mouse)) {
        press.moved = true;
        this.reversals = [];
        this.lastDirX = 0;
        events.push({ type: "pickup", x, y });
      }
      if (press.moved && prev) {
        const vx = ((x - prev.x) / dt) * 1000;
        if (Math.abs(vx) > TUNING.shake.minSpeed) {
          const dir = Math.sign(vx);
          const lastReversal = this.reversals[this.reversals.length - 1] ?? -1e9;
          if (this.lastDirX !== 0 && dir !== this.lastDirX && t - lastReversal > TUNING.shake.minGapMs) this.reversals.push(t);
          this.lastDirX = dir;
        }
      }
    }
    this.pos = { x, y };
    this.lastMoveT = t;
    return events;
  }

  /** A button went down at (x, y). Only a press on his body counts; the result says whether it did. */
  down(t: number, x: number, y: number, touch = false): boolean {
    if (!inside(this.hit(), x, y)) return false;
    this.press = { t, x, y, moved: false, touch };
    if (!this.pos) this.pos = { x, y };
    return true;
  }

  /** The button went up. A short press is a tap, a still long press ends a pinch, a drag is a drop. */
  up(t: number): GestureEvent[] {
    const press = this.press;
    this.press = null;
    if (!press) return [];
    if (press.moved) {
      const v = this.velocity(t);
      this.reversals = [];
      this.lastDirX = 0;
      return [{ type: "drop", vx: v.x, vy: v.y }];
    }
    if (t - press.t > TUNING.tap.maxMs) return [{ type: "pinch-end" }];
    const events: GestureEvent[] = [{ type: "tap" }];
    this.taps.push(t);
    this.taps = this.taps.filter((at) => t - at <= TUNING.tap.spamMs);
    const last = this.taps[this.taps.length - 1] as number;
    const second = this.taps[this.taps.length - 2];
    const third = this.taps[this.taps.length - 3];
    if (this.taps.length >= TUNING.tap.spamCount) events.push({ type: "spam" });
    else if ((second !== undefined && last - second <= TUNING.tap.tickleMs) || (third !== undefined && last - third <= TUNING.tap.tickleThreeMs)) events.push({ type: "tickle" });
    return events;
  }

  /** Cancels a press without a result (the browser took the pointer away). */
  cancel(t: number): GestureEvent[] {
    if (this.press?.moved) return this.up(t);
    this.press = null;
    return [];
  }

  /** The state of the pointer right now, read once a frame. */
  frame(t: number): GestureFrame {
    const rect = this.hit();
    const pos = this.pos;
    const over = !!pos && inside(rect, pos.x, pos.y);
    const overHead = !!pos && inside(this.head(), pos.x, pos.y);
    const speed = t - this.lastMoveT > 150 ? 0 : this.ema;
    const press = this.press;
    const held = !!press?.moved;

    let stareMs = 0;
    if (pos && !press && speed < TUNING.stare.maxSpeed && Math.hypot(pos.x - (rect.x + rect.w / 2), pos.y - (rect.y + rect.h / 2)) <= TUNING.stare.range) {
      if (this.stareSince === null) this.stareSince = t;
      stareMs = t - this.stareSince;
    } else {
      this.stareSince = null;
    }

    return {
      over,
      overHead,
      petting: press ? "none" : this.petting(t),
      pressing: !!press,
      pinching: !!press && !press.moved && t - press.t >= TUNING.pinch.holdMs,
      held,
      shake: held ? this.shakeLevel(t) : 0,
      speed,
      stareMs,
      moveAgeMs: t - this.lastMoveT,
    };
  }

  /** Forget the current stare (he has reacted to it). */
  resetStare() {
    this.stareSince = null;
  }

  private shakeLevel(t: number): ShakeLevel {
    const count = this.reversals.filter((at) => t - at <= TUNING.shake.windowMs).length;
    return count >= TUNING.shake.violent ? 3 : count >= TUNING.shake.strong ? 2 : count >= TUNING.shake.light ? 1 : 0;
  }

  // Petting is slow movement over his head. Only the run of samples that ends at the latest one counts, so a stroke
  // that began somewhere else, or before he moved, cannot carry over. Stroking his body does nothing.
  private petting(t: number): Petting {
    const s = this.samples;
    const last = s[s.length - 1];
    if (!last || !last.head || t - last.t > TUNING.pet.stopMs) return "none";
    let from = s.length - 1;
    while (from > 0 && (s[from - 1] as Sample).head && t - (s[from - 1] as Sample).t <= TUNING.pet.windowMs) from--;
    const run = s.slice(from);
    if (run.length < 2) return "none";
    const first = run[0] as Sample;
    const elapsed = last.t - first.t;
    let path = 0;
    for (let i = 1; i < run.length; i++) path += Math.hypot((run[i] as Sample).x - (run[i - 1] as Sample).x, (run[i] as Sample).y - (run[i - 1] as Sample).y);
    if (elapsed < TUNING.rough.minMs || path < TUNING.pet.minTravel) return "none";
    const speed = (path / elapsed) * 1000;
    const net = Math.max(1, Math.hypot(last.x - first.x, last.y - first.y));
    if (speed > TUNING.rough.speed || (path / net > TUNING.rough.wiggleRatio && speed > TUNING.rough.wiggleSpeed)) return "rough";
    if (elapsed < TUNING.pet.minMs) return "none";
    return speed >= TUNING.pet.minSpeed && speed <= TUNING.pet.maxSpeed ? "gentle" : "none";
  }

  private velocity(t: number) {
    const recent = this.samples.filter((s) => t - s.t <= 100);
    const a = recent[0], b = recent[recent.length - 1];
    if (!a || !b || a === b) return { x: 0, y: 0 };
    const dt = Math.max(8, b.t - a.t);
    return { x: ((b.x - a.x) / dt) * 1000, y: ((b.y - a.y) / dt) * 1000 };
  }
}
