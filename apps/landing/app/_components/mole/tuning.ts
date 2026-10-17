// Every number that decides how Orry reacts, in one place (.ulpi/design/mole-behaviour.md). Times are in milliseconds for the
// gesture classifier (it reads real pointer timestamps) and in seconds for the mood and the sequences (they run on the engine
// clock, which a test can speed up). Change pacing here, not in the code that uses it.
export const TUNING = {
  // The body box that counts as "on him": the middle share of the frame's width, from just under the helmet top to the feet.
  hit: { widthShare: 0.7, topShare: 0.12 },
  // Petting only counts on his head and helmet: the upper part of the frame, a little narrower than the body.
  head: { widthShare: 0.55, topShare: 0.06, heightShare: 0.42 },
  tap: { maxMs: 250, maxMove: 6, tickleMs: 400, tickleThreeMs: 1000, spamMs: 1500, spamCount: 4 },
  // Petting is slow movement inside the body box. Speeds are pixels a second, measured over the last windowMs.
  pet: { minSpeed: 80, maxSpeed: 700, minTravel: 60, minMs: 350, windowMs: 700, stopMs: 300 },
  rough: { speed: 1000, wiggleRatio: 5, wiggleSpeed: 600, minMs: 200 },
  pinch: { holdMs: 500 },
  pickUp: { mouse: 8, touch: 12 },
  shake: { windowMs: 1200, minSpeed: 500, minGapMs: 120, light: 3, strong: 6, violent: 9 },
  charge: { speed: 1600, range: 260, cooldownMs: 9000 },
  stare: { range: 300, maxSpeed: 40, ms: 5000, cooldownMs: 25000 },
  gaze: { rangeX: 520, rangeY: 480, minHoldMs: 4000, holdAfterMoveMs: 6000, switchMs: 600 },
  throwSpeed: 900,
  affection: {
    pet: 8, poke: 5, tickle: 12, play: 4, joy: 10, decay: 3, decayAfter: 1,
    stageMin: 6, happy: 5, bliss: 25, overjoyed: 70,
  },
  irritation: {
    scribble: 12, enough: 5, pinchStart: 14, pinch: 6, spam: 8, strong: 4, violent: 8,
    struggle: 2, heldAngry: 4, droppedAfterShake: 15, soothe: 2, decay: 2, calmAfter: 3,
    stageMin: 10, wary: 20, annoyed: 40, angry: 60, furious: 80, enoughAfter: 10, woken: 12,
  },
  grudge: { seconds: 120, factor: 1.5 },
  // Held: seconds in each phase (amused is shortened or skipped when he is already fed up with you).
  held: { amused: 6, amusedWary: 3, confused: 2, confusedShort: 0.4, struggle: 5, angry: 6, tired: 6, scaredSpeed: 900, queasyAfter: 1.5, jitter: 3, yelpFor: 0.45, swingSpeed: 140 },
  // Only a thrown Orry bounces: a drop, even a long one, lands with a squash. Thrown, he bounces off the floor up to twice.
  bounce: { minSpeed: 700, max: 2, keep: 0.45 },
  run: { speed: 140, flee: 330, storm: 120, burrow: 300, scurry: 1.7 },
  // Sleep: he only dozes off when the pointer has been quiet for a while, only a tap reaches him asleep, and taps within
  // wakeWindowMs climb a ladder: startled and back to sleep, grumpy and awake, then angry.
  sleep: { quietMs: 15000, chance: 0.25, wakeWindowMs: 10000, naturalWake: 25 },
  // The charge: a flinch that lasts, then a scurry away.
  flee: { flinch: 0.8, total: 1.7 },
  // How long each beat stays on screen, in seconds. A person cannot read a reaction that lasts under about half a second, so
  // nothing that carries meaning is shorter than 0.4 s, and the reactions people should notice get a second or more.
  beat: {
    poke: 0.6, // surprised for this long, then smug for the same
    landShort: 0.4, // the squash after a short fall
    landBig: [0.6, 1.0, 1.4], // flat, impact lines, squash: where each ends
    pinch: [0.5, 1.4], // squish ends, ow ends; then stretch and squish alternate
    mad: 2.1, madBeat: 0.7, // puff, facepalm, furious: 0.7 s each
    stomp: 2.4, // two rounds of stomping
    turn: 2.0, // his back turned before the storm-off
    joy: [0.35, 0.6, 0.85, 1.25, 1.5, 1.85, 3], // crouch, launch, kick up, helmet pop, kick down, soft landing, cheer
    dazed: [1.4, 2.6, 3.7, 4.9], // dazed, shakes his head, rubs the bump, gets up
    wake: 1.8, // the startled and grumpy looks on the sleep ladder
  },
} as const;
