import { RULES } from "./constants";
import type { ReceivedReview, Scores } from "./types";

// Stand-ins for the other builders who would review your ship. They exist only so the preview can walk the whole
// pipeline. Reviews carry no reviewer identity at all: there is nothing to leak because nothing is stored.

export const SAMPLE_REASONS: string[] = [
  "The core idea is familiar but the way it is put together shows real thought and a few clever choices.",
  "Good depth in the lower layers, although the error handling around the edges felt thin when I tried odd input.",
  "I could build and run it from the README on the first try, which is rare and worth rewarding.",
  "The journal explains the dead ends honestly, and that made it much easier to trust the measurements shown.",
  "Interesting constraint choice, but the demo only covers the happy path so I cannot judge robustness.",
  "Solid execution overall; the tests cover the tricky parts and the benchmarks are reproducible from the repo.",
  "Documentation is the weak spot here, since setup steps are missing and the architecture is only implied.",
  "Strong technical core with an unusual approach to scheduling, though the interface could be easier to learn.",
  "It works as described and the code is readable, but most pieces are close to standard examples.",
  "The write-up compares two designs with real numbers, which shows the builder understood the trade offs involved.",
  "Hardware choices are sensible and the bill of materials is complete, but the enclosure photos are blurry.",
  "I ran it against my own sample files and it held up well, with clear messages when something failed.",
];

/** Small deterministic generator (mulberry32) so a seeded sample review is the same every time. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampScore(value: number): number {
  return Math.min(RULES.scoreMax, Math.max(RULES.scoreMin, Math.round(value)));
}

/** A sample review whose scores sit near `base` (1 to 9) with a deterministic spread of about one point. */
export function sampleReview(input: { shipId: string; index: number; base: number; createdAt: number }): ReceivedReview {
  const rand = seededRandom(`${input.shipId}:${input.index}`);
  const jitter = () => (rand() + rand() - 1) * 1.6;
  const scores: Scores = {
    originality: clampScore(input.base + jitter()),
    technicalDepth: clampScore(input.base + jitter()),
    execution: clampScore(input.base + jitter()),
    documentation: clampScore(input.base + jitter()),
  };
  const reason = SAMPLE_REASONS[Math.floor(rand() * SAMPLE_REASONS.length)];
  return { id: `${input.shipId}_rv${input.index + 1}`, createdAt: input.createdAt, scores, reason };
}
