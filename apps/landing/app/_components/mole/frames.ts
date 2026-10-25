// Which atlas frames make up each animation (.ulpi/design/mole-record.md). The mole atlas (public/loadout/mole/mole.png) holds twelve
// sheets of 16 frames in a row of 10 columns: A moving, B expressions, C dig and peek, D picked up, E petted, G reactions,
// H walk and run cycles, I idle, jump, fall and landing, J a second walk (8 frames, half a sheet, not used now that he runs), K looking in 8 directions and more moods, L falling, landing, jumping for joy and being pinched, M dazed and confused after a fall and getting back up. Frame numbers
// below are the 1-based numbers inside a sheet. The effects atlas (fx.png) holds 19 frames of 32 px in 8 columns.
export const FRAME = 64; // px of one mole frame
export const ATLAS_COLS = 10;
export const ATLAS_ROWS = 20;
export const FEET = 60; // the mole's feet end on this row of the 64 px frame
export const FX_SIZE = 32;
export const FX_COLS = 8;
export const FX_ROWS = 3;

const SHEETS = ["A", "B", "C", "D", "E", "G", "H", "I", "J", "K", "L", "M"] as const;
type Sheet = (typeof SHEETS)[number];
const f = (sheet: Sheet, number: number) => SHEETS.indexOf(sheet) * 16 + (number - 1);
const run = (sheet: Sheet, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => f(sheet, from + i));

export type Anim = { frames: number[]; fps: number; loop: boolean };
const anim = (frames: number[], fps: number, loop = true): Anim => ({ frames, fps, loop });

export const ANIMS = {
  idle: anim(run("I", 1, 6), 4),
  run: anim(run("H", 9, 14), 12),
  sniff: anim([f("A", 13)], 1, false),
  lookUp: anim([f("A", 14)], 1, false),
  yawn: anim([f("A", 15)], 1, false),
  lookBack: anim([f("A", 16)], 1, false),
  surprised: anim([f("B", 5)], 1, false),
  sleepy: anim([f("B", 7)], 1, false),
  sleeping: anim([f("B", 8)], 1, false),
  smug: anim([f("B", 15)], 1, false),
  dig: anim(run("C", 1, 4), 8),
  sink: anim(run("C", 5, 8), 6, false),
  popOut: anim(run("C", 9, 12), 6, false),
  peekUp: anim([f("C", 13)], 1, false),
  peekLeft: anim([f("C", 14)], 1, false),
  peekRight: anim([f("C", 15)], 1, false),
  peekDuck: anim([f("C", 16)], 1, false),
  grabbed: anim([f("D", 1)], 1, false),
  dangleLeft: anim([f("D", 2)], 1, false),
  dangle: anim([f("D", 3)], 1, false),
  dangleRight: anim([f("D", 4)], 1, false),
  struggle: anim(run("D", 5, 8), 10),
  tired: anim([f("D", 9)], 1, false),
  giveUp: anim([f("D", 10)], 1, false),
  falling: anim(run("L", 1, 4), 8),
  landSquash: anim([f("L", 5)], 1, false),
  dizzy: anim([f("L", 8)], 1, false),
  wiggle: anim(run("E", 2, 5), 6),
  blissful: anim(run("E", 6, 7), 3),
  shakeNo: anim([f("E", 10)], 1, false),
  puff: anim([f("E", 11)], 1, false),
  stomp: anim(run("E", 12, 13), 6),
  stormOff: anim(run("E", 15, 16), 8),
  laugh: anim(run("G", 1, 4), 9),
  ow: anim([f("L", 13)], 1, false),
  pinchStretch: anim([f("L", 14)], 1, false),
  pinchSquish: anim([f("L", 15)], 1, false),
  pinchRub: anim([f("L", 16)], 1, false),
  gazeLeft: anim([f("K", 1)], 1, false),
  gazeUpLeft: anim([f("K", 2)], 1, false),
  gazeUp: anim([f("K", 3)], 1, false),
  gazeUpRight: anim([f("K", 4)], 1, false),
  gazeRight: anim([f("K", 5)], 1, false),
  gazeDownRight: anim([f("K", 6)], 1, false),
  gazeDown: anim([f("K", 7)], 1, false),
  gazeDownLeft: anim([f("K", 8)], 1, false),
  excited: anim([f("K", 9)], 1, false),
  proud: anim([f("K", 10)], 1, false),
  suspicious: anim([f("K", 12)], 1, false),
  mischievous: anim([f("K", 14)], 1, false),
  bored: anim([f("K", 15)], 1, false),
  joyCrouch: anim([f("I", 9)], 1, false),
  joyLaunch: anim([f("L", 9)], 1, false),
  joyKickA: anim([f("L", 10)], 1, false),
  joyKickB: anim([f("L", 11)], 1, false),
  joySoft: anim([f("L", 12)], 1, false),
  swat: anim(run("G", 13, 15), 5, false),
  queasy: anim([f("G", 16)], 1, false),
  dazed: anim(run("M", 1, 4), 4),
  dazedShake: anim(run("M", 5, 6), 6),
  rubHead: anim(run("M", 7, 8), 3),
  getUp: anim([f("D", 15), ...run("M", 13, 15)], 3.3, false), // the stand-up pose first, then M13 to M15 (M16 is not used: the stomp follows at once)
  // Frames that were drawn but unused until 2026-10-16 (see .ulpi/design/mole-record.md, "Spare frames").
  turnedAway: anim([f("E", 14)], 1, false), // his back to you: sulking
  grumpy: anim([f("B", 10)], 1, false), // brows down: the end of a sulk
  furious: anim([f("B", 11)], 1, false), // gritted teeth: the third beat of mad
  worried: anim([f("B", 12)], 1, false), // wary
  content: anim([f("B", 4)], 1, false), // petted: eyes closed, a small smile
  blush: anim([f("B", 14)], 1, false), // petted a lot: blushing
  shy: anim([f("K", 13)], 1, false), // fingers together, after being petted
  laughEyes: anim([f("B", 3)], 1, false), // laughing eyes, in a tickle
  squint: anim([f("B", 16)], 1, false), // the stare, second beat
  halfLid: anim([f("G", 11)], 1, false), // the stare, third beat
  facepalm: anim(run("G", 5, 6), 4), // ugh, when annoyed
  shrug: anim([f("I", 12)], 1, false), // an idle fidget
  cheer: anim([f("G", 12), f("I", 7), f("I", 10), f("I", 11)], 6), // arms up, after a hop for joy
  helmetPop: anim([f("I", 8)], 1, false), // his helmet lifts at the top of the hop
  startled: anim([f("I", 14)], 1, false), // woken up, or noticing you
  flinch: anim([f("I", 13)], 1, false), // ducks when you charge at him
  yelp: anim([f("D", 11)], 1, false), // the moment he is picked up
  impact: anim([f("L", 7)], 1, false), // a hard landing
  splat: anim([f("D", 12)], 1, false), // flat on the ground after a big fall
  fallCheer: anim([f("L", 6)], 1, false), // thrown, arms up
  digSide: anim(run("I", 15, 16), 8), // digging sideways, dirt flying
  scurry: anim(run("A", 9, 12), 12), // leaning forward, fast: the flee and the run away after a fall
  lookTilt: anim([f("B", 13)], 1, false), // head turned, a short look
  glance: anim([f("G", 7), f("G", 8)], 2), // looks one way, then the other
} satisfies Record<string, Anim>;
export type AnimName = keyof typeof ANIMS;

// Effects, by their place in fx.png.
export const FX = {
  heartSmall: 0,
  heartBig: 1,
  sweat: 2,
  anger: 3,
  zzz: 4,
  exclamation: 5,
  question: 6,
  sparkle: 7,
  star1: 8,
  star2: 9,
  dust1: 10,
  dust2: 11,
  dust3: 12,
  dirt1: 13,
  dirt2: 14,
  dirt3: 15,
} as const;
export type FxName = keyof typeof FX;
