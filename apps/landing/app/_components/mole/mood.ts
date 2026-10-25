import { TUNING } from "./tuning";

// How Orry feels (.ulpi/design/mole-record.md, section 3): two meters, a short memory of being fed up, and stages that
// cannot change faster than a minimum time, so he never goes from happy to stomping in a moment. Plain code on its own clock
// (the engine calls update with the seconds that passed), so the pacing is unit tested without a browser.
export type AffectionStage = "none" | "happy" | "bliss" | "overjoyed";
export type IrritationStage = "calm" | "wary" | "annoyed" | "angry" | "furious";
const AFFECTION: AffectionStage[] = ["none", "happy", "bliss", "overjoyed"];
const IRRITATION: IrritationStage[] = ["calm", "wary", "annoyed", "angry", "furious"];

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export class Mood {
  affection = 0;
  irritation = 0;
  private t = 0;
  private aIndex = 0;
  private aSince = -1e9;
  private iIndex = 0;
  private iSince = -1e9;
  private lastKind = -1e9;
  private lastIrritant = -1e9;
  private highSince: number | null = null;
  private grudgeUntil = -1e9;

  get affectionStage(): AffectionStage { return AFFECTION[this.aIndex] as AffectionStage; }
  get irritationStage(): IrritationStage { return IRRITATION[this.iIndex] as IrritationStage; }
  /** True for two minutes after he stormed off: he is touchier and skips the amused phase when picked up. */
  get grudge() { return this.t < this.grudgeUntil; }
  /** True once he has been delighted for a long time: more petting now tires him ("that's enough"). */
  get enough() { return this.highSince !== null && this.t - this.highSince >= TUNING.irritation.enoughAfter; }
  get seconds() { return this.t; }

  // ---- kind things ----------------------------------------------------------------------------------------------
  pet(dt: number) { this.kind(TUNING.affection.pet * dt, TUNING.irritation.soothe * dt); }
  play(dt: number) { this.kind(TUNING.affection.play * dt, TUNING.irritation.soothe * dt); }
  poke() { this.kind(TUNING.affection.poke, TUNING.irritation.soothe); }
  tickle() { this.kind(TUNING.affection.tickle, TUNING.irritation.soothe); }
  joy() { this.kind(TUNING.affection.joy, 0); }

  // ---- unkind things --------------------------------------------------------------------------------------------
  scribble(dt: number) { this.annoy(TUNING.irritation.scribble * dt); }
  tiredOfPetting(dt: number) { this.annoy(TUNING.irritation.enough * dt); }
  pinchStart() { this.annoy(TUNING.irritation.pinchStart); }
  pinch(dt: number) { this.annoy(TUNING.irritation.pinch * dt); }
  spam() { this.annoy(TUNING.irritation.spam); }
  woken() { this.annoy(TUNING.irritation.woken); }
  shaken(level: 1 | 2 | 3, dt: number) {
    if (level === 2) this.annoy(TUNING.irritation.strong * dt);
    else if (level === 3) this.annoy(TUNING.irritation.violent * dt);
  }
  struggling(dt: number) { this.annoy(TUNING.irritation.struggle * dt); }
  angryHeld(dt: number) { this.annoy(TUNING.irritation.heldAngry * dt); }
  droppedAfterShake() { this.annoy(TUNING.irritation.droppedAfterShake); }
  stomped() { this.annoy(10); }
  stormedOff() { this.grudgeUntil = this.t + TUNING.grudge.seconds; }

  /** Moves the clock on by dt seconds: decay, and the stages (one step at a time, never faster than their minimum time). */
  update(dt: number) {
    this.t += dt;
    if (this.t - this.lastKind > TUNING.affection.decayAfter) this.affection = clamp(this.affection - TUNING.affection.decay * dt);
    if (this.t - this.lastIrritant > TUNING.irritation.calmAfter) this.irritation = clamp(this.irritation - TUNING.irritation.decay * dt);

    if (this.affection >= TUNING.affection.overjoyed) this.highSince ??= this.t;
    else this.highSince = null;

    const a = TUNING.affection;
    const aTarget = this.affection >= a.overjoyed ? 3 : this.affection >= a.bliss ? 2 : this.affection >= a.happy ? 1 : 0;
    if (aTarget !== this.aIndex && this.t - this.aSince >= a.stageMin) {
      this.aIndex += Math.sign(aTarget - this.aIndex);
      this.aSince = this.t;
    }

    const i = TUNING.irritation;
    const iTarget = this.irritation >= i.furious ? 4 : this.irritation >= i.angry ? 3 : this.irritation >= i.annoyed ? 2 : this.irritation >= i.wary ? 1 : 0;
    const rising = iTarget > this.iIndex;
    const active = this.t - this.lastIrritant <= 1.5;
    if (iTarget !== this.iIndex && this.t - this.iSince >= i.stageMin && (!rising || active)) {
      this.iIndex += Math.sign(iTarget - this.iIndex);
      this.iSince = this.t;
    }
  }

  private kind(affection: number, soothe: number) {
    this.affection = clamp(this.affection + affection);
    this.irritation = clamp(this.irritation - soothe);
    this.lastKind = this.t;
  }

  private annoy(amount: number) {
    this.irritation = clamp(this.irritation + amount * (this.grudge ? TUNING.grudge.factor : 1));
    this.lastIrritant = this.t;
  }
}
