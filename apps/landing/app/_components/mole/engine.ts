import { ANIMS, ATLAS_COLS, FEET, FRAME, FX, FX_COLS, FX_SIZE, type AnimName, type FxName } from "./frames";
import { GestureTracker, type GestureEvent, type GestureFrame, type Rect } from "./gestures";
import { Mood, type IrritationStage } from "./mood";
import { TUNING } from "./tuning";

// Orry, the homepage mole (.ulpi/design/mole-record.md and mole-behaviour.md): a pixel Maulwurf that turns up at the bottom of the
// screen. This file is the state machine and the animation loop. What the person did comes from gestures.ts, how he feels
// comes from mood.ts, every number comes from tuning.ts. No React in the loop, and Orry is decoration: he never takes focus,
// and the page never waits for him.
export type MoleState =
  | "hidden" | "popout" | "peek" | "idle" | "run" | "look" | "sleepy" | "sleep" | "dig" | "sink" | "under"
  | "poke" | "tickle" | "pet" | "pinch" | "swat" | "annoyed" | "mad" | "sulk" | "stomp" | "stormoff" | "flee" | "joy"
  | "held" | "fall" | "land" | "dizzy" | "stand" | "turnaway";

export const STORAGE_KEY = "loadout-mole";
export const COMMAND_EVENT = "loadout:mole-command";
export const STATE_EVENT = "loadout:mole-state";
export type MoleCommand = "hide" | "show" | "call" | "pet" | "move-left" | "move-right" | "status";
export type MoleStatus = { enabled: boolean; visible: boolean; reduced: boolean; paused: boolean };

const GRAVITY = 2400; // px/s squared
// He can start a reaction when he is doing one of these. Everything else is a sequence that plays to its end.
const FREE: readonly MoleState[] = ["idle", "run", "look", "sleepy", "sleep", "pet"];
const STAGES: readonly IrritationStage[] = ["calm", "wary", "annoyed", "angry", "furious"];

const rand = (from: number, to: number) => from + Math.random() * (to - from);
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)] as T;

export class MoleEngine {
  private state: MoleState = "hidden";
  private anim: AnimName = "idle";
  private animT = 0;
  private shown = -1;
  private stateT = 0;
  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private facing: 1 | -1 = 1;
  private scale = 2;
  private raf = 0;
  private last = 0;
  private timers: number[] = [];
  private enabled = true;
  private reduced: boolean;
  private readonly timeScale: number;
  private target = 0;
  private lifeLeft = 0;
  private dwell = 2;
  private idleTotal = 0;
  private lookAnim: AnimName = "sniff";
  private peekStep = 0;
  private fxClock = 0;
  private cooldownUntil = 0;
  private heldFor = 0;
  private fallFrom = 0;
  private bigFall = false;
  private bounces = 0;
  private testShakeUntil = 0; // Used only by the query-gated E2E API.
  private thrownFall = false;
  private scared = false;
  private scaredFor = 0;
  private burrowing = false;
  private amused: number = TUNING.held.amused;
  private lastX = 0;
  private strongFor = 0;
  private violentFor = 0;
  private dizzyHeld = false;
  private afterDrop: "normal" | "joy" | "mad" = "normal";
  private stompRuns = false;
  private dozing = false;
  private wakeTaps = 0;
  private lastWakeTap = 0;
  private scurrying = false;
  private sniffAfter = false;
  private cursorShown = "";
  private petGap = 0;
  private lastPetStage = "none";
  private handledStage: IrritationStage = "calm";
  private moodReactionActive = false;
  private followCooldown = 0;
  private stareCooldown = 0;
  // Where he is looking, and for how long he keeps looking there (a solid while, and no flicking about).
  private gazeNow: AnimName | null = null;
  private gazeCandidate: AnimName | null = null;
  private gazeCandidateAt = 0;
  private gazeUntil = 0;
  private frameState: GestureFrame = { over: false, overHead: false, petting: "none", pressing: false, pinching: false, held: false, shake: 0, speed: 0, stareMs: 0, moveAgeMs: 1e9 };
  private pointer = { x: -1e9, y: -1e9 };
  private pressId: number | null = null;
  private readonly mood = new Mood();
  private readonly gestures = new GestureTracker(() => this.hitRect(), () => this.headRect());
  private readonly forced: boolean;
  private readonly onlyPop: boolean;

  constructor(
    private readonly root: HTMLElement,
    private readonly sprite: HTMLElement,
    private readonly layer: HTMLElement,
    params: URLSearchParams,
    private readonly paused = false,
  ) {
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // ?mole=1 shows him after a second (any kind of arrival); ?mole=pop always pops him out of the ground; ?mole=0 turns him off.
    // ?speed=8 makes his moods and the long hold run 8 times faster (for tests); his movement and animation stay real time.
    this.forced = params.get("mole") === "1" || params.get("mole") === "pop";
    this.onlyPop = params.get("mole") === "pop";
    this.timeScale = Math.min(20, Math.max(1, Number(params.get("speed")) || 1));
    const off = params.get("mole") === "0";
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch { /* storage can be blocked */ }
    this.enabled = !off && stored !== "off";
    if (off) this.enabled = false;
    this.applyScale();
    this.bind();
    if (params.has("mole")) this.exposeForTests();
    if (this.enabled && !this.reduced && !this.paused) this.schedule(this.forced ? 700 : rand(3000, 6000));
    this.emit();
  }

  // ---- setup and teardown -------------------------------------------------------------------------------------------
  private bind() {
    window.addEventListener(COMMAND_EVENT, this.onCommand);
    window.addEventListener("resize", this.onResize);
    if (this.paused) return;
    this.root.addEventListener("pointerdown", this.onDown);
    this.root.addEventListener("pointerup", this.onUp);
    this.root.addEventListener("pointercancel", this.onCancel);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  destroy() {
    this.timers.forEach((id) => window.clearTimeout(id));
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener(COMMAND_EVENT, this.onCommand);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.root.removeEventListener("pointerdown", this.onDown);
    this.root.removeEventListener("pointerup", this.onUp);
    this.root.removeEventListener("pointercancel", this.onCancel);
    this.layer.querySelectorAll(".mole-fx").forEach((el) => el.remove());
    this.root.classList.remove("is-visible", "is-held");
  }

  private exposeForTests() {
    (window as unknown as { loadoutMole: unknown }).loadoutMole = {
      state: () => this.state,
      box: () => ({ x: this.x, y: this.y, size: this.size, ground: this.ground, bounces: this.bounces }),
      call: () => this.appear("pop", true),
      burrow: () => this.burrow(),
      sleep: () => { this.dozing = false; this.wakeTaps = 0; this.go("sleepy", "sleepy"); },
      runTo: (x: number) => { this.target = x; this.facing = x < this.x ? -1 : 1; this.go("run", "run"); },
      shakeForTest: (durationMs: number) => { this.testShakeUntil = performance.now() + Math.min(1000, Math.max(0, durationMs)); },
      throwForTest: (vx: number, vy: number) => this.releaseIfHeld(vx, vy),
      spamForTest: () => this.mood.spam(),
      anim: () => this.anim,
      mood: () => ({ affection: this.mood.affection, irritation: this.mood.irritation, affectionStage: this.mood.affectionStage, irritationStage: this.mood.irritationStage }),
      gesture: () => this.frameState,
    };
  }

  private get size() { return FRAME * this.scale; }
  private get ground() { return window.innerHeight - FEET * this.scale; }
  private status(): MoleStatus { return { enabled: this.enabled, visible: this.state !== "hidden", reduced: this.reduced, paused: this.paused }; }
  private emit() { window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: this.status() })); }

  // The body box that counts as "on him": the middle of the frame, from under the helmet top down to the feet.
  private hitRect(): Rect {
    const width = this.size * TUNING.hit.widthShare;
    const top = this.size * TUNING.hit.topShare;
    return { x: this.x + (this.size - width) / 2, y: this.y + top, w: width, h: FEET * this.scale - top };
  }

  // His head and helmet, where petting counts.
  private headRect(): Rect {
    const width = this.size * TUNING.head.widthShare;
    return { x: this.x + (this.size - width) / 2, y: this.y + this.size * TUNING.head.topShare, w: width, h: this.size * TUNING.head.heightShare };
  }

  private get free() { return FREE.includes(this.state); }
  // Asleep (drowsy or deep): only a tap, or being picked up, reaches him. Looking, following, staring, charging, petting and pinching are ignored.
  private get asleep() { return this.state === "sleepy" || this.state === "sleep"; }
  private get stageIndex() { return STAGES.indexOf(this.mood.irritationStage); }

  private applyScale() {
    this.scale = window.innerWidth >= 640 ? 2 : 1;
    this.layer.style.setProperty("--s", String(this.scale));
  }

  private later(task: () => void, ms: number) {
    this.timers.push(window.setTimeout(task, ms));
  }

  // ---- when he turns up -------------------------------------------------------------------------------------------
  private schedule(ms: number) {
    this.later(() => {
      if (!this.enabled || this.paused || this.state !== "hidden") return;
      if (document.hidden || Date.now() < this.cooldownUntil) return this.schedule(8000);
      this.appear(this.onlyPop ? "pop" : pick(["pop", "pop", "runin", "runin", "peek"] as const), false);
    }, ms);
  }

  private appear(kind: "pop" | "runin" | "peek", called: boolean) {
    if (this.state !== "hidden" || (this.reduced && !called) || (this.paused && !called)) return;
    if (this.paused) return this.appearStatic();
    this.lifeLeft = rand(40, 90);
    this.scurrying = false;
    this.dozing = false;
    this.idleTotal = 0;
    this.fallFrom = 0;
    this.handledStage = this.mood.irritationStage;
    const margin = this.size * 1.2;
    this.facing = Math.random() < 0.5 ? 1 : -1;
    this.y = this.ground;
    this.show();
    if (kind === "runin" && !this.reduced) {
      const fromLeft = Math.random() < 0.5;
      this.x = fromLeft ? -this.size : window.innerWidth;
      this.facing = fromLeft ? 1 : -1;
      this.target = rand(margin, Math.max(margin + 1, window.innerWidth - margin));
      this.go("run", "run");
    } else if (kind === "peek" && !this.reduced) {
      this.x = rand(margin, Math.max(margin + 1, window.innerWidth - margin));
      this.peekStep = 0;
      this.go("peek", "peekUp");
    } else {
      this.x = rand(margin, Math.max(margin + 1, window.innerWidth - margin));
      this.go(this.reduced ? "idle" : "popout", this.reduced ? "idle" : "popOut");
      if (!this.reduced) this.dirt(4);
    }
    this.place();
    this.emit();
  }

  private appearStatic() {
    if (this.state !== "hidden") return;
    this.idleTotal = 0;
    this.x = rand(this.size, Math.max(this.size + 1, window.innerWidth - this.size * 2));
    this.y = this.ground;
    this.go("idle", "idle");
    this.root.classList.add("is-visible");
    this.place();
    this.emit();
  }

  private show() {
    this.root.classList.add("is-visible");
    this.last = 0;
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    this.raf = window.requestAnimationFrame(this.loop);
  }

  private hide(delay = rand(8000, 20000)) {
    this.state = "hidden";
    this.moodReactionActive = false;
    this.burrowing = false;
    this.pressId = null;
    this.gestures.cancel(performance.now());
    this.root.classList.remove("is-visible", "is-held", "is-petted", "is-bliss", "is-pinched", "is-shaken", "is-stop", "is-praised");
    this.cursorShown = "";
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("pointermove", this.onPointer);
    this.layer.querySelectorAll(".mole-fx").forEach((el) => el.remove());
    this.emit();
    if (this.enabled && !this.reduced && !this.paused) this.schedule(Math.max(delay, this.cooldownUntil - Date.now()));
  }

  // ---- the loop -------------------------------------------------------------------------------------------------
  private loop = (ts: number) => {
    const real = this.last ? Math.min(0.05, (ts - this.last) / 1000) : 0;
    this.last = ts;
    if (this.isHidden()) return;
    if (!document.hidden) this.update(real);
    if (!this.isHidden()) this.raf = window.requestAnimationFrame(this.loop);
  };

  // update() can change the state, so callers cannot rely on an earlier check.
  private isHidden() {
    return this.state === "hidden";
  }

  private go(state: MoleState, anim: AnimName) {
    this.state = state;
    this.stateT = 0;
    this.fxClock = 0;
    this.setAnim(anim);
  }

  private setAnim(anim: AnimName) {
    if (anim === this.anim && this.state !== "hidden" && this.animT > 0) return;
    this.anim = anim;
    this.animT = 0;
    this.shown = -1;
  }

  private animDone() {
    const a = ANIMS[this.anim];
    return !a.loop && this.animT * a.fps >= a.frames.length;
  }

  private draw() {
    const a = ANIMS[this.anim];
    const step = Math.floor(this.animT * a.fps);
    const index = this.reduced && a.loop ? 0 : a.loop ? step % a.frames.length : Math.min(step, a.frames.length - 1);
    const frame = a.frames[index] ?? 0;
    if (frame !== this.shown) {
      this.shown = frame;
      const col = frame % ATLAS_COLS, row = Math.floor(frame / ATLAS_COLS);
      this.sprite.style.backgroundPosition = `${-col * this.size}px ${-row * this.size}px`;
    }
  }

  private bob() {
    if (this.reduced) return 0;
    if (this.state === "joy") return this.stateT > TUNING.beat.joy[0] && this.stateT < TUNING.beat.joy[4] ? Math.sin(((this.stateT - TUNING.beat.joy[0]) / (TUNING.beat.joy[4] - TUNING.beat.joy[0])) * Math.PI) * 34 * this.scale : 0;
    if (this.state === "poke") return this.stateT < 0.2 ? Math.sin((this.stateT / 0.2) * Math.PI) * 10 * this.scale : 0;
    return 0;
  }

  // The cursor over him follows what you are doing to him, and it switches on the first movement over him.
  private cursorClass() {
    const f = this.frameState;
    if (this.state === "held" && f.shake >= 2) return "is-shaken";
    if (this.state === "stomp" || this.state === "mad" || (f.over && this.stageIndex >= 3)) return "is-stop";
    if (this.state === "look" && this.lookAnim === "excited") return "is-praised";
    if (this.state === "pinch") return "is-pinched";
    if (this.state === "pet" || this.state === "tickle") return this.mood.affectionStage === "bliss" || this.mood.affectionStage === "overjoyed" ? "is-bliss" : "is-petted";
    if (f.overHead && f.moveAgeMs < 300 && this.free && !f.pressing) return "is-petted";
    return "";
  }

  private place() {
    const cursor = this.cursorClass();
    if (cursor !== this.cursorShown) {
      this.root.classList.remove("is-petted", "is-bliss", "is-pinched", "is-shaken", "is-stop", "is-praised");
      if (cursor) this.root.classList.add(cursor);
      this.cursorShown = cursor;
    }
    const tremble = this.scared && !this.reduced && this.state === "held" ? Math.sin(performance.now() / 18) * TUNING.held.jitter * this.scale : 0;
    this.root.style.transform = `translate3d(${Math.round(this.x + tremble)}px, ${Math.round(this.y - this.bob())}px, 0)`;
    this.root.classList.toggle("is-flipped", this.facing === -1);
    this.draw();
  }

  private fxEvery(dt: number, seconds: number, task: () => void) {
    this.fxClock += dt;
    if (this.fxClock >= seconds) { this.fxClock = 0; task(); }
  }

  private update(dt: number) {
    this.animT += dt;
    this.stateT += dt;
    const sdt = dt * this.timeScale; // the mood clock
    this.mood.update(sdt);
    const now = performance.now();
    this.frameState = this.gestures.frame(now);
    if (this.state === "held" && now < this.testShakeUntil) this.frameState.shake = 2;
    this.reactToGestures(sdt);
    this.reactToMood();
    switch (this.state) {
      case "poke": this.updatePoke(); break;
      case "tickle": this.updateTickle(dt); break;
      case "pinch": this.updatePinch(dt, sdt); break;
      case "swat": if (this.animDone()) { this.fx("anger", 14, -4); if (this.stageIndex >= 3) this.go("mad", "puff"); else { this.lookAnim = "grumpy"; this.go("look", "grumpy"); } } break;
      case "annoyed": this.updateAnnoyed(dt); break;
      case "mad": this.updateMad(dt); break;
      case "sulk": this.updateSulk(dt); break;
      case "joy": this.updateJoy(dt); break;
      case "flee": this.updateFlee(dt); break;
      case "popout": this.fxEvery(dt, 0.3, () => this.dirt(2)); if (this.animDone()) this.settle(); break;
      case "peek": this.updatePeek(); break;
      case "idle": this.updateIdle(dt); break;
      case "run": this.updateRun(dt); break;
      case "look": this.updateLook(); break;
      case "sleepy": if (this.stateT > 1.8) this.go("sleep", "sleeping"); break;
      case "sleep": this.updateSleep(dt); break;
      case "dig": this.fxEvery(dt, 0.22, () => this.dirt(2)); if (this.stateT > 1.4) this.go("sink", "sink"); break;
      case "sink": if (this.animDone()) { if (this.burrowing) this.goUnder(); else this.hide(); } break;
      case "under": this.updateUnder(dt); break;
      case "held": this.updateHeld(dt, sdt); break;
      case "fall": this.updateFall(dt); break;
      case "land": this.updateLand(); break;
      case "dizzy": this.updateDizzy(); break;
      case "stand": if (this.stateT > 1.25) this.dropStomp(); break; // the full get-up from the squash, then stomp and run off
      case "pet": this.updatePet(dt, sdt); break;
      case "stomp": this.fxEvery(dt, 0.4, () => this.fx("anger", 14, -2)); if (this.stateT > TUNING.beat.stomp) { if (this.stompRuns) this.runAway(); else this.go("turnaway", "turnedAway"); } break;
      case "turnaway": if (this.stateT > TUNING.beat.turn) this.stormOff(); break;
      case "stormoff": this.updateStorm(dt); break;
      case "hidden": break;
    }
    this.place();
  }

  // The stare has three beats: suspicious, squinting, then a half-lidded side eye. Every other look is one frame.
  private updateLook() {
    if (this.lookAnim === "suspicious") this.setAnim(this.stateT < 0.8 ? "suspicious" : this.stateT < 1.6 ? "squint" : "halfLid");
    if (this.stateT > this.lookLength()) {
      if (this.dozing) { this.dozing = false; this.go("sleepy", "sleepy"); } else this.settle();
    }
  }

  private lookLength() {
    return this.lookAnim === "suspicious" ? 2.4 : this.lookAnim === "shakeNo" ? 1.6 : this.lookAnim === "startled" || this.lookAnim === "grumpy" ? TUNING.beat.wake : 1.4;
  }

  // ---- what the person is doing: gestures to reactions ------------------------------------------------------------------
  private reactToGestures(dt: number) {
    const f = this.frameState;
    // Scribbling annoys him whatever he is doing: the mood keeps moving under a sequence, it just shows when the sequence ends.
    if (f.petting === "rough" && this.state !== "held" && this.state !== "pet") this.mood.scribble(dt);
    if (!this.free || this.asleep) return;
    if (f.petting === "gentle" && this.state !== "pet" && this.stageIndex < 3) { this.petGap = 0; this.go("pet", "wiggle"); }
    if (f.pinching && this.state !== "pinch") {
      this.mood.pinchStart();
      this.facing = 1;
      this.fx("exclamation", 0, -4, 16, 700);
      this.go("pinch", "pinchSquish");
      return;
    }
    if (f.stareMs >= TUNING.stare.ms && Date.now() > this.stareCooldown && this.state !== "pet") {
      this.stareCooldown = Date.now() + TUNING.stare.cooldownMs;
      this.gestures.resetStare();
      this.lookAnim = "suspicious";
      this.go("look", "suspicious");
    }
  }

  private handleEvents(events: GestureEvent[]) {
    for (const event of events) {
      switch (event.type) {
        case "tap":
          if (this.asleep) this.wakeTap();
          else if (this.free) { this.mood.poke(); this.fx("heartSmall", rand(-10, 10), 0, 26, 1000); this.go("poke", "surprised"); }
          break;
        case "tickle":
          if (this.state === "poke" || (this.free && !this.asleep)) { this.mood.tickle(); this.go("tickle", "laugh"); }
          break;
        case "spam":
          this.mood.spam();
          break;
        case "pickup":
          this.beginHold(event.x, event.y);
          break;
        case "drop":
          if (this.state === "held") this.release(event.vx, event.vy);
          break;
        case "pinch-end":
          if (this.state === "pinch") this.endPinch();
          break;
        case "charge":
          this.maybeFlee();
          break;
      }
    }
  }

  // He reacts to how fed up he is, one stage at a time, once he is free to (a sequence in progress is never cut short).
  private reactToMood() {
    const now = this.stageIndex;
    const handled = STAGES.indexOf(this.handledStage);
    if (now === handled) return;
    if (now < handled) { this.handledStage = this.mood.irritationStage; return; }
    if (!this.canReactToMood()) return;
    const next = STAGES[handled + 1];
    if (!next) return;
    this.startMoodReaction(next);
  }

  private canReactToMood() {
    if (!this.free) return false;
    if (this.asleep) return false;
    if (this.dozing) return false;
    return !this.moodReactionActive;
  }

  private startMoodReaction(next: IrritationStage) {
    this.handledStage = next;
    this.moodReactionActive = true;
    if (next === "wary") {
      this.lookAnim = pick(["shakeNo", "worried"] as const);
      this.go("look", this.lookAnim);
      return;
    }
    if (next === "annoyed") {
      this.fx("anger", 14, -4);
      this.go("annoyed", "grumpy");
      return;
    }
    if (next === "angry") {
      this.fx("exclamation", 0, -4, 16, 700);
      this.go("mad", "puff");
      return;
    }
    if (next === "furious") {
      this.fx("anger", 14, -4);
      this.mood.stomped();
      this.go("stomp", "stomp");
    }
  }

  // ---- ordinary life --------------------------------------------------------------------------------------------
  private settle() {
    this.moodReactionActive = false;
    this.scurrying = false;
    this.dwell = rand(0.6, 2);
    this.go("idle", "idle");
  }

  private updatePeek() {
    const steps: [AnimName, number][] = [["peekUp", 0.8], ["peekLeft", 0.9], ["peekRight", 0.9], ["peekUp", 0.6]];
    const current = steps[this.peekStep];
    if (!current) {
      if (Math.random() < 0.5) { this.go("popout", "popOut"); this.dirt(4); return; }
      this.go("sink", "peekDuck");
      this.later(() => { if (this.state === "sink") this.hide(); }, 450);
      return;
    }
    this.setAnim(current[0]);
    if (this.stateT >= current[1]) { this.peekStep++; this.stateT = 0; }
  }

  // Where is the pointer around his head? Eight directions. He keeps looking the same way for a good while: it takes 0.6 s of the
  // pointer being in a new direction before his head turns, and he holds the look for at least 4 s, and until 6 s after the pointer
  // last moved. Without a mouse (touch) he never looks.
  private gaze(): AnimName | null {
    if (this.reduced) return null;
    const now = performance.now();
    const f = this.frameState;
    const dx = this.pointer.x - (this.x + this.size / 2);
    const dy = this.pointer.y - (this.y + this.size * 0.3);
    const near = Math.abs(dx) <= TUNING.gaze.rangeX && Math.abs(dy) <= TUNING.gaze.rangeY && !(Math.abs(dx) < 50 && Math.abs(dy) < 50);
    let candidate: AnimName | null = null;
    if (near) {
      const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); // 0 right, 1 down-right, 2 down, ... -1 up-right, -2 up
      const dirs: Record<number, AnimName> = { 0: "gazeRight", 1: "gazeDownRight", 2: "gazeDown", 3: "gazeDownLeft", 4: "gazeLeft", [-4]: "gazeLeft", [-3]: "gazeUpLeft", [-2]: "gazeUp", [-1]: "gazeUpRight" };
      candidate = dirs[sector] ?? null;
    }
    if (candidate) {
      if (candidate !== this.gazeCandidate) { this.gazeCandidate = candidate; this.gazeCandidateAt = now; }
      if (this.gazeNow === null || (candidate !== this.gazeNow && now - this.gazeCandidateAt >= TUNING.gaze.switchMs)) {
        this.gazeNow = candidate;
        this.gazeUntil = Math.max(now + TUNING.gaze.minHoldMs, this.gazeUntil);
      }
      const lastMove = now - f.moveAgeMs;
      this.gazeUntil = Math.max(this.gazeUntil, lastMove + TUNING.gaze.holdAfterMoveMs);
    } else {
      this.gazeCandidate = null;
    }
    if (this.gazeNow && now > this.gazeUntil && !candidate) this.gazeNow = null;
    return this.gazeNow;
  }

  private updateIdle(dt: number) {
    this.lifeLeft -= dt;
    this.idleTotal += dt;
    const gaze = this.gaze();
    if (gaze) { this.facing = 1; this.setAnim(gaze); } else this.setAnim("idle");
    // He keeps his place while a pointer is moving on him, and while he is looking at you: he does not wander off in the middle of it.
    const engaged = this.frameState.over && this.frameState.moveAgeMs < 700;
    if (this.stateT > this.dwell && !engaged && !(gaze && this.stateT < 4)) this.decide();
  }

  private decide() {
    if (this.lifeLeft <= 0) return this.leave();
    const r = Math.random();
    const centre = this.x + this.size / 2;
    const f = this.frameState;
    const lowPointer = this.pointer.y > window.innerHeight * 0.55 && this.pointer.x > 0 && Math.abs(this.pointer.x - centre) > this.size * 1.2;
    const friendly = this.mood.affectionStage !== "none";
    // Happy, he follows a pointer that is moving along the bottom of the screen and keeps a little way off it; calm, he only sometimes wanders over.
    if (lowPointer && !this.reduced && this.stageIndex === 0 && Date.now() > this.followCooldown && Math.random() < (friendly ? 0.85 : 0.35) && f.moveAgeMs < 8000) {
      const side = this.pointer.x > centre ? -1 : 1;
      this.target = Math.min(window.innerWidth - this.size - this.size * 0.2, Math.max(this.size * 0.2, this.pointer.x + side * rand(100, 200) - this.size / 2));
      this.facing = this.target < this.x ? -1 : 1;
      this.sniffAfter = !friendly;
      this.followCooldown = Date.now() + (friendly ? 2000 : 12000);
      return this.go("run", "run");
    }
    if (f.moveAgeMs > TUNING.sleep.quietMs && this.idleTotal > 8 && r < TUNING.sleep.chance) { this.dozing = false; this.wakeTaps = 0; return this.go("sleepy", "sleepy"); }
    if (r < 0.22 && !this.reduced) return this.burrow();
    if (r < 0.8 && !this.reduced) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      const margin = this.size * 0.2;
      this.target = Math.min(window.innerWidth - this.size - margin, Math.max(margin, this.x + dir * rand(220, 700)));
      this.facing = this.target < this.x ? -1 : 1;
      return this.go("run", "run");
    }
    if (r < 0.9) { this.lookAnim = pick(this.idleTotal > 8 ? ["sniff", "lookUp", "lookBack", "yawn", "smug", "mischievous", "bored", "bored", "shrug", "lookTilt", "glance"] as const : ["sniff", "lookUp", "lookBack", "yawn", "smug", "mischievous", "shrug", "lookTilt", "glance"] as const); this.go("look", this.lookAnim); return; }
    this.dwell = rand(1.4, 3.4);
    this.stateT = 0;
  }

  private updateRun(dt: number) {
    this.lifeLeft -= dt;
    const dir = Math.sign(this.target - this.x);
    this.facing = dir < 0 ? -1 : 1;
    const step = TUNING.run.speed * (this.scurrying ? TUNING.run.scurry : 1) * this.scale * dt;
    const arrived = Math.abs(this.target - this.x) <= Math.max(3, step);
    this.x = arrived ? this.target : this.x + dir * step;
    if (arrived) {
      if (this.sniffAfter) { this.sniffAfter = false; this.lookAnim = "sniff"; this.go("look", "sniff"); } else this.settle();
    }
  }

  private updateSleep(dt: number) {
    this.fxEvery(dt, 1.5, () => this.fx("zzz", 18, -6, 20, 1400));
    if (this.stateT > TUNING.sleep.naturalWake) { this.dozing = false; this.lookAnim = "yawn"; this.go("look", "yawn"); }
  }

  // A tap on a sleeper climbs a ladder (taps within 10 s of each other): 1 startled, and he drops off again; 2 grumpy, and he
  // drops off again; 3 angry, and awake. Each tap also annoys him a little.
  private wakeTap() {
    const now = Date.now();
    this.wakeTaps = now - this.lastWakeTap < TUNING.sleep.wakeWindowMs ? this.wakeTaps + 1 : 1;
    this.lastWakeTap = now;
    this.mood.woken();
    this.fx("exclamation", 0, -8);
    if (this.wakeTaps === 1) { this.dozing = true; this.lookAnim = "startled"; this.go("look", "startled"); }
    else if (this.wakeTaps === 2) { this.dozing = true; this.fx("anger", 14, -4); this.lookAnim = "grumpy"; this.go("look", "grumpy"); }
    else { this.dozing = false; this.handledStage = this.mood.irritationStage; this.go("mad", "puff"); }
  }

  // Digs down and comes up somewhere else along the bottom of the screen, leaving a trail of soil underground.
  private burrow() {
    this.burrowing = true;
    this.go("dig", "dig");
    this.dirt(3);
  }

  private goUnder() {
    const margin = this.size * 0.2;
    const room = window.innerWidth - this.size - margin;
    let next = rand(margin, Math.max(margin + 1, room));
    if (Math.abs(next - this.x) < this.size * 2) next = this.x < window.innerWidth / 2 ? Math.min(room, this.x + this.size * 3) : Math.max(margin, this.x - this.size * 3);
    this.target = next;
    this.burrowing = false;
    this.go("under", "idle");
    this.root.classList.remove("is-visible");
    this.dirt(2);
  }

  private updateUnder(dt: number) {
    const dir = Math.sign(this.target - this.x);
    this.x += dir * TUNING.run.burrow * this.scale * dt;
    this.fxEvery(dt, 0.14, () => this.dirt(1));
    if (Math.abs(this.target - this.x) < 6 || this.stateT > 6) {
      this.facing = Math.random() < 0.5 ? 1 : -1;
      this.root.classList.add("is-visible");
      this.go("popout", "popOut");
      this.dirt(4);
    }
  }

  private leave() {
    this.go("dig", Math.random() < 0.5 ? "digSide" : "dig");
    this.dirt(3);
  }

  // ---- poke and tickle ---------------------------------------------------------------------------------------------
  // A poke is a small surprised hop and a smug look. A tickle is a laugh for a second and a half. Both play to their end.
  private updatePoke() {
    this.setAnim(this.stateT < TUNING.beat.poke ? "surprised" : "smug");
    if (this.stateT > TUNING.beat.poke * 2) this.settle();
  }

  private updateTickle(dt: number) {
    this.setAnim(Math.floor(this.stateT * 3) % 3 === 2 ? "laughEyes" : "laugh");
    this.fxEvery(dt, 0.5, () => this.fx("heartSmall", rand(-14, 14), 0, 26, 1000));
    if (this.stateT > 1.5) { this.lookAnim = "excited"; this.go("look", "excited"); }
  }

  // ---- being petted -----------------------------------------------------------------------------------------------
  // While the pointer strokes him gently he enjoys it a little more every few seconds. When it stops he is proud for a moment.
  private updatePet(dt: number, sdt: number) {
    const f = this.frameState;
    if (this.stageIndex >= 3) { this.lastPetStage = "none"; this.settle(); return; }
    if (f.petting === "gentle") {
      this.petGap = 0;
      this.mood.pet(sdt);
      if (this.mood.enough) this.mood.tiredOfPetting(sdt);
    } else {
      this.petGap += dt;
      if (f.petting === "rough") this.mood.scribble(sdt);
    }
    const stage = this.mood.affectionStage;
    if (stage === "overjoyed" && this.lastPetStage !== "overjoyed") { this.lastPetStage = stage; this.mood.joy(); this.go("joy", "joyCrouch"); return; }
    this.lastPetStage = stage;
    if (this.stageIndex >= 2) {
      this.setAnim("grumpy");
      this.fxEvery(dt, 1.2, () => this.fx("anger", 14, -4));
    } else if (stage === "bliss" || stage === "overjoyed") {
      const cycle = stage === "overjoyed" ? (["blissful", "blush", "laugh"] as const) : (["blissful", "content", "laugh"] as const);
      this.setAnim(cycle[Math.floor(this.stateT * 1.3) % 3] as AnimName);
      this.fxEvery(dt, 0.8, () => this.fx("heartBig", rand(-10, 10), -2, 30, 1100));
    } else {
      this.setAnim("wiggle");
      this.fxEvery(dt, 0.8, () => this.fx("heartSmall", rand(-14, 14), 0, 26, 1000));
    }
    if (this.petGap > 1.2) { this.lastPetStage = "none"; this.lookAnim = stage === "bliss" || stage === "overjoyed" ? pick(["proud", "shy", "blush"] as const) : pick(["smug", "proud"] as const); this.go("look", this.lookAnim); }
  }

  // ---- fed up -------------------------------------------------------------------------------------------------------
  // Annoyed: an anger mark, a pause, then he shuffles off a little way from the pointer.
  private updateAnnoyed(dt: number) {
    this.setAnim("grumpy");
    this.fxEvery(dt, 0.7, () => this.fx("anger", 14, -4));
    if (this.stateT < 1.2) return;
    const away = this.pointer.x > this.x + this.size / 2 ? -1 : 1;
    const margin = this.size * 0.2;
    this.target = Math.min(window.innerWidth - this.size - margin, Math.max(margin, this.x + away * 150 * this.scale));
    this.facing = this.target < this.x ? -1 : 1;
    this.go("run", "run");
  }

  private updateMad(dt: number) {
    this.setAnim((["puff", "facepalm", "furious"] as const)[Math.floor(this.stateT / TUNING.beat.madBeat) % 3] as AnimName);
    this.fxEvery(dt, 0.5, () => this.fx("anger", 14, -4));
    if (this.stateT > TUNING.beat.mad) {
      this.facing = this.pointer.x > this.x + this.size / 2 ? -1 : 1;
      this.go("sulk", "grumpy");
    }
  }

  private updateSulk(dt: number) {
    this.setAnim("grumpy");
    this.fxEvery(dt, 1.3, () => this.fx("anger", 14, -4));
    if (this.stateT < 3.6) return;
    this.dizzyHeld = false;
    if (this.stageIndex >= 4) { this.handledStage = this.mood.irritationStage; this.fx("anger", 14, -4); this.mood.stomped(); this.go("stomp", "stomp"); }
    else this.settle();
  }

  // After a fall and getting up, whichever recovery it was, he is cross about it: he stomps, then runs a good way along the
  // bottom, away from the pointer, and carries on. (A real storm-off, off the screen, is only for when he is furious.)
  private dropStomp() {
    this.stompRuns = true;
    this.fx("anger", 14, -4);
    this.go("stomp", "stomp");
  }

  private runAway() {
    this.stompRuns = false;
    const margin = this.size * 0.2;
    const left = margin, right = window.innerWidth - this.size - margin;
    let dir = this.pointer.x > this.x + this.size / 2 ? -1 : 1;
    let target = this.x + dir * rand(350, 650) * this.scale;
    if (target < left || target > right) { dir = -dir; target = this.x + dir * rand(350, 650) * this.scale; }
    this.target = Math.min(right, Math.max(left, target));
    this.facing = this.target < this.x ? -1 : 1;
    this.scurrying = true;
    this.go("run", "scurry");
  }

  private stormOff() {
    this.stompRuns = false;
    const centre = this.x + this.size / 2;
    const dir = this.pointer.x > centre ? -1 : 1;
    this.facing = dir < 0 ? -1 : 1;
    this.cooldownUntil = Date.now() + 60000;
    this.mood.stormedOff();
    this.go("stormoff", "stormOff");
  }

  private updateStorm(dt: number) {
    this.x += this.facing * TUNING.run.storm * this.scale * dt;
    if (this.x < -this.size * 1.1 || this.x > window.innerWidth + this.size * 0.1) this.hide(rand(60000, 100000));
  }

  // ---- pinching and running away -------------------------------------------------------------------------------------
  // Pressing on him without moving is a pinch: ow, the cheek stretches and squishes, and the longer you go on the more fed up he gets.
  private updatePinch(dt: number, sdt: number) {
    this.mood.pinch(sdt);
    const t = this.stateT;
    const [squish, ow] = TUNING.beat.pinch as readonly [number, number];
    this.setAnim(t < squish ? "pinchSquish" : t < ow ? "ow" : Math.floor((t - ow) / 0.8) % 2 === 0 ? "pinchStretch" : "pinchSquish");
    this.fxEvery(dt, 0.9, () => this.fx(this.stageIndex >= 2 ? "anger" : "sweat", 22, 2, 14, 800));
    if (!this.frameState.pressing) this.settle();
  }

  private endPinch() {
    if (this.stageIndex >= 4) { this.fx("anger", 14, -4); this.mood.stomped(); this.go("stomp", "stomp"); return; }
    if (this.stageIndex >= 3 || this.stateT >= 1.2) { this.fx("exclamation", 0, -4, 16, 600); this.go("swat", "swat"); return; }
    this.lookAnim = "pinchRub";
    this.go("look", "pinchRub");
  }

  // A pointer that charges at him makes him run, for a moment, and he sticks his tongue out. It is a game: nothing is held against you.
  private maybeFlee() {
    if (this.reduced || !this.free || this.asleep || this.state === "pet") return;
    const dx = this.pointer.x - (this.x + this.size / 2);
    this.facing = dx > 0 ? -1 : 1;
    this.fx("exclamation", 0, -4, 16, 600);
    this.go("flee", "flinch");
  }

  private updateFlee(dt: number) {
    this.setAnim(this.stateT < TUNING.flee.flinch ? "flinch" : "scurry");
    if (this.stateT < TUNING.flee.flinch) return;
    const room = window.innerWidth - this.size - this.size * 0.2;
    this.x = Math.min(room, Math.max(this.size * 0.2, this.x + this.facing * TUNING.run.flee * this.scale * dt));
    if (this.stateT > TUNING.flee.total || this.x <= this.size * 0.2 || this.x >= room) this.settle();
  }

  // ---- being picked up --------------------------------------------------------------------------------------------
  private beginHold(px: number, py: number) {
    this.state = "held";
    this.stateT = 0;
    this.heldFor = 0;
    this.strongFor = 0;
    this.violentFor = 0;
    this.dizzyHeld = false;
    this.burrowing = false;
    this.stompRuns = false;
    this.dozing = false;
    this.wakeTaps = 0;
    this.lastX = px - this.size / 2;
    const irritation = this.mood.irritation;
    this.amused = this.mood.grudge || irritation >= 40 ? 0 : irritation >= 20 ? TUNING.held.amusedWary : TUNING.held.amused;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.setAnim("yelp");
    this.root.classList.add("is-held");
    this.hold(px, py);
    this.fx("exclamation", 0, -4, 16, 700);
  }

  private hold(px: number, py: number) {
    this.x = Math.min(window.innerWidth - this.size / 2, Math.max(-this.size / 2, px - this.size / 2));
    this.y = Math.min(window.innerHeight - this.size / 3, Math.max(-this.size / 3, py - 6 * this.scale));
  }

  // Held: amused at first (he hangs there with sparkles, more if you swing him), then confused, then he struggles, then he gets angry,
  // then he is tired, then limp. Shaking hard makes him queasy and then dizzy; the more fed up he already is, the sooner the fun stops.
  private updateHeld(dt: number, sdt: number) {
    this.heldFor += sdt;
    this.vx = this.vx * 0.6 + ((this.x - this.lastX) / Math.max(dt, 0.008)) * 0.4;
    this.lastX = this.x;
    const level = this.frameState.shake;
    this.strongFor = level >= 2 ? this.strongFor + sdt : Math.max(0, this.strongFor - sdt);
    this.violentFor = level >= 3 ? this.violentFor + sdt : Math.max(0, this.violentFor - sdt);
    if (level >= 1) this.mood.shaken(level as 1 | 2 | 3, sdt);
    const t = this.heldFor;
    const a = this.amused;
    const confused = a > 0 ? TUNING.held.confused : TUNING.held.confusedShort;
    const struggleEnd = a + confused + TUNING.held.struggle;
    const angryEnd = struggleEnd + TUNING.held.angry;
    const dangle = this.vx > 140 ? "dangleLeft" : this.vx < -140 ? "dangleRight" : "dangle";
    // Shaken, or swung hard, he is scared at once: panic arms, a "!", sweat, and he trembles. It stops when the pointer calms down.
    this.scared = level >= 1 || this.frameState.speed > TUNING.held.scaredSpeed;
    this.scaredFor = this.scared ? this.scaredFor + dt : 0;
    if (this.violentFor >= 3) {
      this.dizzyHeld = true;
      this.setAnim("dizzy");
    } else if (this.strongFor >= TUNING.held.queasyAfter) {
      this.setAnim("queasy");
      this.fxEvery(dt, 0.9, () => this.fx("sweat", 24, 4, 16, 900));
    } else if (this.scared) {
      // A yelp the moment it starts, then he is flung about with the pointer: the pose follows which way he is being swung
      // (left, right), and flails when he is swung slowly. Shaken, the swing flips every few frames, so he looks hectic.
      this.setAnim(this.scaredFor < TUNING.held.yelpFor ? "yelp" : this.vx > TUNING.held.swingSpeed ? "dangleLeft" : this.vx < -TUNING.held.swingSpeed ? "dangleRight" : "struggle");
      this.fxEvery(dt, 0.5, () => this.fx(Math.random() < 0.5 ? "exclamation" : "sweat", rand(-14, 14), -4, 16, 600));
    } else if (t < TUNING.held.yelpFor + 0.2) {
      this.setAnim(t < TUNING.held.yelpFor ? "yelp" : "grabbed");
    } else if (t < a + 0.35) {
      this.setAnim(dangle);
      this.fxEvery(dt, level >= 1 ? 0.35 : 0.7, () => this.fx("sparkle", rand(-14, 14), -4, 20, 700));
    } else if (t < a + 0.35 + confused) {
      this.setAnim(dangle);
      this.fxEvery(dt, 1.2, () => this.fx("question", 8, -6, 18, 900));
    } else if (t < struggleEnd) {
      this.mood.struggling(sdt);
      this.setAnim("struggle");
      this.fxEvery(dt, 1.3, () => this.fx("sweat", 26, 4, 16, 900));
    } else if (t < angryEnd) {
      this.mood.angryHeld(sdt);
      this.setAnim("struggle");
      this.fxEvery(dt, 0.8, () => this.fx("anger", 14, -4));
    } else if (t < angryEnd + TUNING.held.tired) {
      this.setAnim("tired");
      this.fxEvery(dt, 1.1, () => this.fx("sweat", 24, 6, 16, 900));
    } else {
      this.setAnim("giveUp");
    }
  }

  private releaseIfHeld(vx: number, vy: number) {
    if (this.state === "held") this.release(vx, vy);
  }

  private release(vx: number, vy: number) {
    this.root.classList.remove("is-held");
    this.scared = false;
    this.fallFrom = this.y;
    this.bigFall = false;
    this.bounces = 0;
    const speed = Math.hypot(vx, vy);
    const thrown = speed > TUNING.throwSpeed;
    this.thrownFall = thrown;
    this.vx = Math.max(-1800, Math.min(1800, vx)) * (thrown ? 1 : 0.4);
    this.vy = thrown ? Math.max(-1800, Math.min(1800, vy)) : Math.max(0, Math.min(vy, 600));
    const shaken = this.violentFor > 0 || this.strongFor > 1.5;
    if (shaken) this.mood.droppedAfterShake();
    const gentle = this.heldFor < this.amused + 1.6;
    this.afterDrop = shaken || this.mood.irritation >= TUNING.irritation.angry ? "mad" : gentle && this.mood.irritation < 25 && (this.mood.affectionStage === "bliss" || this.mood.affectionStage === "overjoyed") ? "joy" : "normal";
    this.go("fall", thrown && !shaken && this.mood.irritation < 25 ? "fallCheer" : "falling");
    if (this.reduced) { this.y = this.ground; this.go("idle", "idle"); }
  }

  private updateFall(dt: number) {
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    this.x += this.vx * dt;
    this.vx *= Math.pow(0.35, dt);
    // The side walls: a hard throw bounces off them at half the speed.
    const left = -this.size / 2, right = window.innerWidth - this.size / 2;
    if (this.x < left) { this.x = left; this.vx = Math.abs(this.vx) * 0.5; }
    else if (this.x > right) { this.x = right; this.vx = -Math.abs(this.vx) * 0.5; }
    if (this.y < this.ground) return;
    this.y = this.ground;
    this.bigFall = this.bigFall || this.vy > 1500 || this.y - this.fallFrom > 420;
    this.dust();
    if (this.thrownFall && this.vy > TUNING.bounce.minSpeed && this.bounces < TUNING.bounce.max) {
      this.vy = -this.vy * TUNING.bounce.keep;
      this.bounces++;
      return;
    }
    this.vx = 0;
    this.go("land", this.bigFall ? "splat" : "landSquash");
  }

  // Lands in one squash, and then goes straight into what comes next. A bounce back up and a second squash looked like standing up
  // twice before the real standing up, so there is only one landing beat; a thrown Orry really bounces (see updateFall).
  private updateLand() {
    if (this.bigFall) {
      const [flat, impact, squash] = TUNING.beat.landBig;
      this.setAnim(this.stateT < (flat as number) ? "splat" : this.stateT < (impact as number) ? "impact" : "landSquash");
      if (this.stateT > (squash as number)) this.afterLanding();
      return;
    }
    this.setAnim("landSquash");
    if (this.stateT > TUNING.beat.landShort) this.afterLanding();
  }

  // A hard fall or a violent shaking leaves him dazed; a gentle carry makes him hop for joy; being fed up makes him puff and sulk.
  private afterLanding() {
    // The drop decides how he reacts (dazed, joy, mad, or just standing up), so the mood system must not react to the same
    // irritation a second time once he is free: without this he went mad, sulked, then went mad again.
    this.handledStage = this.mood.irritationStage;
    if (this.bigFall || this.dizzyHeld) { this.go("dizzy", "dazed"); return; }
    if (this.afterDrop === "joy") { this.mood.joy(); this.go("joy", "joyCrouch"); return; }
    if (this.afterDrop === "mad") { this.go("mad", "puff"); return; }
    this.go("stand", "getUp");
  }

  private updateJoy(dt: number) {
    const t = this.stateT;
    const [crouch, launch, kickA, pop, kickB, soft, cheer] = TUNING.beat.joy as readonly number[];
    this.setAnim(t < crouch! ? "joyCrouch" : t < launch! ? "joyLaunch" : t < kickA! ? "joyKickA" : t < pop! ? "helmetPop" : t < kickB! ? "joyKickB" : t < soft! ? "joySoft" : "cheer");
    if (t > soft!) this.fxEvery(dt, 0.45, () => this.fx("heartSmall", rand(-12, 12), 0, 26, 1000));
    if (t > cheer!) { this.lookAnim = "excited"; this.go("look", "excited"); }
  }

  // After a hard fall or a shaking: he sways with stars going round, shakes his head, rubs the bump
  // and gets up in three steps. Each beat plays once: the spiral-eyed dazed look is only the first. If he has had enough he gets angry as soon as his head clears.
  private updateDizzy() {
    const t = this.stateT;
    const mad = this.afterDrop === "mad" || this.mood.irritation >= TUNING.irritation.angry;
    const [dazed, shake, rub, up] = TUNING.beat.dazed as readonly number[];
    if (t < dazed!) this.setAnim("dazed");
    else if (t < shake!) this.setAnim("dazedShake");
    else if (mad) { this.dizzyHeld = false; this.handledStage = this.mood.irritationStage; this.go("mad", "puff"); }
    else if (t < rub!) this.setAnim("rubHead");
    else if (t < up!) this.setAnim("getUp");
    else { this.dizzyHeld = false; this.dropStomp(); }
  }

  // ---- effects --------------------------------------------------------------------------------------------------
  private fxElement(name: FxName) {
    const el = document.createElement("span");
    el.className = "mole-fx";
    this.paintFx(el, FX[name]);
    this.layer.appendChild(el);
    return el;
  }

  private paintFx(el: HTMLElement, index: number) {
    const col = index % FX_COLS, row = Math.floor(index / FX_COLS);
    el.style.backgroundPosition = `${-col * FX_SIZE * this.scale}px ${-row * FX_SIZE * this.scale}px`;
  }

  // The marks that carry meaning (hearts, anger, question marks) are rationed: at most six on screen at once.
  private fx(name: FxName, dx: number, dy: number, rise = 24, ms = 900) {
    if (this.layer.querySelectorAll(".mole-fx").length >= 6) return;
    const el = this.fxElement(name);
    el.style.left = `${this.x + this.size / 2 - (FX_SIZE * this.scale) / 2 + dx * this.scale}px`;
    el.style.top = `${this.y + dy * this.scale}px`;
    if (this.reduced || !el.animate) return void this.later(() => el.remove(), ms);
    el.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: `translateY(${-rise * this.scale}px)`, opacity: 0 }], { duration: ms, easing: "cubic-bezier(.23, 1, .32, 1)" }).onfinish = () => el.remove();
  }

  private dust() {
    for (const side of [-1, 1]) {
      const el = this.fxElement("dust1");
      el.style.left = `${this.x + this.size / 2 - (FX_SIZE * this.scale) / 2 + side * 20 * this.scale}px`;
      el.style.top = `${this.y + (FEET - FX_SIZE + 4) * this.scale}px`;
      (["dust2", "dust3"] as const).forEach((name, i) => this.later(() => this.paintFx(el, FX[name]), 110 * (i + 1)));
      this.later(() => el.remove(), 380);
    }
  }

  private dirt(count: number) {
    for (let i = 0; i < count; i++) {
      const name = pick(["dirt1", "dirt2", "dirt3"] as const);
      const el = this.fxElement(name);
      const dx = rand(-26, 26);
      el.style.left = `${this.x + this.size / 2 - (FX_SIZE * this.scale) / 2 + dx * this.scale}px`;
      el.style.top = `${this.y + (FEET - FX_SIZE + 2) * this.scale}px`;
      if (this.reduced || !el.animate) { this.later(() => el.remove(), 500); continue; }
      const hop = rand(18, 40) * this.scale;
      el.animate([{ transform: "translate(0, 0)", opacity: 1 }, { transform: `translate(${dx * 0.6 * this.scale}px, ${-hop}px)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx * 1.1 * this.scale}px, 0)`, opacity: 0 }], { duration: rand(450, 700), easing: "ease-out" }).onfinish = () => el.remove();
    }
  }

  // ---- the pointer ------------------------------------------------------------------------------------------------
  // Only real movements of the pointer reach the gesture tracker (a pointer that sits still sends nothing, even when he runs under it).
  private onPointer = (event: PointerEvent) => {
    this.pointer = { x: event.clientX, y: event.clientY };
    this.handleEvents(this.gestures.move(event.timeStamp, event.clientX, event.clientY));
    if (this.state === "held") this.hold(event.clientX, event.clientY);
  };

  private onDown = (event: PointerEvent) => {
    if (this.state === "hidden" || this.state === "sink" || this.state === "popout" || this.state === "under" || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (!this.gestures.down(event.timeStamp, event.clientX, event.clientY, event.pointerType === "touch")) return;
    event.preventDefault();
    this.pointer = { x: event.clientX, y: event.clientY };
    this.pressId = event.pointerId;
    this.root.setPointerCapture(event.pointerId);
  };

  private onUp = (event: PointerEvent) => {
    if (this.pressId !== event.pointerId) return;
    this.pressId = null;
    if (this.root.hasPointerCapture(event.pointerId)) this.root.releasePointerCapture(event.pointerId);
    this.handleEvents(this.gestures.up(event.timeStamp));
  };

  private onCancel = (event: PointerEvent) => {
    if (this.pressId !== event.pointerId) return;
    this.pressId = null;
    this.handleEvents(this.gestures.cancel(event.timeStamp));
  };

  // ---- the page around him --------------------------------------------------------------------------------------
  private onResize = () => {
    this.applyScale();
    if (!["held", "fall", "hidden"].includes(this.state)) this.y = this.ground;
    this.x = Math.max(0, Math.min(this.x, window.innerWidth - this.size));
    if (this.state !== "hidden") this.place();
  };

  private onVisibility = () => {
    if (!document.hidden && this.state !== "hidden") this.last = 0;
  };

  private onCommand = (event: Event) => {
    const command = (event as CustomEvent<MoleCommand>).detail;
    if (command === "hide") {
      this.enabled = false;
      this.store("off");
      this.timers.forEach((id) => window.clearTimeout(id));
      this.timers = [];
      this.burrowing = false;
      if (this.state === "under") this.hide();
      else if (this.state !== "hidden") {
        this.pressId = null;
        this.gestures.cancel(performance.now());
        this.root.classList.remove("is-held");
        if (this.paused || this.reduced) this.hide();
        else this.go("sink", "sink");
      }
      this.emit();
    } else if (command === "show") {
      this.enabled = true;
      this.store(null);
      if (this.state === "hidden") {
        if (this.paused) this.appearStatic();
        else if (!this.reduced) this.schedule(2500);
      }
      this.emit();
    } else if (command === "status") {
      this.emit();
    } else if (command === "call") {
      this.enabled = true;
      this.store(null);
      if (this.paused) {
        if (this.state === "hidden") this.appearStatic();
        else {
          this.go("idle", "idle");
          this.place();
          this.emit();
        }
      } else this.appear("pop", true);
    } else if (command === "pet" || command === "move-left" || command === "move-right") {
      if (!this.enabled || this.state === "hidden") return;
      this.pressId = null;
      this.gestures.cancel(performance.now());
      this.root.classList.remove("is-held");
      if (command === "pet") {
        this.mood.pet(2);
        this.lookAnim = "excited";
        this.go("look", "excited");
      } else {
        const direction = command === "move-left" ? -1 : 1;
        this.x = Math.max(0, Math.min(window.innerWidth - this.size, this.x + direction * 80));
        this.y = this.ground;
        this.facing = direction;
        this.settle();
      }
      this.place();
      this.emit();
    }
  };

  private store(value: "off" | null) {
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage can be blocked; the choice then lasts for this visit only */
    }
  }
}
